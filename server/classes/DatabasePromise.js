class Database{
    constructor(con){
        if(con){
            this.con = con;
        }else{                                
            this.con = require('../config/database').con;
        }
        
        this.set();
    }

    set(){
        // emmited before sql execution
        this.con.on('trace', (sql) => {
            console.log("trace ----- sql : ", sql);
        })

        // emmited when sql statement is executed
        this.con.on('profile', (sql, execution_time) => {
            console.log("Profile ---- sql : ", sql, " exectime : ", execution_time);
        })
    }
    
    run(sql, params){
        return new Promise((resolve, reject)=>{
            this.con.run(sql,params, function(err){
                if (err){
                    return reject(err);
                }else if(this.lastID){
                    resolve(this.lastID);
                }else{
                    resolve(this.changes);
                }          
            });
        });
    }

    get(sql, params){
        return new Promise((resolve, reject)=>{
            this.con.all(sql, params, function(err, result){
                if (err){                    
                    return reject( err );
                }else{                                       
                    resolve(result);
                }                                    
            })
        })
    }
}

module.exports = Database;