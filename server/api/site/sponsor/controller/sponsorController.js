'use strict';
var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");

var commonLib = require('../../../../lib/common');
var mainConfig = require('../../../../config/mainConfig');
var fs = require('fs');


db.models.trial.associate(sequelizeDb.models);
	
exports.getallSponsors = function(req, res, next) {
 	db.models.sponsor.findAll()
	.then(function(sponsors) {
		if(sponsors)
		{
			res.json({
				status: true,
				data: sponsors,
				message: 'Sponsors load successfully'
			});
		}
		else {
			res.json({
				status: false,
				data: null,
				message: 'Failed to load data..!'
			});
		}
	});
};

 exports.getSponsors = function(req, res, next) {
 	
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;

 	db.models.sponsor.findAndCountAll({
 		offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
      	limit: pageSize
    })
	.then(function(sponsors) {
		if(sponsors)
		{
			res.json({
				status: true,
				data: sponsors,
				message: 'Sponsors load successfully'
			});
		}
		else {
			res.json({
				status: false,
				data: null,
				message: 'Failed to load data..!'
			});
		}
	});
};

exports.getSponsorsId = function(req, res, next) {

 	db.models.sponsor.find({
 		where:{
 			id:req.body.id
 		}
    })
	.then(function(sponsors) {
		if(sponsors)
		{
			res.json({
				status: true,
				data: sponsors,
				message: 'Sponsors load successfully'
			});
		}
		else {
			res.json({
				status: false,
				data: null,
				message: 'Failed to load data..!'
			});
		}
	});
};

exports.savedSponsor = function(req, res, next) {
	
	var state= {}; 
	if(req.body.state1) {
		state= req.body.state1;
	} else {
		state= req.body.state;
	}
	
	var sponsorData ={};

	sponsorData["company_id"] = req.body.company_id;
	sponsorData["sponsor_company"] = req.body.sponsor_company;
	sponsorData["contact_name"] = req.body.contact_name;
	sponsorData["email_address"] = req.body.email_address;
	sponsorData["contact_number"] = req.body.contact_number;
	sponsorData["contact_address_1"] = req.body.contact_address_1;
	sponsorData["contact_address_2"] = req.body.contact_address_2;
	sponsorData["city"] = req.body.city;
	sponsorData["state"] = state;
	sponsorData["country"] = req.body.country;
	sponsorData["zip"] = req.body.zip;


	db.models.sponsor.find({
		where: {
            email_address: req.body.email_address
        }
	}).then(function(findSponsor) {
		if(findSponsor) {
            return res.json({
                'status': false,
                'data': null,
                'message': 'Sponsor already exist'
            });
        } 
        else {
        	if (req.files && req.files.file) {
				var sponsorPicture = req.files.file;
		    	
		    	var options = {
					'uploadedfileobj' : sponsorPicture,
					'storagepath' : settings.filesPath.userPicture,
					'resizeinfo' : false
				}

				commonLib.storeSFImage(options, function(result) {
					if(result.status) {
						sponsorData.sponsor_image = result.data.filename;
						saveSponsorData(sponsorData, function(result) {
							if(result.status) { 		
			    				res.json({
			                    	'status': true,
			                    	'message': 'Sponsor Added SuccessFully'
			                   	});                   
			                }
			                else {
			                   	return res.json({
			                    	'status': false,
			                    	'message': 'Failed to add Device'
			                   	});  
			                }
		    			}); 					
		    		}
		        });
			} 
			else {
		        saveSponsorData(sponsorData, function(result) {
		            if (result.status==true) {
		                return res.json({
		                    'status': true,
		                    'data': result.data,
		                    'message': successmsg
		                });                   
		            } else {  
		                return res.json({
		                    'status': false,
		                    'message': result.message
		                });  
		            }
		        });        
			}
        }
	});
};

var saveSponsorData = function (sponsorData, callback) {
    
	db.models.sponsor.create(sponsorData).then(function(sponsorData) {
		callback ({ 'status': true }); 
	})
    .catch(function(err) {
		callback({
			'status': false,
			'message': err
		});
    });
};

