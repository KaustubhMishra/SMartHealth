'use strict';

var generalConfig = require('../../../../config/generalConfig');
var async = require('async');

var db = require('../../../../config/sequelize').db;

var commonLib = require('../../../../lib/common');
var crypto = require('crypto');

/*
 * @author: Gunjan
 * Get Profile Data of Login User in Super Admin Panel
 */
exports.getProfileData = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    if(userInfo.id)
    {
    	// Load user information
    	db.models.admin_user
		    .findOne({
		        attributes: ['id', 'firstname', 'lastname', 'email','profile_image', 'contact_no', 'contact_no_code'],
		        where: {
		            id: userInfo.id
		        }
		    })
		    .then(function(user) {

		    	// Load profile image
		        commonLib.loadProfileImages(user, function(){
		                res.json({
		                   status: 'success',
		                   data: user,
		                   message: 'Request for user data has been completed',
		                });
		        });
		    })
		    .catch(function(err) {
			      res.json({
			          status: 'fail',
			          data: null,
			          message: 'Request for user data has not been completed',
			      });
		    });
    }
    else
    {
    	res.json({
	        status: 'fail',
	        data: null,
	        message: 'User information has not been found'
	    })
    }
};

/*
 * @author: Gunjan
 * Update Profile Data of Login User in Super Admin Panel
 */
exports.updateProfile = function(req, res, next) {

  //Get userinfo from request
  var userInfo = generalConfig.getUserInfo(req);
  if(!userInfo.id)
  {
  	res.json({
	  status: 'fail',
	  data: null,
	  message: 'User information has not been found'
	});
  }
  else if (req.body != "")
  {
	 req.checkBody('firstname', 'First Name is required').notEmpty();
	 req.checkBody('lastname', 'Last Name is required').notEmpty();
	 req.checkBody('email', 'Email is required').notEmpty();
	 req.checkBody('contact_no', 'Contact no. is required').notEmpty();
	 req.checkBody('contact_no_code', 'Contact no. code is required').notEmpty();
	 if(req.body.updatePassword)
	 {
	 	req.checkBody('password', 'password is required').notEmpty();
	 }
	 var mappedErrors = req.validationErrors(true);
  }

  if(mappedErrors == false)
  {
 	db.models.admin_user.findAll({
 			attributes: ['id'],
 			where: {
					 $or: [ { email: req.body.email } ],
					 id: {
					      $ne: userInfo.id
					     },
				   }
    }).then(function(user_check) {
    	if(user_check.length == 0)
    	{
    		// Get information of admin user
			db.models.admin_user.findOne({
					where: { id: userInfo.id }
			}).then(function(user) {

				user.firstname = req.body.firstname;
				user.lastname = req.body.lastname;
				user.email = req.body.email;
				user.contact_no = req.body.contact_no;
				user.contact_no_code = req.body.contact_no_code;
				// Password Validation
				if(req.body.updatePassword)
				{
					user.password = generalConfig.encryptPassword(req.body.password);
				}
				
				// If Profile pic selected
				if(req.files && req.files.profilepicture)
				{
				    var profilepicture = req.files.profilepicture; // Profile Pic
				    // Upload process of Profile Pic
				    commonLib.storeProfilePicture(profilepicture, user.id, function(result) {
				        if(result.status)
				        {
		                	commonLib.removeProfilePicture(user.profile_image);
				            user.profile_image = result.filename;
				            // Update user information
							saveUserData(user, function(user_result)
							{
								if(user_result.status == 'success')
								{	
									res.json({
									  status: 'success',
									  data: null,
									  message: 'Profile information has been updated successfully'
									});
								}
								else
								{
									res.json({
									  status: 'fail',
									  data: null,
									  message: 'Profile information has not been updated successfully'
									});
								}
							});
		                }
		                else
		                {
							res.json({
							  status: 'fail',
							  data: null,
							  message: result.message,
							});
		                }
		            });
		        }
		        else // No profile pic
		        {
					saveUserData(user, function(user_result) {
						if(user_result.status == 'success')
						{						
							res.json({
							  status: 'success',
							  data: null,
							  message: 'Profile information has been updated successfully'
							});
						}
						else
						{
							res.json({
							  status: 'fail',
							  data: null,
							  message: 'Profile information has not been updated successfully'
							});
						}
					});
			   	}
			}).catch(function(err) {
				res.json({
				  status: 'fail',
				  data: null,
				  message: 'Profile information has not been updated successfully'
				});    
			});
    	}
    	else
    	{
    		res.json({
			  status: 'fail',
			  data: null,
			  message: 'Same email addess already exist',
			});
    	}
 	}).catch(function(err) {
		res.json({
		  status: 'fail',
		  data: null,
		  message: 'Profile information has not been updated successfully'
		});   
	});
  }
  else
  {
      res.json({
          status: 'fail',
          data: null,
          message: mappedErrors
      });
  }
};

