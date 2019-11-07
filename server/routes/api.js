const express = require('express')
const router = express.Router();
const db = require('../config/database');

const product = require('./product');
const productscateory = require('./productscategory');
const search = require('./search');
const billing = require('./billing');
const invoice = require('./invoice');
const inventory = require('./inventory');
const unit = require('./unit');
const analytics = require('./analytics');

// routes
router.use('/products', product);
router.use('/category', productscateory);
router.use('/search', search);
router.use('/billing', billing);
router.use('/invoice', invoice);
router.use('/inventory', inventory);
router.use('/unit', unit);
router.use('/analytics', analytics);

router.get('/', (req, res)=>{
    res.status(200).send("Hello fom API");
})

module.exports = router;