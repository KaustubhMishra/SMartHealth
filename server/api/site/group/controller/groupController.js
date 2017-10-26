'use strict';

var generalConfig = require('../../../../config/generalConfig');
var async = require('async');

/* Common function Lib */
var commonLib = require('../../../../lib/common');

var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");

 
/**
  * @author: GK
  * Add new command in Record
 */
exports.addGroup = function(req, res, next) {

    if (req.body != '')
	{
		req.checkBody('name', 'Name required').notEmpty();
		req.checkBody('parent', 'Parent group required').notEmpty();
		var mappedErrors = req.validationErrors(true);
	}
	if(mappedErrors == false)
	{
		//Get userinfo from request
		var userInfo = generalConfig.getUserInfo(req);
		if (!userInfo.companyId)
		{
			return res.json({ 
						status: 'fail',
						data: null,
						message: 'Company record not found, Please re-login in portal'
					});
		}
		else
		{
			var companyId = userInfo.companyId;
			db.models.device_group.findAll({
						where: {
								company_id: companyId,
								$or: [ { name: req.body.name } ],
								parent_id: req.body.parent	
							   }
					} ).then(function(group) {
				if(group)
				{
					if(group.length == 0) // Group List
					{
						// Insert Record In DB
						var groupDataObj = [];
						groupDataObj = { 
							 name: req.body.name,
							 parent_id: req.body.parent,
							 company_id: companyId
						   };

						db.models.device_group.create(groupDataObj).then(function(group) {
			                if(group) // New Record
			                {
			                    return res.json({
			                    			status: 'success',
			                    			data: null,
			                    			message: 'Group has been added successfully'
			                    		});
			                }
			                else // Same Record
			                {
			                    return res.json({
			                    			status: 'fail',
			                    			data: null,
			                    			message: 'Group has not been added successfully'
			                    		});
			                }
			            })
					}
					else
					{
						return res.json({
									status: 'fail',
									data: null,
									message: 'Same Group name already exist'
								});
					}
				}
				else
				{
					return res.json({
								status: 'fail',
								data: null,
								message: 'Group has not been added successfully'
							});
				}
			}).catch(function(err) {
				return res.json({
							status: 'fail',
							data: null,
							message: 'Group has not been added successfully'
						});
			});
		}
	}
	else
	{
		return res.json({
					status: 'fail',
					data: null,
					message: mappedErrors
				});
	}
};

/**
  * @author: GK
  * Get Group data from Group Id ( Only one Group ID allow )
 */
exports.getGroup = function(req, res, next) {

    var id = req.params.id; // Group Id
	var userInfo = generalConfig.getUserInfo(req);

	if(!id)
	{
		return res.json({
					status: 'fail',
					data: null,
					message: 'Unknown Group record, please select valid Group record'
				});
	}
	else if(!userInfo.companyId) // Get userinfo from request
	{
		return res.json({
					status: 'fail',
					data: null,
					message: 'Company record not found, Please re-login in portal'
				});
	}
	else
	{
		db.models.device_group.findAll( { 
					attributes: ['id', 'name', 'parent_id'],
					where: { company_id: userInfo.companyId, id: id }
				} ).then(function(group) {
			if(group)
			{
				return res.json({
							status: "success",
							data: group,
							message: "Device Group information has been loaded successfully"
						});
			}
			else
			{
				return res.json({
							status: "fail",
							data: null,
							message: "Device Group information has not been loaded successfully"
						});
			}
		}).catch(function(err) {
				return res.json({ 
							status: "fail",
							data: null,
							message: "Device Group information has not been loaded successfully"
						});
		});
	}
};


/**
  * @author: GK
  * Update Group data
 */
