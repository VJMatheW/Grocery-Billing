const express = require('express')
const router = express.Router();
const db = require('../config/database');

let con = db.con; // connection for DB

// emmitd before sql execution
con.on('trace', (sql) => {
    console.log("trace ----- sql : ", sql);
})

// emmited when sql statement us executed
con.on('profile', (sql, execution_time) => {
    console.log("Profile ---- sql : ", sql, " exectime : ", execution_time);
})

router.get('/getall', (req, res)=>{
    let sql = 'SELECT * FROM units where status is null'
    con.all(sql, (err, result)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                unit_list: result
            })
        }
    })
})

router.post('/add', (req, res)=>{
    let obj = req.body;
    let sql = 'INSERT INTO units(u_name_eng, u_name_tam) values(?,?)';
    con.run(sql, [obj.u_name_eng, obj.u_name_tam], function(err){
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                insert_id: this.lastID
            })
        }
    })
})

router.put('/update/:u_id', (req, res)=>{
    let u_id = req.params.u_id;
    let addons = "";
    let parameters = [];
    let obj = req.body;
    if (obj.u_name_eng) {
        addons += " u_name_eng=? ";
        parameters.push(obj.u_name_eng);
    }
    if (obj.u_name_tam) {
        addons += (parameters.length > 0 ? "," : "") +" u_name_tam=? ";
        parameters.push(obj.u_name_tam);
    }

    parameters.push(u_id);
    let sql = `update units set ${addons} where u_id=?`;
    con.run(sql, parameters, (err)=>{
        if(err){
            res.json({
                status: false,
                error: err,
                desc: this.sql
            })
        }else{
            res.json({
                status: true,
                desc: 'Successfully updated',
                changes: this.changes
            })
        }
    })
})

router.delete('/delete/:u_id', (req, res)=>{
    let u_id = req.params.u_id;
    con.run('UPDATE units SET status="deleted" WHERE u_id=?', u_id, (err)=>{
        if(err){
            res.json({
                status: false,
                error: err
            })
        }else{
            res.json({
                status: true,
                desc: 'Successfully deleted'
            })
        }
    })
})

module.exports = router;