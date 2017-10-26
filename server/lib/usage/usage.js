var db = require('../../config/sequelize').db;
var DataTypes = require("sequelize");
var generalConfig = require('../../config/generalConfig');
var async = require('async');
var fs = require('fs-extra');
var shell = require('shelljs');

/* Common function Lib */
var commonLib = require('../common');

/* Cassandra DB */
var cassandra = require('cassandra-driver');
var _ = require('lodash');

/*
 * @author : GK
 * @ Company Usage
 * Update all company's record
 */
var updateAllcompanyData = function updateAllcompanyData(callback)
{
	db.query('SELECT * FROM company where parent_id is null',
		{ type: db.QueryTypes.SELECT }
	).then(function(companyData_resp)
	{
		// Cron Start
		async.forEachSeries(companyData_resp, function(parentCompany, callback_f1) {
				var parent_company_id = parentCompany.id; // Parent Company ID
				if(parent_company_id != '' && parent_company_id != null)
				{
					// add/update parent/child Company Usage
					getParentChildCompanyTotalRecord(parent_company_id, function(parentCompanyProcess_callback){
							if(parentCompanyProcess_callback.status != 'success')
							{
								// Some Error
								callback_f1();
							}
							else
							{
								callback_f1();	
							}
					})
				}
				else
				{
					callback_f1();
				}
		}, function() {
				callback({
					status: 'success',
					data: null,
					message: 'All company record insert/update process has been completed'
				});
		});
		
	}).catch(function(err){
		callback({
			status: 'fail',
			data: err,
			message: 'All company record insert/update process has not been completed'
		});
	});
}

/*
 * @author : GK
 * @ Company Usage
 * Get Details of parent & its child company
 * @param : companyId : Parent Company id
 */
var getParentChildCompanyTotalRecord = function getParentChildCompanyTotalRecord(companyId, callback)
{
	var sms_count = 0; // SMS
	var push_count = 0; // Push
	var email_count = 0; // Email
	var device_count = 0; // Device
	var api_count = 0; // Api
	var mySql_db = 0; // MySql DB Size
	var cassandra_db = 0; // Cassandra DB Size

	// Get company Uses
	companyUses(companyId, function(callback_companyuses){
		if(callback_companyuses.status == 'fail')
		{
			callback({
				status: 'fail',
				data: callback_companyuses.data,
				message: 'Company usage count process has not been completed'
			})
		}
		else
		{
			email_count = parseInt(email_count) + parseInt(callback_companyuses.data.email); // Email
			push_count = parseInt(push_count) + parseInt(callback_companyuses.data.push); // Push
			sms_count = parseInt(sms_count) + parseInt(callback_companyuses.data.sms); // SMS
			device_count = parseInt(device_count) + parseInt(callback_companyuses.data.device); // Device
			api_count = parseInt(api_count) + parseInt(callback_companyuses.data.api_count); // Api Count
			mySql_db = parseFloat(mySql_db) + parseFloat(callback_companyuses.data.mysql_dbSize); // MySql Size
			cassandra_db = parseFloat(cassandra_db) + parseFloat(callback_companyuses.data.cassandra_dbSize); // Cassandra Size

			// Get Child Company Count
			getChildCompanyCount( companyId, function(callback_childCount){
				if(callback_childCount.status == 'fail')
				{
					callback({
		        		status: 'fail',
		        		data: callback_childCount.data,
		        		message: 'Company usage count process has not been completed successfully'
		        	});
				}
				else
				{
					// Add Child count in parent count
					email_count = parseInt(email_count) + parseInt(callback_childCount.data.child_email); // Email
					push_count = parseInt(push_count) + parseInt(callback_childCount.data.child_push); // Push
					sms_count = parseInt(sms_count) + parseInt(callback_childCount.data.child_sms); // SMS
					device_count = parseInt(device_count) + parseInt(callback_childCount.data.child_device); // Device
					api_count = parseInt(api_count) + parseInt(callback_childCount.data.child_api); // Api
					// Note: Parent & Child DB is common, So no need to add.
					
					var count_result = {};
						count_result['email'] = { 'use': email_count, 'total': 2000 };
						count_result['push'] = { 'use': push_count, 'total': 2000 };
						count_result['sms'] = { 'use': sms_count, 'total': 2000 };
						count_result['device'] = { 'use': device_count, 'total': 100 };
						count_result['api'] = { 'use': api_count, 'total': 20000 };
						count_result['db1_s'] = { 'use': mySql_db, 'total': 3221225472 };
						count_result['db2_c'] = { 'use': cassandra_db, 'total': 3221225472 };;

					callback({ 
		        		status: 'success',
		        		data: count_result,
		        		message: 'Company usage count process has been completed successfully'
		        	});
				}
			})
			
		}
	})
}

