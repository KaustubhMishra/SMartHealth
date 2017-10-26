'use strict';

var croCoordinatorController = require('../controller/croCoordinatorController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	
	// Just for React-Redux demo
	app.get('/api/site/getCroCoordinator', croCoordinatorController.getCroCoordinatorList);
};
