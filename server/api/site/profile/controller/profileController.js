'use strict';

var db = require('../../../../config/cassandra');
var generalConfig = require('../../../../config/generalConfig');
var cassandra = require('cassandra-driver');

var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");

var async = require('async');

/* Common function Lib */
var commonLib = require('../../../../lib/common');
var mainConfig = require('../../../../config/mainConfig');

var fs = require('fs');

db.models.user.associate(db.models);
db.models.company_user_group.associate(db.models);




exports.croContactInfo = function(req, res, next) {

	var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
	    return res.json({
	        status: false,
	        message: 'Unknown user'
	    });
	}    
	
	db.models.trial
		.find({
		}).then(function(trail){
			db.models.user.find({
				where:{
					id: trail.user_id
				}
			}).then(function(user){
				var userData ={
					userId: user.id,
					userEmail: user.email,	
					userNumber: user.phone
				};

				return res.json({
					  'status': true,
					  'data': userData,
					  'message': 'Contact data load successfully'
					});

			}).catch(function(err) {
				return res.json({
					'status': false,
					'message': 'Failed to load data'
				});
			});
		}).catch(function(err) {
			return res.json({
				'status': false,
				'message': 'Failed to load data'
			});
		});
};

/**
 * @author HY
 * get patient's current trial's cro co-ordinator contact info 
 * @param  {object} user
 * @param  {object} companydata
 * @param  [func] callback 
 * @return json
 */
exports.croCoordinatorContactInfo = function(req, res, next) {

	var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
	    return res.json({
	        status: false,
	        message: 'Unknown user'
	    });
	}

    db.models.trial.findOne({
        include : [{
            attributes: ['id', 'email', 'firstname', 'lastname', 'phone'],
            model: db.models.user,
            as : 'croCoordinator'
        }, {
            model: db.models.phase,
            as : 'activePhase',
            where: {
                start_date: {
                    $lt: new Date()
                },
                tentitive_end_date: {
                    $gt: new Date()
                },
                active: true
            },
            include : [{
                attributes: ['id', 'user_id'],
                model: db.models.patient,
                as : 'phasePatients',
                where: {
                    user_id: userInfo.id    
                }
            }]
        }]        	
	}).then(function(trial){

		if(trial) {
			
			if(trial.croCoordinator) {

				var user = trial.croCoordinator;

				var userData ={
					userId: user.id,
					userEmail: user.email,	
					userNumber: user.phone
				};

				return res.json({
				  'status': true,
				  'data': userData,
				  'message': 'Contact data loaded successfully'
				});

			} else {

				return res.json({
				  'status': false,
				  'data': null,
				  'message': 'No contact detail available.'
				});				
			}
			
		} else {
			return res.json({
			  'status': false,
			  'data': null,
			  'message': 'You are no longer enrolled in a trial. Please contact your trial coordinator for any questions.'
			});	
		}
	}).catch(function(err) {
		console.log(err);
		return res.json({
			'status': false,
			'message': 'Failed to load data'
		});
	});
};

/**
 * @author HY
 * update user and company data from user object
 * @param  {object} user
 * @param  {object} companydata
 * @param  [func] callback 
 * @return json
 */
var saveUserCompanyData = function (user, callback) {

	user.save().then(function(user) {
		callback ({ 'status': true }); 
	})
    .catch(function(err) {

		callback({
			'status': false,
			'message': err
		});

    });

}

var savePatientData = function (user, callback) {
	
	user.save().then(function(user) {
		callback ({ 'status': true }); 
	})
    .catch(function(err) {

		callback({
			'status': false,
			'message': err
		});

    });
}

/**
 * @author HY
 * update login user profile
 * @return json
 */