/*
 * @author : GK
 * @ Company Usage
 * Get Details of child company
 * @param : parent_company_id : Parent Company id
 */
var getChildCompanyCount =  function getChildCompanyCount(parent_company_id, callback)
{
	var sms_count = 0; // SMS
	var push_count = 0; // Push
	var email_count = 0; // Email
	var device_count = 0; // Device
	var api_count = 0; // Api

	db.query('select * from company where parent_id = :parent_company_id',
        	{ replacements: { parent_company_id: parent_company_id }, type: db.QueryTypes.SELECT }
	    ).then(function(companyData)
	    {
	    		// Child Company Loop Start
	    		async.forEachSeries(companyData, function(childCompany, callback_f1) {
    					
    					var getChildCompanyID = childCompany.id;
						// Get Child Company Uses Record
						companyUses(getChildCompanyID, function(callback_companyuses){
							
							if(callback_companyuses.status == 'fail')
							{
								callback({
									status: 'fail',
									data: callback_companyuses.data,
									message: 'Child Company usage count process has not been completed'
								})
							}
							else
							{
								email_count = parseInt(email_count) + parseInt(callback_companyuses.data.email); // Email
								push_count = parseInt(push_count) + parseInt(callback_companyuses.data.push); // Push
								sms_count = parseInt(sms_count) + parseInt(callback_companyuses.data.sms); // SMS
								device_count = parseInt(device_count) + parseInt(callback_companyuses.data.device); // Device
								api_count = parseInt(api_count) + parseInt(callback_companyuses.data.api_count); // Device

								callback_f1();
							}
						})						    					

    			}, function() {
                      // Child Company Loop End
                      	var result = {};
                      	result['child_email'] = email_count;
                      	result['child_push'] = push_count;
                      	result['child_sms'] = sms_count;
                      	result['child_device'] = device_count;
                      	result['child_api'] = api_count;

               		  	callback({
			        		status: 'success',
			        		data: result,
			        		message: 'Child company usage count process has not been completed successfully'
			        	});       
                });

	    }).catch(function(err){
        	callback({
        		status: 'fail',
        		data: err,
        		message: 'Child company usage count process has not been completed successfully'
        	});
    	});

}

/*
 * @author : GK
 * @ Company Usage
 * Get count of Company Usage
 * Email Notification Count
 * Push Notification Count
 * SMS Notification Count
 * Registered Active Device Count
 * API request Count ( Count from Cassandra DB )
 * MySql Database Size ( Byte Format )
 * Cassandra Database Size ( Byte Format )
 * @param : company_id : Company id
 */
