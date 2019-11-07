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

router.get('/', (req, res) => {
    res.status(200).send("Hello fom /api/products");
})

router.get('/get/:p_id', (req, res) => {
    let p_id = req.params.p_id;
    sql = "select p_id, p_name_eng, p_name_tam, p_category, p_quick_access_code, retail_amount, wholesale_amount, available_quantity, min_quantity, p_unit, status from products where p_id=? and status is null";
    con.get(sql, [p_id], (err, result) => { // query only one row
        if (err) {
            res.json({
                status: false,
                err: err
            })
        } else {
            res.json({
                status: true,
                product_list: result
            })
        }
    })
})

router.get('/getall', (req, res) => {
    // sql = "select p_id, p_name, p_category, p_quick_access_code, amount, p_unit, status from products where status is null";
    sql = "select p_id, p_name_eng, p_name_tam, p_category, p_quick_access_code, retail_amount, wholesale_amount, available_quantity, min_quantity, p_unit, u_name_eng, u_name_tam, p.status , c_name  from products AS p INNER JOIN category ON category.c_id = p.p_category INNER JOIN units as u on p.p_unit=u.u_id WHERE p.status IS NULL"
    con.all(sql, (err, result) => { // query all rows
        if (err) {
            res.json({
                status: false,
                err: err
            })
        } else {
            res.json({
                status: true,
                product_list: result
            })
        }
    })
})

router.post('/add', (req, res) => {
    let obj = req.body;
    con = db.con;
    sql = "INSERT INTO products(p_name_eng, p_name_tam,p_category,p_quick_access_code,retail_amount, wholesale_amount, available_quantity,min_quantity,p_unit) values(?,?,?,?,?,?,?,?,?)";
    con.run(sql, [obj.p_name_eng, obj.p_name_tam, obj.p_category, obj.p_quick_access_code, obj.retail_amount, obj.wholesale_amount, obj.available_quantity, obj.min_quantity, obj.p_unit], function(err){
        if (err) {
            if (err.errno == 19) {
                err = "Quick Access Code Already Defined";
            }
            res.json({
                status: false,
                err: err
            });
        } else {            
            res.json({
                status: true,
                added_product:{
                    p_id: this.lastID,
                    p_name_eng: obj.p_name_eng,
                    p_name_tam: obj.p_name_tam,
                    p_category: obj.p_category,
                    p_quick_access_code: obj.p_quick_access_code,
                    retail_amount: obj.retail_amount,
                    wholesale_amount: obj.wholesale_amount,
                    available_quantity: obj.available_quantity,
                    min_quantity: obj.min_quantity,
                    p_unit: obj.p_unit
                }                 
            })
        }
    });
})

router.put('/update/:p_id', (req, res) => {
    let p_id = req.params.p_id;
    let addons = "";
    let parameters = [];
    let obj = req.body;
    console.log(obj);
    if (obj.p_name_eng) {
        addons += " p_name_eng=? ";
        parameters.push(obj.p_name_eng);
    }
    if (obj.p_name_tam) {
        addons += (parameters.length > 0 ? "," : "")+" p_name_tam=? ";
        parameters.push(obj.p_name_tam);
    }
    if (obj.p_category) {
        addons += (parameters.length > 0 ? "," : "")+" p_category=? ";
        parameters.push(obj.p_category);
    }

    if (obj.p_quick_access_code) {
        addons += (parameters.length > 0 ? "," : "")+" p_quick_access_code=? ";
        parameters.push(obj.p_quick_access_code);
    }

    if (obj.retail_amount) {
        addons += (parameters.length > 0 ? "," : "")+" retail_amount=? ";
        parameters.push(obj.retail_amount);
    }

    if (obj.wholesale_amount) {
        addons += (parameters.length > 0 ? "," : "")+" wholesale_amount=? ";
        parameters.push(obj.wholesale_amount);
    }

    if (obj.p_unit) {
        addons += (parameters.length > 0 ? "," : "")+" p_unit=? ";
        parameters.push(obj.p_unit);
    }

    if(obj.available_quantity){
        addons += (parameters.length > 0 ? "," : "")+" available_quantity=? ";
        parameters.push(obj.available_quantity);
    }

    if(obj.min_quantity){
        addons += (parameters.length > 0 ? "," : "")+" min_quantity=? ";
        parameters.push(obj.min_quantity);
    }

    parameters.push(p_id);

    sql = `UPDATE products SET ${addons} WHERE p_id=?`;
    con.run(sql, parameters, (err) => {
        console.log("this : ", sql);
        if (err) {
            console.log(err);
            if (err.errno == 19) {
                err = "Quick Access Code Already Defined";
            }
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

router.delete('/delete/:p_id', (req, res) => {
    let p_id = req.params.p_id;
    sql = "UPDATE products SET status='deleted' WHERE p_id=?";
    con.run(sql, [p_id], (err) => {
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

module.exports = router;