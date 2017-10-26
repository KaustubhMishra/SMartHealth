'use strict';

var countryandstateCompany = require('../controller/countryandstateController');

module.exports = function(app) {
     app.get('/getCountryList', countryandstateCompany.getCountryData);
     app.post('/getStateList', countryandstateCompany.getStateData);
    
};