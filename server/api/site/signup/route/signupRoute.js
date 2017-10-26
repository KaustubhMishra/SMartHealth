'use strict';

var siteUser = require('../controller/signupController');
module.exports = function(app) {	
	app.post('/api/site/signup', siteUser.signup);
	app.get('/api/site/checkForUserExist', siteUser.checkForUserExist);	
};