var generalConfig = require('../../config/generalConfig');
var timezoneList = require('./timezone-list');

/** 
 * Get timezone list
 */
var getTimezones = function getTimezone(callback)
{
	var timezones = timezoneList.timezones.timezones;
	var timeArr = [];	
	timezones.forEach(function(value){
		value.utc.forEach(function(u){
			timeArr.push(u);
			timeArr = timeArr.sort();
		});
	});
	callback({
        status: 'success',
        data: timeArr,  // List of countries Json
        message: 'Timezones data has been loded succssfully'
    });
}



module.exports = {
	getTimezones: getTimezones
};