var companyUses = function companyUses( company_id, callback)
{
	if(company_id)
	{
		var totalCountResult = {};
		async.series([
			
			// Email Count			
			function(callbackProcess){
				
				email_notification_count(company_id, function(callback_emailCount){
					if(callback_emailCount.status != 'fail')
					{
						totalCountResult['email'] = callback_emailCount.data;
						callbackProcess(null, null);
					}
					else
					{

						callbackProcess(callback_emailCount.data, null);
					}
				})
			},

			// Push Count			
			function(callbackProcess){
				
				push_notification_count(company_id, function(callback_pushCount){
					if(callback_pushCount.status != 'fail')
					{
						totalCountResult['push'] = callback_pushCount.data;
						callbackProcess(null, null);
					}
					else
					{
						callbackProcess(callback_pushCount.data, null);
					}
				})
			},

			// SMS Count			
			function(callbackProcess){
				
				sms_notification_count(company_id, function(callback_smsCount){
					if(callback_smsCount.status != 'fail')
					{
						totalCountResult['sms'] = callback_smsCount.data;
						callbackProcess(null, null);
					}
					else
					{
						callbackProcess(callback_smsCount.data, null);
					}
				})
			},

			// Device ( Thing ) Count			
			function(callbackProcess){
				
				device_count(company_id, function(callback_deviceCount){
					if(callback_deviceCount.status != 'fail')
					{
						totalCountResult['device'] = callback_deviceCount.data;
						callbackProcess(null, null);
					}
					else
					{
						callbackProcess(callback_deviceCount.data, null);
					}
				})
			},

			// Request API Count
			function(callbackProcess){
				
				request_api_countV2(company_id, function(callback_apiCount){
					if(callback_apiCount.status != 'fail')
					{
						totalCountResult['api_count'] = callback_apiCount.data;
						callbackProcess(null, null);
					}
					else
					{
						callbackProcess(callback_apiCount.data, null);
					}
				})
			},

			// MySql DB Size
			function(callbackProcess){
				mysql_db_size(company_id, function(callback_mySqldbSize){
					if(callback_mySqldbSize.status != 'fail')
					{
						totalCountResult['mysql_dbSize'] = callback_mySqldbSize.data;
						callbackProcess(null, null);
					}
					else
					{
						callbackProcess(callback_mySqldbSize.data, null);
					}
				})
			},

			// Cassandra DB Size
			function(callbackProcess){
				cassandra_db_size(company_id, function(callback_cassandraDbSize){
					if(callback_cassandraDbSize.status != 'fail')
					{
						totalCountResult['cassandra_dbSize'] = callback_cassandraDbSize.data;
						callbackProcess(null, null);
					}
					else
					{
						callbackProcess(callback_cassandraDbSize.data, null);
					}
				})
			}

		],
	    /* All process Finish */
	  	function(err, results){
	  		if(err)
	  		{
	  			callback({
	  				status: 'fail',
	  				data: err,
	  				message: 'Company usage count process has not been completed'
	  			})
	  		}
	  		else
	  		{
	  			var getEmailCount = totalCountResult.email;
	  			var getPushCount = totalCountResult.push;
	  			var getSmsCount = totalCountResult.sms;
	  			var getDeviceCount = totalCountResult.device;
	  			var getApiCount = totalCountResult.api_count;
	  			var getMySqlSize = totalCountResult.mysql_dbSize;
	  			var getCassandraSize = totalCountResult.cassandra_dbSize;

				// Update count record	  			
	  			updateCompanyUsesCount( company_id, getEmailCount, getPushCount, getSmsCount, getDeviceCount, getApiCount, getMySqlSize, getCassandraSize, function(callback_updateCountRecord){
	  					if(callback_updateCountRecord.status == 'fail')
	  					{
	  						callback({
				  				status: 'fail',
				  				data: callback_updateCountRecord.data,
				  				message: 'Company usage count process has not been completed'
				  			})
	  					}
	  					else
	  					{
	  						callback({
				  				status: 'success',
				  				data: totalCountResult,
				  				message: 'Company usage count process has been completed'
				  			})
	  					}
	  			})

	  		}
	  	})
	}
	else
	{
		callback({
				status: 'fail',
				data: null,
				message: 'Company id not found'
		})
	}
}

/*
 * @author : GK
 * @ Company Usage
 * Get count of Email Notification
 * @param : company_id : Company id
 */
var email_notification_count = function email_notification_count( company_id, callback)
{
	if(company_id)
	{
		db.query('select * from notification_log where company_id= :company_id and email_notification = "1"',
        	{ replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
	    ).then(function(emailCountData)
	    {
	    	var email_count = emailCountData.length; // Get Email Count
	    	callback({
        			status: 'success',
        			data: email_count,
        			message: 'Email usage count process has been completed successfully'
        		});

	    }).catch(function(err){
        	callback({
        			status: 'fail',
        			data: err,
        			message: 'Email usage count process has not been completed successfully'
        		});
    	});
	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Company id not found'
		})
	}
}

/*
 * @author : GK
 * @ Company Usage
 * Get count of Push Notification
 * @param : company_id : Company id
 */
var push_notification_count = function push_notification_count( company_id, callback)
{
	if(company_id)
	{
		db.query('select * from notification_log where company_id= :company_id and push_notification = "1"',
        	{ replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
	    ).then(function(pushCountData)
	    {
	    	var push_count = pushCountData.length; // Get Push Count
	    	callback({
        			status: 'success',
        			data: push_count,
        			message: 'Push usage count process has been completed successfully'
        		});

	    }).catch(function(err){
        	callback({
        			status: 'fail',
        			data: err,
        			message: 'Push usage count process has not been completed successfully'
        		});
    	});
	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Company id not found'
		})
	}
}

