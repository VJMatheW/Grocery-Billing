const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let is_new_db = !fs.existsSync(path.resolve(process.env.USERPROFILE, "billing_app.sqlite"));

let db = new sqlite3.Database(path.resolve(process.env.USERPROFILE, "billing_app.sqlite"), (err) => {
    if (err) {
        console.error(err.message);
    } else {
        initDB(is_new_db);
        console.log('Connected to the billing_simple database.');
    }
});

function initDB(is_new_db){
  if(is_new_db){
    db.serialize(function(){
      // create table units
      db.run('create table units(u_id integer primary key autoincrement, u_name_eng varchar(100), u_name_tam varchar(100), status varchar(100))');
      
      // insert some units
      db.serialize(function(){
          db.run("insert into units(u_name_eng, u_name_tam) values ('Nos','என்'),('Kg', 'கிலோ'), ('Pcs', 'பீஸ்'), ('Pck', 'பாக்')");
      })
    
      // create table category
      db.run('create table category (c_id integer primary key autoincrement,c_name varchar(255),status varchar(20))');
  
      // insert some categories
      db.serialize(function(){
          db.run("insert into category(c_name) values ('Default'), ('Snacks'), ('Drinks')");
      })
  
      // create table products
      db.run(`create table products (p_id integer primary key autoincrement, p_name_eng varchar(255), p_name_tam varchar(255), p_category integer, p_quick_access_code integer UNIQUE, retail_amount float(9,2),
      wholesale_amount float(9,2), available_quantity integer, p_unit integer, min_quantity integer, timestamp DATE default CURRENT_TIMESTAMP, status varchar(20) default null,
      foreign key (p_category) references category(c_id), foreign key(p_unit) references units(u_id));`);
  
      // create table invoice
      db.run(`create table invoice (invoice_id integer primary key autoincrement,invoice_ref_id varchar(255), date text default current_timestamp, total_amount integer,total_quantity integer, 
      discount_price integer, grand_total integer, balance integer, bill_type integer, status varchar(20));`);
  
      // create table invoice_items
      db.run(`create table invoice_items (invoice_items_id integer primary key autoincrement, invoice_id integer, p_id integer,p_name_eng varchar(255), p_name_tam varchar(255),p_category integer, p_quantity integer, 
      u_name_tam, p_amount integer, total_amount integer, foreign key(invoice_id) references invoice(invoice_id) on delete cascade on update cascade, foreign key(p_id) references products(p_id))`);
  
      // create table stock_vendor
      db.run('create table stock_vendor (vendor_id integer primary key autoincrement, vendor_name varchar(225), vendor_phone varchar(255), vendor_address varchar(255), date text default current_timestamp)');
  
      // insert default vendor
      db.serialize(function(){
          db.run('insert into stock_vendor(vendor_id,vendor_name, vendor_phone, vendor_address, date) values(0, "Default agencies", "Default", "Default", DATETIME("now", "localtime"))');
      })
  
      // create table stocks
      db.run('create table stocks (stock_id integer primary key autoincrement, vendor_id integer,date text default current_timestamp, foreign key(vendor_id) references stock_vendor(vendor_id))');
  
      // create table stock_items
      db.run(`create table stock_items (stock_item_id integer primary key autoincrement, stock_id integer, product_id integer, stock_quantity integer, unit_price float(9,2), 
      foreign key(product_id) references products(p_id), foreign key(stock_id) references stocks(stock_id) on update cascade on delete cascade)`);
    })
  }
}

  // emmited before sql execution
db.on('trace', (sql) => {
  console.log("trace ----- sql : ", sql);
})

// emmited when sql statement is executed
db.on('profile', (sql, execution_time) => {
  console.log("Profile ---- sql : ", sql, " exectime : ", execution_time);
})

module.exports = {
    con: db,
    shop_sf: "RMS"
}