'use strict';

var trialController = require('../controller/trialController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	
	// Just for React-Redux demo
	app.post('/getActiveTrial', trialController.getActiveTrials);
	app.post('/getActiveTrialCRO', trialController.getActiveTrialCRO);
	app.post('/gettrial', trialController.getTrials);
	app.post('/getTrialsByDSMBId', trialController.getTrialsByDSMBId);
	app.post('/getTrialsByCROId', trialController.getTrialsByCROId);
	app.post('/gettrialsSelectList', trialController.gettrialsSelectList);
	app.post('/gettrialsSelectListDSMB', trialController.gettrialsSelectListDSMB);
	app.post('/gettrialsSelectListCRO', trialController.gettrialsSelectListCRO);

	
	/*app.post('/addtrial', trialController.savedTrial);*/
	app.put('/updatetrial/:id', trialController.updateTrial);
	app.delete('/deletetrial/:id', trialController.deleteTrialData);
	app.put('/compeletetrial/:id', trialController.compeletetrialData);
	app.get('/gettrialbyid/:id', trialController.getTrialDataById);
	app.post('/gettrialbyPatientId', trialController.getTrialByPateintId);	
	app.get('/gettrialStatus', trialController.getTrialsStatus);
	app.get('/getTrialsStatusDSMB', trialController.getTrialsStatusDSMB);
	app.get('/getTrialsStatusCoordinator', trialController.getTrialsStatusCoordinator);
	app.get('/gettrialpiechartStatus',trialController.getTrialpieChartStatus)
	app.get('/getTrialpieChartStatusDSMB',trialController.getTrialpieChartStatusDSMB);
	app.get('/getTrialpieChartStatusCoordinator',trialController.getTrialpieChartStatusCoordinator);
	app.post('/api/site/addTrialData', trialController.addTrial);
	app.get('/getTrialMetrics',trialController.getTrialMetrics);
	app.get('/getTrialDSMBMetrics', trialController.getTrialDSMBMetrics);
	app.get('/getTrialCROMetrics', trialController.getTrialCROMetrics);
	app.get('/api/patient/trial', trialController.getPatientTrial);	

	app.get('/api/site/getTrialDetailMetrics/:id', trialController.getTrialsDetailsMetrics);
	app.get('/api/site/getTrialMilestonestatus/:id', trialController.getTrialMilestoneStatus);
	app.get('/api/site/getTrialPatient/:id', trialController.getTrialPatients);
	
		
};
