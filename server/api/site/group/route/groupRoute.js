'use strict';

var siteGroup = require('../controller/groupController');
module.exports = function(app) {

	app.post('/api/site/group/add', siteGroup.addGroup); // Add Group
    app.get('/api/site/group/:id', siteGroup.getGroup); // get Group Record by ID
    app.put('/api/site/group/:id', siteGroup.updateGroup); // Update Group
    app.post('/api/site/group', siteGroup.getGroupList); // Get Group list
    app.delete('/api/site/group/:id', siteGroup.deleteGroup); // Delete Group
	app.post('/api/site/group/namelist', siteGroup.getGroupNameTreeList); // get Group List
    

};