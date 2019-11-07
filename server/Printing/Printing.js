class Printing{
    constructor(){
        this.html_content = ""; 
        this.path = process.env.USERPROFILE;   
        this.pdf_name = 'out.pdf';    
    }
    generateHtmlContent(invoice_ref_id, bill_date, total_amount, total_quantity, discount_price, grand_total, bill_type, items){
        const html = require('./pdfhelp');
        this.html_content += html.head(bill_date, invoice_ref_id);
        items.forEach(item=>{
            this.html_content += html.setitem(item);
        })
        this.html_content += html.setfoot(total_quantity,grand_total);
    }

    storeHtmlAsPdf(){
        const wkhtmltopdf = require('wkhtmltopdf');        
        const path = require('path');   
        return new Promise((resolve, reject)=>{
            let pdf = wkhtmltopdf(this.html_content,{ images: true, 'margin-left': 4, 'margin-top':0,output: path.join( this.path,this.pdf_name)}, function(err){
                if(err){
                    reject("Error in Creating and Storing PDF");
                }else{
                    resolve({status: true, desc:"Created and Saved PDF"});
                }                
            });
        })             
    }    

    printPdf(){
        const { exec } = require('child_process');
        const path = require('path');

        const command = `java -jar "${path.join(this.path,'pdfbox-app-2.0.17.jar')}" PrintPDF -silentPrint "${path.join(this.path,this.pdf_name)}"`;        
        console.log(command);
        return new Promise((resolve, reject)=>{
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    reject(err);                                        
                }else{
                    resolve(stdout);
                }
            })                
        });
    }
}

module.exports = Printing;