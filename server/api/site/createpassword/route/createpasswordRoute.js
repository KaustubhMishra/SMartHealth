'use strict';

var siteCreatepassword = require('../controller/createpasswordController');

module.exports = function(app) {	
	app.post('/api/site/createuserpassword', siteCreatepassword.createpassword);
	
};