/*
 * @author : GK
 * @ Company Usage
 * Get count of SMS Notification
 * @param : company_id : Company id
 */
var sms_notification_count = function sms_notification_count( company_id, callback)
{
	if(company_id)
	{
		db.query('select * from notification_log where company_id= :company_id and sms_notification = "1"',
        	{ replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
	    ).then(function(smsCountData)
	    {
	    	var sms_count = smsCountData.length; // Get SMS Count
	    	callback({
        			status: 'success',
        			data: sms_count,
        			message: 'SMS usage count process has been completed successfully'
        		});

	    }).catch(function(err){
        	callback({
        			status: 'fail',
        			data: err,
        			message: 'SMS usage count process has not been completed successfully'
        		});
    	});
	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Company id not found'
		})
	}
}

/*
 * @author : GK
 * @ Company Usage
 * Get count of Registered Active Device Count
 * @param : company_id : Company id
 */
var device_count = function device_count( company_id, callback)
{
	if(company_id)
	{
		db.query('select * from thing where company_id = :company_id and active = "1"',
        	{ replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
	    ).then(function(deviceCountData)
	    {
	    	var device_count = deviceCountData.length; // Get Device Count
	    	callback({
        			status: 'success',
        			data: device_count,
        			message: 'Device count process has been completed successfully'
        		});

	    }).catch(function(err){
        	callback({
        			status: 'fail',
        			data: err,
        			message: 'Device count process has not been completed successfully'
        		});
    	});
	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Company id not found'
		})
	}
}

/*
 * @author : GK
 * @ Company Usage
 * Get count of API Request
 * Count form cassandra Database
 * @param : company_id : Company id
 */
var request_api_count = function request_api_count( company_id, callback)
{
	if(company_id)
	{
		db.query('select * from company where id = :company_id',
        	{ replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
	    ).then(function(companyData)
	    {
	    	if(companyData)
	    	{
	    		var db_name = companyData[0].database_name;
	    		if(db_name)
	    		{
	    			// Cassandra DB Connection
	    			var cas_options = {
					    contactPoints: [settings.cassandraContactPoint],
					    keyspace: db_name,
					    authProvider: new cassandra.auth.PlainTextAuthProvider(settings.cassandraContactDBUserName, settings.cassandraContactDBPassword)
					};
					var cas_client = new cassandra.Client(cas_options);
					
					
					  /*cas_client.connect(function(err, result) {
					  });*/
					
					// Cassandra Query

					var cas_query = 'select companyid from sensordatav3 where companyid='+company_id;

	    			cas_client.execute(cas_query, function(cas_err, cas_data) {

            			cas_client.shutdown();	
            			    				
						if(cas_err) // Error
						{
							callback({
			        			status: 'fail',
			        			data: cas_err,
			        			message: 'Company sensor database has not been Connected'
			        		});
						}
						else
						{
							// Result
							var total_record_count = cas_data.rows.length; // Sensor Record Count
							//cas_client.shutdown();

							callback({
			        			status: 'success',
			        			data: total_record_count,
			        			message: 'Api count process has been completed successfully'
			        		});
		        		}
					});
	    		
	    		}
	    		else
	    		{
	    			callback({
	        			status: 'success',
	        			data: null,
	        			message: 'Company sensor database name has not been found'
	        		});
	    		}
	    	}
	    	else
	    	{
	    		callback({
        			status: 'fail',
        			data: null,
        			message: 'Company information has not been found'
        		});
	    	}

	    }).catch(function(err){
        	callback({
        			status: 'fail',
        			data: err,
        			message: 'Company information has not been found'
        		});
    	});
	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Company id not found'
		})
	}
}

/*
 * @author : GK
 * @edited : HY
 * @ Company Usage
 * Get count of API Request
 * Count form cassandra Database table apilog
 * @param : company_id : Company id
 */
