'use strict';

var patientUser = require('../controller/patientController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {	

    app.get('/api/site/getPhasePatientList/:trialId',patientUser.getPhasePatients);
    app.get('/getAllPatientList',patientUser.getAllPatients);
    app.post('/api/site/getPatientList',patientUser.getPatients);
	app.delete('/deletePatient/:id', patientUser.deletePatientData);
	app.get('/api/site/getFalloutPatientsList/:trialId',patientUser.getFalloutPatients);
	app.post('/api/site/getEnrolledPhasePatientsTrialCRO',patientUser.getEnrolledPhasePatientsTrialsCRO);
	app.get('/api/site/getEnrolledTrialsCRO',patientUser.getEnrolledTrialsCRO);
	app.post('/api/site/getEnrolledPhasePatientsTrialDSMB',patientUser.getEnrolledPhasePatientsTrialsDSMB);
	app.get('/api/site/getEnrolledTrialsDSMB',patientUser.getEnrolledTrialsDSMB);
	//app.post('/api/site/getEnrolledSearchTrials',patientUser.getEnrolledSearchTrial);
};