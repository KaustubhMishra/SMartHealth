'use strict';

var dosageController = require('../controller/dosageController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	
	// Just for React-Redux demo
	app.post('/getdosages', dosageController.getdosages);
};