exports.updateGroup = function(req, res, next) {
	
	var groupId = req.params.id || null; // Group ID
	var userInfo = generalConfig.getUserInfo(req);

	if (!groupId) {
		return res.json({
					status: 'fail',
					data: null,
					message: 'Unknown Group record, please select valid Group record'
				});
	}
	else if(!userInfo.companyId) // Get userinfo from request
	{
		return res.json({
					status: 'fail',
					data: null,
					message: 'Company record not found, Please re-login in portal'
				});
	}
	else if (req.body != '')
	{
		req.checkBody('name', 'Name required').notEmpty();
		req.checkBody('parent', 'Parent group required').notEmpty();
		var mappedErrors = req.validationErrors(true);
	}

	if(mappedErrors == false)
	{
		async.waterfall([
			// 1. Fetch & varify group name and data
			function(callback_wf) {
				db.models.device_group.findAll({
					where: {
							company_id: userInfo.companyId,
							$or: [ { name: req.body.name }],
							id: {
						      $ne: groupId
						    },
						    parent_id: req.body.parent
						   }
				}).then(function(group) {
					if(group)
					{
						if(group.length == 0) // No same record found
						{
							callback_wf(null);
						}
						else  // Same record found
						{
							callback_wf({
								status: 'fail',
								data: null,
								message: 'Same Group name already exist'
							});
						}
					}
					else  // Some unknow error
					{
						callback_wf({
							status: 'fail',
							data: null,
							message: 'Group has not been updated successfully'
						});
					}
				}).catch(function(err) {
					callback_wf({
						status: 'fail',
						data: null,
						message: 'Group has not been updated successfully'
					});
				});
			},
			// 2. Check group have own template or not
			function(callback_wf) {
				db.models.template.findAll({
						attributes: ['id'],
						where: { device_group_id: groupId }
					}).then(function(template) {
						if(template.length > 0)
						{
							callback_wf(null, true); // Group have own template
						}
						else
						{
							callback_wf(null, false); // Group have not own template
						}
				}).catch(function(err) {
					callback_wf({
						status: 'fail',
						data: null,
						message: 'Group has not been updated successfully'
					});
				});		

			},
			// 3. Update Group information
			function(template_status, callback_wf) {
				if(template_status) // Group have own template
				{
					callback_wf(null, template_status, false);
				}
				else
				{
					db.models.device_group.findOne({
						attributes: ['parent_id'],
						where: { id: groupId }
					}).then(function(group_info) {
						var current_parnet_group_id = group_info.parent_id;
						if(req.body.parent == current_parnet_group_id)
						{
							callback_wf(null, template_status, true); // Same Parent group
						}
						else
						{
							callback_wf(null, template_status, false); // Different Parent group
						}
					}).catch(function(err) {
						callback_wf({
							status: 'fail',
							data: null,
							message: 'Group has not been updated successfully'
						});
					});
				}
			},
			// 3. Check validation & dependency
			function(template_status, parent_group_status, callback_wf) {
				if(template_status) // Group have own template
				{
					callback_wf(null);
				}
				else // Not own template, depend on parent group's template
				{
					if(parent_group_status) // Same parent group selected
					{
						callback_wf(null);
					}
					else // Different parent group selected
					{
						commonLib.checkAssignRuleOrThingToGroupAndChildGroup( groupId, function(group_information_res){
							if(group_information_res.status == 'success') // IF: Check Group or Child Group 
							{
								if(group_information_res.data.rule_count > 0 && group_information_res.data.thing_count > 0) // Rule & Thing both are assign
								{
									callback_wf({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Rule(s) & Thing(s) are assign to group or its child group(s), Please unassign Rule(s) & Thing(s) from this group\'s hierarchy before change group'
						  			});
								}
								else if(group_information_res.data.rule_count > 0) // Rule are assign
								{
									callback_wf({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Rule(s) are assign to group or its child group(s), Please unassign Rule(s) from this group\'s hierarchy before change group'
						  			});
								}
								else if(group_information_res.data.thing_count > 0) // Thing are assign
								{
									callback_wf({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Thing(s) are assign to group or its child group(s), Please unassign Thing(s) from this group\'s hierarchy before change group'
						  			});
								}
								else // Not Rule & Thing: Success
								{
									callback_wf(null);
								}
							}
							else  // Else: Check Group or Child Group 
							{
								callback_wf({ 
					  				status: 'fail',
					  				data: null,
					  				message: 'Group hierarchy information has not been found'
					  			});
							}
						})
					}
				}
			},
			// 4. Update Group information
			function(callback_wf) {
				
				var groupDataObj = [];
					groupDataObj = { 
						 name : req.body.name,
						 parent_id: req.body.parent
					   };

				// Update Command  
				db.models.device_group.update( groupDataObj, {
						   where : { id: groupId, company_id: userInfo.companyId } 
						}).then(function(group_up) {
					if(group_up)
					{
						callback_wf({
							status: 'success',
							data: null,
							message: 'Group has been updated successfully'
						});
					}
					else
					{
						callback_wf({
							status: 'fail',
							data: null,
							message: 'Group has not been updated successfully'
						});
					}	
				}).catch(function(err) {
					callback_wf({
						status: 'fail',
						data: null,
						message: 'Group has not been updated successfully'
					});
				});
			}
		], function(response) {
			// Final call of waterfall
			res.json(response);
		})
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

/**
  * @author: GK
  * Get list of all Group with ng-table filter for listing
 */
exports.getGroupList = function(req, res, next) {

	//get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId)
    {
        return res.json({
        			status: 'fail',
        			data : null,
        			message: 'User information not found'
        		});
    }
    else
    {
	    var companyId = userInfo.companyId;
	    var sortBy = req.body.params.sortBy;
	    var sortOrder = req.body.params.sortOrder;
	    var pageNumber = req.body.params.pageNumber;
	    var pageSize = req.body.params.pageSize;
	    var searchParams = new Array();
	    var serachWhere = '';

	    if(sortBy == 'name') { sortBy = 'd1.name'; }
	    else if(sortBy == 'parent_id') { sortBy = 'd2.name'; }
	    else { sortBy = 'd1.createdAt'; }
	    
	    if(pageNumber == '') { pageNumber = pageNumber; } 
	    else { pageNumber = (pageNumber - parseInt(1)) * pageSize; }


	    if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "") {

	    	serachWhere += "( d1.name like :searchTxt or d2.name like :searchTxt ) and";
	    }
	    
	    db.query("select ( select count(*) from device_group d1 left join device_group d2 on d1.parent_id = d2.id where "+serachWhere+" d1.company_id = :company_id and d1.deletedAt IS NULL ) as totalCount, d1.id, d1.name, d1.createdAt, COALESCE(NULLIF(d2.name,''), 'Root Group') as `parent_name` from device_group d1 left join device_group d2 on d1.parent_id = d2.id where "+serachWhere+" d1.company_id = :company_id and d1.deletedAt IS NULL ORDER BY "+sortBy+" "+sortOrder+" LIMIT :pageSize OFFSET :offset",
	        { replacements: { company_id: companyId, searchTxt: '%'+req.body.SearchParams.searchTxt+'%', pageSize: pageSize, offset: pageNumber }, type: db.QueryTypes.SELECT }
	    ).then(function(groupData)
	    {
	    	if(groupData.length > 0)
	        {
			    	var groupAry = [];
	        		groupAry = {
	        			count: groupData[0].totalCount,
	        			rows: groupData
	        		}
	        		return res.json({
	        				status: 'success',
	        				data: groupAry,
	        				message: 'Records loaded successfully'
	        			});
			    
	        }
	        else
	        {
	        	return res.json({
	        				status: 'success',
	        				data: [],
	        				message: 'No records found'
	        			});
	        }
	    }).catch(function(err) {
	        return res.json({
	        		status: 'fail',
	        		data: null,
	        		message: 'No records found'
	        	}); 
	   });
    }
}

/**
 * @author: GK
 * Delete Group by Group Id
 */
exports.deleteGroup = function(req, res, next) {

	var id = req.params.id; // Group Id
    var userInfo = generalConfig.getUserInfo(req);

    if (!id)
    {
        return res.json({
        			status: 'fail',
        			data: null,
        			message: 'Unknown Group record, please select valid Group record'
        		});
    }
    else if (!userInfo.companyId) //Get userinfo from request
    {
        return res.json({
        			status: 'fail',
        			data: null,
        			message: 'Company record not found, Please re-login in portal'
        		});
    }
    else
    {
    	async.waterfall([
    		// 1. Check Group as Parent or Not
			function(callback_wf) {
				db.models.device_group.findAll({
					where: {
							company_id: userInfo.companyId,
							parent_id: id
						   }
				} ).then(function(parent_group) {
					if(parent_group.length == 0) // No same record found
					{
						callback_wf(null);
					}
					else
					{
						callback_wf({
							status: 'fail',
							data: null,
							message: 'This group assign as parent group. Remove All child group before delete'
						});
					}
				}).catch(function(err) {
					callback_wf({ 
						status: 'fail',
						data: null,
						message: 'Group has not been deleted successfully'
					});
				});
			},
			// 2. Check Assign in Thing Or Rule
			function(callback_wf) {

				commonLib.checkAssignRuleOrThingToGroupAndChildGroup( id, function(group_information_res){
					if(group_information_res.status == 'success') // IF: Check Group or Child Group 
					{
						if(group_information_res.data.rule_count > 0 && group_information_res.data.thing_count > 0) // Rule & Thing both are assign
						{
							callback_wf({ 
				  				status: 'fail',
				  				data: null,
				  				message: 'Rule(s) & Thing(s) are assign to group or its child group(s), Please unassign Rule(s) & Thing(s) from this group\'s hierarchy before remove group'
				  			});
						}
						else if(group_information_res.data.rule_count > 0) // Rule are assign
						{
							callback_wf({ 
				  				status: 'fail',
				  				data: null,
				  				message: 'Rule(s) are assign to group or its child group(s), Please unassign Rule(s) from this group\'s hierarchy before remove group'
				  			});
						}
						else if(group_information_res.data.thing_count > 0) // Thing are assign
						{
							callback_wf({ 
				  				status: 'fail',
				  				data: null,
				  				message: 'Thing(s) are assign to group or its child group(s), Please unassign Thing(s) from this group\'s hierarchy before remove group'
				  			});
						}
						else // Not Rule & Thing: Success
						{
							callback_wf(null);
						}
					}
					else  // Else: Check Group or Child Group 
					{
						callback_wf({ 
			  				status: 'fail',
			  				data: null,
			  				message: 'Group hierarchy information has not been found'
			  			});
					}
				})
			},
			// 3. Check template assign to this group or not
			function(callback_wf) {
				// Get template information
				db.models.template.findAll({
						attributes: ['id'],
						where: { device_group_id: id }
					}).then(function(template) {
						if(template.length > 0)
						{
							// Group have own template
							callback_wf({ 
				  				status: 'fail',
				  				data: null,
				  				message: 'Template are assign to group, Please unassign Template from this group before remove group'
				  			});	
						}
						else
						{
							// Group have not own template
							callback_wf(null);
						}
				}).catch(function(err) {
					callback_wf({
						status: 'fail',
						data: null,
						message: 'Group has not been deleted successfully'
					});
				});
			},
			// 4. Delete Group Record
			function(callback_wf) {
			    
			    db.models.device_group.destroy({where: { id: id, company_id : userInfo.companyId }}).then(function (deleletGroup)
			     {
			        if(deleletGroup)
			        {
			        	callback_wf({
	        				status: 'success',
	        				data: null,
	        				message: 'Group has been deleted successfully'
	        			});
			        }
			        else
			        {
			            callback_wf({
	            			status: 'fail',
	            			data: null,
	            			message: 'Group has not been deleted successfully'
	            		});
			        }
			      }).catch(function(err) {
			            callback_wf({
	            			status: 'fail',
	            			data: null,
	            			message: 'Group has not been deleted successfully'
	            		});
			      });
			}
		], function(response) {
				return res.json(response)
		})
	}
}

/**
  * @author: GK
  * Get Group Assigned Thing device data 
  * @param: groupId : Device Group Id
  **/  
var checkGroupAssignInThing = function checkGroupAssignInThing( groupId, callback) {

	db.models.thing.findAll({
	   		where: { device_group_id: groupId }
		}).then(function(things_group)
		{
			return callback({
					status: 'success',
					data: things_group,
					message: 'Group record has been fetched successfully'
				});

		}).catch(function(err) {
			return callback({
					status: 'fail',
					data: null,
					message: 'Group record has not been fetched successfully'
				});
		});

}

/**
  * @author: GK
  * Group Name listing as tree View ideal for dropdown
  * Exp:
  	1
  	-2
  	-3
  	--4
  	---5
  	6
  	-7
  	8
  	-9
  	--10
  	---11
  	---12
  	13
  	-14
  	15

 */
exports.getGroupNameTreeList = function(req, res, next){

	//Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    
    if (!userInfo.companyId)
    {
        return res.json({
        			status: 'fail',
        			data: null,
        			message: 'Company record not found, Please re-login in portal'
        		});
    }
    else
    {
	    var ids = req.body.id;
	    var currentListingGroupId = ''
	    if(ids && ids != null)
	    {
	    	currentListingGroupId = ids;
	    }

	    var groupListArry = []; // Result Group Array
	    var specialCharPettran = ''; 
	    var currentLoopStep = 0;  // Lopping Child Steps

	    // Call Recursion Function
	    groupListingTree( '0', null, currentListingGroupId, userInfo.companyId, groupListArry, specialCharPettran, currentLoopStep, function(main_callback){

	    	if(main_callback != null) // Result Not found
	    	{
	    		return res.json({
	    					status: 'fail',
	    					data: null,
	    					message: 'No records found'
	    				});
			}
	    	else // Result found
	    	{
	    		return res.json({
	    			 		status: "success",
	    			 		data: groupListArry,
	    			 		message: "Records loaded successfully"
	    			 	});
	    	}
	    })
    }
}

/**
  * @author: GK
  * Group Name listing as tree View ideal dropdown
  * Call Recursion function for N-Level Group Tree
  * @param : parentId : Parent group Id
  * @param : parentName : Parent group name
  * @param : currentListingGroupId : Group Id of current call( Ingor this group id )
  * @param : companyId : Company Id
  * @param : groupListArry : Final result Data (Hierarchy)
  * @param : specialCharPettran : Special pettran ( -, * , - etc )
  * @param : currentLoopStep : Group level ( 1, 2, 3, 4 etc... )
  */
var groupListingTree = function groupListingTree(parentId, parentName, currentListingGroupId, companyId, groupListArry, specialCharPettran, currentLoopStep, callback) {
	
	if(currentListingGroupId != '') // If edit any Group Id And Skip this id's record with child record
	{
		//var whereval = { company_id: companyId, id: { $ne: currentListingGroupId }, parent_id: parentId }
		var whereval = { company_id: companyId,
						 parent_id: parentId,
						 id: { 
						 	notIn: [currentListingGroupId]	
						  } 
						}
	}
	else // All Groups
	{
		var whereval = { company_id: companyId, parent_id: parentId }
	}

	db.models.device_group.findAll({
				where: whereval,
				attributes: 
					[ 'id', 'name' ],
				order: 'createdAt' + ' ' + 'asc'
			} ).then(function(groups) {
		if(groups)
		{
			// ForEach(1) Start
			currentLoopStep++;
			specialCharPettran = specialCharPettran + ' - ';
			async.forEachSeries(groups, function(group, callback_f1) {
					var group_id = group.id;
					var group_name = group.name;
					group_name = specialCharPettran + group_name;

					var groupNameTempArry = []; // Temp Group Array
						groupNameTempArry = {
									id : group_id,
									name : group_name,
									level : currentLoopStep,
									orgName : group.name,
									parent : parentName,
									pid: parentId
								}
					groupListArry.push(groupNameTempArry); // Push Value in Loop Globle Array

					// Call Recursion Function
					groupListingTree(group_id, group.name, currentListingGroupId, companyId, groupListArry, specialCharPettran, currentLoopStep, function(callback_1){
						callback_f1(callback_1)
					})

			},function(listValue) {
            	// ForEach(1) finish
              	callback(listValue); // Call Back to Parent Loop
          	});
		}
		else
		{
			callback({
					status: 'fail',
					data: null,
					message: 'Group data not found'
				});
		}
	}).catch(function(err) {
			callback({
					status: 'fail',
					data: null,
					message: 'Group data not found'
				});
	});
}

