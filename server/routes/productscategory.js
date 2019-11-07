const express = require('express')
const router = express.Router();
const db = require('../config/database');

let con = db.con; // connection for DB

router.get('/', (req, res) => {
    res.status(200).send("Hello fom /api/productscategory");
})

router.get('/get/:c_id', (req, res) => {
    let c_id = req.params.c_id;
    sql = "select c_id,c_name from category where c_id=? status is null";
    con.get(sql, [c_id], (err, result) => {
        if (err) {
            res.json({
                status: false
            })
        } else {
            res.json({
                status: true,
                data: result
            })
        }
    })
})

router.get('/getall', (req, res) => {
    sql = "select c_id,c_name from category where status is null";
    con.all(sql, (err, result) => {
        if (err) {
            res.json({
                status: false
            })
        } else {
            res.json({
                status: true,
                data: result
            })
        }
    })
})

router.post('/add', (req, res) => {
    category_name = req.body.category_name;
    sql = "insert into category(c_name) values(?)";
    con.run(sql, [category_name], (err) => {
        if (err) {
            res.json({
                status: false
            });
        } else {
            console.log("LAST ID : " + this.lastID);
            res.json({
                status: true,
                id: this.lastID
            });
        }
    })
})

router.put('/update/:category_id', (req, res) => {
    category_id = req.params.category_id;
    category_name = req.body.category_name;
    sql = "update category set c_name=? where c_id=?";
    con.run(sql, [category_name, category_id], (err) => {
        if (err) {
            res.json({
                status: false
            });
        } else {
            res.json({
                status: true
            });
        }
    })
})

router.delete('/delete/:c_id', (req, res) => {
    category_id = req.params.c_id;
    sql = "update category set status='deleted' where c_id=?";
    con.run(sql, [category_id], (err) => {
        if (err) {
            res.json({
                status: false
            })
        } else {
            res.json({
                status: true
            })
        }
    })
})

module.exports = router;