/*
 * @author: Gunjan
 * Save/Update user information
 */
var saveUserData = function (user, callback) {

    user.save().then(function(user) {
       callback({ 
       		status: 'success',
       		data: null,
       		message: 'User information has been updated successfully'
       	}); 
    })
    .catch(function(err) {
            callback({
                status: 'fail',
                data: null,
                message: 'User information has not been updated successfully'
            });
    });

}


/*
 * @author: Gunjan
 * Get user profile image of login user
 */
exports.getProfileImage = function(req, res, next) {
    var userInfo = generalConfig.getUserInfo(req);
    //console.log(req);
    if(!userInfo.id)
    {
    	res.json({
		  status: 'fail',
		  data: null,
		  message: 'User information has not been found'
		});
    }
    else
    {
	    db.models.admin_user
		    .findOne({
		        attributes: ['id','profile_image'],
		        where: { id: userInfo.id }
		    })
	    .then(function(user) {

	        commonLib.loadProfileImages(user, function(){
	                res.json({
	                  status: 'success',
	                  data: user,
	                  message: 'Profile picture has been load successfully'
	                });    
	        });
	    })
	    .catch(function(err) {
	        res.json({
	            status: 'fail',
	            data: null,
	            message: 'Profile picture has not been load successfully'
	        });   
	    });
    }
}

/*
 * @author: Gunjan
 * User Management
 * Get list of User
 */
exports.getUserList = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else
    {
	    var sortBy = req.body.params.sortBy;
	    var sortOrder = req.body.params.sortOrder;
	    var pageNumber = req.body.params.pageNumber;
	    var pageSize = req.body.params.pageSize;
	    var searchWhere = '';

	    // Sorting
	    if(sortBy == 'full_name') { sortBy = 'full_name'; }
	    else if(sortBy == 'full_phone') { sortBy = 'full_phone'; }
	    else if(sortBy == 'email') { sortBy = 'email'; }
	    else { sortBy = 'createdAt'; }

	    // Pagination
	    if(pageNumber == '') { pageNumber = pageNumber; } 
	    else { pageNumber = (pageNumber - parseInt(1)) * pageSize; }

	    // Condition
		if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "") {
				searchWhere += "where email like :searchTxt or full_name like :searchTxt or full_phone like :searchTxt"
	    }

	    // Main inner query
	    	var main_innner_query = "select admin_user.id, admin_user.email, CONCAT(admin_user.firstname,' ',admin_user.lastname) as full_name, IF( (admin_user.contact_no is null or admin_user.contact_no = '') and (admin_user.contact_no_code is null or admin_user.contact_no_code = '') , '' , CONCAT('+',admin_user.contact_no_code,' ',admin_user.contact_no)) as full_phone, admin_user.active, admin_user.createdAt from 	admin_user";

	    // Query
	    db.query("select id, email, full_name, full_phone, active, createdAt from ("+main_innner_query+") as x "+searchWhere+"  ORDER BY "+sortBy+" "+sortOrder+" LIMIT :pageSize OFFSET :offset",
	        { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%', pageSize: pageSize, offset: pageNumber }, type: db.QueryTypes.SELECT }
	    ).then(function(user_response)
	    {
	    	if(user_response.length > 0) // Result Found
	        {
	        	// Get count for total rows
                db.query("select count(*) as totalCount from ("+main_innner_query+") as x "+searchWhere,
                    { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%' }, type: db.QueryTypes.SELECT }
                ).then(function(user_count_response)
                {
		        	var userAry = [];
		        		userAry = {
		        			count: user_count_response[0].totalCount,
		        			rows: user_response
		        		}

		        	res.json({ 
	        			status: 'success',
	        			data: userAry,
	        			message: 'User records has been loaded successfully'
		        	});

		        }).catch(function(err) {
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'User record request has not been completed'
                    }); 
                });	
	        }
	        else  // Result Not Found
	        {
	        	res.json({
	        			status: 'success',
	        			data: [],
	        			error: 'No user records found'
	        		});
	        }
	    }).catch(function(err) {
	        res.json({
        		status: 'fail',
        		data: null,
        		message: 'User record request has not been completed'
        	}); 
	    });
	}
};