exports.updateProfile = function(req, res, next) {

    //Get userinfo from request
	var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
	    return res.json({
	        status: "fail",
	        message: 'Unknown user'
	    });
	}
	 

	if (userInfo) {

		var failmsg = 'There was some problem updating profile, please try later or contact administrator.';
		var successmsg = 'Profile has been updated successfully.';

		var updateduser = req.body;

		db.models.user
		.findOne({			
			where: {
			  id: userInfo.id
			}
		})
		.then(function(user) {
			updatePassword();

			function updatePassword() {
				if(req.body.oldPassword) {
					var hashedPassword = generalConfig.encryptPassword(req.body.oldPassword);
					if(user.password == hashedPassword) {

						var failmsg = 'There was some problem updating password, please try later or contact administrator.';
						var successmsg = 'Password updated successfully.';

						user.password = generalConfig.encryptPassword(req.body.newPassword);
						user.save().then(function(user) {
							updateUser();
						})
					    .catch(function(err) {
					    });

					} else {
						return res.json({
						  'status': false,
						  'message': 'Current password is wrong, please try again.',
						});
					}
				} else {
					updateUser();
				}	
			}

			function updateUser() {
				console.log("User");
				user.firstname  = updateduser.firstname;
				user.lastname   = updateduser.lastname;           
				user.phone      = updateduser.phone;


				var userInfoData ={};
				userInfoData["user_id"] = user.id;
			    userInfoData["contact_address1"] = updateduser.contact_address;
			    userInfoData["city"] = updateduser.city;
			    userInfoData["state"] = updateduser.state;
			    userInfoData["country"] = updateduser.country;
			    userInfoData["fax"] = updateduser.fax;
			    

				if (req.files && req.files.file) {
				
	    			var userProfilePicture = req.files.file;

	    			var options = {
						'uploadedfileobj' : userProfilePicture,
						'storagepath' : settings.filesPath.userPicture,
						'resizeinfo' : false
					}		

				    commonLib.storeSFImage(options, function(result) {
				        if(result.status) {
				        	user.profile_image = result.data.filename;
							saveUserCompanyData(user, function(result) {
								if(result.status) {	
									saveUserContactInfo(userInfoData, function(result){
										if(result.status) {
											getprofiledata(userInfo.id, function(result){
												if (result.status==true) {
													return res.json({
													  'status': true,
													  'data': result.data,
													  'message': successmsg
													});										
												} else {	
													return res.json({
													  'status': 'fail',
													  'message': result.message
													});  
												}
											});
										} else {
											return res.json({
											  'status': 'fail',
											  'message': result.message
											});  
										}
									});
								} else {
									return res.json({
									  'status': 'fail',
									  'message': failmsg
									});
								}
							});

			            } else {

							return res.json({
							  'status': 'fail',
							  'message': result.message,
							});

			            }
			        });

			    } else {
			    	
					saveUserCompanyData(user, function(result) {
						if(result.status) {	
							saveUserContactInfo(userInfoData, function(result){
								if(result.status) {
									getprofiledata(userInfo.id, function(result){
										if (result.status==true) {
											return res.json({
											  'status': true,
											  'data': result.data,
											  'message': successmsg
											});										
										} else {	
											return res.json({
											  'status': 'fail',
											  'message': result.message
											});  
										}
									});
								} else {
									return res.json({
									  'status': 'fail',
									  'message': result.message
									});  
								}
							});
						} else {

							return res.json({
							  'status': 'fail',
							  'message': failmsg
							});
						}
					});

			   	}
			}


		})
		.catch(function(err) {
			res.json({
			  'status': 'fail',
			  'message': failmsg
			});    
		});

	} else {
		res.json({
		  	status: 'fail',
		  	message: failmsg
		});
	}		
};

/**
 * @author HY
 * user to change password
 * @return json
 */
exports.changePasswordData = function(req, res, next) {
	
	var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
	    return res.json({
	        status: "fail",
	        message: 'Unknown user'
	    });
	}    

	if (req.body != "") {
		req.checkBody('currentpassword', 'currentpassword is required').notEmpty();
		req.checkBody('newpassword', 'newpassword is required').notEmpty();
		var mappedErrors = req.validationErrors(true);
	}

	if (mappedErrors == false) {

		db.models.user
		.findOne({
			where: {
			  id: userInfo.id
			}
		})
		.then(function(user) {

			var hashedPassword = generalConfig.encryptPassword(req.body.currentpassword);
			if(user.password == hashedPassword) {

				var failmsg = 'There was some problem updating password, please try later or contact administrator.';
				var successmsg = 'Password updated successfully.';

				user.password = generalConfig.encryptPassword(req.body.newpassword);
				user.save().then(function(user) {
					return res.json({
					  'status': true,
					  'message': successmsg
					});
				})
			    .catch(function(err) {

					return res.json({
					  'status': false,
					  'message': failmsg
					});
			    });

			} else {

				return res.json({
				  'status': false,
				  'message': 'Current password is wrong, please try again.',
				});
			}

		})
		.catch(function(err) {

			res.json({
			  'status': false,
			  'message': 'Unable to get user account'
			});    
		});

	} else {
		res.json({
		  status: false,
		  message: mappedErrors
		});
	}
};

/**
 * @author HY
 * user to get profile data
 * @return json
 */
