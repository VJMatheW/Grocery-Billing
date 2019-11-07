const express = require('express')
const router = express.Router();
const db = require('../config/database');

let con = db.con; // connection for DB

router.get('/', (req, res) => {
    res.send("<h1>Search Works</h1>");
})

router.get('/:query', (req, res) => {
    let query = req.params.query;
    console.log("Query ", query);
    let sql = `select p_id, p_name_eng,p_name_tam, p_category, available_quantity, p_quick_access_code, retail_amount, wholesale_amount, p_unit, u_name_tam, p.status , c_name  
        from products AS p INNER JOIN category ON category.c_id = p.p_category 
        INNER JOIN units ON units.u_id=p.p_unit
        WHERE p.status IS NULL AND 
        ((p.p_name_eng LIKE "%${query}%") OR 
        (p.p_name_tam LIKE "%${query}%") OR
        (p.p_quick_access_code LIKE "%${query}%"))`;
    con.all(sql, (err, result) => {
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

module.exports = router;