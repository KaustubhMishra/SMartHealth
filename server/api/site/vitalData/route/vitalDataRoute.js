'use strict';

var vitalDataController = require('../controller/vitalDataController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	
	// Just for React-Redux demo
	app.post('/getvitalData', vitalDataController.getvitalDataList);
};
