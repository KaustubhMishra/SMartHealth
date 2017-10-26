import moment from 'moment';
import momenttz from 'moment-timezone';

/*export function UTCtoUserTimezone1(date,timeZone) {
    var stillUtc = moment.utc(date).toDate();
    if(timeZone)
    {
        return moment(stillUtc).local(timeZone).format('MM/DD/YYYY');       
    }
    else
    {
        return moment(stillUtc).local('America/Chicago').format('MM/DD/YYYY');    
    }
    
}

export function UTCtoUserTimezoneWithTime1(date,timeZone) {
    var stillUtc = moment.utc(date).toDate();
    if(timeZone)
    {
        return moment(stillUtc).local(timeZone).format('MM/DD/YYYY HH:mm:ss');       
    }
    else
    {
        return moment(stillUtc).local('America/Chicago').format('MM/DD/YYYY HH:mm:ss');    
    }
    
}

export function UTCtoUserTimezoneOnlyTime1(date,timeZone) {
   var stillUtc = moment.utc(date).toDate();
    if(timeZone)
    {
        return moment(stillUtc).local(timeZone).format('HH:mm:ss');       
    }
    else
    {
        return moment(stillUtc).local('America/Chicago').format('HH:mm:ss');    
    }
    
}*/

export function UTCtoUserTimezoneWithUnixTime(date,timeZone) {
    var UTCDate = moment.unix(date).format("MM/DD/YYYY HH:mm:ss");
    if(timeZone)
    {
        return moment(UTCDate).local(timeZone).format('MM/DD/YYYY HH:mm:ss');       
    }
    else
    {
        return moment(UTCDate).local('America/Chicago').format('MM/DD/YYYY HH:mm:ss');    
    }
    
}

export function UTCtoUserTimezone(date,timeZone) {
     var utc = momenttz.tz(date, "Etc/GMT");
     if(timeZone)
     {
        
         return momenttz.tz(utc, timeZone).format('MM/DD/YYYY');
     }
     else
     {
        return momenttz.tz(utc, 'America/Chicago').format('MM/DD/YYYY');
     }
}

export function UTCtoUserTimezoneWithTime(date,timeZone) {
         var utc = momenttz.tz(date, "Etc/GMT");

         if(timeZone)
         {
            
             return momenttz.tz(utc, timeZone).format('MM/DD/YYYY HH:mm:ss');
         }
         else
         {
            return momenttz.tz(utc, 'America/Chicago').format('MM/DD/YYYY HH:mm:ss');
         }

    
}

export function UTCtoUserTimezoneOnlyTime(date,timeZone) {
        var utc = momenttz.tz(date, "Etc/GMT");

         if(timeZone)
         {
            
              return momenttz.tz(utc, timeZone).format('HH:mm:ss');
         }
         else
         {
             return momenttz.tz(utc, 'America/Chicago').format('HH:mm:ss');
         }
       
    
}