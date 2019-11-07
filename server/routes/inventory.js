const express = require('express')
const router = express.Router();
const db = require('../config/database');
const Database = require('../classes/DatabasePromise');

const con = db.con; // connection for DB

// emmited before sql execution
con.on('trace', (sql) => {
    console.log("trace ----- sql : ", sql);
})

// emmited when sql statement is executed
con.on('profile', (sql, execution_time) => {
    console.log("Profile ---- sql : ", sql, " exectime : ", execution_time);
})

router.get('/', (req, res)=>{
    res.write("Inventory works");
    res.end();
})

//------------------------ALL VENDOR RELATED API GOES HERE-----------------------

/**
 * This API is for Suggestion when typing vendor name while updating new stocks, save the vendor_id in front end  for stocks
 */
router.get('/search/vendor/:query', (req, res)=>{
    let query = req.params.query;

    let sql = `SELECT * FROM stock_vendor WHERE vendor_name LIKE "${query}%" 
               UNION
               SELECT * FROM stock_vendor WHERE vendor_name LIKE "%${query}%"`;
    con.all(sql, (err, result)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                vendor_lists: result
            })
        }
    })
})

/**
 * This API is to retrive all the vendor from database
 */
router.get('/vendor/all', (req, res)=>{
    let sql = 'SELECT vendor_id, vendor_name, vendor_phone, vendor_address FROM stock_vendor WHERE vendor_id != 0';
    con.all(sql, (err, result)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                vendor_lists: result
            })
        }
    })
})

/**
 * To add new vendor, this API returns vendor ID which is used in stock update
 */
router.post('/vendor', (req, res)=>{
    let vendor = req.body;
    /**
     * body : { v_name: , v_phone: , v_address }
     */
    let v_name = req.body.v_name;
    let v_phone = req.body.v_phone;
    let v_address = req.body.v_address;

    let sql = "insert into stock_vendor(vendor_name, vendor_phone, vendor_address, date) values(?, ?, ?, DATETIME('now')";
    con.run(sql, [v_name, v_phone, v_address], (err)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                msg: "successfully Added"
            })
        }
    })
})


//------------------ ALL STOCK RELATED API GOES HERE------------------------

/**
 * This API is for getting low stock products 
 */
router.get('/getlowstocks', (req, res)=>{
    let sql = "select *, 'Low stock' as availability_status  from  products where min_quantity >= available_quantity and status is null order by available_quantity";
    con.all(sql, (err, result)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                low_stocks: result
            })
        }
    })
})

/**
 * To retrive and list all stock items in pagination 
 */
router.get('/stocks/getall/:offset/:count', (req, res)=>{

    let conProm = new Database(con);

    let finalObj = {
        total_count : 0,
        stocks: []
    };
    let offset = req.params.offset;
    let count = req.params.count;

    offset = ((offset-1)<0 ? 0 : (offset-1)) * count;

    conProm.get('select count(*) as total_stock from stocks')
    .then(total_result =>{
        finalObj['total_count'] = total_result[0].total_stock;
        return conProm.get('select stock_id, s.date, vendor_name, vendor_phone, vendor_address from stocks as s inner join stock_vendor as sv on s.vendor_id=sv.vendor_id order by stock_id desc limit ?,?', [offset, count]);
    })
    .then(stock_results =>{            
        let stockItemPromiseArr = [];
        stock_results.forEach(stock=>{
            finalObj.stocks.push(stock);            
            stockItemPromiseArr.push(conProm.get('select stock_item_id, p_name_eng, p_name_tam, stock_quantity, unit_price, (stock_quantity*unit_price) as total_price from stock_items as si left join products as p on si.product_id=p.p_id where stock_id=?',[stock.stock_id]));            
        })
        return Promise.all(stockItemPromiseArr);    
    })
    .then(stock_items_result=>{        
        stock_items_result.forEach((stock_items, index)=>{
            finalObj.stocks[index]['stock_items'] = stock_items;
        })
        finalObj['status'] = true;
        res.json(finalObj);
    })
    .catch(err=>{
        res.json({
            status: false,
            error: err
        })
    })
})

/**
 * To add stockitems, after adding vendor if exists
 */
router.post('/add', (req,res)=>{
    
    const promiseCon = new Database(con);
    
    let finalRes = {};
    let vendor_id;
    if(req.body.vendor_id){
        vendor_id = req.body.vendor_id;
    }else{
        vendor_id = 0;
    }
    let stock_items = req.body.stock_items;
    /**
     * body:{
     *  vendor_id: ,
     *  stock_items: [{
     *          product_id: ,
     *          quantity: ,
     *          per_unit_price: ,
     *          p_name_eng: , if  product_id is 0
     *      }]
     * }
     */
    let promiseArr = [];    
    let stocks_sql = "INSERT INTO stocks(vendor_id, date) VALUES(?,DATETIME('now'))";
    
    promiseCon.run(stocks_sql,[vendor_id])
    .then(stock_id=>{
        finalRes['stock_id'] = stock_id;
        stock_items.forEach(item => {
            let sql = "INSERT INTO stock_items(stock_id, product_id, stock_quantity, unit_price) VALUES (?,?,?,?)";
            promiseArr.push(promiseCon.run(sql,[stock_id,item.product_id, item.quantity, item.per_unit_price]));            
        });
        return Promise.all(promiseArr);
    })
    .then(stock_item_ids=>{
        finalRes['stock_item_ids'] = stock_item_ids;

        let updatePromiseArr = [];
        stock_items.forEach(item=>{
            let sql = "UPDATE products SET available_quantity = (CASE WHEN (available_quantity + ?) > 0 THEN (available_quantity + ?) ELSE 0 END) where p_id=?";
            updatePromiseArr.push(con.run(sql, [item.quantity, item.quantity, item.product_id]));
        });
        return Promise.all(updatePromiseArr);
    })
    .then(updateAffectedRows=>{
        finalRes['stock_update'] = updateAffectedRows;
        finalRes['status'] = true;
        res.json(finalRes);
    })   
    .catch(err=>{
        res.json({
            status: false,
            error: err
        })
    }) 
})

/**
 * To delete the stock added using stock_id
 */
router.delete('/stocks/delete/:stock_id', (req, res)=>{
    let stock_id = req.params.stock_id;
    let sql = "DELETE FROM stock_items WHERE stock_id=?";
    con.run(sql, stock_id, (err)=>{
        if(err){
            res.json({
                status: false,
                error: err,
                desc: "Stock Items not deleted"
            })
        }else{
            let sql = "DELETE FROM stocks WHERE stock_id=?";
            con.run(sql, stock_id, (err)=>{
                if(err){
                    res.json({
                        status: false,
                        error: err,
                        desc: "Stock items deleted but Stocks not deleted"
                    })
                }else{
                    res.json({
                        status: true,
                        desc: "Successfully Deleted"
                    })
                }
            })
        }
    })
})

module.exports = router;