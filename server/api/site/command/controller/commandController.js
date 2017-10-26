'use strict';

var generalConfig = require('../../../../config/generalConfig');
var async = require('async');

/* Common function Lib */
var commonLib = require('../../../../lib/common');

var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");

 
/**
  * Add new command in Record
 */
exports.addCommand = function(req, res, next) {

    if (req.body != '')
	{
		req.checkBody('name', 'Name required').notEmpty();
		req.checkBody('command', 'Command required').notEmpty();
		var mappedErrors = req.validationErrors(true);
	}
	if(mappedErrors == false)
	{
		//Get userinfo from request
		var userInfo = generalConfig.getUserInfo(req);
		if (!userInfo.companyId) {
			return res.json({ 
						status: 'fail',
						data: null,
						message: 'Unknown company record'
					});
		}
		else
		{
			var companyId = userInfo.companyId;

			// Fetch Data for verify
			db.models.company_command.findAll({
						where: {
								company_id: userInfo.companyId,
								$or: [ { command: req.body.command }, { name: req.body.name }]
							   }
					} ).then(function(command) {
				if(command)
				{
					if(command.length == 0) // No same record found
					{
						// Insert Record In DB
						var commandDataObj = [];
						commandDataObj = { 
							 command : req.body.command,
							 company_id: companyId,
							 name: req.body.name
						   };

						db.models.company_command.findOrCreate({ where: {company_id: companyId, command: req.body.command, name: req.body.name } }).spread(function(group, created) {
			                if(created == true) // New Record
			                {
			                    return res.json({status: 'success' , data: null, message: 'Command has been added successfully'});
			                }
			                else // Same Record
			                {
			                    return res.json({status: 'fail' , data: null, message: 'Same record already exist in list'});
			                }
			            })
					}
					else  // Same record found
					{
						return res.json({status: 'fail' , data: null, message: 'Same Name Or Command already exist in list'});
					}
				}
				else  // Some unknow error
				{
					res.json({ status: 'fail', data: null, message: 'Fail to verify record' });
				}
			}).catch(function(err) {
				res.json({ status: 'fail', data: null, message: 'Command has not been added successfully' });
			});
		}
	}
	else
	{
		res.json({ status: 'fail', data: null, message: mappedErrors });
	}
};

/**
  * Get Command data from command Id ( Only one command ID allow )
 */
exports.getCommand = function(req, res, next) {

    var id = req.params.id;
	var userInfo = generalConfig.getUserInfo(req);
	if(!id)
	{
		return res.json({ status: 'fail', data: null, message: 'Unknown command record, please select valid command record' });
	}
	else if(!userInfo.companyId) // Get userinfo from request
	{
		return res.json({ status: 'fail', data: null, message: 'Unknown company record, Please re-login in portal' });
	}
	else
	{
		db.models.company_command.findAll( { 
					attributes: ['id', 'name', 'command'],
					where: { company_id: userInfo.companyId, id: id }
				} ).then(function(command) {
			if(command)
			{
				res.json({ status: "success", data: command, message: "Record loaded successfully" });
			}
			else
			{
				res.json({ status: "fail", data: null, message: "Fail to load data" });
			}
		}).catch(function(err) {
			res.json({ status: "fail", data: null, message: "Fail to load data" });
		});
	}
};


/**
  * Update command data
 */
exports.updateCommand = function(req, res, next) {
	
	var commandId = req.params.id || null;
	var userInfo = generalConfig.getUserInfo(req);
	if (!commandId)
	{
		return res.json({ status: 'fail', data: null, message: 'Unknown command record, please select valid command record' });
	}
	else if(!userInfo.companyId) // Get userinfo from request
	{
		return res.json({ status: 'fail', data: null, message: 'Unknown company record, Please re-login in portal' });
	}
	else if (req.body != '')
	{
		req.checkBody('name', 'Name required').notEmpty();
		req.checkBody('command', 'Command required').notEmpty();
		var mappedErrors = req.validationErrors(true);
	}
	if(mappedErrors == false)
	{
		// Fetch Data for verify
		db.models.company_command.findAll({
					where: {
							company_id: userInfo.companyId,
							$or: [ { command: req.body.command }, { name: req.body.name }],
							id: {
						      $ne: commandId
						    }
						   }
				} ).then(function(command) {
			if(command)
			{
				if(command.length == 0) // No same record found
				{
						var commandDataObj = [];
							commandDataObj = { 
								 command : req.body.command,
							   };

						// Update Command  
						db.models.company_command.update( commandDataObj, {
											   where : { id: commandId, company_id: userInfo.companyId } 
											   }).then(function(command) {
							if(command)
							{
								return res.json({status: 'success' , data: null, message: 'Command has been updated successfully'});
							}
							else
							{
								return res.json({ status: 'fail', data: null, message: 'Some Unknown  error' });
							}	
						}).catch(function(err) {
							return res.json({ status: 'fail', data: null, message: 'Command has not been updated successfully' });
						});
				}
				else  // Same record found
				{
					return res.json({status: 'fail' , data: null, message: 'Same Name Or Command already exist in list'});
				}
			}
			else  // Some unknow error
			{
				res.json({ status: 'fail', data: null, message: 'Fail to verify record' });
			}
		}).catch(function(err) {
			res.json({ status: 'fail', data: null, message: 'Command has not been updated successfully' });
		});
	}
	else
	{
		res.json({ status: 'fail', data: null, message: mappedErrors });
	}
};

