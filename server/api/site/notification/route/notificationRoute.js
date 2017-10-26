'use strict';

var siteNotification = require('../controller/notificationController');

module.exports = function(app) {
    //app.post('/api/site/getnotifications/sensor/:sensorId', siteNotification.getNotifications);
    app.post('/api/site/getnotificationsById', siteNotification.getNotificationByPatientId);
    app.get('/api/site/getnotificationsList', siteNotification.getAllNotificationList);
    app.get('/api/site/getnotificationsListWeb', siteNotification.getAllNotificationListForWeb);
    app.get('/api/site/getAllNotificationListForWebCRO', siteNotification.getAllNotificationListForWebCRO);
    
    app.get('/api/site/getnotifications', siteNotification.getNotification);	
	app.get('/setnotifications/:id', siteNotification.setNotifications);
	//app.get('/testpushnotification/:devicetoken', siteNotification.testPushNotification);
	app.get('/api/site/currentdosage', siteNotification.getCurrentDosageInfo);
	app.post('/api/site/vitaldosagestatus/:vitaldosagestatusid', siteNotification.setVitalDosageStatus);
	app.post('/api/site/getdosagecalenderdata', siteNotification.getDosageCalenderData);
	app.post('/api/site/getdosagecalenderdataweb', siteNotification.getDosageCalenderDataWeb);
	app.put('/api/site/notification/:notificationid', siteNotification.setNotificationReadStatus);
	app.delete('/api/site/notification/:notificationid', siteNotification.removeNotification);
	app.get('/api/site/getTrialNotificationLists/:id', siteNotification.getTrialsNotificationLists);
	app.post('/api/site/sendPushNotification', siteNotification.sendPushNotificationFromWeb);


};
