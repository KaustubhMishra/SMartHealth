'use strict';

var siteSensor = require('../controller/sensorController');
module.exports = function(app) {
	app.delete('/api/site/sensor/:id/thing/:thingId', siteSensor.deleteSensor);
	app.post('/api/site/sensor/list/:thingId', siteSensor.getSensors);
	app.post('/api/site/sensor/notifications/:thingId', siteSensor.getSensorsNotifications);

	app.get('/api/site/thing/sensorlist/:thingId', siteSensor.getSensorList);
	app.post('/getsensorDatabyTrialId',siteSensor.getsensorDatabyTrialId);
	app.post('/getHistoricalDataCompanyWise/',siteSensor.getHistoricalDataCompanyWise);	

	app.post('/api/site/patient/getvitalgraphdata',siteSensor.getPatientVitalHistoricalDataV2);	
};