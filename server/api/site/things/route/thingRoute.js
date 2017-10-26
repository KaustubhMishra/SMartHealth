'use strict';

var siteThing = require('../controller/thingController');
module.exports = function(app) {
	app.get('/api/site/thinglist', siteThing.getThingList);
	app.get('/api/site/thing/list', siteThing.getActiveThingsList);

	app.post('/api/site/thing/active', siteThing.getActiveThings);
	app.post('/api/site/thing/inactive', siteThing.getInactiveThings);
	/* app.get('/api/site/thing/listThing', siteThing.listThing);
	app.get('/api/site/thing/loadMore', siteThing.loadMore);*/
	//app.get('/api/site/thing/getSiteList', siteThing.getSiteList);
	//app.get('/api/site/thing/getDeviceFamilyList', siteThing.getDeviceFamilyList);
	app.post('/api/site/thing', siteThing.addThing);
	//app.get('/api/site/thing/:id/regenerate', siteThing.regenerateCredentials);
	//app.put('/api/site/thing/:id/status', siteThing.changeThingStatus);
	app.put('/api/site/thing/:id', siteThing.updateThing);
	app.delete('/api/site/thing/:id', siteThing.deleteThing);
	app.get('/api/site/thing/:id', siteThing.getThingById);
	app.post('/api/site/thing/status/:thingId', siteThing.changeThingStatus);
	app.post('/api/site/thing/exporthistoricaldata/:exporttype', siteThing.exportHistoricalData);
	app.get('/api/site/thing/gethistoricalgraphdata/:thingId', siteThing.getHistoricalGraphData);
	app.get('/api/site/thing/refreshhistoricalgraphdata/:thingId', siteThing.refreshHistoricalGraphData);
	app.get('/api/site/thing/updatenotification/:thingId', siteThing.updateNotification);

	app.post('/api/site/thing/gethistoricaldata/:type', siteThing.getHistoricalData);
	//app.get('/api/site/getthingcountinfo', siteThing.getThingCountInfo);
	//app.get('/api/site/dashboardinfo/:companyId', siteThing.getDashboardInfo);	

	app.post('/api/site/thing/getSimulatorData', siteThing.getSimulatorData);
	app.post('/api/site/thing/executecommand', siteThing.executionCommand);
};