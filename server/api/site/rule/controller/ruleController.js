'use strict';

//var db = require('../../../../config/cassandra');
var generalConfig = require('../../../../config/generalConfig');
//var cassandra = require('cassandra-driver');
var async = require('async');

/* Common function Lib */
var commonLib = require('../../../../lib/common');

/* AWS */
var awsSubscriber = require('../../../../lib/aws/subscriber');
var awsIotConnect = require('../../../../lib/aws/awsiotconnect');

var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");



 /**
 * Get Rule list for Data Table
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for datatable response
 */
exports.getRuleList = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information not found.'
        });
    }
    else
    {
	    var companyId = userInfo.companyId;
	    var sortBy = req.body.params.sortBy;
	    var sortOrder = req.body.params.sortOrder;
	    var pageNumber = req.body.params.pageNumber;
	    var pageSize = req.body.params.pageSize;
	    var searchWhere = '';

	    // Sorting
	    if(sortBy == 'name') { sortBy = 'name'; }
	    else if(sortBy == 'device_group_name') { sortBy = 'device_group_name'; }
	    else { sortBy = 'createdAt'; }

	    // Pagination
	    if(pageNumber == '') { pageNumber = pageNumber; } 
	    else { pageNumber = (pageNumber - parseInt(1)) * pageSize; }

	    // Condition
		if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "") {
			searchWhere += "where name like :searchTxt or device_group_name like :searchTxt";
	    }

	    // Fetch Value
	    db.query("select id, name, active, createdAt, device_group_name, notification_count from ( select rule.id, rule.name, rule.active, rule.createdAt, device_group.name as device_group_name, count(notification_log.id) as notification_count from rule left join 	device_group on device_group.id = rule.device_group_id left join 		notification_log on notification_log.rule_id = rule.id where rule.company_id = :company_id and rule.deletedAt is null group by rule.id, rule.name, rule.active, device_group_id, device_group_name ) as x "+searchWhere+" ORDER BY "+sortBy+" "+sortOrder+" LIMIT :pageSize OFFSET :offset",
	        { replacements: { company_id: companyId, searchTxt: '%'+req.body.SearchParams.searchTxt+'%', pageSize: pageSize, offset: pageNumber }, type: db.QueryTypes.SELECT }
	    ).then(function(rule)
	    {
	    	if(rule.length > 0) // Result Found
	        {
		    	db.query("select count(*) as total_count from ( select rule.id, rule.name, rule.active, rule.createdAt, device_group.name as device_group_name, count(notification_log.id) as notification_count from rule left join 	device_group on device_group.id = rule.device_group_id left join 		notification_log on notification_log.rule_id = rule.id where rule.company_id = :company_id and rule.deletedAt is null group by rule.id, rule.name, rule.active, device_group_id, device_group_name ) as x "+searchWhere,
		        { replacements: { company_id: companyId, searchTxt: '%'+req.body.SearchParams.searchTxt+'%' }, type: db.QueryTypes.SELECT }
			    ).then(function(rule_total_count)
			    {
			    	var ruleAry = [];
		        		ruleAry = {
		        			count: rule_total_count[0].total_count,
		        			rows: rule
		        		}

		        		res.json({ 
		        			status: 'success',
		        			data: ruleAry,
		        			message: 'Records loaded successfully.'
		        		});
			    }).catch(function(err) {
			    		
			        	res.json({
			        		status: 'fail',
	        				message: 'Failed to load data. please contact administrator.'
			        	}); 
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
	        		message: 'Failed to load data. please contact administrator.'
	        	}); 
	    });
	}
};

/**
  * @author: GK
  * Register new Rule with user subscription in AWS for Notification
  */
