const DateFunc = require('../classes/DateFunc');
let obj = {
    head : (bill_date, bill_no)=>{
        return `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <style>
        body{
            width: 330px;            
        }              
        *{
            padding: 0px;
            margin: 0px;
            letter-spacing: 0px;
            font-weight: bold;
        }
        
        .al{
            text-align: left;
        }
        .ar{
            text-align: right;
        }
        .ac{
            text-align: center;
        }               
        .eng-f{
            font-family: 'Times New Roman', Times, serif;
        }    
        .col{
            display: inline-block;
            word-wrap: break-word;
        }      
        .body{
            width: 324px;
            display: flex;
            font-size: 14px;            
        }
        .unit{
            font-size: 8px;
        }
        .foot{
            margin-top:5px;
            padding-top: 5px;
            margin-bottom:5px;
            padding-bottom: 5px;
            font-size: 13px;            
        }
        table{
            width: 100%;
            table-layout: fixed; 
            border-collapse: collapse;  
            margin-top: 10px;                     
        }
        table th{
            font-size: 11px;
        }
        table td{
            word-wrap: break-word;
        }
        .pad-r{
            padding-right: 2px; 
        }
        .pad-l{
            padding-left: 2px;
        }
    </style>
</head>
<body>   
    <div style="text-align: center;" >        
        <h2 style="font-size: 28px;" >ராஜன் மளிகை ஸ்டோர்</h2>  
        <p style="font-size: 13px;" >நெ.94<span class="eng-f" >/</span>216<span class="eng-f">,</span> அண்ணா சாலை<span class="eng-f">,<br></span> செங்கல்பட்டு-603002.</p>
        <p>Ph:9940095877, 9952296925</p>
        <h3>ரொக்க ரசீது</h3>
    </div>   
    <div style="font-size: 13.5px;" >
        <div class="col" style="width: 110px;letter-spacing: 1px;" >நெ.${bill_no}</div>
        <div class="col ar" style="width: 205px;" >தேதி: ${DateFunc.formatAMPM(bill_date)}</div>        
    </div>    
    <table border="1">
            <col width="45%" />
            <col width="15%" />
            <col width="15%" />
            <col width="15%" />
            <col width="15%" />
        <thead>
            <tr>
                <th>விபரம்</th>
                <th>அளவு</th>
                <th>Mrp</th>
                <th>விலை</th>
                <th>தொகை</th>
            </tr>
        </thead>
        <tbody>
    `;        
    },

    setitem: (item)=>{        
        return `
        <tr>
            <td class="pad-l" >${item.p_name_tam}</td>
            <td class="ar pad-r" >${item.quantity}<span class="unit">${item.u_name_tam}</span></td>
            <td class="ar pad-r" >${item.p_rate}</td>
            <td class="ar pad-r" >${item.total}</td>
        </tr>`;
    },    
    
    setfoot: (total_quantity, grand_total)=>{
    return `
    <tr>
        <td class="" >எண்ணிக்கை :&nbsp;${total_quantity}</td>
        <td class="ar" >மொத்தம் :&nbsp;<td>Rs.${grand_total}</td></td>
    </tr>
        </tbody>
    </table>
    <table>
        <col width="40%" />
        <col width="5%" />
        <col width="30%" />
        <col width="20%" />
        <tr>
            <td class="ar" >எண்ணிக்கை :&nbsp;</td>
            <td> ${total_quantity}</td>
            <td class="ar" >மொத்தம் :&nbsp;</td>
            <td>Rs.${grand_total}</td>
        </tr>
    </table> 
    <h3>AMT: Rs.${grand_total}</h3>
    <div class="ac">நன்றி !!  மீண்டும் வருக !!</div>
    <div class="ac" style="font-size:10px;">அச்சிடப்பட்ட நேரம் : ${DateFunc.formatAMPM()} </div> 
</body>
</html>
    `;
    }
}  

module.exports = obj;