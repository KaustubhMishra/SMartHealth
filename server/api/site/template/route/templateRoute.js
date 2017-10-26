'use strict';
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var siteTemplate = require('../controller/templateController');
module.exports = function(app) {

	app.post('/api/site/template/add', multipartMiddleware, siteTemplate.addTemplate); // Add new Template
	app.get('/api/site/template/:id', siteTemplate.getTemplate); // get Template Record by ID
	app.post('/api/site/template/:id', multipartMiddleware, siteTemplate.updateTemplate); // Update Template
    app.post('/api/site/template', siteTemplate.getTemplateList); // Get Template list
    app.delete('/api/site/template/:id', siteTemplate.deleteTemplate); // Delete Template
    app.post('/api/site/template/:id/download', siteTemplate.downloadTemplateFile); // Download file by id
    app.get('/api/site/getattrlist/:id', siteTemplate.attributeList); // Get Parent Attribute list of template  ( id = Device Group Id )
    app.get('/api/site/getsubattrlist/:id', siteTemplate.subAttributeList); // Get Sub-Attribute list of template  ( id = Parent Device Group Id )

    app.get('/api/site/recursionattr/:id', siteTemplate.recursionParentAttrList); // Get own template's attribute, if not then get nearest Group template's attribute ( id = Device Group Id )
    
};