exports.addRule = function(req, res) {

	if (req.body != '')
	{
		req.checkBody('name', 'Name required').notEmpty();
		req.checkBody('groupId', 'Group required').notEmpty();
		//req.checkBody('thingId', 'Thing required').notEmpty();
		//req.checkBody('condition', 'Condition required').notEmpty();
		req.checkBody('ruletype', 'Rule Type required').notEmpty();
		req.checkBody('dwelltimeunit', 'Dwelltimeunit required').notEmpty();
		req.checkBody('severity', 'Severity required').notEmpty();

		req.sanitizeBody('emailnotification').toBoolean();
		req.sanitizeBody('pushnotification').toBoolean();
		req.sanitizeBody('smsnotification').toBoolean();

		// Email Notification
		if(req.body.emailnotification)
		{
			req.checkBody('groups', 'Email Notification Group required').notEmpty();
			req.checkBody('emailtemplate', 'Email Template required').notEmpty();
			req.checkBody('emailtemplatesubject', 'Email Template Subject required').notEmpty();
		}
		else
		{
			req.body.emailtemplate = null;
			req.body.emailtemplatesubject = null;
			req.body.emailnotification = false;
		}
		
		// Push Notification
		if(req.body.pushnotification)
		{
			req.checkBody('pushgroups', 'Push Notification Group required').notEmpty();
			req.checkBody('pushtemplate', 'Push Template required').notEmpty();
		}
		else
		{
			req.body.pushtemplate = null;
			req.body.pushnotification = false;
		}

		// SMS Notification 
		if(req.body.smsnotification)
		{
			req.checkBody('smsgroups', 'SMS Notification Group required').notEmpty();
			req.checkBody('smstemplate', 'SMS Template required').notEmpty();
		}
		else
		{
			req.body.smstemplate = null;
			req.body.smsnotification = false;
		}

		// Execute Operation
		if(req.body.executeoperation)
		{
			req.checkBody('executeoperationcommand', 'Command required').notEmpty();
		}
		else
		{
			req.body.executeoperationcommand = null;
			req.body.executeoperation = false;
		}

		if(req.body.ruletype == '2')
		{
			req.checkBody('querystring', 'Query string required').notEmpty();
		}
		else if(req.body.ruletype == '1')
		{
			req.checkBody('rules', 'Rules required').notEmpty();
		}
		var mappedErrors = req.validationErrors(true);
	}

	if (mappedErrors == false)
	{
		//Get userinfo from request
		var userInfo = generalConfig.getUserInfo(req);
		if (!userInfo.companyId) {
			return res.json({
				status: 'fail',
				data: null,
				message: 'User information not found'
			});
		}
		else if(!req.body.emailnotification && !req.body.pushnotification && !req.body.smsnotification && !req.body.executeoperation )
		{
			res.json({
				status: 'fail',
				data: null,
				message: 'Please true on any Notification or Execute Operation'
			});
		}
		else
		{
			var companyId = userInfo.companyId;

			var isValidRule = false;
			//req.body.condition = req.body.condition == '1' ? true : false;
			//req.body.allTrue = req.body.allTrue == '1' ? true : false;
			//req.body.executeoperationcommand = req.body.executeoperation == '1' ? req.body.executeoperationcommand : null;
			
			/* Time Frequency Setting : Start */
			var dwelltime = null;
			var dwelltimestring = null;
			var dwelltimeUnit = ['minute', 'hour', 'day'];
			var dwelltimeCoversion = {'minute':60000, 'hour':3.6e+6, 'day':8.64e+7 };

				if(req.body.dwelltime){
					req.body.dwelltime = req.body.dwelltime.trim();
				}

				if(req.body.dwelltimeunit){
					req.body.dwelltimeunit = req.body.dwelltimeunit.trim();
				}

				if(dwelltimeUnit.indexOf(req.body.dwelltimeunit) == -1){
					return res.json({
						status: 'fail',
						data: null,
						message: "Dwelltime Unit should be in 'minute', 'hour' or 'day'"
					});
				}

				dwelltime = req.body.dwelltime * dwelltimeCoversion[req.body.dwelltimeunit];
				dwelltimestring = req.body.dwelltimeunit + " " +req.body.dwelltime;
			/* Time Frequency Setting : End */

			// Query String Validation
			var queryStringVal = '';
			if(req.body.ruletype == '2')
			{
				queryStringVal = req.body.querystring;
			}

			// Get Company CPID
			commonLib.getCPIDFromCompanyID(companyId, function(cpid_callback){
				if(cpid_callback.status == 'fail')
				{
					return res.json({
						status: 'fail',
						data: null,
						message: "CPID has not been found so Rule registered Process has not been completed successfully"
					});
				}
				else
				{
					var company_cpid = cpid_callback.data; // Company CPID

					/* Register Rule : Start */
					var ruleDataObj = [];
						ruleDataObj = { 
								 //alltrue : req.body.allTrue,
								 company_id: companyId,
								 //condition: req.body.condition,
								 ctodtopic: 'c2d'+company_cpid+'topic',
								 description: req.body.description,
								 dwelltime: req.body.dwelltime,
								 dwelltimestring: req.body.dwelltimeunit,
								 email_notification: req.body.emailnotification,
								 push_notification: req.body.pushnotification,
								 sms_notification: req.body.smsnotification,
								 execute_operation: req.body.executeoperation,
								 company_command_id: req.body.executeoperationcommand,
								 name: req.body.name,
								 //thing_id: req.body.thingId,
								 device_group_id: req.body.groupId,
								 rules_type: req.body.ruletype.toString(),
								 query_string: queryStringVal,
								 email_template: req.body.emailtemplate,
								 email_subject_template: req.body.emailtemplatesubject,
								 push_template: req.body.pushtemplate,
								 sms_template: req.body.smstemplate,
								 severity: req.body.severity
							   };
					
				  db.models.rule.create(ruleDataObj).then(function(rule) {
					if(rule)
					{
						var getRuleData = rule.dataValues; /* Latest register rule details */
						var getRuleID = getRuleData.id; /* Latest register rule id */

						/* WaterFall Start */
						async.waterfall([
							function(callback_wf) { // 1. Rule Condition ( Attribute & Sub-Attribute ) Registration
								
								// Rule Option Attribute/Sub-Attribute Add/Update
								ruleDetailsOptions(getRuleID, companyId, req.body.rules, req.body.ruleSubAttr, req.body.ruletype.toString(), function(callback_attr){
									if(callback_attr.status == 'fail')
									{
										callback_wf(callback_attr.message)
									}
									else
									{
										callback_wf(null);
									}
								})
								
							},
							function(callback_wf) { // 2. AWS Notification Topic & User Subcription(s)
								
								/* AWS SNS Subscription functionality : Start */
								commonLib.getCompanyInfoById(companyId, function(companyResponse){
										if(companyResponse.status != 'fail') /* Success */
										{
											var companyInfo = companyResponse.data; /* Company all information */
											var companyName = companyInfo.name; /* Company Name */
											
											var ruleName = req.body.name; /* Rule Name */
											var awsTopicName = companyName+'_topic_'+ruleName+'_'+ Math.random().toString(36).slice(-10);
											awsTopicName = awsTopicName.replace(/[^A-Za-z0-9_-]+/ig, "_"); /* Topic Name */

											/* Create Topic : Start */
											awsIotConnect.awsCreateTopicAndUpdatRule(awsTopicName, getRuleID, function(awsTopicResponse){
														//console.log(awsTopicResponse);
														if(awsTopicResponse.status == 'success')
														{
															var topicArn = awsTopicResponse.data;
															/* Subscription functionality : Start */
															var errorFileName = getRuleID +'_'+ Math.random().toString(36).slice(-5) + '.txt';
															var error_file_path = settings.filesPath.ruleErrorLog +'/'+ errorFileName;
															awsCommonSubscription(getRuleID, error_file_path, companyId, topicArn, req.body.emailnotification, req.body.groups, req.body.pushnotification, req.body.pushgroups, req.body.smsnotification, req.body.smsgroups, function(awsSubscriptionRepsonse){
																	if(awsSubscriptionRepsonse.status == 'success')
																	{
																		/* mqtt Call functional */

																		generalConfig.mqttPublishMessage(companyId);
																		/*var  msg = ({
																					status: 'success',
																					data: null,
																					message: awsSubscriptionRepsonse.message
																				});*/
																		var  msg = ({
																						status: 'success',
																						data: null,
																						message: 'Rule has been registered successfully'
																					});
																		callback_wf(msg); // WaterFall Callback
																	}
																	else
																	{
																		var  msg = ({
																					status: 'fail',
																					data: null,
																					message: awsSubscriptionRepsonse.message
																				});
																		callback_wf(msg); // WaterFall Callback
																	}
															})
															/* Subscription functionality : End */
														}
														else /* Fail */
														{
															var  msg = ({
																	status: 'fail',
																	data: null,
																	message: awsTopicResponse.message
																});
															callback_wf(msg); // Cut WaterFlow
														}
											})
											/* Create Topic : End */
										}
										else /* Fail */
										{
											var  msg = ({
													status: 'fail',
													data: null,
													message: companyResponse.message
												});
					                        callback_wf(msg); // Cut WaterFlow
										}
								})
								/* AWS SNS Subscription functionality : End */
							}
						], function(err, data) { // Final WaterFall Callback
					          return res.json(err);
						})
						/* WaterFall End */
					}
					else
					{
						return res.json({
							status: 'fail',
							data: null,
							message: 'Rule has not been registered successfully'
						});
					}
				 }).catch(function(err) {
						return res.json({
								status: 'fail',
								data: null,
								message: 'Rule has not been registered successfully'
						 });
				 });
		 		}
			}); // Get Company CPID
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

/*
 * @author : GK
 * AWS subscription functionality for Rule
 * Subscription functionality for Email, Push notification, SMS
 * @param : ruleId : Rule Id
 * @param : errorFilePath : File path for write error log
 * @param : companyId : Company Id
 * @param : topicArn : Topic Arn
 * @param : emailStatus : Email notification active/deactive status
 * @param : emailGroupIdList : selected group array of Email notification ( Json )
 * @param : pushStatus : Push notification active/deactive status
 * @param : pushGroupList : selected group array of Push notification ( Json )
 * @param : smsStatus : SMS notification active/deactive status
 * @param : smsGroupList : selected group array of SMS notification ( Json )
 */

var awsCommonSubscription = function awsCommonSubscription(ruleId, errorFilePath, companyId, topicArn, emailStatus, emailGroupIdList, pushStatus, pushGroupList, smsStatus, smsGroupList, callback)
{
	async.series([
		  // Email subscription functionality
		  function(callbackSubscription){
		    
		  		if(emailStatus == true) /* Email notification enable */
				{
					/* Email Subscriprion : Start */
					awsIotConnect.awsGroupRegistration( ruleId, topicArn, emailGroupIdList, '1', function(emailGroupResponse){
							var groupId = emailGroupResponse.data;
							if(groupId.length > 0)
							{
								awsIotConnect.awsEmailUserSubscriptionByGroupId( groupId, companyId, ruleId, topicArn, errorFilePath, function(emailSubscription){
										if(emailSubscription.status == 'success') /* Process complete successfullly */
										{
											/* Change Unsubscribe group status : Start */
											awsIotConnect.awsUnsubscriptionGroupStatus( emailGroupIdList, companyId, ruleId, topicArn, '1', function(statusChangeUnsubscription){
												if(statusChangeUnsubscription.status == 'success')
												{	
													/* Unsubscribe group user : Start */
													awsIotConnect.awsUnsubscriptionOfEmailGroup( companyId, ruleId, topicArn, errorFilePath, function(emailUnsubscription){
														if(emailUnsubscription.status == 'success')
														{
															/* AWS resubscription functionality : start */
															awsIotConnect.awsResubscriptionProcessOfPendingUser(groupId, companyId, ruleId, topicArn, errorFilePath, function(resubscriptioncallBack){
																	if(resubscriptioncallBack.status == 'success') //  Success
																	{
																		callbackSubscription(null, null);
																	}
																	else // Not Success
																	{
																		callbackSubscription(resubscriptioncallBack.message, null);
																	}
																})
															/* AWS resubscription functionality : End */
														}
														else
														{
															callbackSubscription(emailUnsubscription.message, null);
														}
													})
													/* Unsubscribe group user : End */
												}
												else
												{
													callbackSubscription(statusChangeUnsubscription.message, null);
												}
											})
											/* Change Unsubscribe group status : End */
										}
										else /* Process not complete successfullly */
										{
											callbackSubscription(emailSubscription.message, null);
										}
								});
							}
							else
							{
								/* Change Unsubscribe group status : Start */
								awsIotConnect.awsUnsubscriptionGroupStatus( emailGroupIdList, companyId, ruleId, topicArn, '1', function(statusChangeUnsubscription){
									if(statusChangeUnsubscription.status == 'success')
									{	
										/* Unsubscribe group user : Start */
										awsIotConnect.awsUnsubscriptionOfEmailGroup( companyId, ruleId, topicArn, errorFilePath, function(emailUnsubscription){
											if(emailUnsubscription.status == 'success')
											{
												/* AWS resubscription functionality : start */
												var groupId = ['null'];
												awsIotConnect.awsResubscriptionProcessOfPendingUser(groupId, companyId, ruleId, topicArn, errorFilePath, function(resubscriptioncallBack){
														if(resubscriptioncallBack.status == 'success') //  Success
														{
															callbackSubscription(null, null);
														}
														else // Not Success
														{
															callbackSubscription(resubscriptioncallBack.message, null);
														}
													})
												/* AWS resubscription functionality : End */
											}
											else
											{
												callbackSubscription(emailUnsubscription.message, null);
											}
										})
										/* Unsubscribe group user : End */
									}
									else
									{
										callbackSubscription(statusChangeUnsubscription.message, null);
									}
								});
								/* Change Unsubscribe group status : End */
							}
					})
					/* Email Subscriprion : Start */
				}
				else /* Email notification not enable */
				{
					/* unsubscribe all */
					/* Change Unsubscribe all group stataus : Start */
						awsIotConnect.awsAllGroupStatusChangeByRuleId( companyId, ruleId, topicArn, '1', function(statusChangeUnsubscription){
							if(statusChangeUnsubscription.status == 'success')
							{	
								/* Unsubscribe group user : Start */
								awsIotConnect.awsUnsubscriptionOfEmailGroup( companyId, ruleId, topicArn, errorFilePath, function(emailUnsubscription){
									if(emailUnsubscription.status == 'success')
									{
										callbackSubscription(null, null);				
									}
									else
									{
										callbackSubscription(emailUnsubscription.message, null);
									}
								})
								/* Unsubscribe group user : End */
							}
							else
							{
								callbackSubscription(statusChangeUnsubscription.message, null);
							}
						});
					/* Change Unsubscribe all group stataus : End */	
				}
		  },
		  // Push subscription functionality
		  function(callbackSubscription){
			    if(pushStatus == true) /* Push notification enable */
				{
					/* get Setting Data : start */
					awsIotConnect.awsGetApplicationData(companyId, function(settingResponse){
							if(settingResponse.status == 'success')
							{
								var settingData = settingResponse.data;
								
								// IOS
								var iOSData = settingData.ios_aws_app_data;
								var iOSapplicationName = '';
								var iOSApplicationArn = '';
								if(iOSData != null)
								{
									iOSData = JSON.parse(iOSData);
									iOSapplicationName = iOSData.iotAppleAppName; /* IOS application Name */
									iOSApplicationArn = iOSData.appAwsArn; /* IOS application ARN */
								}

								// Android
								var androidData = settingData.android_aws_app_data;
								var androidApplicationName = '';
								var androidApplicationArn = '';
								if(androidData != null) // Android not null
								{
									androidData = JSON.parse(androidData);
									androidApplicationName = androidData.iotAndroidAppName; /* Android application Name */
									androidApplicationArn = androidData.appAwsArn; /* Android application ARN */
								}

								/* Push notification group registration : Start */
									awsIotConnect.awsGroupRegistration( ruleId, topicArn, pushGroupList, '2', function(pushGroupResponse){
											var groupId = pushGroupResponse.data; /* Register group Id(s) list */
											if(groupId.length > 0) /* New group found more then zero */
											{
												/* Subscription funcitonality : Start */
												awsIotConnect.awsPushUserSubscriptionByGroupId(groupId, companyId, ruleId, topicArn, errorFilePath, iOSApplicationArn, androidApplicationArn, function(pushSubscriptionResponse){
														/* Check Unsubscription and if Yes then unsubscribe from list : Start */
														if(pushSubscriptionResponse.status == 'success')
														{
															awsIotConnect.awsUnsubscriptionGroupStatus( pushGroupList, companyId, ruleId, topicArn, '2', function(statusChangeUnsubscription){
																	if(statusChangeUnsubscription.status == 'success')
																	{	
																		/* Unsubscribe group user : Start */
																		awsIotConnect.awsUnsubscriptionOfPushGroup( companyId, ruleId, topicArn, errorFilePath, function(pushUnsubscription){
																			if(pushUnsubscription.status == 'success')
																			{
																				callbackSubscription(null, null);															
																			}
																			else
																			{
																				callbackSubscription(pushUnsubscription.message, null);
																			}
																		})
																		/* Unsubscribe group user : End */
																	}
																	else
																	{
																		callbackSubscription(statusChangeUnsubscription.message, null);
																	}
															})
														}
														else
														{
															callbackSubscription(pushSubscriptionResponse.message, null);
														}
														/* Check Unsubscription and if Yes then unsubscribe from list : End */
												})
												/* Subscription funcitonality : End */
											}
											else /* Not new group found */
											{
												/* Check Unsubscription and if Yes then unsubscribe from list : Start */
												awsIotConnect.awsUnsubscriptionGroupStatus( pushGroupList, companyId, ruleId, topicArn, '2', function(statusChangeUnsubscription){
															if(statusChangeUnsubscription.status == 'success')
															{	
																/* Unsubscribe group user : Start */
																awsIotConnect.awsUnsubscriptionOfPushGroup( companyId, ruleId, topicArn, errorFilePath, function(pushUnsubscription){
																	if(pushUnsubscription.status == 'success')
																	{
																		callbackSubscription(null, null);															
																	}
																	else
																	{
																		callbackSubscription(pushUnsubscription.message, null);
																	}
																})
																/* Unsubscribe group user : End */
															}
															else
															{
																callbackSubscription(statusChangeUnsubscription.message, null);
															}
												})
												/* Check Unsubscription and if Yes then unsubscribe from list : End */
											}
									});
								/* Push notification group registration : End */	
							}
							else
							{
								callbackSubscription(settingResponse.message, null);
							}
					})
					/* get Setting Data : End */
				}
				else /* Push notification not enable */
				{
					/* Unsubscription all group : Start */
					/* Change Unsubscribe all group stataus : Start */
						awsIotConnect.awsAllGroupStatusChangeByRuleId( companyId, ruleId, topicArn, '2', function(statusChangeUnsubscription){
							if(statusChangeUnsubscription.status == 'success')
							{
								/* Unsubscribe group user : Start */
								awsIotConnect.awsUnsubscriptionOfPushGroup( companyId, ruleId, topicArn, errorFilePath, function(pushUnsubscription){
									if(pushUnsubscription.status == 'success')
									{
										callbackSubscription(null, null);															
									}
									else
									{
										callbackSubscription(pushUnsubscription.message, null);
									}
								})
								/* Unsubscribe group user : End */
							}
							else
							{
								callbackSubscription(statusChangeUnsubscription.message, null);
							}
						});
					/* Change Unsubscribe all group stataus : End */
					/* Unsubscription all group : End */
				}
		  	},
		  // SMS subscription functionality
		  function(callbackSubscription){
		  	
			    // *** SMS Notification ***
			    if(smsStatus == true) /* SMS notification enable */
				{
					/* SMS Subscriprion: Start */
						// SMS Group Registration
					awsIotConnect.awsGroupRegistration( ruleId, topicArn, smsGroupList, '3', function(smsGroupResponse){
							var groupId = smsGroupResponse.data;
							if(groupId.length > 0) // Group found 
							{
									// User Subscription By User Group
								awsIotConnect.awsUserSMSSubscriptionByGroupId( groupId, companyId, ruleId, topicArn, errorFilePath, function(smsSubscription){

									if(smsSubscription.status == 'success') // Subscription Process success
									{
										/* Change Unsubscribe group status : Start */
											awsIotConnect.awsUnsubscriptionGroupStatus( smsGroupList, companyId, ruleId, topicArn, '3', function(statusChangeUnsubscription){
												if(statusChangeUnsubscription.status == 'success')
												{
													/* SMS Unsubscribe user group: Start */
													awsIotConnect.awsUnsubscriptionOfSMSGroup( companyId, ruleId, topicArn, errorFilePath, function(smsUnsubscription){
														if(smsUnsubscription.status == 'success') // Success
														{
															callbackSubscription(null, null);
														}
														else  // Fail
														{
															callbackSubscription(smsUnsubscription.message, null);
														}
													})
													/* SMS Unsubscribe user group: End */	
												}
												else
												{
													callbackSubscription(statusChangeUnsubscription.message, null);
												}
											})
										/* Change Unsubscribe group status : End */
									}
									else // Subscription Process not success
									{
										callbackSubscription(smsSubscription.message, null);
									}
								})
							}
							else // Zero Group found
							{
								/* Change Unsubscribe group status : Start */
									awsIotConnect.awsUnsubscriptionGroupStatus( smsGroupList, companyId, ruleId, topicArn, '3', function(statusChangeUnsubscription){
										if(statusChangeUnsubscription.status == 'success')
										{
											/* SMS Unsubscribe user group: Start */
											awsIotConnect.awsUnsubscriptionOfSMSGroup( companyId, ruleId, topicArn, errorFilePath, function(smsUnsubscription){
												if(smsUnsubscription.status == 'success') // Success
												{
													callbackSubscription(null, null);
												}
												else  // Fail
												{
													callbackSubscription(smsUnsubscription.message, null);
												}
											})
											/* SMS Unsubscribe user group: End */	
										}
										else
										{
											callbackSubscription(statusChangeUnsubscription.message, null);
										}
									})
								/* Change Unsubscribe group status : End */
							}
						})
					/* SMS Subscriprion: End */	
				}
				else /* SMS notification not enable */
				{
					/* Unsubscribe All */
					/* Unsubscribe all group, so change status of all groups : Start */
						awsIotConnect.awsAllGroupStatusChangeByRuleId( companyId, ruleId, topicArn, '3', function(statusChangeUnsubscription){
							if(statusChangeUnsubscription.status == 'success')
							{
								/* SMS Unsubscribe user group: Start */
									awsIotConnect.awsUnsubscriptionOfSMSGroup( companyId, ruleId, topicArn, errorFilePath, function(smsUnsubscription){
										if(smsUnsubscription.status == 'success') // Success
										{
											callbackSubscription(null, null);
										}
										else  // Fail
										{
											callbackSubscription(smsUnsubscription.message, null);
										}
									})
								/* SMS Unsubscribe user group: End */	
							}
							else
							{
								callbackSubscription(statusChangeUnsubscription.message, null);
							}
						});
					/* Unsubscribe all group, so change status of all groups : End */	
				}
			}
		  ],
		  // Final Call function
		  function(err, results){
			if(err)
			{
			   return callback({status: 'fail' , data: null, message: err});
			}
			else
			{
			   return callback({status: 'success' , data: null, message: 'Notification subscription successfully completed.'});
			}
		  }
		)
}


/**
 * @author: GK
 * Update Rule and AWS user subscription for Notification
 */
exports.updateRule = function(req, res, next) {

	var ruleId = req.params.id || null;

	if (!ruleId) {
		return res.json({
			status: 'fail',
			data: null,
			message: 'Unknown Rule record, please select valid Rule record'
		});
	}

	if (req.body != '')
	{
		req.checkBody('name', 'Name required').notEmpty();
		req.checkBody('groupId', 'Group required').notEmpty();
		//req.checkBody('thingId', 'Thing required').notEmpty();
		//req.checkBody('condition', 'Condition required').notEmpty();
		req.checkBody('ruletype', 'Rule Type required').notEmpty();
		req.checkBody('dwelltimeunit', 'Dwelltimeunit required').notEmpty();
		req.checkBody('severity', 'Severity required').notEmpty();
		req.checkBody('dwelltime', 'Dwelltime required').notEmpty().isInt();
		
		req.sanitizeBody('emailnotification').toBoolean();
		req.sanitizeBody('pushnotification').toBoolean();
		req.sanitizeBody('smsnotification').toBoolean();
		
		// Email Notification
		if (req.body.emailnotification)
		{
			req.checkBody('groups', 'Group required').notEmpty();
			req.checkBody('emailtemplate', 'Email Template required').notEmpty();
			req.checkBody('emailtemplatesubject', 'Email Template Subject required').notEmpty();
		}
		else
		{
			req.body.emailtemplate = null;
			req.body.emailtemplatesubject = null;
			req.body.emailnotification = false;
		}
		
		// Push Notification
		if(req.body.pushnotification)
		{
			req.checkBody('pushgroups', 'Push Notification Group required').notEmpty();
			req.checkBody('pushtemplate', 'Push Template required').notEmpty();
		}
		else
		{
			req.body.pushtemplate = null;
			req.body.pushnotification = false;
		}

		// SMS Notification 
		if(req.body.smsnotification)
		{
			req.checkBody('smsgroups', 'SMS Notification Group required').notEmpty();
			req.checkBody('smstemplate', 'SMS Template required').notEmpty();
		}
		else
		{
			req.body.smstemplate = null;
			req.body.smsnotification = false;
		}

		// Execute Operation
		if(req.body.executeoperation)
		{
			req.checkBody('executeoperationcommand', 'Command required').notEmpty();
		}
		else
		{
			req.body.executeoperation = false;
			req.body.executeoperationcommand = null;
		}

		if(req.body.ruletype == '2')
		{
			req.checkBody('querystring', 'Query string required').notEmpty();
		}
		else if(req.body.ruletype == '1')
		{
			req.checkBody('rules', 'Rules required').notEmpty();
		}
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
				message: 'User information not found'
			});
		}
		else if(!req.body.emailnotification && !req.body.pushnotification && !req.body.smsnotification && !req.body.executeoperation )
		{
			res.json({
				status: 'fail',
				data: null,
				message: 'Please true on any Notification or Execute Operation'
			});
		}
		else
		{
			var companyId = userInfo.companyId;
			//req.body.condition = req.body.condition == '1' ? true : false;
			//req.body.allTrue = req.body.allTrue == '1' ? true : false;
			//req.body.executeoperationcommand = req.body.executeoperation == '1' ? req.body.executeoperationcommand : null;

			/* Time Frequency Setting : Start */
			var dwelltime = null;
			var dwelltimestring = null;
			var dwelltimeUnit = ['minute', 'hour', 'day'];
			var dwelltimeCoversion = {'minute':60000, 'hour':3.6e+6, 'day':8.64e+7 };

			if(dwelltimeUnit.indexOf(req.body.dwelltimeunit) == -1)
			{
				return res.json({
					status: 'fail',
					data: null,
					message: "Dwelltime Unit should be in 'minute', 'hour' or 'day'"
				});
			}

			dwelltime = req.body.dwelltime * dwelltimeCoversion[req.body.dwelltimeunit];
			dwelltimestring = req.body.dwelltimeunit + " " +req.body.dwelltime;
			/* Time Frequency Setting : End */

			// Query String Validation
			var queryStringVal = '';
			if(req.body.ruletype == '2')
			{
				queryStringVal = req.body.querystring;
			}

			var ruleDataObj = [];
				ruleDataObj = { 
						 //alltrue : req.body.allTrue,
						 company_id: companyId,
						 //condition: req.body.condition,
						 description: req.body.description,
						 dwelltime: req.body.dwelltime,
						 dwelltimestring: req.body.dwelltimeunit,
						 email_notification: req.body.emailnotification,
						 push_notification: req.body.pushnotification,
						 sms_notification: req.body.smsnotification,
						 execute_operation: req.body.executeoperation,
						 company_command_id: req.body.executeoperationcommand,
						 name: req.body.name,
						 //thing_id: req.body.thingId,
						 device_group_id: req.body.groupId,
						 rules_type: req.body.ruletype.toString(),
						 query_string: queryStringVal,
						 email_template: req.body.emailtemplate,
						 email_subject_template: req.body.emailtemplatesubject,
						 push_template: req.body.pushtemplate,
						 sms_template: req.body.smstemplate,
						 severity: req.body.severity
					   };
			
			/* Update Rule : Start */
			db.models.rule.update( ruleDataObj, {
								   where : { id: ruleId } 
								   }).then(function(rule) {
				if(rule)
				{
					/* WaterFall Start */
					async.waterfall([
						function(callback_wf) { // 1. Rule Condition ( Attribute & Sub-Attribute ) Registration
							
							// Rule Option Attribute/Sub-Attribute Add/Update
							ruleDetailsOptions(ruleId, companyId, req.body.rules, req.body.ruleSubAttr, req.body.ruletype.toString(), function(callback_attr){
								if(callback_attr.status == 'fail')
								{
									callback_wf(callback_attr.message)
								}
								else
								{
									callback_wf(null);
								}
							})

						},
						function(callback_wf) { // 2. AWS Notification Topic & User Subcription(s)
							/* AWS Code: Start */
							var errorFileName = ruleId +'_'+ Math.random().toString(36).slice(-5) + '.txt';
							var error_file_path = settings.filesPath.ruleErrorLog +'/'+ errorFileName;

							awsIotConnect.awsGetTopicArnByRuleId( companyId, ruleId, function(awsTopicRepsonse){
									if(awsTopicRepsonse.status == 'success') /* topic Arn found */
									{
										var topicArn =  awsTopicRepsonse.data;
										awsCommonSubscription(ruleId, error_file_path, companyId, topicArn, req.body.emailnotification, req.body.groups, req.body.pushnotification, req.body.pushgroups, req.body.smsnotification, req.body.smsgroups, function(awsSubscriptionRepsonse){
											if(awsSubscriptionRepsonse.status == 'success')
											{
												/* mqtt Call functional */

												generalConfig.mqttPublishMessage(companyId);
												/*var msg = ({
															status: 'success',
															data: null,
															message: awsSubscriptionRepsonse.message
														});*/
												var msg = ({
															status: 'success',
															data: null,
															message: 'Rule has been updated successfully'
														});
												callback_wf(msg); // WaterFall Callback
											}
											else
											{
												var msg = ({
															status: 'fail',
															data: null,
															message: awsSubscriptionRepsonse.message
														});
												callback_wf(msg); // WaterFall Callback
											}
										});
									}
									else /* topic Arn not found */
									{
										if( awsTopicRepsonse.data == 'topicarnnotfound') /* Register new topic Arn */
										{
											/* AWS SNS Subscription functionality : Start */
											commonLib.getCompanyInfoById(companyId, function(companyResponse){
													if(companyResponse.status != 'fail') /* Success */
													{
														var companyInfo = companyResponse.data; /* Company all information */
														var companyName = companyInfo.name; /* Company Name */
														
														var ruleName = req.body.name; /* Rule Name */
														var awsTopicName = companyName+'_topic_'+ruleName+'_'+ Math.random().toString(36).slice(-10);
														awsTopicName = awsTopicName.replace(/[^A-Za-z0-9_-]+/ig, "_"); /* Topic Name */

														/* Create Topic : Start */
														awsIotConnect.awsCreateTopicAndUpdatRule(awsTopicName, getRuleID, function(awsTopicResponse){
															//console.log(awsTopicResponse);
																	if(awsTopicResponse.status == 'success')
																	{
																		var topicArn = awsTopicResponse.data;
																		/* Subscription functionality : Start */
																		var errorFileName = getRuleID +'_'+ Math.random().toString(36).slice(-5) + '.txt';
																		var error_file_path = settings.filesPath.ruleErrorLog +'/'+ errorFileName;
																		awsCommonSubscription(getRuleID, error_file_path, companyId, topicArn, req.body.emailnotification, req.body.groups, req.body.pushnotification, req.body.pushgroups, req.body.smsnotification, req.body.smsgroups, function(awsSubscriptionRepsonse){
																				if(awsSubscriptionRepsonse.status == 'success')
																				{
																						/* mqtt Call functional */

																						generalConfig.mqttPublishMessage(companyId);
																					/*var msg = ({
																							status: 'success',
																							data: null,
																							message: awsSubscriptionRepsonse.message
																						});*/
																					var msg = ({
																						status: 'success',
																						data: null,
																						message: 'Rule has been updated successfully'
																					});
		
																					callback_wf(msg); // WaterFall Callback
																				}
																				else
																				{
																					var msg = ({
																							status: 'fail',
																							data: null,
																							message: awsSubscriptionRepsonse.message
																						});
																					callback_wf(msg); // WaterFall Callback
																				}
																		})
																		/* Subscription functionality : End */
																	}
																	else /* Fail */
																	{
																		var msg = ({
																					status: 'fail',
																					data: null,
																					message: awsTopicResponse.message
																				});
																		callback_wf(msg); // WaterFall Callback
																	}
														})
														/* Create Topic : End */
													}
													else /* Fail */
													{
														var msg = ({
																	status: 'fail',
																	data: null,
																	message: companyResponse.message
																});
														callback_wf(msg); // WaterFall Callback
													}
											})
											/* AWS SNS Subscription functionality : End */
										}
										else /* Some unknow DB error */
										{
											var msg = ({
														status: 'fail',
														data: null,
														message: 'Rule has not been updated successfully'
													});
											callback_wf(msg); // WaterFall Callback
										}
									}
							})
							/* AWS Code: End */
						}
						], function(err, data) { // Final WaterFall Callback
					          return res.json(err);
						})
				}
				else
				{
					return res.json({
						status: 'fail',
						data: null,
						message: 'Rule has not been updated successfully'
					});
				}
			}).catch(function(err) {
				return res.json({
						status: 'fail',
						data: null,
						message: 'Rule has not been updated successfully'
				 });
			});
			/* Update Rule : End */
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

/*
 * @author : GK
 * Rule Attribute/Sub-Attribute Insert/Update functionality
 * @param : ruleId : Rule Id
 * @param : companyId : Company Id
 * @param : ruleAttribute : Rule Parent Attribute
 * @param : ruleSubAttribute : Rule Parent Sub-Attribute
 * @rulesType : Rule Type : 1 = Options, 2 = Query String 
 */
var ruleDetailsOptions = function ruleDetailsOptions(ruleId, companyId, ruleAttribute, ruleSubAttribute, rulesType, callback)
{
	var listOfAttrIds = ['']; // Define list of sub-attribute array
	// Attribute loop : ForEach(1) Start
	async.forEachSeries(ruleAttribute, function(attr, callback_f1) {

			if(rulesType != '1') // Option Rule Type not selected
			{
				callback_f1(); // Call Parent Loop
			}
			else if(attr.key == null || typeof attr.key === undefined)
			{
				// ignore
				callback_f1(); // Call Parent Loop
			}
			else
			{
				var explodeJson = attr.key.split('___'); // Explode Value of Key
				var tempAttrId = explodeJson[0]; // Template Attribute Id
				var tempAttrName = explodeJson[1]; // Template Attribute Name
				var tempAttrCount = explodeJson[2]; // Template Attribute Count
				var attrOperator = attr.operator; // Template Attribute Operator
				var attrValue = attr.value; // Template Attribute Value
				  if(tempAttrCount > 0) // Sub-Attribute Found
				  {
				  		// Sub-attribute loop : ForEach(2) Start
					 	async.forEachSeries(ruleSubAttribute, function(sub_attr, callback_f2) {
				 			var subExplodeJson = sub_attr.attrNameId.split('___'); // Explode Value of Key
							var subAttrId = subExplodeJson[0]; // Template Sub Attribute Id
							var subAttrName = subExplodeJson[1]; // Template Sub Attribute Name
							var subOperator = sub_attr.sub_operator; // Template Sub Attribute Operator
							var subValue = sub_attr.sub_value; // Template Sub Attribute Value
							if( sub_attr.sub_status && 
								subAttrName != '' && subAttrName != null && typeof subAttrName !== undefined &&
								ruleId != '' && ruleId != null && typeof ruleId !== undefined && 
								subAttrId != '' && subAttrId != null && typeof subAttrId !== undefined && 
								tempAttrId != '' && tempAttrId != null && typeof tempAttrId !== undefined &&
								subOperator != '' && subOperator != null && typeof subOperator !== undefined &&
								subValue != '' && subValue != null && typeof subValue !== undefined
							 )// Check Status & Values
							{
								db.models.rule_detail.findAll({ 
									where: {
										 key: subAttrName,
										 rule_id: ruleId,
										 template_attr_id: subAttrId,
										 template_attr_parent_id: tempAttrId
									   }
								}).then(function(ruleSubAttr) {
									if(ruleSubAttr.length > 0) // Record Found, Update Record
									{
										var ruleDetailsRecord_id = ruleSubAttr[0]['id'];
										var ruleDetailsAttrDataObj = [];
											ruleDetailsAttrDataObj = {
												operator: subOperator,
												value: subValue
										   	};
										   	listOfAttrIds.push(ruleDetailsRecord_id); // add Record Id in Array

										   	// Update Rule-Detail Sub-Attribute 
											db.models.rule_detail.update( ruleDetailsAttrDataObj, {
															where: { id: ruleDetailsRecord_id } 
													}).then(function(rule_attr_update) {
														callback_f2();
											}).catch(function(err) {
												var msg = ({
														status: 'fail',
														data: null,
														message: 'Rule attribute has not been updated successfully'
													});
												callback(msg); // Cut WaterFlow
											});

									}
									else // Record Not Found, Insert new entry
									{
										var ruleDetailsAttrDataObj = [];
											ruleDetailsAttrDataObj = {
													key: subAttrName,
													rule_id: ruleId,
													operator: subOperator,
													value: subValue,
													template_attr_id: subAttrId,
													template_attr_parent_id: tempAttrId
												}
											// Insert Template
		   									db.models.rule_detail.create(ruleDetailsAttrDataObj).then(function(ruleDetailSubAttr) {
												if(ruleDetailSubAttr)
												{
													var insertRecordId = ruleDetailSubAttr.id; // Inserted Record Id
													listOfAttrIds.push(insertRecordId); // add Record Id in Array
													callback_f2();
												}
												else
												{
													var msg = ({
															status: 'fail',
															data: null,
															message: 'Rule attribute has not been updated successfully'
														});
													callback(msg); // Cut WaterFlow
												}
											}).catch(function(err) {
												var msg = ({
														status: 'fail',
														data: null,
														message: 'Rule attribute has not been updated successfully'
													});
												callback(msg); // Cut WaterFlow
											});	
									}
								}).catch(function(err) {
									var msg = ({
											status: 'fail',
											data: null,
											message: 'Rule attribute has not been updated successfully'
										});
									callback(msg); // Cut WaterFlow
							   });
							}
							else
							{
								callback_f2();
							}

					 	}, function() { // ForEach(2) Finish
								callback_f1(); // Call Parent Loop	
						})
				  }
				  else  // Sub-Attribute Not Found
				  {
				  			if( tempAttrName != '' && tempAttrName != null && typeof tempAttrName !== undefined && 
				  				ruleId != '' && ruleId != null && typeof ruleId !== undefined &&
				  				tempAttrId != '' && tempAttrId != null && typeof tempAttrId !== undefined &&
				  				attrOperator != '' && attrOperator != null && typeof attrOperator !== undefined &&
				  				attrValue != '' && attrValue != null && typeof attrValue !== undefined
				  				)
					  		{
					  			db.models.rule_detail.findAll({ 
										where: {
											 key: tempAttrName,
											 rule_id: ruleId,
											 template_attr_id: tempAttrId,
											 template_attr_parent_id: tempAttrId
										   }
									}).then(function(ruleAttr) {
										if(ruleAttr.length > 0) // Record Found, Update Record
										{
											var ruleDetailsRecord_id = ruleAttr[0]['id'];
											var ruleDetailsAttrDataObj = [];
												ruleDetailsAttrDataObj = {
													operator: attrOperator,
													value: attrValue
											   	};
											   	listOfAttrIds.push(ruleDetailsRecord_id); // add Record Id in Array

											   	// Update Rule-Detail Sub-Attribute 
												db.models.rule_detail.update( ruleDetailsAttrDataObj, {
																where: { id: ruleDetailsRecord_id } 
														}).then(function(rule_attr_update) {
															callback_f1();
												}).catch(function(err) {
													var msg = ({
															status: 'fail',
															data: null,
															message: 'Rule attribute has not been updated successfully'
														});
													callback(msg); // Cut WaterFlow
												});
										}
										else // Record not found, Insert new entry
										{
											var ruleDetailsAttrDataObj = [];
											ruleDetailsAttrDataObj = {
													key: tempAttrName,
													rule_id: ruleId,
													operator: attrOperator,
													value: attrValue,
													template_attr_id: tempAttrId,
													template_attr_parent_id: tempAttrId
												}
											// Insert Template
		   									db.models.rule_detail.create(ruleDetailsAttrDataObj).then(function(ruleDetailAttr) {
												if(ruleDetailAttr)
												{
													var insertRecordId = ruleDetailAttr.id; // Inserted Record Id
													listOfAttrIds.push(insertRecordId); // add Record Id in Array
													callback_f1();
												}
												else
												{
													var msg = ({
															status: 'fail',
															data: null,
															message: 'Rule attribute has not been updated successfully'
														});
													callback(msg); // Cut WaterFlow
												}
											}).catch(function(err) {
												var msg = ({
														status: 'fail',
														data: null,
														message: 'Rule attribute has not been updated successfully'
													});
												callback(msg); // Cut WaterFlow
											});
										}
									}).catch(function(err) {
										var msg = ({
												status: 'fail',
												data: null,
												message: 'Rule attribute has not been updated successfully'
											});
										callback(msg); // Cut WaterFlow
									});
							}
							else
							{
								callback_f1();
							}
				  }
			}

	}, function() { // ForEach(1) Finish
			
			// Delete Attribute
			db.models.rule_detail.destroy({
            	where: ["rule_id = ? AND NOT (`id` IN ( ? )) ", ruleId, listOfAttrIds]
            }).then(function (deleletRuleAttr)
		       {
		            
		          callback({
						status: 'success',
						data: null,
						message: 'Rule attribute has been updated successfully'
				  });
		       
		     }).catch(function(err) {
		        callback({
		        	status: 'fail',
		        	data: null,
		        	message: 'Rule attribute has not been updated successfully'
		        });
		     });
	})
}

/**
 * @author: GK
 * Get rule details by Rule ID
 */
exports.getRuleById = function(req, res, next) {

	var id = req.params.id;
	var userInfo = generalConfig.getUserInfo(req);
	if(!id)
	{
		return res.json({
			status: 'fail',
			data: null,
			message: 'Unknown Rule record, please select valid Rule record'
		});
	}
	else if(!userInfo.companyId) // Get userinfo from request
	{
		return res.json({
			status: 'fail',
			data: null,
			message: 'User information not found'
		});
	}
	else
	{
		/* Query Join Rule */
			db.models.rule.hasMany(db.models.rule_detail, {foreignKey: 'rule_id'})
			db.models.rule_detail.belongsTo(db.models.rule, {foreignKey: 'id'})

			db.models.rule.hasMany(db.models.aws_group_subscription, {foreignKey: 'rule_id'})
			db.models.aws_group_subscription.belongsTo(db.models.rule, { foreignKey: 'id' })

			db.models.rule_detail.belongsTo(db.models.template_attr, { foreignKey: 'template_attr_parent_id' })
			/////////
			//db.models.rule.hasOne(db.models.template_attr, { through: db.models.rule_detail, foreignKey: 'template_attr_parent_id' })

			/*m.Book.hasMany(m.Article, {through: 'book_articles'});
			m.rule_detail.hasMany(m.Books, {through: 'book_articles'});*/

			db.models.template_attr.hasOne(db.models.rule_detail, { foreignKey: 'template_attr_parent_id' })

			db.models.rule.findAll( { 
					where: { company_id: userInfo.companyId, id: id },
					include: [ { 
									model: db.models.rule_detail,
									required: false,
									attributes: Object.keys(db.models.rule_detail.attributes).concat([
										            [db.literal('(select concat(id,"___",name,"___",(select count(*) from template_attr where template_attr.parent_attr_id = rule_details.template_attr_parent_id )) from template_attr where template_attr.id = rule_details.template_attr_parent_id)'), 'combine_name'],
										            [db.literal('(select count(*) from template_attr where template_attr.parent_attr_id = rule_details.template_attr_parent_id )'), 'subAttrCount']
										        ],

										        [
													'id',
													'value',
													'operator',
													[ db.models.rule_detail.sequelize.fn("concat", db.models.rule_detail.sequelize.col("rule_details.template_attr_id"), '___', db.models.rule_detail.sequelize.col("rule_details.key")), "key" ]
												]),
									group : 'template_attr_parent_id'
								},
								/*{
									model: db.models.template_attr,
									required: false 
								},*/
							    { 
							    	model: db.models.aws_group_subscription,
							    	attributes: ['company_group_id', 'notification_type'],
							    	required: false 
							    	/*,  where: { notification_type: "1" }*/
							    }
							 ]
					/*,attributes: Object.keys(db.models.rule.attributes).concat([
						[db.literal('(select name from device_group where `device_group`.`id` = `rule`.`device_group_id`)'), 'deviceGroupName']
					])*/
				} ).then(function(rule) {
			if(rule)
			{
				res.json({
					status: "success",
					data: rule,
					message: "Records loaded successfully"
				});
			}
			else
			{
				res.json({
					status: "fail",
					data: null,
					message: "No records found"
				});
			}
		}).catch(function(err) {
			res.json({
				status: "fail",
				data: null,
				message: 'No records found'
			});
		});
	}
};

/**
  * @author: Gunjan
  * Delete(Soft) rule by rule ID
  */
exports.deleteRule = function(req, res, next) {

	var ruleId = req.params.id;
	var userInfo = generalConfig.getUserInfo(req);

	if (!ruleId) {
		return res.json({
			status: 'fail',
			data: null,
			message: 'Unknown Rule record, please select valid Rule record'
		});
	}
	else if (!userInfo.companyId) //Get userinfo from request
	{
		return res.json({
			status: 'fail',
			data: null,
			message: 'User information has not been found'
		});
	}
	else
	{
		/* Error log file */
		var errorFileName = ruleId +'_RemoveRule_'+ Math.random().toString(36).slice(-5) + '.txt';
		var error_file_path = settings.filesPath.ruleErrorLog +'/'+ errorFileName;

		// AWS unsubscription process
		awsIotConnect.removeFullRule(ruleId, userInfo.companyId, error_file_path, function(removeRule){
				var getResponse = removeRule.status; /* Get response */
				if(getResponse == 'success')
				{
					/* Delete(Soft) Rule Data : Start */
					db.models.rule.destroy({where: { id : ruleId }}).then(function (rule_delete)
					{
						if(rule_delete)
						{
							
							var ruleDataObj = [];
								ruleDataObj = { 
										 email_notification: false,
										 push_notification: false,
										 sms_notification: false,
										 execute_operation: false,
										 company_command_id: null,
										 email_template: null,
										 email_subject_template: null,
										 push_template: null,
										 sms_template: null,
										 active: false,
										 topic_arn: null
									   };

								db.models.rule.update( ruleDataObj, {
									   where : { id: ruleId } 
								}).then(function(rule) {
									if(rule)
									{
										//console.log('update done')
									}
									else
									{
										//console.log('update done')
									}
								}).catch(function(err) {
									/*res.json({
										status: 'fail',
										data: null,
										message: 'Rule has not been updated successfully'
									 });*/
								});

							/* mqtt Call refresh functional */
							generalConfig.mqttPublishMessage(userInfo.companyId);
							res.json({
								status: 'success',
								data: null,
								message: 'Rule has been removed successfully'
							});
						}
						else
						{
							res.json({
								status: 'fail',
								data: null,
								message: 'Rule has not been removed successfully'
							});
						}
					})
					/* Delete(Soft) Rule Data : End */
				}
				else /* Fail */
				{
					res.json({
						status: 'fail',
						data: null,
						message: removeRule.message
					});
				}
		})
	}
};

/**
 * all rules
 **/

exports.getRules = function(req, res, next) {
	//Get userinfo from request
	var userInfo = generalConfig.getUserInfo(req);

	if (!userInfo.companyId)
	{
		return res.json({
			status: 'fail',
			message: 'Unknown user'
		});
	}
	else
	{
		/* Get all rules */
		db.models.rule.findAll( { where: { company_id: userInfo.companyId } } ).then(function(rules) {
			if(rules)
			{
				res.json({
					status: "success",
					data: rules,
					message: "Data loaded successfully"
				});
			}
			else
			{
				res.json({
					status: "fail",
					data: null,
					message: "Fail to load data"
				});
			}
		}).catch(function(err) {
				res.json({
					status: "fail",
					data: null,
					message: err
				});
		   }); 
	}
};


exports.getDevices = function(req, res, next) {
	//Get userinfo from request
	var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
		res.json({
			status: 'fail',
			message: 'Unknown user'
		});
	}

	var query = 'select id,name from sensor where companyid=' + userInfo.companyId + ' allow filtering;';

	db.client.execute(query, function(err, data) {
		if (err) {
			return res.json({
				status: 'fail'
			});
		}
		res.json(data.rows);
	});
};

/*
 * Rule Controller
 * Get all things for rules
 */
exports.getRuleThings = function(req, res, next) {

	var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
		res.json({
			status: "fail",
			data: null,
			message: 'User information not found'
		});
	}

	db.models.thing.findAll({
							  attributes: ['id', 'serial_number', 'name', 'company_id'],
							  where: ["company_id = ? AND NOT (`thing`.`id` IN (select thing_id from rule)) AND active=1 ", userInfo.companyId]
							}) .then(function(thing)
	{
		if(thing)
		{
			res.json({
				status:"success",
				data: thing,
				message: 'Record found'
			});
		}
		else
		{
			res.json({
				status:"success",
				data: null,
				message: 'No Record Available'
			});
		}
	}).catch(function(err){
		res.json({
			status: "fail",
			data: null,
			message: err
		});
	}); 
};

/*
 * @author: GK
 * Get all company commmand of rules
 */
exports.getRuleCommands = function(req, res, next) {

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
								  attributes: ['id', 'name'],
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


/**
 * @author HY
 * change rule status
 */

exports.changeStatus = function(req, res, next) {

    var id = req.params.id || null;

    if (!id) {
        return res.json({
            status: "fail",
            message: 'Unknown rule'
        });
    }

	var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {

		res.json({
			status: "fail",
			data: null,
			message: 'User information not found'
		});

	}

    if (req.body != "") {
        req.checkBody('activate', 'Activate required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {
        var active = req.body.activate != true ? 0 : 1;
        var rule = {
            active: active
        };

        db.models.rule.update(rule, {
            where:{
                id:id,
            }
         }).then(function(updatedRule){
            if(updatedRule){
				generalConfig.mqttPublishMessage(userInfo.companyId);            	
                res.json({
                    status:'success',
                    message:'Rule has been updated successfully.'
                });
            }else {
                res.json({
                    status: 'fail',
                    message: 'Failed to update rule' + req.params.id
                });
            }

         }).catch(function(err) {
            res.json({
                'status': 'fail',
                error: err,
                message: 'Failed to update rule' + req.params.id
            });
        });
    } else {
        res.json({
            status: "fail",
            message: mappedErrors
        });
    }

};
