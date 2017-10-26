'use strict';

var adminCompanyUser = require('../controller/companyUserController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
 	
    app.post('/api/admin/companyuser/getuserlist/:companyId' ,adminCompanyUser.getuserlist); // Get List of company User based on company Id ( companyId = Company Id )
    app.post('/api/admin/companyuser/status/:userId' ,adminCompanyUser.changeUserStatus); // Change Status of user based on user id ( userId = User Id )

};