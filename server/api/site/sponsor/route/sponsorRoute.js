'use strict';

var sponsorController = require('../controller/sponsorController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
	
	// Just for React-Redux demo
	app.get('/getallsponsors', sponsorController.getallSponsors);
	app.get('/getSponsorsDSMB', sponsorController.getSponsorsDSMB);
	app.get('/getSponsorsCRO', sponsorController.getSponsorsCRO);
	app.post('/getsponsorById', sponsorController.getSponsorsId);
	
	
	app.post('/getsponsor', sponsorController.getSponsors);
	app.post('/addsponsor', multipartMiddleware, sponsorController.savedSponsor);
	app.put('/updatesponsor/:id', multipartMiddleware, sponsorController.updateSponsor);
	app.delete('/deletesponsor/:id', sponsorController.deleteSponsorData);
};
