const express = require('express')
const router = express.Router();
const db = require('../config/database');
const Database = require('../classes/DatabasePromise');

let con = db.con; // connection for DB

/**
 * To get the invoice with the specified offset and count for pagination
 */
router.get('/getall/:offset/:count', (req,res)=>{
    let offset = req.params.offset;
    let count = req.params.count;

    offset = ((offset-1)<0 ? 0 : (offset-1)) * count;

    con.get('select count(*) as total from invoice where status is null', (err, totalResult)=>{  
        if(err){
            res.json({
                status: false,
                error: err,
                desc: "Getting total failed"
            })
        }else{                 
            let sql = "select * from invoice where status is null order by invoice_id desc limit ?, ?";
            con.all(sql, [offset, count],(err, paginationResult) => { // query all rows        
                if (err) {
                    res.json({
                        status: false,
                        err: err,
                        desc: "getting invoice failed"
                    })
                } else {
                    res.json({
                        status: true,
                        invoices: paginationResult ? paginationResult : [],
                        total_count: totalResult.total
                    })
                }
            })
        }
    })
})

/**
 * To get invoice_items of specific invoice_id
 */
router.get('/:invoice_id', (req, res)=>{
    let invoice_id = req.params.invoice_id;
    let invoice_sql = "select * from invoice where invoice_id=?";
    let invoice_items_sql = "select * from invoice_items where invoice_id=?";
    con.get(invoice_sql, invoice_id, (err, invoice_result)=>{
        if(err){
            res.json({
                status: false,
                err: err
            })
        }else{            
            if(invoice_result){
                con.all(invoice_items_sql, invoice_id, (err, invoice_items_result)=>{
                    if(err){
                        res.json({
                            status: false,
                            err: err
                        })
                    }else{  
                        if(invoice_items_result.length > 0){
                            res.json({
                                status: true,
                                invoice: invoice_result,
                                invoice_items: invoice_items_result
                            })
                        }else{
                            res.json({
                                status: true,
                                invoice: invoice_result,
                                invoice_items: [],
                                desc: "No invoice items exists"
                            })
                        }                                            
                    }
                })
            }else{
                res.json({
                    status: false,
                    err: "No invoice present with the specified invoice_id"
                })
            }            
        }
    })
})

/**
 * To API is to search for specific invoice_ref id
 */
router.get('/search/:invoice_ref', (req, res)=>{
    let invoice_ref = req.params.invoice_ref;
    let sql = "select * from invoice where invoice_ref_id like ? and status is null union select * from invoice where invoice_ref_id like ? and status is null";
    con.all(sql, [invoice_ref+'%', '%'+invoice_ref+'%'], (err, result)=>{
        if(err){        
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                invoices: result
            })
        }
    } )
})

/**
 * To get inovice for the specified date range
 */
router.get('/range/:start_date/:end_date', (req, res)=>{
    let DateFunc = require('../classes/DateFunc');    
    let start_date = req.params.start_date;
    let end_date = DateFunc.getNextDayDate(req.params.end_date);

    let sql = "SELECT * FROM invoice WHERE date BETWEEN ? and ? and status is null ORDER BY invoice_id desc";
    con.all(sql, [start_date, end_date], (err, result)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{            
            res.json({
                status: true,
                invoices: result
            })                   
        }
    })
})

/**
 * To Update invoice_items
 */
router.put('/update/:invoice_id', (req, res)=>{
    let invoice_id = req.params.invoice_id;
    let changed_invoice_items = req.body;
    /**
     * body :[
     *      {
     *          invoice_items_id: ,
     *          p_id: , // products_id
     *          p_quantity:        
     *      }
     *   ]
     */
    let exisiting_invoice;
    let existing_invoice_items;

    let conPromise = new Database(con);    
    conPromise.get('select * from invoice where invoice_id = ?', invoice_id)
    .then(invoice_data=>{        
        if(invoice_data.length > 0){
            exisiting_invoice = invoice_data;
            return conPromise.get('select * from invoice_items where invoice_id = ?', invoice_id);
        }else{                        
            throw "Specified Invoice ID does not exists";            
        }
    })
    .then(invoice_items_data=>{        
        if(invoice_items_data.length > 0){
            existing_invoice_items = invoice_items_data;
        }else{
            throw "No invoice items found for the specified Invoice ID";
        }
    })
    .then(()=>{
        let promArr = [];
        changed_invoice_items.forEach(item=>{
            promArr.push(updateInvoiceItemsQuantity(conPromise, invoice_id, item.invoice_items_id, item.p_quantity));
        })
        return Promise.all(promArr);
    })
    .then(promised=>{
        console.log("Promised : ", promised);

        // update the invoice total here
        return updateInvoiceTotal(conPromise, invoice_id);
    })
    .then(update=>{
        res.json({
            status: true,
            desc: "updates done"
        })
    })
    .catch(err=>{        
        res.json({
            status: false,
            error: err
        })
    })
    
})

async function updateInvoiceItemsQuantity(db_con,invoice_id, invoice_items_id, new_quantity){    

    // getting and creating necessary details for given invoice_items_id
    let select_data = await db_con.get('select * from invoice_items where invoice_items_id = ? and invoice_id = ? ', [invoice_items_id, invoice_id]);
    let old_quantity = select_data[0].p_quantity;
    let product_id = select_data[0].p_id;    
    let product_update_quantity = new_quantity - old_quantity; // 7-8 = -1

    let affected_row_1, affected_row_2;

    if(Math.abs(product_update_quantity) == old_quantity){
        // delete the invoice_items_id row
        affected_row_1 = await db_con.run('delete from invoice_items where invoice_items_id = ?', invoice_items_id);

    }else{    
        // update process begins for invoice_items quantity
        affected_row_1 = await db_con.run('update invoice_items set p_quantity = ? , total_amount = ?*p_amount where invoice_items_id= ?', [new_quantity, new_quantity, invoice_items_id]);
    }

    // update process begins for products available_quantity
    affected_row_2 = await db_con.run('update products set available_quantity = (case when available_quantity - ? > 0 then available_quantity - ? else 0 end ) where p_id = ?', [product_update_quantity, product_update_quantity, product_id])

    if(affected_row_1 == 1 && affected_row_2 == 1){
        return true;
    }else{
        return false;
    }
}

async function updateInvoiceTotal(db_con, invoice_id){

    let sql = "select count(*) as total_no_products, sum(p_quantity) as total_no_quans, sum(total_amount) as total from invoice_items where invoice_id= ?";
    let s = await db_con.get(sql, [invoice_id]);
    console.log("no of products : ",s[0].total_no_products);
    if(s[0].total_no_products == 0){        
        // updating invoice status as deleted because no invoice items exists for this invoice
        return db_con.run('update invoice set status = "deleted" where invoice_id = ?', [invoice_id]);
    }else{
        // updating invoice 
        return db_con.run('update invoice set total_amount = ? , total_quantity = ? , grand_total = ? - discount_price where invoice_id = ?', 
        [s[0].total, s[0].total_no_products, s[0].total, invoice_id]);
    }    
}

module.exports = router;