class DateFunc{
    static strToDateObj(dateStr){
        let datetime = dateStr.split(' ');
        let ymd = datetime[0].split('-');
        let hms;
        if(dateStr.includes(':')){
            hms = datetime[1].split(':');
        }else{
            hms = [0,0,0];
        }
        return new Date(Date.UTC(ymd[0], ymd[1]-1, ymd[2], hms[0], hms[1], hms[2]));
    }

    static getDateObj(data){        
        let date;
        if(typeof(data) == 'string'){
            date = this.strToDateObj(data);
        }else if(typeof(data) == 'undefined'){
            date = new Date();
        }else{
            date = data;
        }
        return date;
    }

    static getNextDayDate(dateStr){                
        let du = this.getDateObj(dateStr);
        du.setDate(du.getDate()+1);
        return `${du.getFullYear()}-${du.getMonth()+1}-${du.getDate()}`;        
    }

    static formatAMPM(data) {
        let date = this.getDateObj(data);        
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var month = date.getMonth()+1;
        var strTime = date.getDate()+'-'+( ( month < 10) ? '0'+month: month )+'-'+date.getFullYear()+' '+ hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    static formatDate(data){        
        let date = this.getDateObj(data);
        let month = date.getMonth()+1 <10 ? '0'+(date.getMonth()+1) : date.getMonth()+1;
        let dateq = date.getDate() < 10 ? '0'+(date.getDate()) : date.getDate();
        return date.getFullYear()+'-'+month+'-'+dateq; 
    }
}

module.exports = DateFunc;