/*
 * @author: Gunjan
 * User Management
 * Add New User
 */
exports.addNewUser = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else
    {
    	req.checkBody('firstname', 'First Name is required').notEmpty();
    	req.checkBody('lastname', 'Last Name is required').notEmpty();
    	req.checkBody('email', 'Email Address is required').notEmpty();
    	req.checkBody('contact_no', 'Contact No. is required').notEmpty();
    	req.checkBody('contact_no_code', 'Contact No. Code is required').notEmpty();
    	var mappedErrors = req.validationErrors(true);
    }

    if(mappedErrors == false)
    {
    	db.models.admin_user.findAll({
    				attributes: ['id'],
					where: {
						 email: req.body.email
					   }
		}).then(function(user_check) {
			if(user_check.length == 0)
			{
				var userTokenGen = new Date().getTime()+req.body.email;
                var userToken = crypto.createHash('md5').update(userTokenGen).digest('hex');

				var userDataObj = [];
				userDataObj = {
						 email: req.body.email,
						 firstname: req.body.firstname,
						 lastname: req.body.lastname,
						 contact_no_code: req.body.contact_no_code,
						 contact_no: req.body.contact_no,
						 usertoken: userToken
					   };
				db.models.admin_user.create(userDataObj).then(function(user) {
						if(user)
						{
							var userEmaildetail = {};
			                userEmaildetail.userfullname = req.body.firstname+" "+req.body.lastname;
			                userEmaildetail.usertoken    = userToken;
			                userEmaildetail.email        = req.body.email;
			                sendCreatePasswordLink(userEmaildetail, function(mailsend_callback){
			                	if(mailsend_callback.status == 'success')
			                	{
			                		res.json({
										status: 'success',
										data: null,
										message: 'User has been registered successfully'
									});
			                	}
			                	else
			                	{
			                		res.json({
										status: 'fail',
										data: null,
										message: 'User has been registered successfully but mail of password link has not successfully send'
									});
			                	}
			                });
						}
						else
						{
							res.json({
								status: 'fail',
								data: null,
								message: 'User has not been registered successfully'
							});
						}
				}).catch(function(err) {
						res.json({
							status: 'fail',
							data: null,
							message: 'User has not been registered successfully'
						 });
				});
			}
			else
			{
				res.json({
				  status: 'fail',
				  data: null,
				  message: 'Same email addess already exist',
				});
			}
		}).catch(function(err) {
			res.json({
			  status: 'fail',
			  data: null,
			  message: 'User has not been registered successfully'
			});   
		});
    }
    else
    {
    	res.json({
          status: 'fail',
          data: null,
          message: mappedErrors
      	});
    }
}

