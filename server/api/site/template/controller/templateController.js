'use strict';

var generalConfig = require('../../../../config/generalConfig');
var async = require('async');

/* Common function Lib */
var commonLib = require('../../../../lib/common');

var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");

var fs = require('fs-extra');
var mkpath = require('mkpath');
var thingDummyData = require('../../../../lib/thing_dummy_data/thing_dummy_data');



/**
  * @author: Gunjan
  * Add New Template
  */
exports.addTemplate = function(req, res, next) {
	
    if (req.body != '')
	{
		req.checkBody('name', 'Name required').notEmpty();
		req.checkBody('devicegroup', 'Device Group required').notEmpty();
		req.checkFiles('tempfile', 'Template data required').notEmpty();
		var mappedErrors = req.validationErrors(true);
	}
	if(mappedErrors == false)
	{
		//Get userinfo from request
		var userInfo = generalConfig.getUserInfo(req);
		var file = req.files.tempfile;

		if (!userInfo.companyId)
		{
			return res.json({ 
						status: 'fail',
						data: null,
						message: 'Company record not found, Please re-login in portal'
					 });
		}
		else if(file.size>1000000) //file should not exceed 1MB
	    {
	        return res.json({ 
	        		status: "fail",
	        		data: null,
	        		message:"JSON File is too large , max file size allowed 1MB"
	        	 });
	    }
	    else if(file.type !='application/json' && file.type !='application/octet-stream' ) //file should be JSON type only
	    {
	        return res.json({
	        		status: "fail",
	        		data: null,
	        		message:"Only allow JSON formate file. Please select valid formate file"
	        	});
	    }
	    else
	    {
		    var companyId = userInfo.companyId;
			// Fetch Data for verify
			db.models.template.findAll({
						where: {
								company_id: companyId,
								$or: [ { name: req.body.name }, { device_group_id: req.body.devicegroup } ]
							   }
					} ).then(function(template) {
				if(template)
				{
					if(template.length == 0) // No same record found
					{

						// Get Group & its child information
						commonLib.checkAssignRuleOrThingToGroupAndChildGroup( req.body.devicegroup, function(group_information_res){
							if(group_information_res.status == 'success')
							{
								if(group_information_res.data.rule_count > 0 && group_information_res.data.thing_count > 0) // Rule & Thing both are assign
								{
									res.json({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Rule(s) & Thing(s) are assign to this group or its child group(s), Please unassign Rule(s) & Thing(s) from this group\'s hierarchy before add template on this group'
						  			});
								}
								else if(group_information_res.data.rule_count > 0) // Rule are assign
								{
									res.json({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Rule(s) are assign to this group or its child group(s), Please unassign Rule(s) from this group\'s hierarchy before add template on this group'
						  			});
								}
								else if(group_information_res.data.thing_count > 0) // Thing are assign
								{
									res.json({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Thing(s) are assign to this group or its child group(s), Please unassign Thing(s) from this group\'s hierarchy before add template on this group'
						  			});
								}
								else // Not Rule & Thing: Success
								{
									var tmpPath = file.path;
								    // var fileName = file.originalFilename;
								    // var randFld = Math.random().toString(36).slice(-10);
								    // var definePath = companyId+"/"+randFld+"/"+fileName;
								    // var destPath = settings.filesPath.jsTemplate+"/"+definePath;

								    // Read file
								    fs.readFile( tmpPath, 'utf8', function (err,data) {
					                    if(err) {
								  			res.json({ 
								  				status: "fail",
								  				data: null,
								  				message: "JSON data format is invalid. Please refer sample file"
								  			});
								  			return false;
										}

										// Check file Data
										try {
										    var tempData = JSON.parse(data);
										} 
										catch (e) {
										   res.json({ 
									   			status: "fail",
									   			data: null,
									   			message: "JSON data format is invalid. Please refer sample file"
									   		  });
										   return false;
										}

										var readReadAttr = tempData.attributes;
										if(readReadAttr == '' || typeof readReadAttr === 'undefined') // attribute not define
										{
										  	res.json({
										  			status: "fail",
										  			data: null,
										  			message:"JSON data format is invalid. Please refer sample file"
										  	});
										  	return false;
										}
										else // Attribute Found
										{
											// Verify Template Duplication Data
											verifyTemplateData(tmpPath, companyId, function(callback_verifyTemplate){
												if(callback_verifyTemplate.status == 'fail') // Error
												{
													return res.json(callback_verifyTemplate)
												}
												else // Success
												{
													// Insert Record In DB
													db.models.template.findOrCreate({ where: { company_id: companyId, name: req.body.name, device_group_id: req.body.devicegroup } }).spread(function(group, created) {
										                if(created == true) // New Record
										                {
										                	var templateId = group.id; // Template Record Id

									                	 	// Call function for Template attribute record updation
									                	 	readJsFileInsertRecord(tmpPath, companyId, templateId, function(callback_readJs){
														    	
														    	if(callback_readJs.status == 'fail') // Error
														    	{
														    		// Delete Registred Record
														    		deleteTemplateProcess( templateId, companyId, function(callback){
													    					return res.json({
												                    			status: 'fail',
												                    			data: null,
												                    			message: 'Template has not been added successfully because JSON data format is invalid. Please refer sample file'
												                    		});
														    			})
														    	}
														    	else //Success
														    	{
														    		return res.json({ 
										                    			status: 'success',
										                    			data: null,
										                    			message: 'Template has been added successfully'
										                    		});
														    	}
															})
										                	
										                }
										                else // Same Record
										                {
										                    return res.json({
									                    			status: 'fail',
									                    			data: null,
									                    			message: 'Same record already exist in Template list'
									                    		});
										                }
										            })
												}
											})
										}
					                })
	               				}
							}
							else
							{
								res.json({ 
					  				status: 'fail',
					  				data: null,
					  				message: 'Group hierarchy information has not been found'
					  			});
							}
						});
					}
					else
					{
						return res.json({
									status: 'fail',
									data: null,
									message: 'Same Template name already exist Or Device Group already assign'
								});
					}
				}
				else  // Same record found
				{
					return res.json({
							status: 'fail',
							data: null,
							message: 'Template has not been added successfully'
						});
				}
			}).catch(function(err) {
				return res.json({
						status: 'fail',
						data: null,
						message: 'Template has not been added successfully'
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
  * @author: Gunjan
  * Get Template data from template Id ( Only one template ID allow )
  */
exports.getTemplate = function(req, res, next) {

    var id = req.params.id;
	var userInfo = generalConfig.getUserInfo(req);

	if(!id)
	{
		return res.json({ 
					status: 'fail',
					data: null,
					message: 'Unknown Template record, please select valid Template record'
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
		db.models.template.findAll( { 
					attributes: ['id', 'name', 'device_group_id'],
					where: { company_id: userInfo.companyId, id: id }
				} ).then(function(template) {
			if(template)
			{
				res.json({ 
						status: "success",
						data: template,
						message: "Record loaded successfully"
					});
			}
			else
			{
				res.json({
						status: "fail",
						data: null,
						message: "Record not loaded successfully"
					});
			}
		}).catch(function(err) {
			res.json({ 
					status: "fail",
					data: null,
					message: "Record not loaded successfully" 
				});
		});
	}

};


/**
  * @author: Gunjan
  * Update Template data by template ID
  */
exports.updateTemplate = function(req, res, next) {
	
	var tempId = req.params.id || null; // Template ID
	var userInfo = generalConfig.getUserInfo(req);

	if (!tempId)
	{
		return res.json({
				status: 'fail',
				data: null,
				message: 'Unknown Template record, please select valid Template record'
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
		var companyId = userInfo.companyId;
		if (req.body != '')
		{
			req.checkBody('name', 'Name required').notEmpty();
			req.checkBody('devicegroup', 'Device Group required').notEmpty();
			var mappedErrors = req.validationErrors(true);
		}
		if(mappedErrors == false)
		{
			// callback_wf(null);
			async.waterfall([
			 // 1. Fetch Data for verification
				function(callback_wf) {
					
					db.models.template.findAll({
								where: {
										company_id: companyId,
										$or: [ { name: req.body.name }, { device_group_id: req.body.devicegroup } ],
										id: {
									      $ne: tempId
									    }
									   }
							}).then(function(template) {
						if(template)
						{
							if(template.length == 0) // No same record found
							{
								callback_wf(null);
							}
							else  // Same record found
							{
								callback_wf({
										status: 'fail',
										data: null,
										message: 'Same Template name already exist Or Device Group already assign'
									});
							}
						}
						else  // Some unknow error
						{
							callback_wf({
									status: 'fail',
									data: null,
									message: 'Template record has not been found for update template action'
								});
						}
					})
				},
			 // 2. Check(Assing or not) Old Device Group and its child group
				function(callback_wf) {
					
					db.models.template.findOne({
								attributes: ['device_group_id'],
								where: { id: tempId }
							}).then(function(template) {
						if(template)
						{
							var old_device_group_id = template.device_group_id; // Old device Group ID
							if(old_device_group_id == req.body.devicegroup)  // Same device group
							{
								callback_wf(null, true)
							}
							else  // Different device group
							{
								commonLib.checkAssignRuleOrThingToGroupAndChildGroup( old_device_group_id, function(group_information_res){
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
											callback_wf(null,  false);
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
						else  // Some unknow error
						{
							callback_wf({
									status: 'fail',
									data: null,
									message: 'Template record has not been found'
								});
						}
					}).catch(function(err) {
						callback_wf({
							status: 'fail',
							data: null,
							message: 'Template has not been updated successfully'
						});
					});
				},
			 // 3. Check(Assing or not) New Device Group and its child group
				function(device_group_status, callback_wf) {
					if(device_group_status) // Same device group
					{
						callback_wf(null);
					}
					else  // Different device group
					{
						commonLib.checkAssignRuleOrThingToGroupAndChildGroup( req.body.devicegroup, function(group_information_res){
							if(group_information_res.status == 'success') // IF: Check Group or Child Group 
							{
								if(group_information_res.data.rule_count > 0 && group_information_res.data.thing_count > 0) // Rule & Thing both are assign
								{
									callback_wf({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Rule(s) & Thing(s) are assign to requested new group or its child group(s), Please unassign Rule(s) & Thing(s) from this group\'s hierarchy before change group'
						  			});
								}
								else if(group_information_res.data.rule_count > 0) // Rule are assign
								{
									callback_wf({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Rule(s) are assign to requested new group or its child group(s), Please unassign Rule(s) from this group\'s hierarchy before change group'
						  			});
								}
								else if(group_information_res.data.thing_count > 0) // Thing are assign
								{
									callback_wf({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Thing(s) are assign to requested new group or its child group(s), Please unassign Thing(s) from this group\'s hierarchy before change group'
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
				},
			 // 4. Process for update Data & Files
				function(callback_wf) {
					var file = req.files.tempfile;
					if(file) // File Selected
					{
						// Validation
					    //file should not exceed 1MB
					    if(file.size>1000000)
					    {
					        callback_wf({ 
				        		status: "fail",
				        		data: null,
				        		message:"JSON File is too large , max file size allowed 1MB"
				        	 });
					    }
					    else if(file.type !='application/json' && file.type !='application/octet-stream') //file should be JSON type only
					    {
					        callback_wf({
				        		status: 'fail',
				        		data: null,
				        		message:"Only allow JSON formate file. Please select valid formate file"
				        	});
					    }
					    else
					    {
							var tmpPath = file.path;
						    // var fileName = file.originalFilename;
						    // var randFld = Math.random().toString(36).slice(-10);
						    // var definePath = companyId+"/"+randFld+"/"+fileName;
						    // var destPath = settings.filesPath.jsTemplate+"/"+definePath;

						    // Read file
							fs.readFile( tmpPath, 'utf8', function (err,data) {
							    if(err)
							    {
								  	callback_wf({ 
						  				status: "fail",
						  				data: null,
						  				message: "JSON data format is invalid. Please refer sample file"
						  			});
								}
								else
								{
									// Check file Data
									try {
									    var tempData = JSON.parse(data);
									} 
									catch (e) {
									   callback_wf({ 
								   			status: "fail",
								   			data: null,
								   			message: "JSON data format is invalid. Please refer sample file"
								   		  });
									}

									var readReadAttr = tempData.attributes;
									if(readReadAttr == '' || typeof readReadAttr === 'undefined') // attribute not define
									{
									  	callback_wf({
								  			status: "fail",
								  			data: null,
								  			message: "JSON data format is invalid. Please refer sample file"
								  		 });
									}
									else // Attribute Found
									{
										// Verify Template Duplication Data
										verifyTemplateData(tmpPath, companyId, function(callback_verifyTemplate)
										{
											if(callback_verifyTemplate.status == 'fail') // Error
											{
												callback_wf(callback_verifyTemplate)
											}
											else // Success
											{
											    // Call function for Template attribute record updation
											    readJsFileInsertRecord(tmpPath, companyId, tempId, function(callback_readJs){
											    	if(callback_readJs.status != 'fail') // Success Response
											    	{
											    		// Update Template
											    		var templateDataObj = [];
														templateDataObj = { 
															 device_group_id : req.body.devicegroup,
															 name : req.body.name
														   };
														db.models.template.update( templateDataObj, {
																where : { id: tempId, company_id: companyId } 
																}).then(function(template_update) {
															if(template_update)
															{
																// Update Simulator Process
																thingDummyData.updateSimulatorDataBasedonTemplateUpdate(req.body.devicegroup, function(callback_simulator){
																		console.log(callback_simulator);
																})

																callback_wf({
																	status: 'success',
																	data: null,
																	message: 'Template has been updated successfully'
																});
															}
															else
															{
																callback_wf({
																	status: 'fail',
																	data: null,
																	message: 'Template has not been updated successfully'
																});
															}
														}).catch(function(err) {
															callback_wf({
																status: 'fail',
																data: null,
																message: 'Template has not been updated successfully'
															});
														});
											    	}	
											    	else
											    	{
											    		callback_wf(callback_readJs);
											    	}
											    })
									    	}
								 		})
									}
								}
							})
						}
					}
					else // File Not Selected
					{
						var templateDataObj = [];
						templateDataObj = { 
							 device_group_id : req.body.devicegroup,
							 name : req.body.name
						   };

						// Update Template  
						db.models.template.update( templateDataObj, {
								where : { id: tempId, company_id: companyId } 
						   }).then(function(template_update) {
							if(template_update)
							{
								callback_wf({
									status: 'success',
									data: null,
									message: 'Template has been updated successfully'
								});
							}
							else
							{
								callback_wf({
									status: 'fail',
									data: null,
									message: 'Template has not been updated successfully'
								});
							}
						}).catch(function(err) {
							callback_wf({
								status: 'fail',
								data: null,
								message: 'Template has not been updated successfully'
							});
						});
					}
				}
			], function(response, data) {
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
	}
};

/**
  * @author: Gunjan
  * Read Js File and add, update & delete Template Attribute
  * @param : tmpFilePath : Upload file temp Path
  * @param : companyId : Company Id
  * @param : templateId : Template Id
  */
var readJsFileInsertRecord = function readJsFileInsertRecord(tmpFilePath, companyId, templateId, callback)
{
	// Read file
    fs.readFile( tmpFilePath, 'utf8', function (err,data) {
        if(err)
        {
		  	callback({
		  			status: "fail",
		  			data: null,
		  			message: err
		  		});
			return false;
		}

		// Check file Data
		try {
		    var tempData = JSON.parse(data);
		} 
		catch (e) {
		   callback({
		   		status: "fail",
		   		data: null,
		   		message: 'JSON data format is invalid. Please refer sample file'
		   	});
		   return false;
		}

		var readReadAttr = tempData.attributes;
		if(readReadAttr == '' || typeof readReadAttr === 'undefined') // attribute not define
		{
		  	callback({
		  			status: "fail",
		  			data: null,
		  			message: 'JSON data format is invalid. Please refer sample file'
		  		});
		  	return false;
		}

		var templateAttrRecord = [];
		var dataValidFlag = 0; // Flag for Record not proper
		var listOfTemplateIds = [];
		
		// ForEach(1) Start
    	async.forEachSeries(readReadAttr, function(attr, callback_f1) {
    			
    			// attribute List
				var name = attr.name;
				var description = attr.description;
				var type = attr.type;
				var localId = attr.localId;
				var status = attr.status;
				var unit = attr.unit;
				var min = attr.min;
				var max = attr.max;
				var sub_attr = attr.sub_attr; // Sub Attribute Array

				// Status Chnage Word
				if(status == true)
				{
					status = '1';
				}
				else if(status == false)
				{
					status = '0';
				}
				else
				{
					status = '';
				}

				if( name != '' && description != '' && type != '' && localId != '' && status != ''  && unit != '' && min != '' && max != '' && (status != '1' || status != '0') 
						&& typeof name !== 'undefined'
						&& typeof description !== 'undefined'
						&& typeof type !== 'undefined'
						&& typeof localId !== 'undefined'
						&& typeof status !== 'undefined'
						&& typeof unit !== 'undefined'
						&& typeof min !== 'undefined'
						&& typeof max !== 'undefined'
					) // Validation Check
				{
						// Check value in DB ( By Name, TemplateId & LocalId)
						db.models.template_attr.findAll( { 
								where: { 
										 localId: localId,
										 template_id: templateId,
										 parent_attr_id : '0'
									   }
							} ).then(function(tempAttr) {
							if(tempAttr)
							{
								if(tempAttr.length > 0) // Record Found, Update Record
								{
									var temp_attr_recordId = tempAttr[0]['id']; // Template Attribute Record Id
									var templateAttrDataObj = [];
										templateAttrDataObj = {
											name: name,
											description: description,
										 	type: type,
										 	unit: unit,
										 	min: min,
										 	max: max,
										 	status: status
									   	};
									listOfTemplateIds.push(temp_attr_recordId); // Add Template Ids in Array
									
									// Update Template  
									db.models.template_attr.update( templateAttrDataObj, {
														   where: { id: temp_attr_recordId } 
														   }).then(function(template_update) {
										
											// Update Rule Details Entry
											updateNameInRuleDetail(temp_attr_recordId, name, function(ruleDetail_callback){

													if(ruleDetail_callback.status == 'fail') // Fail
													{
														callback(ruleDetail_callback);
													}
													else // Success
													{
														// Check this attribute is assign to rule or not
														getRuleDetailsBasedOnTemplateAttrId(temp_attr_recordId, function(callback_ruleCheck){
																if(callback_ruleCheck.status == 'success') // Response Success
																{
																	if(callback_ruleCheck.data.length > 0) // Attribute Assign
																	{
																		callback_f1();
																	}
																	else  // Attribute Not Assign
																	{
																		// Update/Insert Sub-Attribute
																		insertSubAttribute(temp_attr_recordId, companyId, templateId, sub_attr, function(subattr_callback){
																				callback_f1();
																		})
																	}
																}
																else  // Response Error
																{
																	callback_f1();
																}
														})
													}

											})
										
									}).catch(function(err) {
										callback({
													status: 'fail',
													data: null,
													message: err
												});
									});
								}
								else // Record Not Found, Insert Record
								{
									var tempDataObj = [];
										tempDataObj = {
												template_id: templateId,
												name : name,
												description : description,
												type : type,
												localId : localId,
												unit: unit,
												min: min,
												max: max,
												status : status
											}
											
									// Insert Template
   									db.models.template_attr.create(tempDataObj).then(function(template) {
										if(template)
										{
											var insertRecordId = template.id; // Inserted Record Id
											listOfTemplateIds.push(insertRecordId); // Add Template Ids in Array

											// Update/Insert Sub-Attribute
											insertSubAttribute(insertRecordId, companyId, templateId, sub_attr, function(subattr_callback){
													callback_f1();
											})
										}
										else
										{
											callback({
													status: "fail",
													data: null,
													message: 'Requested processed not successfully completed'
												});
										}
									}).catch(function(err) {
										callback({
												status: "fail",
												data: null,
												message: err
											});
									});
								}
							}
						}).catch(function(err) {
							callback({
									status: "fail",
									data: null,
									message: err
								});
					   });
				}
				else
				{
					dataValidFlag = 1;
					callback_f1();
				}

    	}, function() { // ForEach(1) Finish

    		if(listOfTemplateIds.length > 0)
    		{
    			
    			// Remove Template Attr record which not in Record Id
    			checkAttrAssignToRuleStatus( templateId, companyId, listOfTemplateIds, '0', function(callbackRuleAssign){
    	  			if(callbackRuleAssign.status == 'fail') // Error
    	  			{
    	  				var msg = { 
			            			status: 'fail',
			            			data: null,
			            			message: 'Template attributes has not been updated & Removed successfully'
			            		  };
			            callback(msg, null);
    	  			}
    	  			else  // Sucess
    	  			{
    	  				var getCount = callbackRuleAssign.data.length;
    	  				if(getCount > 0) // Assign found
    	  				{
	    	  				var msg = { 
				            			status: 'fail',
				            			data: null,
				            			message: 'Request for delete attributes of this template had assigned to rule(s), Please unassign then before remove'
				            		  };
				            callback(msg, null);
				        }
				        else // Not assign
				        {
				        	callback({
				    			status: 'success',
				    			data: null,
				    			message: 'Record has been updated & Removed successfully'
				    		});
				        }
    	  			}
    	  		});
		   }
		   else
		   {
		   		callback({
		   				status: "fail",
		   				data: null,
		   				message: 'Attribute Record(s) has not been found in template file'
		   			});
		   }
		});

	})
}

/**
  * @author: Gunjan
  * Insert sub-attribute for Main Attribute
  * @param : parent_id : Parent Attribute Id
  * @param : companyId : Company Id
  * @param : templateId : Template Id
  * @param : sub_attributes : File's Sub-attributes JSON
  */
var insertSubAttribute = function insertSubAttribute(parent_id, companyId, templateId, sub_attributes, callback)
{
	if(parent_id != '' && companyId != '' && templateId != '')
	{
			var listOfSubTemplateIds = [];
			// ForEach(1) Start
			async.forEachSeries(sub_attributes, function(sub_attr, callback_f1) {
		    			
		    			// sub attribute List
						var name = sub_attr.name;
						var type = sub_attr.type;
						var localId = sub_attr.localId;
						var unit = sub_attr.unit;
						var min = sub_attr.min;
						var max = sub_attr.max;

						if( name !== '' && type != '' && localId != '' && min != '' && max != '' && typeof name !== 'undefined'  && typeof type !== 'undefined'  && typeof localId !== 'undefined' && typeof unit !== 'undefined' && typeof min !== 'undefined' && typeof max !== 'undefined')
						{
							
							// Check value in DB ( By Parent_id, TemplateId & LocalId)
							db.models.template_attr.findAll({ 
									where: {
											 localId: localId,
											 parent_attr_id: parent_id,
											 template_id: templateId
										   }
							}).then(function(tempSubAttr) {
								if(tempSubAttr)
								{
									if(tempSubAttr.length > 0) // Record Found, Update Record
									{
										var attributeRecord_id = tempSubAttr[0]['id'];
										var templateSubAttrDataObj = [];
											templateSubAttrDataObj = {
												name: name,
												unit: unit,
												type: type,
												min: min,
												max: max
										   	};
										   	listOfSubTemplateIds.push(attributeRecord_id);

										// Update Template Sub-Attribute 
										db.models.template_attr.update( templateSubAttrDataObj, {
															   where: { id: attributeRecord_id } 
															   }).then(function(attr_update) {
											
												// Update Rule Details Entry
												updateNameInRuleDetail(attributeRecord_id, name, function(ruleDetail_callback){
														if(ruleDetail_callback.status == 'fail') // Fail
														{
															callback(ruleDetail_callback);
														}
														else // Success
														{
															callback_f1();
														}
													})
										}).catch(function(err) {
											callback({
														status: 'fail',
														data: null,
														message: 'Sub-Attribute has not been updated successfully'
													});
										});
									}
									else // Record not found, Insert new record
									{
										var tempDataObj = [];
										tempDataObj = {
												template_id: templateId,
												name: name,
												parent_attr_id: parent_id,
												type: type,
												unit: unit,
												min: min,
												max: max,
												localId: localId
											}
											
										// Insert Template
	   									db.models.template_attr.create(tempDataObj).then(function(template) {
											if(template)
											{
												var insertRecordId = template.id; // Inserted Record Id
												listOfSubTemplateIds.push(insertRecordId); // Add Template Ids in Array
												callback_f1();
											}
											else
											{
												callback({
														status: 'fail',
														data: null,
														message: 'Sub-Attribute has not been updated successfully'
													});
											}
										}).catch(function(err) {
											callback({
													status: 'fail',
													data: null,
													message: 'Sub-Attribute has not been updated successfully'
												});
										});
									}
								}
							}).catch(function(err) {
								callback({
										status: 'fail',
										data: null,
										message: 'Sub-Attribute has not been updated successfully'
								});
						   });
						}
						else
						{
							callback_f1();
						}
			}, function() { // ForEach(1) Finish
					
	    			// Remove Template Attr record which not in Record Id
	    			checkAttrAssignToRuleStatus( templateId, companyId, listOfSubTemplateIds, parent_id, function(callbackRuleAssign){
	    	  			if(callbackRuleAssign.status == 'fail') // Error
	    	  			{
	    	  				var msg = {
				            			status: 'fail',
				            			data: null,
				            			message: 'Template sub attributes has not been updated & Removed successfully'
				            		  };
				            callback(msg, null);
	    	  			}
	    	  			else  // Sucess
	    	  			{
	    	  				// Update parent attribute type(JSON, INT Etc...) record 
	    	  				getDetailsAndUpdateParentAttrValue(parent_id, function(parentUpdate_callback){
	    	  						
	    	  						if(parentUpdate_callback.status == 'fail') // Error
	    	  						{
	    	  							var msg = {
					            			status: 'fail',
					            			data: null,
					            			message: 'Template sub attributes has not been updated & Removed successfully'
						            		  };
							            callback(msg, null);
	    	  						}
	    	  						else // Success
	    	  						{
	    	  							var getCount = callbackRuleAssign.data.length;
				    	  				if(getCount > 0) // Assign found
				    	  				{
					    	  				var msg = {
								            			status: 'fail',
								            			data: null,
								            			message: 'Request for delete sub attributes of this template had assigned to rule(s), Please unassign then before remove'
								            		  };
								            callback(msg, null);
								        }
								        else // Not assign
								        {
								        	callback({
								    			status: 'success',
								    			data: null,
								    			message: 'Record has been updated & Removed successfully'
								    		});
								        }	
	    	  						}
	    	  				})
	    	  			}
	    	  		});
			});
	}
	else // Fail
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Please pass all parameters valid value'
		});
	}
}

/**
  * @author: Gunjan
  * Update Parent Attribute value based on child-subattribute count
  * @param : parent_attr_id : Parent Attribute Id
  */
var getDetailsAndUpdateParentAttrValue =  function getDetailsAndUpdateParentAttrValue(parent_attr_id, callback)
{
	db.models.template_attr.findOne( { 
				where: { id: parent_attr_id },
				attributes: Object.keys(db.models.template_attr.attributes).concat([
					[db.literal('(select count(*) from template_attr as attr2 where `attr2`.`parent_attr_id` = `template_attr`.`id`)'), 'childCount']
				])
			} ).then(function(attributes) {
		if(attributes)
		{
			var childAttrCount = attributes['dataValues'].childCount;
			var parentAttributeName = attributes.name;
			var parentAttributeType = attributes.type;

			var attrType = '';
			if(childAttrCount > 0)
			{
				attrType = 'JSON';
			}
			else 
			{
				if(parentAttributeType == 'JSON')
				{
					attrType = 'INT';
				}
			}

			if(attrType != '') // If attribute type not null
			{
				var attrDataObj = [];
					attrDataObj = {
							type : attrType
						}

				db.models.template_attr.update( attrDataObj, {
							   where : { id: parent_attr_id } 
							   }).then(function(attribute_update) {
								
								   callback({
										status: 'success',
										data: null,
										message: 'Parent attribute Type has been updated successfully'
									});
				})
			}
			else
			{
				callback({
					status: 'success',
					data: null,
					message: 'Parent attribute Type has not required to update'
				});
			}
		}
		else
		{
			callback({
				status: 'fail',
				data: null,
				message: 'Parent attribute not found'
			});
		}
	}).catch(function(err) {
		callback({
			status: 'fail',
			data: null,
			message: 'Parent record update process not completed successfully'
		});
	});
}

/**
  * @author: Gunjan
  * Update sub-Attribute name in rule detail's record when update parent attribute name
  * @param : parent_attr_id : Parent Attribute Id
  */
var childNameAtParentNameUpdateInRuleDetail = function childNameAtParentNameUpdateInRuleDetail(parent_attr_id ,callback)
{
	db.query("select attr1.*, attr2.name as parent_name from template_attr as attr1 left join template_attr as attr2 on attr2.id = attr1.parent_attr_id where attr1.parent_attr_id = :parent_attr_id",
        { replacements: { parent_attr_id: parent_attr_id }, type: db.QueryTypes.SELECT }
    ).then(function(templateAttr)
    {
    	// ForEach(1) Start
    	async.forEachSeries(templateAttr, function(attr, callback_f1) {

    			updateNameInRuleDetail(attr.id, attr.name, function(callbackNameUpdate){
    					callback_f1();
    			})

		}, function(err) { // ForEach(1) Finish
			    	
			    	callback({ 
						status: 'success',
						data: null,
						message: 'Rule detail child Record(s) has been updated successfully'
					});	
			    	
			    });

    }).catch(function(err) {
		callback({
			status: 'fail',
			data: null,
			message: 'Rule detail child Record(s) has not been updated successfully'
		});
	});
}

/**
  * @author: Gunjan
  * Update Attribute name in rule detail's record
  * @param : template_record_id : Attribute Id
  * @param : nawName : New Name
  */
var updateNameInRuleDetail = function updateNameInRuleDetail(template_record_id, nawName, callback)
{

	db.query("select attr2.name as newName from template_attr as attr1 left join template_attr as attr2 on attr2.id = attr1.parent_attr_id where attr1.id = :template_record_id",
        { replacements: { template_record_id: template_record_id }, type: db.QueryTypes.SELECT }
    ).then(function(templateAttr)
    {
		if(templateAttr)
		{
			var parentAttrName = templateAttr[0]['newName'];
			var newKeyName = '';
			if(parentAttrName == null)
			{
				newKeyName = nawName
			}
			else
			{
				newKeyName = parentAttrName+'.'+nawName
			}

			/* Update Records */
			var ruleDetailDataObj = [];
				ruleDetailDataObj = {
					key: newKeyName
				}
			db.models.rule_detail.update( ruleDetailDataObj, {
					   where: { template_attr_id: template_record_id } 
					}).then(function(template_update) {
						
						childNameAtParentNameUpdateInRuleDetail(template_record_id , function(callback_childname){
								callback(callback_childname);
						})
						/*callback({
								status: 'success',
								data: null,
								message: 'Rule detail Record(s) has been updated successfully'
						});*/
						
					}).catch(function(err) {
						callback({
								status: 'fail',
								data: null,
								message: 'Rule detail Record(s) has not been updated successfully'
							});
			});
		}
		else
		{
			callback({
				status: 'fail',
				data: null,
				message: 'Rule detail Record(s) has not been updated successfully'
			});
		}
	}).catch(function(err) {
		callback({
			status: 'fail',
			data: null,
			message: 'Rule detail Record(s) has not been updated successfully'
		});
	});
}

/**
  * @author: Gunjan
  * Varify Template data before processing
  * @param : tmpFilePath : JSON File upload Temp Path
  * @param : companyId : Company ID
  */
var verifyTemplateData = function verifyTemplateData(tmpFilePath, companyId, callback)
{
	// Read Json File
	fs.readFile( tmpFilePath, 'utf8', function (err,data) {
		if(err) {
		  	callback({
		  			status: 'fail',
		  			data: null,
		  			message: err
		  		});
			return false;
		}

		// Check file Data
		try {
		    var tempData = JSON.parse(data);
		} 
		catch (e) {
		   callback({
		   		status: 'fail',
		   		data: null,
		   		message: 'JSON data format is invalid. Please refer sample file'
		   	});
		   return false;
		}

		var readReadAttr = tempData.attributes;
		if(readReadAttr == '' || typeof readReadAttr === 'undefined') // attribute not define
		{
		  	callback({
		  			status: 'fail',
		  			data: null,
		  			message: 'JSON data format is invalid. Please refer sample file'
		  		});
		  	return false;
		}

		var listOfTemplateLocalIds = [];

		// ForEach(1) Start
		async.forEachSeries(readReadAttr, function(attr, callback_f1) {

					var localId = attr.localId; // Attribute local id
					var subsAttr = attr['sub_attr']; // Sub-attribute Data

					var name = attr.name; // Attribute Name
					var description = attr.description; // Attribute Description
					var type = attr.type; // Attribute Type
					var status = attr.status; // Attribute Status
					var unit = attr.unit; // Attribute Unit
					var min = attr.min; // Min Range
					var max = attr.max; // Max Range

					if(  name != '' && description != '' && type != '' && unit != '' && min != '' && max != '' && localId != '' && typeof name !== 'undefined'  && typeof description !== 'undefined'  && typeof type !== 'undefined' && typeof status !== 'undefined' && typeof unit !== 'undefined' && typeof min !== 'undefined' && typeof max !== 'undefined' && typeof localId !== 'undefined')
						{
							// Parent Attribute Validation False
							if(listOfTemplateLocalIds.indexOf(localId) > -1) 
							{ 
								// local_id in array
								callback({
						  			status: 'fail',
						  			data: null,
						  			message: 'Duplicate Local-id found, Local-id should be unique for each attribute'
						  		});
							}
							else if(isNaN(min) || isNaN(max))
							{
								callback({
						  			status: 'fail',
						  			data: null,
						  			message: 'Min or Max value found as not number, Min or Max attribute value should be in number format'
						  		});
							}
							else
							{
								// local_id not in array
								listOfTemplateLocalIds.push(localId);
								if(subsAttr) // Sub-attribute Found
								{
									// ForEach(2) Start
									async.forEachSeries(subsAttr, function(sub_attr, callback_f2) {
											var sub_local_id = sub_attr.localId; // Sub-attribute local id
											var sub_name = sub_attr.name; // Sub-attribute name
											var sub_type = sub_attr.type; // Sub-attribute type
											var sub_unit = sub_attr.unit; // Sub-attribute unit
											var sub_min = sub_attr.min; // Sub-attribute Min Range
											var sub_max = sub_attr.max; // Sub-attribute Max Range
											
											if(sub_local_id != '' && typeof sub_local_id !== 'undefined' &&
											   sub_name != '' && typeof sub_name !== 'undefined' &&
											   sub_type != '' && typeof sub_type !== 'undefined' &&
											   sub_unit != '' && typeof sub_unit !== 'undefined' &&
											   sub_min != '' && typeof sub_min !== 'undefined' &&
											   sub_max != '' && typeof sub_max !== 'undefined' )
											{
												// Sub-Attribute Validation False
												if(listOfTemplateLocalIds.indexOf(sub_local_id) > -1) 
												{
													// local_id in array of Sub-attribute
													callback({
											  			status: 'fail',
											  			data: null,
											  			message: 'Duplicate Local-id found, Local-id should be unique for each attribute'
											  		});			
												}
												else if(isNaN(sub_min) || isNaN(sub_max))
												{
													callback({
											  			status: 'fail',
											  			data: null,
											  			message: 'Min or Max value found as not number, Min or Max attribute value should be in number format'
											  		});
												}
												else
												{
													// local_id in not array of Sub-attribute
													listOfTemplateLocalIds.push(sub_local_id);
													callback_f2();
												}
											}
											else // Sub-Attribute Validation True
											{
												callback({
										  			status: 'fail',
										  			data: null,
										  			message: 'Required attribute has not been found in sub-attribute'
										  		});
											}
									}, function() { // ForEach(2) Finish
											callback_f1();
									});	
									
								}
								else // Sub-attribute not Found
								{
									callback_f1();
								}
							}
						}
						else // Parent Attribute Validation True
						{
							callback({
					  			status: 'fail',
					  			data: null,
					  			message: 'Required attribute has not been found in parent attribute'
					  		});
						}
		}, function() { // ForEach(1) Finish
				callback({
		  			status: 'success',
		  			data: null,
		  			message: 'Localid are unique of each attribute'
		  		});	
		});	

	})
}

/**
  * @author: Gunjan
  * Get list of all Template with ng-table filter for listing
  */
exports.getTemplateList = function(req, res, next) {

	//get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({ 
        		status: 'fail',
        		data : null,
        		message: 'User information not found'
        	});
        return false;
    }

    var companyId = userInfo.companyId;
    var sortBy = req.body.params.sortBy;
    var sortOrder = req.body.params.sortOrder;
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;
    var serachWhere = '';

    // Sorting
    if(sortBy == 'name') { sortBy = 'temp.name'; }
    else if(sortBy == 'parent_id') { sortBy = 'd2.name'; }
    else { sortBy = 'temp.createdAt'; }
    
    // Pagination
    if(pageNumber == '') { pageNumber = pageNumber; } 
    else { pageNumber = (pageNumber - parseInt(1)) * pageSize; }
	
	// Condition
	if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "") {

		serachWhere += "( temp.name like :searchTxt or deviceGroup.name like :searchTxt ) and";

    }

    // Fetch Value
    db.query("SELECT temp.id, temp.name, temp.createdAt, deviceGroup.name as device_group_name, ( select count(*) from template as temp left join device_group as deviceGroup on temp.device_group_id = deviceGroup.id where "+serachWhere+" temp.company_id = :company_id and temp.deletedAt is null ) as totalCount FROM template as temp left join device_group as deviceGroup on temp.device_group_id = deviceGroup.id where "+serachWhere+" temp.company_id = :company_id and temp.deletedAt is null ORDER BY "+sortBy+" "+sortOrder+" LIMIT :pageSize OFFSET :offset",
        { replacements: { company_id: companyId, searchTxt: '%'+req.body.SearchParams.searchTxt+'%', pageSize: pageSize, offset: pageNumber }, type: db.QueryTypes.SELECT }
    ).then(function(templateData)
    {
    	if(templateData.length > 0) // Result Found
        {
        	var tempAry = [];
        		tempAry = {
        			count: templateData[0].totalCount,
        			rows: templateData
        		}

        	res.json({ 
        			status: 'success', // 200
        			data: tempAry,
        			message: 'Records loaded successfully.'
        		});
        }
        else  // Result Not Found
        {
        	res.json({
        			status: 'success',
        			data: [],
        			message: 'No records found'
        		});
        }
    }).catch(function(err) { // Some unknow error
        res.json({
        		status: 'fail',
        		data: null,
        		message: 'No records found'
        	}); 
   });    
    
}

/**
  * @author: Gunjan
  * Delete Template by Template Id
  */
exports.deleteTemplate = function(req, res, next) {

	var tempId = req.params.id; // Template ID
    var userInfo = generalConfig.getUserInfo(req);

    if (!tempId)
    {
        return res.json({
        		status: 'fail',
        		data: null,
        		message: 'Unknown Template record, please select valid Template record'
        	});

    	return false;
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
	    deleteTemplateProcess( tempId, userInfo.companyId, function(callback_delete){
	    		return res.json(callback_delete);
	    })
	}    
}

/**
  * @author: Gunjan
  * Delete Template
  * @param : templateId : Template Id
  * @param : companyId : Company Id
  */
var deleteTemplateProcess = function deleteTemplateProcess( templateId, companyId, callback)
{
	async.series([
    	  // 1. Check this template's attribute assign in rule
    	  function(callbackDelete){
    	  		/*checkAttrAssignToRuleStatus( templateId, companyId, [], '', function(callbackRuleAssign){
    	  			if(callbackRuleAssign.status == 'fail') // Error
    	  			{
    	  				var msg = { 
			            			status: 'fail',
			            			data: null,
			            			message: 'Template has not been deleted successfully'
			            		  };
			            callbackDelete(msg, null);
    	  			}
    	  			else  // Sucess
    	  			{
    	  				var getCount = callbackRuleAssign.data.length;
    	  				if(getCount > 0) // Assign found
    	  				{
	    	  				var msg = { 
				            			status: 'fail',
				            			data: null,
				            			message: 'Some attribute Or Sub-Attribute of this template had assigned to rule, Please unassign then before delete template'
				            		  };
				            callbackDelete(msg, null);
				        }
				        else // Not assign
				        {
				        	callbackDelete(null, null);
				        }
    	  			}
    	  		});*/
    	  		callbackDelete(null, null);
    	  },
    	  // 2. Get template information
    	  function(callbackDelete){
    	  		db.models.template.findOne({
							attributes: ['device_group_id'],
							where: { id: templateId }
						}).then(function(template) {
					if(template)
					{
						var device_group_id = template.device_group_id; // Old device Group ID
						commonLib.checkAssignRuleOrThingToGroupAndChildGroup( device_group_id, function(group_information_res){
							if(group_information_res.status == 'success') // IF: Check Group or Child Group 
							{
								if(group_information_res.data.rule_count > 0 && group_information_res.data.thing_count > 0) // Rule & Thing both are assign
								{
									callbackDelete({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Rule(s) & Thing(s) are assign to requested group or its child group(s), Please unassign Rule(s) & Thing(s) from this group\'s hierarchy before remove template'
						  			});
								}
								else if(group_information_res.data.rule_count > 0) // Rule are assign
								{
									callbackDelete({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Rule(s) are assign to requested group or its child group(s), Please unassign Rule(s) from this group\'s hierarchy before remove template'
						  			});
								}
								else if(group_information_res.data.thing_count > 0) // Thing are assign
								{
									callbackDelete({ 
						  				status: 'fail',
						  				data: null,
						  				message: 'Thing(s) are assign to requested group or its child group(s), Please unassign Thing(s) from this group\'s hierarchy before remove template'
						  			});
								}
								else // Not Rule & Thing: Success
								{
									callbackDelete(null);
								}
							}
							else  // Else: Check Group or Child Group 
							{
								callbackDelete({ 
					  				status: 'fail',
					  				data: null,
					  				message: 'Group hierarchy information has not been found'
					  			});
							}
						})
					}
					else  // Some unknow error
					{
						callbackDelete({
							status: 'fail',
							data: null,
							message: 'Template record has not been found'
						});
					}
				})
    	  },
    	  // 3. Delete Template Attr records
    	  function(callbackDelete){

			    /*db.models.template_attr.destroy({where: { template_id: templateId }}).then(function (deleletTemplateAttr)
			    {
			        
			        callbackDelete(null, null);
			        
			    }).catch(function(err) {
			            var msg = { 
			            			status: 'fail',
			            			data: null,
			            			message: 'Template has not been deleted successfully'
			            		  };
			            callbackDelete(msg, null);
			    });*/
			    callbackDelete(null, null);
	      },
	      // 4.  Delete Template records
	      function(callbackDelete){

	  			db.models.template.destroy({where: { id: templateId, company_id : companyId }}).then(function (deleletTemplate)
			    {
			        if(deleletTemplate)
			        {
			        	callbackDelete(null, null);
			        }
			        else
			        {
			            var msg = { 
			            			status: 'fail',
			            			data: null,
			            			message: 'Template has not been deleted successfully'
			            		  };
			            callbackDelete(msg, null);
			        }
			    }).catch(function(err) {

			            var msg = {
			            			status: 'fail',
			            			data: null,
			            			message: 'Template has not been deleted successfully'
			            		  };
			            callbackDelete(msg, null);
			    });
	      },
	      // 5. Remove Directory from "jsTemplate" Folder
	      function(callbackDelete){
		      	
	      		var definePath = settings.filesPath.jsTemplate+"/"+companyId+"/"+templateId;
		      	commonLib.deleteFolderRecursive(definePath);
	      		callbackDelete(null, null);
	      }
    	],
    /* All process Finish */
  	function(err, results){
  		if(err && err != null)
  		{
  			return callback(err);
  		}
  		else
  		{
  			return callback({
  						status: 'success',
  						data: null,
  						message: 'Template has been deleted successfully'
  					});
  		}
  	})
}

/**
  * @author: Gunjan
  * Check Template attribute assign to any rule
  * If not then delete this attribute from record and pass array of assign attribute
  * @param : templateId : Template Id
  * @param : companyId : Company Id
  * @param : templateAttrId : Template Attribute List Array
  * @param : parent_attr_id : Parent Attribute Id
  */
var checkAttrAssignToRuleStatus = function checkAttrAssignToRuleStatus( templateId, companyId, templateAttrId, parent_attr_id, callback)
{
	var whereString = '';
	if(templateAttrId.length > 0)
	{
		whereString += "tempAttr.id NOT IN( :attrId ) and ";
	}
	if(parent_attr_id != '' && parent_attr_id != 'undefined' )
	{
		whereString += "tempAttr.parent_attr_id = :parent_id and ";
	}

	var notDeletedAttrRecordId = [];
	
	db.query("select *, ( select count(*) from rule_detail as ruleDetails left join rule on rule.id = ruleDetails.rule_id where rule.deletedAt is null and ( ruleDetails.template_attr_id = tempAttr.id or template_attr_id in (select id from template_attr where parent_attr_id = tempAttr.id )) ) as attrAssign from template_attr as tempAttr where "+whereString+" tempAttr.template_id = :templateId",
        { replacements: { templateId: templateId, company_id: companyId, attrId: templateAttrId, parent_id: parent_attr_id }, type: db.QueryTypes.SELECT }
    ).then(function(templateAttr)
    {
		if(templateAttr)
		{
			// Foreach(1) Start
			
			async.forEachSeries(templateAttr, function(attr, callback_f1) {
					var assignCount = attr.attrAssign; // Rule details assign count
					var attrRecordId = attr.id; // Template Attribute Record Id

					if(assignCount > 0) // Assign in rule
					{
						notDeletedAttrRecordId.push(attrRecordId);
						callback_f1();
					}
					else // Not assign anywhere in rule
					{
						// Delete Template Record
						db.models.template_attr.destroy({where: { id: attrRecordId }}).then(function (deleletTemplateAttr)
						    {
						        if(deleletTemplateAttr)
						        {
						        	// Sub Attribute Delete
						        	checkAttrAssignToRuleStatus( templateId, companyId, [], attrRecordId, function(sub_attr){
						        		callback_f1();
						        	})
						        	
						        }
						        else
						        {
						        	callback_f1();
						        }
						    }).catch(function(err) {
						            var msg = {
						            			status: 'fail',
						            			data: null,
						            			message: 'Template has not been deleted successfully'
						            		  };
						            callback_f1(msg);
						    });

					}
		    }, function(err) { // ForEach(1) Finish
		    	if(err) // Error
		    	{
					callback(err);
		    	}
		    	else // Success
		    	{
		    		callback({ 
						status: 'success',
						data: notDeletedAttrRecordId,
						message: 'Unassign template attribute has not been deleted successfully'
					});	
		    	}
		    });
		}
		else
		{
			callback({ 
				status: 'success',
				data: notDeletedAttrRecordId,
				message: 'Unassign template attribute has not been found'
			});	
		}
	}).catch(function(err) {
		callback({ 
				status: 'fail',
				data: null,
				message: 'Template has not been deleted successfully'
			});
	});
}

/**
  * @author: Gunjan
  * Download Template File
  */
exports.downloadTemplateFile = function(req, res, next){

	var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
        			status: 'fail',
        			data: null,
        			message: 'Company record not found, Please re-login in portal'
        		});
        return false;
    }
	var tempId = req.params.id; // Template Id

	var fileName = 'TemplateData.json'; // File Name
	var definePath = settings.filesPath.jsTemplate+"/"+userInfo.companyId+"/"+tempId;
    var destPath = definePath+"/"+fileName;

    // Create Folder
    mkpath.sync(definePath);

	//Fetch Attribute value
		db.query("select *, ( select group_concat(tempAttr2.id) from template_attr as tempAttr2 where tempAttr2.parent_attr_id = tempAttr1.id ) as sub_attr from template_attr as tempAttr1 where tempAttr1.template_id = :templateId and tempAttr1.parent_attr_id = '0'",
        { replacements: { templateId: tempId }, type: db.QueryTypes.SELECT }
	    ).then(function(tempAttr)
	    {
			if(tempAttr)
			{
				// ForEach(1) Start
				var templateAttrArray = {};
				templateAttrArray['attributes'] = new Array ();
				
				// ForEach(1) Start
				async.forEachSeries(tempAttr, function(attr, callback_f1) {
						
						var name = attr.name;
						var description = attr.description;
						var type = attr.type;
						var localId = attr.localId;
						var status = attr.status;
						var sub_attr_id = attr.sub_attr;
						var unit = attr.unit;
						var min = attr.min;
						var max = attr.max;

						// ForEach(2) Start
						var sub_attr_json = [];
						
							if(sub_attr_id != null)
							{
								sub_attr_id = sub_attr_id.split(',');
							}
						
						// ForEach(2) Start
						async.forEachSeries(sub_attr_id, function(attr_id, callback_f2) {
							getAttributeDetailById(attr_id, function(callback_attr_information){
								if(callback_attr_information.status != 'fail')
								{	
									var temp = [];
									temp = {
										"name": callback_attr_information.data.name,
										"type": callback_attr_information.data.type,
										"localId": callback_attr_information.data.localId,
										"unit": callback_attr_information.data.unit,
										"min": callback_attr_information.data.min,
										"max": callback_attr_information.data.max
									}
									sub_attr_json.push(temp);
									callback_f2()
								}
								else
								{
									callback_f2()
								}
							})
						}, function() { // ForEach(2) Finish
							
							// Status Chnage Word
							if(status == '1')
							{
								status = true;
							}
							else if(status == '0')
							{
								status = false;
							}
							else
							{
								status = null;
							}

							var tempAray = [];
							
							if(sub_attr_json.length > 0)
							{
								tempAray = {
								  "name": name,
							      "description": description,
							      "type": type,
							      "localId": localId,
							      "status": status,
							      "unit": unit,
							      "min": min,
							      "max": max,
							      "sub_attr": sub_attr_json
								}
							}
							else
							{
								tempAray = {
								  "name": name,
							      "description": description,
							      "type": type,
							      "localId": localId,
							      "unit": unit,
							      "min": min,
							      "max": max,
							      "status": status
								}
							}
							templateAttrArray['attributes'].push(tempAray);
							callback_f1();
						})				

				}, function() { // ForEach(1) Finish

						// Write File
						var writeContent = JSON.stringify(templateAttrArray);
						fs.writeFile( destPath, writeContent, function (err) {
					        if (err)
					        { 
					        	return res.json({
					        				  status: 'fail',
					        				  data: null,
					        				  message: 'Download process has not been completed successfully'
					        			});
					        	return false;
					        }
					        
					        var fileToSend = fs.readFileSync(destPath);
					        var stat = fs.statSync(destPath);
					        /*res.writeHead(200, {
					            'Content-Type': 'application/javascript',
					            'Content-Length': stat.size,
					            'Content-Disposition': fileName
					        });*/
					        res.end(fileToSend);
					    });
				});
			}
		}).catch(function(err) {
			return res.json({
						status: 'fail',
						data: null,
						message: 'Download process has not been completed successfully'
					});
	   });
}

/**
  * @author: Gunjan
  * Get attribute details by Attribute record ID
  * @param : template_attr_id : Attribute Id
  * @param : nawName : New Name
  */
var getAttributeDetailById = function getAttributeDetailById(template_attr_id, callback)
{
	db.models.template_attr.findOne( { 
				where: { id: template_attr_id }
			} ).then(function(attr) {

				callback({ 
					status: 'success',
					data: attr['dataValues'],
					message: 'Attribute details loaded successfully'
				});
			
	}).catch(function(err) {
		callback({ 
				status: 'fail',
				data: null,
				message: 'Attribute details not loaded successfully'
			});
	});
}

/**
  * @author: Gunjan
  * Get template's Parent( Main ) attribute list Based on Group Id
  */
exports.attributeList = function(req, res, next){
	
	var deviceGroupId = req.params.id; // Device Group Id
	var userInfo = generalConfig.getUserInfo(req);
	if(!deviceGroupId)
	{
		res.json({
        	  status: 'fail',
        	  data: null,
        	  message: 'Unknown Device Group, please pass valid Device Group'
        	});
		return false;
	}
	else if (!userInfo.companyId) {
        res.json({
				status: 'fail',
				data: null,
				message: 'Company record has not been found, Please re-login in portal'
			});
        return false;
    }
    else
    {
		getParentAttributeByGroupId(deviceGroupId, userInfo.companyId,function(getParentAtt_callback){
				if(getParentAtt_callback.status == 'success')
				{
					res.json({
						status: 'success',
						data: getParentAtt_callback.data,
						upssage: 'Attribute listing has been loaded of this group'
					});
				}
				else
				{
					res.json({
						status: 'fail',
						data: null,
						upssage: 'Attribute listing has not been loaded of this group'
					});
				}
		})
	}

}

/**
  * @author: Gunjan
  * Get Template parent(Main/Root) attribute based on Group & Company
  * @param : group_id = Device Group Id
  * @param : company_id = Company Id
  */
var getParentAttributeByGroupId = function getParentAttributeByGroupId(group_id, company_id, callback)
{
	if(group_id && company_id)
	{
		db.query("select attr.id, attr.name as attribute_name, temp.name as template_name, attr.parent_attr_id, (select count(*) from template_attr as attrInr where attrInr.parent_attr_id = attr.id ) as subAttrCount from template_attr as attr left join template as temp on temp.id = attr.template_id where temp.company_id = :company_id and temp.device_group_id = :deviceGroupId and attr.parent_attr_id = '0' and temp.deletedAt is null ORDER BY attribute_name ",
		        { replacements: { company_id: company_id, deviceGroupId: group_id }, type: db.QueryTypes.SELECT }
		    ).then(function(templateAttr)
		    {
				if(templateAttr)
				{
					callback({ 
						status: 'success',
						data: templateAttr,
						message: 'Record loaded successfully'
					});
				}
				else
				{
					callback({
						status: 'success',
						data: null,
						message: 'No Record found'
					});
				}
			}).catch(function(err) {
				callback({ 
					status: 'fail',
					data: null,
					message: 'Record has not been loaded successfully'
				});
			});
	}
	else
	{
		res.json({ 
			status: 'fail',
			data: null,
			message: 'Device Group & company has not been valid'
		});
	}	
}

/**
  * @author: Gunjan
  * Get template's Sub-attribute(s) list based on parent attribute Id
  */
exports.subAttributeList = function(req, res, next){
	var parent_attr_id = req.params.id; // Parent Attribute Id
	if(!parent_attr_id)
	{
		res.json({
        	  status: 'fail',
        	  data: null,
        	  message: 'Unknown parent attribute record, please select valid parent attribute'
        	});
		return false;
	}

	var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        res.json({
    			status: 'fail',
    			data: null,
    			message: 'Company record not found, Please re-login in portal'
    		});
        return false;
    }

    db.query("select attr.id, attr.name as attribute_name, temp.name as template_name, attr.parent_attr_id, (select concat(attr.id,'___',attr_1.name,'.',attr.name) from template_attr as attr_1 where id = attr.parent_attr_id) as attrNameId from template_attr as attr left join template as temp on temp.id = attr.template_id where temp.company_id = :company_id and attr.parent_attr_id = :parentId ORDER BY attribute_name ",
        { replacements: { company_id: userInfo.companyId, parentId: parent_attr_id }, type: db.QueryTypes.SELECT }
    ).then(function(templateAttr)
    {
		if(templateAttr)
		{
			res.json({ 
					status: 'success',
					data: templateAttr,
					message: 'Record loaded successfully'
				});
		}
		else
		{
			res.json({
					status: 'success',
					data: null,
					message: 'Record not loaded successfully'
				});
		}
	}).catch(function(err) {
		res.json({ 
				status: 'fail',
				data: null,
				message: 'Record not loaded successfully'
			});
	});

}

/**
  * @author: Gunjan
  * Get rule details based on Assign Attribute Id
  * @param: template_attr_id : Attribute Id
  */
var getRuleDetailsBasedOnTemplateAttrId = function getRuleDetailsBasedOnTemplateAttrId(template_attr_id, callback)
{
	db.models.rule_detail.findAll({ 
				where: {
						 template_attr_id: template_attr_id
					   }
		}).then(function(ruleSubAttr) {
			if(ruleSubAttr)
			{
				callback({
					status: 'success',
					data: ruleSubAttr,
					message: 'Rule assign attribute record has not been found'
				});
			}
			else
			{
				callback({
					status: 'success',
					data: null,
					message: 'Rule assign attribute record has not been found'
				});
			}
		}).catch(function(err) {
			callback({
				status: 'fail',
				data: null,
				message: 'Rule assign attribute record has not been found'
			});
	   });
}

/**
  * @author: Gunjan
  * Get Template Attribute list by Group Id
  * If group have not own template then recursion till root group.
  */
exports.recursionParentAttrList = function(req, res, next){

	var group_id = req.params.id; // Group Id
	var userInfo = generalConfig.getUserInfo(req);
	if(!group_id)
	{
		res.json({
    	  status: 'fail',
    	  data: null,
    	  message: 'Unknown Device Group, please pass valid Device Group'
    	});
	}
	else if(!userInfo.companyId)
	{
        res.json({
			status: 'fail',
			data: null,
			message: 'Company record not found, Please re-login in portal'
		});
    }
    else
    {
		// Get Device Group Id which have own template
		commonLib.getGroupIdWhichHaveTemplate(group_id, function(group_data_callback){
			if(group_data_callback.status == 'success')
			{
				// Get Attribte Data based on Device Group Id
				getParentAttributeByGroupId(group_data_callback.data.group_id, userInfo.companyId,function(getParentAtt_callback){
						if(getParentAtt_callback.status == 'success')
						{
							res.json({
								status: 'success',
								data: getParentAtt_callback.data,
								upssage: 'Attribute listing has been loaded of this group'
							});
						}
						else
						{
							res.json({
								status: 'fail',
								data: null,
								upssage: 'Attribute listing has not been loaded of this group'
							});
						}
				})
			}
			else
			{
				res.json({
		    	  status: 'fail',
		    	  data: null,
		    	  message: 'Template attribute has not been found, Please try again'
		    	});
			}
		});  

    }
}