exports.getProfile = function(req, res, next) {

	var imageFolder = 'public/upload/profilepicture/';	

	var userInfo = generalConfig.getUserInfo(req);
 	if (!userInfo.companyId) {
	    return res.json({
	        status: false,
	        message: 'Unknown user'
	    });
	}  

	getprofiledata(userInfo.id, function(result){
		
		if(result.data.is_mobile == 1 ) {
			db.models.patient.findOne({
				where: {
	      			user_id: result.data.id
	  			}
			}).then(function(data){	
				result.data.dataValues.age = data.age;
				result.data.dataValues.gender = data.gender;

				if(!fs.existsSync(imageFolder+result.data.dataValues.profile_image)) {
					result.data.dataValues.profile_image =''; 
				}

				res.json({
			  		'status': true,
			  		'data': result.data,
			  		'message': 'user profile fetched successfully'
				});
			}).catch(function(err) {
				res.json({
		 			'status': 'fail',
		  			'message': 'Failed to load user',
		  			'error': err
				});
			});
		} 
		else if (result.status==true) {
			res.json({
			  'status': true,
			  'data': result.data,
			  'message': 'user profile fetched successfully'
			}); 
		}
		 else {			
			res.json({
			  'status': false,
			  'message': result.message	
			});  
		}
	});
}

/**
 * @author HY
 * user to profile detail
 * @return json
 */
var getprofiledata = function (user_id, callback) {	
	
	db.models.user
	.findOne({
	  attributes: ['id', 'firstname','lastname','email','phonecode','phone','profile_image', 'timezone', 'customer_number', 'is_mobile', 'role_id'],

	  include: [{
	      model: db.models.company,
	      attributes: ['id', 'cpid', 'name','address1','address2','city','state','country','phonecodeCom','phone','fax'],
	  }],
	  where: {
	      id: user_id
	  }
	})
	.then(function(user) {
		callback({
			'status': true,
			'data': user
		});
		
        /*async.series([
            function(callback) {   
				commonLib.loadProfileImages(user, function(){
              		callback(null, null);
				});
            },
            function(callback) {   
				commonLib.loadUserGroup(user, function(){			
              		callback(null, null);
				});
            }
        ], function(err, results) {
            if(err) {
				callback({
				  'status': false,
				  'message': 'There was some problem fetching user profile',
				  'error': err
				});
            } else { 
				callback({
				  'status': true,
				  'data': user
				});                                 
            }
  		});*/

	})
	.catch(function(err) {
		callback({
		  'status': false,
		  'message': 'Failed to load user',
		  'error': err
		});
	});
}

exports.getProfileImage = function(req, res, next) {
	
    var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
	    return res.json({
	        status: "fail",
	        message: 'Unknown user'
	    });
	}  

	db.models.user
	.findOne({
		attributes: ['id','profile_image'],
		include: [{
			attributes: ['name'],
		  	model: db.models.company
		}],
		where: {
			id: userInfo.id
		}
	})
	.then(function(user) {
		commonLib.loadProfileImages(user, function(){
			res.json({
			  'status': true,
			  'data': user,
			});    
		});		   
	})
	.catch(function(err) {
		
	  res.json({
	      'status': 'fail',
	      'message': 'Failed to load user.'
	  });    
	});
};