/*
 * @author: Gunjan
 * User Management
 * New User Register, Sent Create Password Link with Token
 * @param : userdetail
 *  Exp: { userfullname = 'Value' ,
 *         usertoken = 'Value'  ,
 *	       email  = 'Value' }
 */
var sendCreatePasswordLink = function sendCreatePasswordLink(userdetail, callback) {

    var emailTemplate = settings.emailTemplate;
    var emailbody = emailTemplate.createpasswordEmailBody;
    var userToken = userdetail.usertoken;
    var link = "<a href='"+settings.superAdminUrl+"/createpassword/"+userToken+"'>"+settings.superAdminUrl+"/createpassword/"+userToken+"</a>";

    emailbody = emailbody.replace("%companyname%", userdetail.userfullname);
    emailbody = emailbody.replace("%createpasswordlink%", link);     

    var emailmessage = emailTemplate.emailContainerHeaderString;
    emailmessage += emailbody;
    emailmessage += emailTemplate.emailContainerFooterString;


    var message = {
        from:    "kaustubh.mishra@softwebsolutions.com", 
        to:      userdetail.email,
        subject: emailTemplate.createpasswordSubject,
        attachment: 
        [
          {data:emailmessage, alternative:true}
        ]
    };

    settings.emailserver.send(message, function(err, message) { 
        console.log(err || message);
        if(err)
        {
            callback({
                status: 'fail',
                data: null,
                message: 'User create password mail has not been send successfully'
            });
        }
        else
        {
            callback({
                status: 'success',
                data: null,
                message: 'User create password mail has been send successfully'
            });
        }
    });
};


/*
 * @author: Gunjan
 * User Management
 * Get User Information
 */
exports.getUserData = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    var req_user_id = req.params.id;
    
    if(!userInfo.id && !req_user_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else
    {
    	// Load user information
    	db.models.admin_user
		    .findOne({
		        attributes: ['id', 'firstname', 'lastname', 'email','profile_image', 'contact_no', 'contact_no_code','active'],
		        where: {
		            id: req_user_id
		        }
		    })
		    .then(function(user) {
		    	// Load profile image
		        commonLib.loadProfileImages(user, function(){
		                res.json({
		                   status: 'success',
		                   data: user,
		                   message: 'Request for user data has been completed',
		                });
		        });
		    })
		    .catch(function(err) {
			      res.json({
			          status: 'fail',
			          data: null,
			          message: 'Request for user data has not been completed',
			      });
		    });
    }
}

/*
 * @author: Gunjan
 * Update User Data
 */
