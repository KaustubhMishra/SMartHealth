'use strict';
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var siteSetting = require('../controller/settingcontroller');

module.exports = function(app) {
	app.get('/api/site/setting', siteSetting.getSettings);
	app.post('/api/site/setting/:id', multipartMiddleware, siteSetting.updateSettings);
	app.delete('/api/site/setting/:id/name/:name',siteSetting.deleteCertificate);
	app.post('/api/site/setting/:id/download', siteSetting.downloadCertificate);
	//app.post('/api/site/setting/:id/imageUpload', multipartMiddleware, siteSetting.imageUpload);
	app.post('/api/site/setting/:id/createnotifictionapp', siteSetting.createAWSNotifictionApp);
	app.post('/api/site/setting/apns/:id', multipartMiddleware, siteSetting.uploadApnsGetKey);

	app.get('/api/site/setting/removeapplication/:id', siteSetting.removeApplication);

	app.post('/api/site/updatedevicesetting', siteSetting.updateDeviceSettings);

	app.post('/api/site/updateFirmware', multipartMiddleware, siteSetting.updateFirmware);
}