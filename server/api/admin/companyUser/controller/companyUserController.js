'use strict';

var generalConfig = require('../../../../config/generalConfig');
var async = require('async');

var db = require('../../../../config/sequelize').db;

var commonLib = require('../../../../lib/common');
var crypto = require('crypto');


/*
 * @author: Gunjan
 * Company User Management
 * Get list of User based on company
 */
exports.getuserlist = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    var company_id = req.params.companyId;
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else if(!company_id)
    {
    	res.json({
            status: 'fail',
            data: null,
            message: 'Company information has not been found'
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
	    if(sortBy == 'firstname') { sortBy = 'full_name'; }
	    else if(sortBy == 'email') { sortBy = 'email'; }
	    else if(sortBy == 'full_phone') { sortBy = 'full_phone'; }
	    else if(sortBy == 'active') { sortBy = 'active'; }
	    else { sortBy = 'createdAt'; }

	    // Pagination
	    if(pageNumber == '') { pageNumber = pageNumber; } 
	    else { pageNumber = (pageNumber - parseInt(1)) * pageSize; }

	    // Condition
		if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "") {
				searchWhere += " where full_name like :searchTxt or email like :searchTxt or full_phone like :searchTxt or group_name like :searchTxt";
	    }

	    // Main Inner Query
	    var main_innner_query = "select user.id, CONCAT(user.firstname,' ',user.lastname) as full_name, user.email, IF( (user.phone is null or user.phone = '') and (user.phonecode is null or user.phonecode = '') , '' , CONCAT('+',user.phonecode,' ',user.phone)) as full_phone, user.active, user.createdAt, group_concat(company_group.name SEPARATOR ' | ') as group_name from user left join company_user_group on company_user_group.user_id = user.id left join company_group on company_group.id = company_user_group.company_group_id where user.company_id = :company_id group by user.id, full_name, user.email, full_phone, user.active, user.createdAt"

	    // Query
	    db.query("select id, full_name, email, full_phone, active, createdAt, group_name from ("+main_innner_query+") as x "+searchWhere+" ORDER BY "+sortBy+" "+sortOrder+" LIMIT :pageSize OFFSET :offset",
	        { replacements: { company_id: company_id , searchTxt: '%'+req.body.SearchParams.searchTxt+'%', pageSize: pageSize, offset: pageNumber }, type: db.QueryTypes.SELECT }
	    ).then(function(user_response)
	    {
	    	if(user_response.length > 0) // Result Found
	        {

	        	// Get count for total rows
                db.query("select count(*) as totalCount from ("+main_innner_query+") as x "+searchWhere,
                    { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%', company_id: company_id }, type: db.QueryTypes.SELECT }
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
	        			message: 'User record has been loaded successfully'
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
 * Company User Management
 * Change User Status
 */
exports.changeUserStatus = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    var req_user_id = req.params.userId;
    
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
		db.models.user.findOne({
			attributes: ['id','password', 'usertoken'],
			where: { id: req_user_id }
		}).then(function(user_response) {

			if(user_response)
			{
				if(user_response.password)
				{
					//user_response.active = req.body.status;
					
					var userDataObj = [];
						userDataObj = {
							active: req.body.status,
						};

					// Update User Status  
						db.models.user.update( userDataObj, {
							where : { id: req_user_id } 
						}).then(function(user_update_response) {
							if(user_update_response)
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
					}).catch(function(err) {
						res.json({
							status: 'fail',
							data: null,
							message: 'User status has not been changed'
						});
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