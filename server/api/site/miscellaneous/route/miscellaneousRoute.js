'use strict';

var siteMiscellaneous = require('../controller/miscellaneousController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	app.get('/api/site/groups', siteMiscellaneous.getGroups);
	app.get('/download/sample/:filename', siteMiscellaneous.downloadSampleImportFile);
	app.post('/api/site/thing/fileupload', multipartMiddleware, siteMiscellaneous.importThings);
	app.post('/thing/register', siteMiscellaneous.registerThing);
	app.post('/thing/senddata', siteMiscellaneous.sendData);
	//app.get('/api/site/miscellaneous/getsensordata/thing/:id', siteMiscellaneous.getTelemetryData);
	app.get('/api/site/template/devicegroup/:dgid', siteMiscellaneous.getTemplate);
	app.get('/api/site/getkey', siteMiscellaneous.getTelemetryDataTopic);

	app.get('/api/site/companyuses', siteMiscellaneous.getCompanyUsesCount);
	app.get('/gettimezonelist', siteMiscellaneous.getTimezoneList);
	app.get('/syncUserRole', siteMiscellaneous.syncUserRole);
};