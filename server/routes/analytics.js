const express = require('express')
const router = express.Router();
const db = require('../config/database');
const Database = require('../classes/DatabasePromise');
const DateFunc = require('../classes/DateFunc');

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
    res.send("analytics Works");
})

/**
 * This API is used to fetch data for today total no of bill and total amount
 */
router.get("/today", (req, res)=>{    
    let today = DateFunc.formatDate();
    let nextDay = DateFunc.getNextDayDate(today);
    let sql = "select count(*) as total_no_of_bill, case when sum(grand_total) is null then 0 else sum(grand_total) end as total_amount from invoice where (date between ? and ?) and status is null";
    con.get(sql, [today, nextDay], (err, result)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                data: result
            })
        }
    })
})

/**
 * This API is used to fetch data for specified's date total no of bill and total amount
 * DATE FORMAT : yyyy-mm-dd
 */
router.get("/today/:date", (req, res)=>{    
    let today = DateFunc.formatDate(req.params.date);
    let nextDay = DateFunc.getNextDayDate(today);
    let sql = "select count(*) as total_no_of_bill, case when sum(grand_total) is null then 0 else sum(grand_total) end as total_amount from invoice where (date between ? and ?) and status is null";
    con.get(sql, [today, nextDay], (err, result)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                data: result
            })
        }
    })
})

/**
 * This API is used to fetch list of products sales for today
 */
router.get("/products/today", (req, res)=>{
    let today = DateFunc.formatDate();
    let nextDay = DateFunc.getNextDayDate(today);
    let sql = `select ii.p_id, p.p_name_eng, p.p_name_tam, sum(ii.p_quantity) as quantity, avg(distinct ii.p_amount) as rate ,sum(ii.total_amount) as total, u.u_name_eng || '/' || u.u_name_tam as unit
    from invoice as i inner join invoice_items as ii on i.invoice_id=ii.invoice_id
    inner join products as p on ii.p_id=p.p_id
    left join units as u on p.p_unit=u.u_id
    where (i.date between ? and ? ) and i.status is null group by ii.p_id`;

    con.all(sql, [today, nextDay], (err, result)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                data: result
            })
        }
    })
})

/**
 * This API is used to fetch list of products sales for specified time frame
 */
router.get("/products/:start_date/:end_date", (req, res)=>{
    let start_date = req.params.start_date;
    let end_date = req.params.end_date;  
    end_date = DateFunc.getNextDayDate(end_date);
    let sql = `select ii.p_id, p.p_name_eng, p.p_name_tam, sum(ii.p_quantity) as quantity, avg(distinct ii.p_amount) as rate ,sum(ii.total_amount) as total, u.u_name_eng || '/' || u.u_name_tam as unit
    from invoice as i inner join invoice_items as ii on i.invoice_id=ii.invoice_id
    inner join products as p on ii.p_id=p.p_id
    left join units as u on p.p_unit=u.u_id
    where (i.date between ? and ? ) and i.status is null group by ii.p_id`;    

    con.all(sql, [start_date, end_date], (err, result)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                data: result
            })
        }
    })
})

module.exports = router;