exports.updateSponsor = function(req, res, next) {
	
	var failmsg = 'There was some problem updating device, please try later or contact administrator.';
  	var successmsg = 'Device Data has been updated successfully.';

	var state= {}; 
	
	if(req.body.state1) {
		state= req.body.state1;
	} else {
		state= req.body.state;
	}
	
	var sponsorId = req.params.id;
  	var sponsorData = JSON.parse(req.body.sponsor);

  	console.log(sponsorData);

	var data = {
		"company_id" : "e2bf5889-a22d-49f5-bf51-8bc2f02178c4",
		"sponsor_company" : req.body.sponsor_company,
		"contact_name" : req.body.contact_name,
		"email_address" : req.body.email_address,
		"contact_number" : req.body.contact_number,
		"contact_address_1" : req.body.contact_address_1,
		"contact_address_2" : req.body.contact_address_2,
		"city" : req.body.city,
		"state" : state,
		"country" : req.body.country,
		"zip" : req.body.zip
	};
	
	db.models.sponsor.findOne({
    where: {
      id: sponsorId
    }
  }).then(function (sponsor) {
        sponsor.company_id  = sponsorData.company_id;
        sponsor.sponsor_company = sponsorData.sponsor_company;
        sponsor.contact_name = sponsorData.contact_name;
        sponsor.email_address = sponsorData.email_address;
        sponsor.contact_number = sponsorData.contact_number;
        sponsor.contact_address_1 = sponsorData.contact_address_1;
        sponsor.contact_address_2 = sponsorData.contact_address_2;
        sponsor.city = sponsorData.city;
        sponsor.country = sponsorData.country;
        sponsor.zip = sponsorData.zip;
        
        if (req.files && req.files.file) {
            var sponsorPicture = req.files.file;

            var options = {
                'uploadedfileobj' : sponsorPicture,
                'storagepath' : settings.filesPath.userPicture,
                'resizeinfo' : false
            }

            commonLib.storeSFImage(options, function(result) {
              if(result.status) {
                commonLib.removeProfilePicture(sponsor.sponsor_image);
                sponsor.sponsor_image = result.data.filename;
                sponsor.save().then(function(result) {
                    if (result.status) {
                        res.json({
                            'status': true,
                            'data': result.data,
                            'message': successmsg,
                        });                   
                    } else {
                        res.json({
                            'status': false,
                            'message': result.message
                        });  
                    }
                });                     
              } else {
                    return res.json({
                        'status': false,
                        'message': failmsg
                    });
                }
            });

        } else {
          
            sponsor.save().then(function(result) {
                if (result.status==true) {
                    return res.json({
                        'status': true,
                        'data': result.data,
                        'message': successmsg
                    });                   
                } else {  
                    return res.json({
                        'status': false,
                        'message': result.message
                    });  
                }
            });        
        }
    });
};


exports.deleteSponsorData = function(req, res, next) {
	
	var sponsorID = req.params.id;
	
	sequelizeDb.models.trial.find({
		where:{
			sponsor_id: sponsorID
		}
	}).then(function (data) {
		if(data){
			res.json({
		  	status: false,
		  	data: null,
		  	message: 'You can not delete this sponsor. Trial attached with this sponsor..!'
		  });
		}
	})
	sequelizeDb.models.sponsor.destroy({ where: { id: sponsorID} })
	.then(function(sponsor) {
		if (sponsor) {
			res.json({
		  	status: true,
		  	data: sponsorID,
		  	message: 'Data removed successfully..!'
		  });
	  }
	  else {
			res.json({
				status: false,
				data: null,
				message: 'Data not found to remove..!'
			});
	  }
	}).catch(function(err){
		res.json({
			status: false,
			data: null,
			message: err.message
		});
	});
};

exports.getSponsorsDSMB = function(req, res, next) {
 	
 	var userInfo = generalConfig.getUserInfo(req);
 	var dsmbId = userInfo.id;
 	
 	db.models.trial.findAll({
 		attributes: ['sponsor_id'],
 		where:{
 			dsmb_id: dsmbId
 		}
 	}).then(function(trialData) {
 		var data ={};
 		var resultData =[];
 		for (var i = 0; i < trialData.length; i++) {
 			data = trialData[i].dataValues.sponsor_id;
 			resultData.push(data);
 		}
		db.models.sponsor.findAll({
			where:{
				id: resultData
			}
		}).then(function(result){
			if(result)
			{
				res.json({
					status: true,
					data: result,
					message: 'Sponsors load successfully for DSMB'
				});
			}
			else {
				res.json({
					status: false,
					data: null,
					message: 'Failed to load data..!'
				});
			}
		}).catch(function(err){
			res.json({
				status: false,
				data: null,
				message: err.message
			});
		});
	});
};

exports.getSponsorsCRO = function(req, res, next) {
 	
 	var userInfo = generalConfig.getUserInfo(req);
 	var croCoordinatorId = userInfo.id;
 	
 	db.models.trial.findAll({
 		attributes: ['sponsor_id'],
 		where:{
 			croCoordinator_id: croCoordinatorId
 		}
 	}).then(function(trialData) {
 		var data ={};
 		var resultData =[];
 		for (var i = 0; i < trialData.length; i++) {
 			data = trialData[i].dataValues.sponsor_id;
 			resultData.push(data);
 		}
		db.models.sponsor.findAll({
			where:{
				id: resultData
			}
		}).then(function(result){
			if(result)
			{
				res.json({
					status: true,
					data: result,
					message: 'Sponsors load successfully for Cro Coordinator'
				});
			}
			else {
				res.json({
					status: false,
					data: null,
					message: 'Failed to load data..!'
				});
			}
		}).catch(function(err){
			res.json({
				status: false,
				data: null,
				message: err.message
			});
		});
	});
};

