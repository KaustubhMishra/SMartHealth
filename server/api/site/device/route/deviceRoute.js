'use strict';

var deviceController = require('../controller/deviceController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	
	// Just for React-Redux demo
	app.get('/getdevicelist', deviceController.getdevicelist);
	app.get('/api/site/getDeviceGroupList', deviceController.getdeviceGrouplist);
	app.post('/api/site/getDeviceList', deviceController.getdeviceListWithPagination);
	app.post('/api/site/saveDeviceData', multipartMiddleware, deviceController.addDeviceData);
	app.delete('/api/site/deleteDevice/:id', deviceController.deleteDeviceData);
	app.put('/api/site/updateDevice/:id', multipartMiddleware, deviceController.updateDeviceData);
	app.post('/getdeviceById', deviceController.getDeviceId);
	app.post('/getdeviceVital', deviceController.getDeviceVitalData);

	
};