var request_api_countV2 = function( company_id, callback)
{
	if(company_id)
	{
		db.query('select * from company where id = :company_id',
        	{ replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
	    ).then(function(companyData)
	    {
	    	if(companyData)
	    	{
	    		var db_name = companyData[0].database_name;
	    		if(db_name)
	    		{
	    			// Cassandra DB Connection
	    			var cas_options = {
					    contactPoints: [settings.cassandraContactPoint],
					    keyspace: db_name,
					    authProvider: new cassandra.auth.PlainTextAuthProvider(settings.cassandraContactDBUserName, settings.cassandraContactDBPassword)
					};
					var cas_client = new cassandra.Client(cas_options);
					
					
					  /*cas_client.connect(function(err, result) {
					  });*/
					
					// Cassandra Query
					//var cas_query = 'select companyid from sensordatav3 where companyid='+company_id;
					var cas_query = 'select sum(datasize) as totaldatasize from apiLog where companyid='+company_id;


	    			cas_client.execute(cas_query, function(cas_err, cas_data) {

            			cas_client.shutdown();	
            			    				
						if(cas_err) // Error
						{
							callback({
			        			status: 'fail',
			        			data: cas_err,
			        			message: 'Company sensor database has not been Connected'
			        		});
						}
						else
						{
							// Result
							//var total_record_count = cas_data.rows.length; // Sensor Record Count
							var total_record_count = cas_data.rows[0].totaldatasize; // API Request log datasize sum
							//cas_client.shutdown();

							callback({
			        			status: 'success',
			        			data: total_record_count,
			        			message: 'Api count process has been completed successfully'
			        		});
		        		}
					});
	    		
	    		}
	    		else
	    		{
	    			callback({
	        			status: 'success',
	        			data: null,
	        			message: 'Company sensor database name has not been found'
	        		});
	    		}
	    	}
	    	else
	    	{
	    		callback({
        			status: 'fail',
        			data: null,
        			message: 'Company information has not been found'
        		});
	    	}

	    }).catch(function(err){
        	callback({
        			status: 'fail',
        			data: err,
        			message: 'Company information has not been found'
        		});
    	});
	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Company id not found'
		})
	}
}

/*
 * @author : GK
 * @ Company Usage
 * Get size of MySql DB ( Byte Format )
 * @param : company_id : Company id
 */
var mysql_db_size = function mysql_db_size( company_id, callback)
{
	if(company_id)
	{
		// Get Company Information
		db.query('select * from company where id = :company_id',
		      	{ replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
			).then(function(companyData)
			{
				if(companyData)
	    		{
	    			var db_name = companyData[0].database_name;
		    		if(db_name)
		    		{
		    			var tableName = 'sensordatav3';
		    			// Get MySql Database Size
		    			db.query('SELECT table_name AS `table_name`, (data_length + index_length) `size_in_byte` FROM information_schema.TABLES WHERE table_schema = :databseName AND table_name = :tableName ',
					      	{ replacements: { tableName: tableName, databseName: db_name }, type: db.QueryTypes.SELECT }
						).then(function(databaseData)
						{
							if(databaseData)
							{	
								var db_table_name = databaseData[0].table_name;
								var db_table_size = databaseData[0].size_in_byte;
								if(db_table_size)
								{
									callback({
										status: 'success',
										data: db_table_size,
										message: 'MySql Databse size process has been completed successfully'
									});
								}
								else
								{
									callback({
					        			status: 'fail',
					        			data: null,
					        			message: 'MySql Databse size information has not been found'
					        		});
								}
							}
							else
							{
								callback({
				        			status: 'fail',
				        			data: null,
				        			message: 'MySql Databse size information has not been found'
				        		});
							}
						
						}).catch(function(err){
				        	callback({
				        		status: 'fail',
				        		data: err,
				        		message: 'MySql Databse size has not been found'
				        	});
				    	});
		    		}
		    		else
		    		{
		    			callback({
		        			status: 'fail',
		        			data: null,
		        			message: 'Company sensor database name has not been found'
		        		});
		    		}
	    		}
	    		else
		    	{
		    		callback({
	        			status: 'fail',
	        			data: null,
	        			message: 'Company information has not been found'
	        		});
		    	}

		}).catch(function(err){
        	callback({
        		status: 'fail',
        		data: err,
        		message: 'Company information has not been found'
        	});
    	});
	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Company id not found'
		})
	}
}

/*
 * @author : GK
 * @ Company Usage
 * Get size of Cassandra DB ( Byte Format )
 * @param : company_id : Company id
 */
