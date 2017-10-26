'use strict';

var adminCompany = require('../controller/companyController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
 	
    app.post('/api/admin/company/list',adminCompany.getCompanyList); // Get List of Parent Company
    app.get('/api/admin/company/getbasicinfo/:id', adminCompany.getCompanyBasicInfo); // Get Company Basic Information ( id = Company Id )
    app.post('/api/admin/company/update/basicinfo/:id', adminCompany.updateCompanyBasicInfo); // Update Company Basic Information ( id = Company Id )
    app.get('/api/admin/company/get/usage/:id', adminCompany.getCompanyUsage); // Get Company Usage Count ( id = Company Id )
    app.post('/api/admin/company/sub/list/:parentcompanyid',adminCompany.getSubCompanyList); // Get List of Child Company ( parentcompanyid = Parent Company Id )
    app.get('/api/admin/company/get/statistics/:id', adminCompany.getCompanyStatistics); // Get Company Statistics ( id = Company Id )
    app.get('/api/admin/company/proxylogin/:id', adminCompany.companyProxyLogin); // Company Proxy Login ( id = Company Id )

    app.post('/api/admin/company/common/list', adminCompany.getCommonCompanyList); // Get List of Common Company
    app.get('/api/admin/company/common/delete/:id', adminCompany.deleteCommonCompanyData); // Delete Common company record 
    app.post('/api/admin/company/common/add', adminCompany.addNewCommonCompany); // Add New Common Company

    /*app.post('/api/admin/user/add',adminUser.addNewUser); // Add New User
    app.get('/api/admin/user/get/:id',adminUser.getUserData); // Get User Data
    */

    /* Company Module Management */
    
};