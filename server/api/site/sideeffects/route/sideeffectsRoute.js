'use strict';

var sideeffectsController = require('../controller/sideeffectsController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	
	// Just for React-Redux demo
	app.post('/getsideEffect', sideeffectsController.getSideEffects);
	app.post('/addsideEffect', sideeffectsController.savedSideEffect);
	app.put('/updatesideEffect/:id', sideeffectsController.updateSideEffect);
	app.delete('/deletesideEffect/:id', sideeffectsController.deleteSideEffect);
	app.post('/getSideEffectById', sideeffectsController.getSideEffectById);
	
};
