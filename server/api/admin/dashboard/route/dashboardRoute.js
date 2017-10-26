'use strict';

var adminDashboard = require('../controller/dashboardController');

module.exports = function(app) {
 
    app.get('/api/admin/dashboard', adminDashboard.getDashboardData); // Get Dashboard Data

};