var cassandra_db_size = function cassandra_db_size( company_id, callback)
{
	if(company_id)
	{
		// Get Company Information
		db.query('select * from company where id = :company_id',
		      	{ replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
			).then(function(companyData)
			{
				if(companyData)
	    		{
	    			var db_name = companyData[0].database_name;
		    		if(db_name) // Database name found
		    		{
						
						// Move to Cassandra Location
						//shell.cd(settings.cassandraDbBinPath);
						
						// Get Keyspace Details
						shell.exec(settings.cassandraDbBinPath + 'nodetool cfstats '+db_name, { silent: true} ,function(cmdCode, cmdStdout, cmdErr) {
							if(cmdErr) // Error Found
							{
								callback({
				        			status: 'fail',
				        			data: cmdErr,
				        			message: 'Cassandra Databse size process has not been completed successfully'
				        		});
							}
							else
							{
								var split_cmdStdout = cmdStdout.split('\n\t'); // Spilt Data
								split_cmdStdout = split_cmdStdout[8]; // Select 'Space used (total)'
								var usedMemory_split = split_cmdStdout.split(':');
								var usedMemory = usedMemory_split[1]; // Get Space Memory Value 
								callback({
									status: 'success',
									data: usedMemory,
									message: 'Cassandra Databse size process has been completed successfully'
								});

							}
						})
		    		}
		    		else
		    		{
		    			callback({
		        			status: 'fail',
		        			data: null,
		        			message: 'Company sensor database name has not been found'
		        		});
		    		}
	    		}
	    		else
		    	{
		    		callback({
	        			status: 'fail',
	        			data: null,
	        			message: 'Company information has not been found'
	        		});
		    	}

		}).catch(function(err){
        	callback({
        		status: 'fail',
        		data: err,
        		message: 'Company information has not been found'
        	});
    	});

	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Company id not found'
		})
	}
}

/*
 * @author : GK
 * @ Company Usage
 * Update all record in Database
 * @param : company_id : Company id
 * @param : emailCount : Email Notification Count
 * @param : pushCount : Push Notification Count
 * @param : smsCount : SMS Notification Count
 * @param : deviceCount : Registered Device Count
 * @param : apiCount : Api Request Count
 * @param : mySqlDb : MySql Database Size ( byte )
 * @param : cassandraDb : Cassandra Database Size ( byte )
 */
var updateCompanyUsesCount = function updateCompanyUsesCount( company_id, emailCount, pushCount, smsCount, deviceCount, apiCount, mySqlDb, cassandraDb, callback)
{
	async.waterfall([
		
		// Company Entry in Company_Uses Table
		function(callback_wt){
			db.models.company_usage.findOrCreate({ where: { company_id: company_id } }).spread(function(uses, created) {
               		callback_wt(null);
            })		
		},
		// Update Uses record in uses table
		function(callback_wt){
			
			var mySqlDb = parseFloat(mySqlDb);
			if(isNaN(mySqlDb))
			{
				mySqlDb = 0;
			}
			var cassandraDb = parseFloat(cassandraDb);
			if(isNaN(cassandraDb))
			{
				cassandraDb = 0;
			}
				

			var uses_record = [];
                uses_record = {
                    email_notification_count: emailCount,
                    push_notification_count: pushCount,
                    sms_notification_count: smsCount,
                    device_count: deviceCount,
                    api_count: apiCount,
                    mysql_db_size: mySqlDb,
                    cassandra_db_size: cassandraDb
                }
            db.models.company_usage.update( uses_record, {
               	where : { 
               				company_id: company_id
                       	}}).then(function(companyUsesCountUpdate) {
	            if(companyUsesCountUpdate)
	            {
	            	callback_wt(null);
	        	}
                else
                {
                 	callback_wt('Some Unknow Error');
                }
		    }).catch(function(err) {
		         callback_wt(err);
		    });
		}
	],
  	function(err, results){
  			if(err)
  			{
  				callback({
		         	status: 'fail',
		         	data: err,
		         	message: 'Company usage record update process has not been completed successfully'
		         })
  			}
  			else
  			{
  				callback({
		         	status: 'success',
		         	data: null,
		         	message: 'Company usage record update process has been completed successfully'
		        })
  			}
  	})
}

module.exports = {
	updateAllcompanyData: updateAllcompanyData,
	getParentChildCompanyTotalRecord: getParentChildCompanyTotalRecord,
	getChildCompanyCount: getChildCompanyCount,
	companyUses: companyUses,
	email_notification_count: email_notification_count,
	push_notification_count: push_notification_count,
	sms_notification_count: sms_notification_count,
	device_count: device_count,
	request_api_count: request_api_count,
	mysql_db_size: mysql_db_size,
	cassandra_db_size: cassandra_db_size,
	updateCompanyUsesCount: updateCompanyUsesCount
};