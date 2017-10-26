var generalConfig = require('../../config/generalConfig');
var async = require('async');

var countriesDataFile = require('./countries-list');

/**
 * @author: Gunjan
 * Get country list
 */
var getCountry = function getCountry(callback)
{
	callback({
        status: 'success',
        data: countriesDataFile.Countries.Countries,  // List of countries Json
        message: 'Countries data has been loded succssfully'
    });
}

/**
 * @author: Gunjan
 * Get state list based on country name
 * @country_name: Country Name
 */
var getStateByCountry = function getStateByCountry(country_name, callback)
{
    var countrydata = countriesDataFile.Countries; // List of countries Json

    async.forEachSeries(countrydata.Countries, function(data, callback_f1) {
    	if(data.name == country_name)
	    {
	    	callback_f1(data.states)
	    }
	    else
	    {
	    	callback_f1();
	    }
	}, function(data) {
			if(data != '' && data != null)
			{
				callback({
		            status: 'success',
		            data: data,
		            message: 'State data has been loded succssfully'
		        });
	        }
	        else
	        {
	        	callback({
		            status: 'fail',
		            data: [],
		            message: 'State data has not been loded succssfully'
		        });	
	        }
	});
}


module.exports = {
	getCountry: getCountry,
	getStateByCountry: getStateByCountry
}