/**
  * Get list of all command with ng-table filter for listing
 */
exports.getCommandList = function(req, res, next) {

	//get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId)
    {
        res.json({ status: 'fail', data : null, message: 'Unknown user.' });
    }
    else
    {
	    var companyId = userInfo.companyId;
	    var sortBy = req.body.params.sortBy;
	    var sortOrder = req.body.params.sortOrder;
	    var pageNumber = req.body.params.pageNumber;
	    var pageSize = req.body.params.pageSize;
	    var searchParams = new Array();

	    if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "") {

	        searchParams.push({
	            name: {
	                $like: '%' + req.body.SearchParams.searchTxt + '%'
	            }
	        });
	        searchParams.push({
	            command: {
	                $like: '%' + req.body.SearchParams.searchTxt + '%'
	            }
	        });
	        searchParams.push(
	            Sequelize.where(
	                Sequelize.fn('concat', Sequelize.col('name'), ' ', Sequelize.col('command')), {           
	                    like: '%' + req.body.SearchParams.searchTxt + '%'
	                }
	            )
	        );
	    }

	    if(searchParams.length==0) {
	        var whereval = { company_id: companyId };
	    } else {
	        var whereval = { company_id: companyId, $or: searchParams };        
	    }

	    db.models.company_command
		    .findAndCountAll({
		        where: whereval,
		        order: sortBy + ' ' + sortOrder,
		        offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
		        limit: pageSize
		    })
		    .then(function(command) {
		        if (command) {
		            res.json({ status: 'success', data: command, message: 'Data loaded successfully.' });
		        } else {
		            res.json({ status: 'success', data: [], message: 'No records found' });
		        }
		    })
		    .catch(function(err) {
		        res.json({ status: 'fail', data: null, message: 'No records found' });
		    });
	}
}

/**
  * Delete command by command Id
 */
exports.deleteCommand = function(req, res, next) {

	var id = req.params.id;
    var userInfo = generalConfig.getUserInfo(req);

    if (!id)
    {
        return res.json({ status: 'fail', data: null, message: 'Unknown command record, please select valid command record' });
    }
    else if (!userInfo.companyId) //Get userinfo from request
    {
        return res.json({ status: 'fail', data: null, message: 'Unknown company record, Please re-login in portal' });
    }
    else
    {
	    // Check this command assign to any rule
	    db.models.rule.findAll({
	    		attributes: ['id', 'company_command_id'],
				where: {
						company_command_id: id,
					   }
			} ).then(function(command) {
				if(command)
				{
					if(command.length == 0) // No same record found
					{
						 // Delete Record
					    db.models.company_command.destroy({where: { id: id, company_id : userInfo.companyId }}).then(function (deleletCommand)
					     {
					            if(deleletCommand)
					            {
					            	return res.json({status: 'success' , data: null, message: 'Command has been deleted successfully'});
					            }
					            else
					            {
					                return res.json({status: 'fail' , data: null, message: 'Command has not been deleted successfully'});
					            }
					      }).catch(function(err) {
					             res.json({ status: 'fail', data: null, message: 'Command has not been deleted successfully' });
					      });
					}
					else
					{
						return res.json({status: 'fail' , data: null, message: 'You canot delete this command because this command already assign to rule' });
					}
				}
				else
				{
					return res.json({status: 'fail' , data: null, message: 'Command has not been deleted successfully'});
				}
		}).catch(function(err) {
			 res.json({ status: 'fail', data: null, message: 'Command has not been deleted successfully' });
		});
	}
}

/*
 * @author: GK
 * Get all company commmand
 */
exports.getCommands = function(req, res, next) {

	var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId)
	{
		res.json({
			status: "fail",
			data: null,
			message: 'User information not found'
		});
	}
	else
	{
		db.models.company_command.findAll({
								  //attributes: ['id', 'name'],
								  where: { company_id : userInfo.companyId }
								}) .then(function(commmand)
		{
			if(commmand)
			{
				res.json({
					status:"success",
					data: commmand,
					message: 'Record has been found'
				});
			}
			else
			{
				res.json({
					status:"success",
					data: null,
					message: 'No Record found'
				});
			}
		}).catch(function(err){
			res.json({
				status: "fail",
				data: null,
				message: 'No Record Available'
			});
		}); 
	}
};