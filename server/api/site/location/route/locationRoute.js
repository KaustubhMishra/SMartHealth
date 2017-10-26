'use strict';

var siteLocation = require('../controller/locationController');
module.exports = function(app) {
	app.get('/api/site/location/list', siteLocation.getSiteList);
    app.get('/api/site/location/list/pageState/:pageState', siteLocation.getSites);    
    app.post('/api/site/location', siteLocation.addSite);
    app.put('/api/site/location/:id', siteLocation.updateSite);
    app.get('/api/site/location/:id', siteLocation.getSiteById);
    app.put('/api/site/location/:id/status', siteLocation.changeSiteStatus);
    app.delete('/api/site/location/:id', siteLocation.deleteSite);
    app.get('/api/site/location/:id/things', siteLocation.getThingsInSite);
};