'use strict';

var adminUser = require('../controller/userController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
 	
 	/* Login User Profile Management */
    app.get('/api/admin/getprofile', adminUser.getProfileData); // Get Profile Data of Login User
    app.post('/api/admin/updateprofile', multipartMiddleware, adminUser.updateProfile); // Update Profile Data of Login User
    app.get('/api/admin/getprofileimage',adminUser.getProfileImage); // Get Profile Image of Login User

    /* User Module Management */
    app.post('/api/admin/getuserlist',adminUser.getUserList); // Get List of User
    app.post('/api/admin/user/add',adminUser.addNewUser); // Add New User
    app.get('/api/admin/user/get/:id',adminUser.getUserData); // Get User Data ( id = Super admin User Id )
    app.post('/api/admin/user/update/:id', multipartMiddleware, adminUser.updateUser); // Update User Data  ( id = Super admin User Id )
    app.get('/api/admin/user/delete/:id',adminUser.deleteUserData); // Delete User Data  ( id = Super admin User Id )
    app.post('/api/admin/user/status/:id', adminUser.changeUserStatus); // Change user Status  ( id = Super admin User Id )

};