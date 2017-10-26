'use strict';

var dsmbController = require('../controller/dsmbController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	
	// Just for React-Redux demo
	app.get('/api/site/getdsmbs', dsmbController.getdsmbs);
	app.get('/api/site/getActiveDSMB', dsmbController.getActiveDSMB);
};
