'use strict';

var frequencyController = require('../controller/frequencyController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	
	// Just for React-Redux demo
	app.get('/getfrequencies', frequencyController.getfrequencies);
};
