'use strict';

var siteDashboard = require('../controller/dashboardController');
module.exports = function(app) {
    app.get('/api/site/getdashboarddata', siteDashboard.getData);
    app.get('/api/site/getdevicesposition', siteDashboard.getDevicesPosition);

    app.post('/api/site/apilogdetail', siteDashboard.getApiLogDetail);

    //later remove from thing controller and route
	app.get('/api/site/dashboardinfo/:companyId', siteDashboard.getDashboardInfo);
};