exports.updatePatientProfile = function(req, res, next) {
	
	var imageFolder = 'public/upload/profilepicture/';

	var userInfo = generalConfig.getUserInfo(req);
  	if (!userInfo.companyId) {
    	return res.json({
        	status: "fail",
        	message: 'Unknown user'
    	});
  	}  

 	var failmsg = 'There was some problem updating profile, please try later or contact administrator.';
    var successmsg = 'Profile has been updated successfully.';

    var updateduser = req.body;
    
    db.models.user
    .findOne({     
      where: {
        id: userInfo.id
      }
    })
    .then(function(user) {

      user.firstname  = updateduser.firstname;
      user.lastname   = updateduser.lastname;
      user.email      = updateduser.email;
      user.phone      = updateduser.phone;
      user.phonecode = updateduser.phonecode;


    	if(updateduser.updatePassword) {
        	user.password = generalConfig.encryptPassword(updateduser.password);        
      	}

      	if (req.files && req.files.profilepicture) {
      		
        	var profilepicture = req.files.profilepicture;
        	
        	var options = {
    			'uploadedfileobj' : profilepicture,
    			'storagepath' : settings.filesPath.userPicture,
    			'resizeinfo' : false
    		}

          commonLib.storeSFImage(options, function(result) {
              if(result.status) {
                  commonLib.removeProfilePicture(user.profile_image);
                                            
                  user.profile_image = result.data.filename;
            savePatientData(user, function(result) {
        
              if(result.status) { 
                getprofiledata(userInfo.id, function(result){
                	db.models.patient
    				.findOne({     
      					where: {
        					user_id: userInfo.id
      					}
    				}).then(function(patient) {
    					patient.age = req.body.age;
    					patient.gender = req.body.gender;
    					patient.save().then(function(patient){
    						result.data.dataValues.age = patient.age;
							result.data.dataValues.gender = patient.gender;
    						if (result.status==true) {
                    			res.json({
                      				'status': true,
                      				'data': result.data,
                      				'message': successmsg,
                    			});                   
                  			} else {
                    			return res.json({
                      				'status': false,
                      				'message': result.message
                    			});  
                  			}
    					}); 					
    				});
                });

              } else {

                return res.json({
                  'status': false,
                  'message': failmsg
                });
              }
            });

                } else {

            return res.json({
              'status': false,
              'message': result.message,
            });

                }
            });

        } else {
          
	        savePatientData(user, function(result) {
	          if(result.status) { 

	            getprofiledata(userInfo.id, function(result){
	            	db.models.patient
    				.findOne({     
      					where: {
        					user_id: userInfo.id
      					}
    				}).then(function(patient) {
    					patient.age = req.body.age;
    					patient.gender = req.body.gender;
    					patient.save().then(function(patient){
    						if(!fs.existsSync(imageFolder+result.data.dataValues.profile_image)) {
    							result.data.dataValues.profile_image =''; 
    						}
    						result.data.dataValues.age = patient.age;
							result.data.dataValues.gender = patient.gender;
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
	            	}).catch(function(err) {
      					res.json({
        					'status': false,
        					'message': failmsg
      					});    
    				});
	          	});
	        }
	        else {
	            return res.json({
	              'status': false,
	              'message': failmsg
	            });
	        }
        })
    }
	}).catch(function(err) {
      	res.json({
        	'status': false,
        	'message': failmsg
      	});    
    });   
};

var saveUserContactInfo = function (user, callback) {
	db.models.user_contact_info.findOne({
		where:{
			user_id: user.user_id
		}
	}).then(function(result){
		if(result == null) {
			db.models.user_contact_info.create(user).then(function(data){
				callback({ 'status': true });
			});
		} else {
			result.contact_address1 = user.contact_address1;
			result.city = user.city;
			result.state = user.state;
			result.fax = user.fax;
			result.country = user.country;
			result.save().then(function(data){
				callback({ 'status': true });
			});
		}
	})
    .catch(function(err) {
    	callback({
			'status': false,
			'message': err
		});
    });
};


exports.getProfileWeb = function(req, res, next) {

	var imageFolder = 'public/upload/profilepicture/';
	var userInfo = generalConfig.getUserInfo(req);
 	
 	if (!userInfo.companyId) {
	    return res.json({
	        status: false,
	        message: 'Unknown user'
	    });
	}  

	getprofiledataWeb(userInfo.id, function(result){
		if (result.status==true) {
			if(result.data.dataValues.profile_image != null && result.data.dataValues.profile_image != '') {
				if(!fs.existsSync(imageFolder+result.data.dataValues.profile_image)) {
					result.data.dataValues.profile_image ='user-avtar.jpg'; 
				}
			} else {
				result.data.dataValues.profile_image ='user-avtar.jpg';
			}
			
			res.json({
			  'status': true,
			  'data': result.data,
			  'message': 'user profile fetched successfully'
			}); 
		}
		 else {			
			res.json({
			  'status': false,
			  'message': result.message	
			});  
		}
	});
}

/**
 * @author HY
 * user to profile detail
 * @return json
 */
var getprofiledataWeb = function (user_id, callback) {	
	
	db.models.user
	.findOne({
	  attributes: ['id', 'firstname','lastname','email', 'company_id', 'phonecode','phone','profile_image', 'timezone', 'customer_number', 'role_id'],
	  include: [{
	      model: db.models.user_contact_info,
	      attributes: ['id', 'user_id', 'contact_address1','city','state','country','fax'],
	  }],
	  where: {
	      id: user_id
	  }
	})
	.then(function(user) {
		callback({
			'status': true,
			'data': user
		});
	})
	.catch(function(err) {
		callback({
		  'status': false,
		  'message': 'Failed to load user',
		  'error': err
		});
	});
}