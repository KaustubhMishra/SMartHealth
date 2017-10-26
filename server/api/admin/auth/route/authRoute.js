'use strict';

var adminAuth = require('../controller/authController');

module.exports = function(app) {

    app.post('/api/admin/auth/enc', adminAuth.encryptCookies); // Cookies encryption
    app.get('/api/admin/auth/signout', adminAuth.signout); // User Singout Process
    app.post('/admin/forgotpassword', adminAuth.forgotpassword); // Forgot Password Process
    app.post('/admin/resetpassword', adminAuth.resetpassword); // Reset Password Process
	app.post('/admin/createpassword', adminAuth.createPassword); // Create Password Process(New User)
	app.get('/admin/get/country', adminAuth.getCountryList); // Get Country List
	app.post('/admin/get/state', adminAuth.getStateList); // Get State List
	

    app.post('/api/admin/auth/signin', adminAuth.signin);
    app.post('/api/admin/auth/dec', adminAuth.decryptCookies);
    
};