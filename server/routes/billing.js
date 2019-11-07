const express = require('express')
const router = express.Router();
const db = require('../config/database');
const Database = require('../classes/DatabasePromise');

let con = db.con; // connection for DB

// emmitd before sql execution
con.on('trace', (sql) => {
    console.log("trace ----- sql : ", sql);
})

// emmited when sql statement us executed
con.on('profile', (sql, execution_time) => {
    console.log("Profile ---- sql : ", sql, " exectime : ", execution_time);
})

router.get("/", (req, res) => {
    res.send("Billing Works");
})

router.post("/billme", (req, res) => {    
    let total_amount = req.body.total_amount;
    let total_quantity = req.body.total_quantity;
    let discount_price = req.body.discount_price;
    let grand_total = req.body.grand_total;
    let bill_type = req.body.bill_type;
    let items = req.body.items;
    let print_bill = req.body.print_bill
    console.log(req.body);
        /**
         * items: [{ p_id , p_name_eng, p_name_tam, quantity, u_name_tam, p_rate, total }]
         */
        /**
         * bill_type : 1 => wholesale 0=> retail
         */
    let conPromise = new Database(con);
    let ivc_id;
    let invoice_item_ids;

    let sql = `INSERT INTO invoice(invoice_ref_id, date, total_amount, total_quantity, discount_price, grand_total, balance,bill_type) 
                VALUES( "${db.shop_sf}"|| strftime('%m', date('now')) || ((select count(*) from invoice) + 1), datetime('now'),
                ?,?,?,?,0,?)`;
    conPromise.run(sql, [total_amount, total_quantity, discount_price, grand_total, bill_type])
        .then(invoice_id => {
            ivc_id = invoice_id;
            let promiseArr = [];
            items.forEach(item => {
                let sql = "INSERT INTO invoice_items(invoice_id,p_id,p_name_eng, p_name_tam, p_quantity, u_name_tam, p_amount, total_amount, p_category) values(?,?,?,?,?,?,?,?,?)";
                promiseArr.push(conPromise.run(sql, [invoice_id, item.p_id, item.p_name_eng, item.p_name_tam, item.quantity, item.u_name_tam, item.p_rate, item.total, item.p_category]));
            });
            return Promise.all(promiseArr);
        })
        .then(insertIds => {
            invoice_item_ids = insertIds;

            updateStockQuantity(items, conPromise);
            // fetch invoice ref id for bill
            return conPromise.get('SELECT invoice_ref_id, date FROM invoice where invoice_id=?',ivc_id);            
        })
        .then(bill_info => {
            console.log("Bill info : ",bill_info)
            if (print_bill) {
                // printing process goes here
                return printBill(bill_info[0].invoice_ref_id, bill_info[0].date, total_amount, total_quantity, discount_price, grand_total, bill_type, items);
            } else {
                return "Printing bill avoided";
            }
        })
        .then((bill_info) => {
            res.json({
                status: true,
                insertIds: invoice_item_ids,
                desc: bill_info
            })
        })
        .catch(err => {
            console.log("ERROR : ", err);
            res.json({
                status: false,
                error: err
            })
        })
})

router.post("/reprint/:invoice_id", (req, res) =>{
    let invoice_id = req.params.invoice_id;
    let conPromise = new Database(con);

    let invoice_ref_id, date, total_amount, total_quantity, discount_price, grand_total, bill_type;
    let items = [];    

    let sql = 'select * from invoice where invoice_id = ?';

    conPromise.get(sql,invoice_id)
    .then(invoice_data=>{
        invoice_ref_id = invoice_data[0].invoice_ref_id;
        date = invoice_data[0].date;
        total_amount = invoice_data[0].total_amount;
        total_quantity = invoice_data[0].total_quantity;
        discount_price = invoice_data[0].discount_price;
        grand_total = invoice_data[0].grand_total;
        bill_type = invoice_data[0].bill_type;

        return conPromise.get('select p_id,p_name_eng, p_name_tam, p_quantity as quantity, p_amount as p_rate, total_amount as total from invoice_items where invoice_id = ?', invoice_id);
    })
    .then((items)=>{
        return printBill(invoice_ref_id, date, total_amount, total_quantity, discount_price, grand_total, bill_type, items);
    }).then(text=>{
        res.json({
            status: true,
            desc: text
        })
    })
    .catch(err=>{
        res.json({
            status: false,
            error: err
        })
    })

})

router.delete('/delete/:invoice_id', (req, res) => {
    let invoice_id = req.params.invoice_id;
    sql = "UPDATE invoice SET status='deleted' WHERE invoice_id=?";
    con.run(sql, [invoice_id], (err) => {
        if (err) {
            console.log(err);
            res.json({
                status: false,
                err: err
            });
        } else {
            res.json({
                status: true
            })
        }
    })
})

function updateStockQuantity(items, conPromise){
    // update stock in products table
    let updatePromiseArr = [];
    items.forEach(item => {
        let sql = "UPDATE products SET available_quantity = (CASE WHEN (available_quantity - ?) > 0 THEN (available_quantity - ?) ELSE 0 END) WHERE p_id=?";
        updatePromiseArr.push(conPromise.run(sql, [item.quantity, item.quantity, item.p_id]));
    });
    return Promise.all(updatePromiseArr);
}


async function printBill(invoice_ref_id, date, total_amount, total_quantity, discount_price, grand_total, bill_type, items){
    const Printing = require('../Printing/Printing');
    let print = new Printing();
    print.generateHtmlContent(invoice_ref_id, date, total_amount, total_quantity, discount_price, grand_total, bill_type, items);
    await print.storeHtmlAsPdf();
    await print.printPdf();
    return "Printing done";
}
module.exports = router;