exports.updateUser = function(req, res, next) {

  //Get userinfo from request
  var userInfo = generalConfig.getUserInfo(req);
  if(!userInfo.id)
  {
  	res.json({
	  status: 'fail',
	  data: null,
	  message: 'User information has not been found'
	});
  }
  else if (req.body != "")
  {
	 req.checkBody('firstname', 'First Name is required').notEmpty();
	 req.checkBody('lastname', 'Last Name is required').notEmpty();
	 req.checkBody('email', 'Email is required').notEmpty();
	 req.checkBody('contact_no', 'Contact no. is required').notEmpty();
	 req.checkBody('contact_no_code', 'Contact no. code is required').notEmpty();
	 var mappedErrors = req.validationErrors(true);
  }

  if(mappedErrors == false)
  {
 	db.models.admin_user.findAll({
 			attributes: ['id'],
 			where: {
					 $or: [ { email: req.body.email } ],
					 id: {
					        $ne: req.params.id
					     },
				   }
    }).then(function(user_check) {
    	if(user_check.length == 0)
    	{
    		// Get information of admin user
			db.models.admin_user.findOne({
					where: { id: req.params.id }
			}).then(function(user) {

				user.firstname = req.body.firstname;
				user.lastname = req.body.lastname;
				user.email = req.body.email;
				user.contact_no = req.body.contact_no;
				user.contact_no_code = req.body.contact_no_code;
				
				// If Profile pic selected
				if(req.files && req.files.userpicture)
				{
				    var userpicture = req.files.userpicture; // Profile Pic
				    // Upload process of Profile Pic
				    commonLib.storeProfilePicture(userpicture, user.id, function(result) {
				        if(result.status)
				        {
		                	commonLib.removeProfilePicture(user.profile_image);
				            user.profile_image = result.filename;
				            // Update user information
							saveUserData(user, function(user_result)
							{
								if(user_result.status == 'success')
								{	
									res.json({
									  status: 'success',
									  data: null,
									  message: 'User information has been updated successfully'
									});
								}
								else
								{
									res.json({
									  status: 'fail',
									  data: null,
									  message: 'User information has not been updated successfully'
									});
								}
							});
		                }
		                else
		                {
							res.json({
							  status: 'fail',
							  data: null,
							  message: result.message,
							});
		                }
		            });
		        }
		        else // No profile pic
		        {
					saveUserData(user, function(user_result) {
						if(user_result.status == 'success')
						{						
							res.json({
							  status: 'success',
							  data: null,
							  message: 'User information has been updated successfully'
							});
						}
						else
						{
							res.json({
							  status: 'fail',
							  data: null,
							  message: 'User information has not been updated successfully'
							});
						}
					});
			   	}
			}).catch(function(err) {
				res.json({
				  status: 'fail',
				  data: null,
				  message: 'User information has not been updated successfully'
				});    
			});
    	}
    	else
    	{
    		res.json({
			  status: 'fail',
			  data: null,
			  message: 'Same email addess already exist',
			});
    	}
 	}).catch(function(err) {
		res.json({
		  status: 'fail',
		  data: null,
		  message: 'User information has not been updated successfully'
		});   
	});
  }
  else
  {
      res.json({
          status: 'fail',
          data: null,
          message: mappedErrors
      });
  }
};

/*
 * @author: Gunjan
 * User Management
 * Delete User
 */
exports.deleteUserData = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    var req_user_id = req.params.id;
    
    if(!userInfo.id && !req_user_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else
    {
    	db.models.admin_user.destroy({ 
			where: { id: req_user_id } 
		}).then(function(delete_user_response) {
			if(delete_user_response)
			{
				res.json({
		            status: 'success',
		            data: null,
		            message: 'User has been deleted successfully'
		        });
			}
			else
			{
				res.json({
		            status: 'fail',
		            data: null,
		            message: 'User has not been deleted successfully'
		        });
			}
		}).catch(function(err) {
	          	res.json({
	            	status: 'fail',
	            	data: null,
	            	message: 'User has not been deleted successfully'
	        	});
        });
    }
}

/*
 * @author: Gunjan
 * User Management
 * Change User Status
 */
exports.changeUserStatus = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    var req_user_id = req.params.id;
    
    if(!userInfo.id && !req_user_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else
    {

    	// Get information of admin user
		db.models.admin_user.findOne({
			attributes: ['id','password', 'usertoken'],
			where: { id: req_user_id }
		}).then(function(user_response) {

			if(user_response)
			{
				if(user_response.password)
				{
					user_response.active = req.body.status;
					
					saveUserData(user_response, function(user_result) {
						if(user_result.status == 'success')
						{						
							res.json({
							  status: 'success',
							  data: null,
							  message: 'User status has been changed successfully'
							});
						}
						else
						{
							res.json({
							  status: 'fail',
							  data: null,
							  message: 'User status has not been changed'
							});
						}
					});

				}
				else
				{
					res.json({
					  status: 'fail',
					  data: null,
					  message: 'Requested User has not been confirmed, Please confirm user before changing status'
					});
				}
			}
			else
			{
				res.json({
				  status: 'fail',
				  data: null,
				  message: 'Requested User information has not been found'
				}); 
			}
		}).catch(function(err) {
			res.json({
			  status: 'fail',
			  data: null,
			  message: 'Requested User information has not been found'
			});    
		});	
    }
}