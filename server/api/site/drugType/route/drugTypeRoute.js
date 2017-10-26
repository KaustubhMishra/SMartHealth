'use strict';

var drugTypeController = require('../controller/drugTypeController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	
	// Just for React-Redux demo
	app.get('/getdrugTypes', drugTypeController.getdrugTypes);
};
