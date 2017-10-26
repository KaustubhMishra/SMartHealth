var db = require('../../config/sequelize').db;
var DataTypes = require("sequelize");
var generalConfig = require('../../config/generalConfig');
var async = require('async');
var fs = require('fs-extra');
var shell = require('shelljs');
var base64 = require('base-64');
var request = require('request'); /*[SOFTWEB]*/
/* Common function Lib */
var commonLib = require('../common');

var utf8 = require('utf8');
var PropertiesReader = require('properties-reader');
var thingSPath = './thingSimulated.properties';
var mqttConnectionUrl = settings.mqttUrl;


/*
 * @author: Gunjan
 * @Thing dummy data
 * Thing dummy data init process
 * @param: thing_id = Thing Id
 * @param: is_dummy = True/False
 * @param: company_id = Company Id
 */
var thingDummyInitProcess = function thingDummyInitProcess(thing_id, is_dummy, company_id, callback)
{
	if(is_dummy && thing_id != '')
	{
		async.waterfall([
			// 1. Get company information
			function(callback_wf) {
				
				db.models.company.findOne({
					attributes: ['id', 'cpid', 'name'],
					where: {
						id: company_id,
					}
				}).then(function(company_info) {
					if(company_info)
					{
						callback_wf(null, company_info);
					}
					else
					{
						callback_wf({
							status: 'fail',
							data: null,
							message: 'Company information has not been found'
						});
					}
				})
			},
			// 2. Get sensor list based on template
			function(company_information, callback_wf) {
				getSensorListbasedonGroup(thing_id, company_id, function(reg_device_callback){
					if(reg_device_callback.status == 'success')
					{
						callback_wf(null, reg_device_callback.data, company_information);
					}
					else
					{
						callback_wf(reg_device_callback);
					}
				})
			},
			// 3. Register Device
			function(sensors, company_information, callback_wf) {
				
				saveSensorHandShakeData(company_id, thing_id, company_information.cpid, sensors, function(device_reg_callback){
						callback_wf(device_reg_callback);
				})
				
				
			}
		], function(response) {
				// Final Response
			 //callback(response);
		})
	}
}

/*
 * @author: Gunjan
 * @Thing dummy data
 * Get sensor information based on template( Assign Device Group to that template)
 * @param: thing_id = Thing Id
 * @param: company_id = Company Id
 */
var getSensorListbasedonGroup = function getSensorListbasedonGroup(thing_id, company_id, callback)
{
	db.models.thing.findOne({
		attributes: ['device_group_id'],
		where: {
			company_id: company_id,
			id: thing_id
		}
	}).then(function(thing) {
		if(thing)
		{
			var get_device_group_id = thing.device_group_id;
			// Get device Group id which have template
			commonLib.getGroupIdWhichHaveTemplate(get_device_group_id, function(getTemplateGroupId_callback){
				if(getTemplateGroupId_callback.status == 'success')
				{
					// Device Group id
					var get_latest_group_id = getTemplateGroupId_callback.data.group_id;
					
					/* Get Template & pass response: Start */
					getThingTemplate(company_id, get_latest_group_id, function(getTemplate_callback){
						if(getTemplate_callback.status == 'success')
						{
							designTemplateAttribute(getTemplate_callback.data, function(attributes_callback){
									callback({
										status: 'success',
										data: attributes_callback.data,
										message: 'Template has been found successfully'
									});
							})
						}
						else
						{
							callback({
								status: 'fail',
								data: null,
								message: getTemplate_callback.message
							});
						}
					});
					/* Get Template & pass response: End */
				}
				else
				{
					callback(getTemplateGroupId_callback);
				}
			})
		}
		else
		{
			callback({
				status: 'fail',
				data: null,
				message: 'The thing with Register id (' + thing_id + ') not found. '
			});
		}
	})
}

/**
 * @author: Gunjan
 * @Thing dummy data
 * Thing handShake Process & Sensor Registration Process
 * @param : company_id : Company Id
 * @param : thing_id : Thing Id
 * @param : cpid : Company CPID
 * @param : Sensors : List of sensors
 */
var saveSensorHandShakeData = function saveSensorHandShakeData(company_id, thing_id, cpid, sensors, callback)
{
	async.waterfall([
		function(callback_wf) {
				db.models.thing.findOne({
					attributes: ['serial_number'],
					where: {
						company_id: company_id,
						id: thing_id
					}
				}).then(function(thing) {
					if(thing)
					{
						var get_serial_number = thing.serial_number;
						callback_wf(null, get_serial_number);
					}
					else
					{
						callback_wf({
							status: 'fail',
							data: null,
							message: 'Thing information has not been found'
						});
					}
				})			
		},
		function(serial_number, callback_wf) {
			
			// Thing activation call
			if(cpid && cpid != undefined && serial_number && serial_number != undefined && sensors && sensors != undefined)
		    {
		    	var storeSensorArray = {
		                "cpid" : cpid,
		                "srno" : serial_number,
		                "sensors" : sensors
		            };

		        async.series([
		            function(callback) {

		                request.post({
		                    url: generalConfig.siteUrl+'/thing/register',
		                    body: storeSensorArray,
		                    json: true
		                },
		                function (error, response, body){
		                	if(error)
		                	{
		                		callback_wf(error);
		                	}
		                	else
		                	{
		                		callback_wf(null);	
		                	}
		                });
		            }
		        ]);
		    }
		}
	], function(error) {
		if(error)
		{
			callback({
				status: 'fail',
				data: null,
				message: 'Thing has not been activate successfully'
			})
		}
		else
		{
			callback({
				status: 'success',
				data: null,
				message: 'Thing has been activate successfully'
			})
		}
	})
}

/**
 * @author: Gunjan
 * @Thing dummy data
 * Dummy data status change
 * Sample data active / inactive process
 * @param : thing_id : Thing Id
 * @param : new_status : New Status
 * @param : company_id : Company Id
 */
var thing_dummy_data_status_change = function thing_dummy_data_status_change(thing_id, new_status, company_id, callback)
{
	if(thing_id)
	{
		// Start waterFall Process
		async.waterfall([
			// 1. Get thing information
			function(callback_wf) {

				db.models.thing.findOne({
					attributes: ['id', 'is_dummy', 'status', 'active'],
					where: {
						company_id: company_id,
						id: thing_id
					}
				}).then(function(thing) {
					if(thing)
					{
						callback_wf(null, thing)
					}
					else
					{
						callback_wf({
							status: 'fail',
							data: null,
							message: 'Thing information has not been found'
						});
					}
				})
			},
			// 2. Check new status and run forther process
			function(thing_information, callback_wf) {
				if(new_status) // Active Status
				{
					dummy_thing_active_process(thing_id, function(active_callback){
						callback_wf(active_callback);
					})
				}
				else // Deactive Status
				{
					dummy_thing_deactive_process(thing_id, function(deactive_callback){
						callback_wf(deactive_callback);
					});
				}
			}
		], function(response) {
			// End waterFall process
			callback(response);
		})
	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Thing information has not been found'
		});
	}
}

/**
 * @author: Gunjan
 * @Thing dummy data
 * Active process of device
 * @param : thing_id : Thing Id
 */
var dummy_thing_active_process = function dummy_thing_active_process(thing_id, callback)
{
	var new_active_status = '2';
	// Update status
	update_status_of_device(thing_id, new_active_status, function(status_update_callback){
		if(status_update_callback.status == 'success')
		{
			getSimulatorData(thing_id, '2', function(active_simulator_callback){
				if(active_simulator_callback.status == 'success')
				{
					callback({
		                status: 'success',
		                data:null,
		                message: 'Thing has been active successfully'
		            });
				}
				else
				{
					update_status_of_device(thing_id, '3')
					callback(active_simulator_callback);
				}
			})
		}
		else
		{
			callback({
                status: 'fail',
                data:null,
                message: 'Thing has not been active successfully'
            });
		}
	})
}

/**
 * @author: Gunjan
 * @Thing dummy data
 * Deactive process of device
 * @param : thing_id : Thing Id
 */
var dummy_thing_deactive_process = function dummy_thing_deactive_process(thing_id, callback)
{
	var new_deactive_status = '3';
	// Update status
	update_status_of_device(thing_id, new_deactive_status, function(status_update_callback){
		if(status_update_callback.status == 'success')
		{
			
			// Inactive process, Update property file. Set status false.
			var old_word = thing_id+'_simulatorStatus=true';
			var new_word = thing_id+'_simulatorStatus=false';
			commonLib.readWriteSync(thingSPath, old_word, new_word);

			callback({
                status: 'success',
                data:null,
                message: 'Thing has been deactive successfully'
            });
		}
		else
		{
			callback({
                status: 'fail',
                data:null,
                message: 'Thing has not been deactive successfully'
            });
		}
	})
}

/**
 * @author: Gunjan
 * @Thing dummy data
 * Simulator restart process of device
 * @param : thing_id : Thing Id
 */
var thing_simulator_restart_process = function thing_simulator_restart_process(thing_id, callback)
{
	async.waterfall([
		// Thing simulator deactive process
		function(callback_wf) {
			console.log('******************* Deactive Simulator ')
			dummy_thing_deactive_process(thing_id, function(callback_deactive){
				if(callback_deactive.status == 'success')
				{
					callback_wf(null);
				}
				else
				{
					callback_wf({
		                status: 'fail',
		                data:null,
		                message: 'Thing has not been deactive successfully'
		            });
				}
			})

		},
		function(callback_wf) {
			setTimeout(function(){
				callback_wf();
			},3000)
		},
		// Thing simulator active process
		function(callback_wf) {
			console.log('******************* Active Simulator ')

			dummy_thing_active_process(thing_id, function(callback_active){
				if(callback_active.status == 'success')
				{
					callback_wf({
		                status: 'success',
		                data:null,
		                message: 'Thing has been restart successfully'
					})
				}
				else
				{
					callback_wf({
		                status: 'fail',
		                data:null,
		                message: 'Thing has not been active successfully'
					})
				}
			})
		}
	], function(response) {
		console.log(response);
		callback(response)
	})
}

/**
 * @author: Gunjan
 * @Thing dummy data
 * Update status of device( Thing_id )
 * @param : thing_id : Thing Id
 * @param : new_status : New status
 */
var update_status_of_device = function update_status_of_device(thing_id, new_status, callback)
{
	var thing_update = {};
		thing_update = {
			status: new_status
		}
	db.models.thing.update(thing_update, {
            where: {
                id: thing_id
            }
        }).then(function(updated_thing) {
            if(updated_thing)
            {
                callback({
                    status: 'success',
                    data:null,
                    message: 'Thing status has been updated successfully'
                });
            }
            else
            {
                callback({
                    status: 'fail',
                    data: null,
                    message: 'Thing status has not been updated successfully'
                });
            }
        }).catch(function(err) {
        	console.log(err);
            callback({
                status: 'fail',
                data: null,
                message: 'Thing status has not been updated successfully'
            });
        });
} 

/*
 ***
 ************ Simulate Functions ************
 ***
 */

 /**
 * @author: Gunjan
 * @Thing dummy data
 * Register Simulator for selected device(Thing)
 * @param : deviceId : Thing Id
 * @param : callback_from : 1 = Normal, 2 = Status Active
 */
var getSimulatorData = function getSimulatorData(deviceId, callback_from, callback)
{
    var childCompanyList = '';
    var thingsDevicesArray = [];
    var thingsArray = {};
    var thingsArray1 = [];
    var cnt = 0;
    var bulkCnt = 0;
    var lastDate = '';
    var message = '';
    var companyID = '';
    var deviceID = deviceId;
    var device_group_id = '';
    var latest_device_group_id = ''; // Which have template
    var device_current_status = ''; // Device Status

    var device_active_database_status = '2'; // For compare value
    var device_inactive_database_status = '3'; // For compare value
    
   async.series([
      // Step- 1 : Fetch Company & device information
       function(callback_sr) {
        
        if (!deviceID)
        {
            callback({
                status: 'fail',
                data: null,
                message: 'Unknown Device ID, please select valid Device'
            });
        }
        
        db.models.thing.findOne({
            attributes: ['id','company_id','serial_number','user','password','device_key', 'device_group_id', 'active', 'status'],
            where: {
                $and: { id: deviceID, active : true } // For single company
            }
        }).then(function(thingsDetail) {

            if(thingsDetail && thingsDetail != undefined)
            {
            	device_current_status = thingsDetail.status;
                companyID = thingsDetail.company_id;
                device_group_id = thingsDetail.device_group_id;
                callback_sr();
            }
            else
            {
                callback({
                    status: 'fail',
                    data: null,
                    message: 'Device record could not been found.'
                });      
            }
        }).catch(function(err) {
        	console.log(err);
        	callback({
                status: 'fail',
                data: null,
                message: 'Unknown Device ID, please select valid Device'
            });
    	});
      },
    // Step- 2 : Register Device on properties file
      function(callback_sr) {
      	
        var properties = PropertiesReader(thingSPath);
        var result = properties.get('DataSection_'+deviceID+'.thingID');
        var simulator_status = properties.get('DataSection_'+deviceID+'.'+deviceID+'_simulatorStatus');

        if(device_current_status == device_inactive_database_status) // Device not active
        {
        	callback({
                status: 'success',
                data: null,
                message: "This device is not active, Please active device for sample data"
            });
        }
        else if(callback_from == '2') // Device trun to active
        {
        	if(result == deviceID)
        	{
        		var old_word = deviceID+'_simulatorStatus=false';
				var new_word = deviceID+'_simulatorStatus=true';
				commonLib.readWriteSync(thingSPath, old_word, new_word);
	        	callback_sr();	
        	}
        	else
        	{
	        	var str = '\n\n[DataSection_'+deviceID+']\nthingID='+deviceID+'\n'+deviceID+'_simulatorStatus=true';
	            fs.appendFile(thingSPath, str, (err) => {
	            	console.log(err);
	                if (err) throw err;
	                var properties = PropertiesReader(thingSPath);
	                var deviceid = properties.get('DataSection_'+deviceID+'.thingID');
	                callback_sr();
	            });
        	}
        }
        else if(result == deviceID && simulator_status == true) // Found in property file & device is active
        {
            callback({
                status: 'success',
                data: null,
                message: "This device is already sending data."
            });
        }
        else if(result == deviceID && simulator_status == false) // Found in property file & device is not active
        {
        	var old_word = deviceID+'_simulatorStatus=false';
			var new_word = deviceID+'_simulatorStatus=true';
			commonLib.readWriteSync(thingSPath, old_word, new_word);
        }
        else
        {
            var str = '\n\n[DataSection_'+deviceID+']\nthingID='+deviceID+'\n'+deviceID+'_simulatorStatus=true';
            fs.appendFile(thingSPath, str, (err) => {
            	console.log(err);
                if (err) throw err;
                var properties = PropertiesReader(thingSPath);
                var deviceid = properties.get('DataSection_'+deviceID+'.thingID');
                callback_sr();
            });
        }
      },
    
    // Step- 3 : Get device group id
      function(callback_sr) {

      		commonLib.getGroupIdWhichHaveTemplate(device_group_id, function(getTemplateGroupId_callback){
				if(getTemplateGroupId_callback.status == 'success')
				{
					latest_device_group_id = getTemplateGroupId_callback.data.group_id;
					callback_sr();
				}
				else
				{
					 callback({
		                status: 'fail',
		                data: null,
		                message: 'Device group information has not been found successfully'
		            });
				}
			})
      },
    // Step- 4 : Fetch required information from database
      function(callback_sr) {
        
        if(!companyID && !deviceID)
        {
            callback({
                status: 'fail',
                data: null,
                message: 'Missing company or device detail.'
            });
        }
        
        db.models.company.hasMany(db.models.thing, {
            foreignKey: 'company_id'
        });

        db.models.company.hasMany(db.models.device_group, {
            foreignKey: 'company_id'
        });

        db.models.company.hasMany(db.models.template, {
            foreignKey: 'company_id'
        });

        db.models.template.hasMany(db.models.template_attr, {
            foreignKey: 'template_id'
        });

        db.models.company
        .findAll({
            attributes: ['id','parent_id','name','cpid','database_name','active'],
            include: [
                        { model: db.models.device_group, attributes: ['id', 'name']
                        },
                        { model: db.models.thing, attributes: ['id', 'name', 'device_group_id', 'device_key', 'serial_number', 'active','user','password', 'status'], where: { $and: [{active: true, id: deviceID }] }
                        },
                        { model: db.models.template, attributes: ['id', 'name', 'device_group_id', 'company_id'], include: [
                            { model: db.models.template_attr, attributes: ['id', 'name', 'localId', 'min', 'max'], where : { 'parent_attr_id' : '0' }
                            }]
                        },
                     ],
            /*where: {
                $and: {active: true } // For single company
            },*/
            where: ["company.active = true and templates.device_group_id = ?", latest_device_group_id],
            group: ['`templates.template_attrs`.`id`'],
            order: 'localId ASC'
        }).then(function(childCompany) {
            if(childCompany.length > 0)
            {
                childCompanyList = childCompany;
                var companyID = childCompany[0].id;
                var cpid = childCompany[0].cpid; /*[SOFTWEB]*/
                var thingsData = childCompany[0].dataValues.things;
                var companyInfo = childCompany[0].dataValues.templates[0].dataValues.template_attrs;
                
                if(thingsData.length > 0)
                {
                    var cnt = 0;
                    for (var t = 0; t < thingsData.length; t++)
                    {
                        cnt++;
                        var deviceID = thingsData[t].id;
                        var deviceKey = thingsData[t].device_key;
                        var thingUser = thingsData[t].user;
                        var thingPassword = thingsData[t].password;
                        var device_group_id = thingsData[t].device_group_id;
                        var device_status = thingsData[t].status;
                        
                        var thingsArray = {};
                        
                        thingsArray.companyId = companyID;
                        thingsArray.databaseName = childCompany[0].database_name;
                        thingsArray.deviceId = deviceID;
                        thingsArray.connectionString = deviceKey;
                        thingsArray.thingUser = thingUser;
                        thingsArray.thingPassword = thingPassword;
                        thingsArray.device_group_id = device_group_id;
                        thingsArray.device_status = device_status;
                        thingsArray.cpid = cpid;
                        thingsArray.data = [];
                        
                        for (var i = 0; i < companyInfo.length; i++)
                        {
                            
                            var dataRangeArray = {};
                            var sensorName = companyInfo[i].name;
                            var localID = companyInfo[i].localId;
                            dataRangeArray.name = companyInfo[i].name;
                            dataRangeArray.min = companyInfo[i].min;
                            dataRangeArray.max = companyInfo[i].max;
                            dataRangeArray.localID = localID;
                            dataRangeArray.template_attr_id = companyInfo[i].id;
                            thingsArray.data.push(dataRangeArray);
                            if(i+parseInt(1) == companyInfo.length)
                            {   
                                thingsDevicesArray.push(thingsArray);
                                if((t+parseInt(1) == childCompany.length))
                                {
                                    callback_sr();
                                }
                            }
                        }
                    }
                }
            }
            else
            {
                callback({
                    status: 'fail',
                    data: null,
                    message: 'Company record could not been found.'
                });      
            }
        }).catch(function(err) {
        	console.log(err);
        	callback({
                    status: 'fail',
                    data: null,
                    message: 'Company record could not been found.'
                });   
    	});
      },
    // Step- 5 : Set & call Simulator
      function(callback_sr) {
      	
      	// Key Sting
        var text = {"cs":thingsDevicesArray[0].connectionString,"u":thingsDevicesArray[0].thingUser,"p":thingsDevicesArray[0].thingPassword,"topic":"IoTConnect"};

        var encoded = new Buffer(JSON.stringify(text)).toString("base64"); // Key

        var obj = {
            "did" : thingsDevicesArray[0].deviceId,
            "dgid" : thingsDevicesArray[0].device_group_id, 
            "key" : encoded,
            "cpid" : thingsDevicesArray[0].cpid,
        };
        
        if(thingsDevicesArray[0].data.length > 0)
        {
        	// Call simulator function
            sendSimulatorDatatoMQTT(thingsDevicesArray, obj, request);
            setTimeout(function() {
                callback_sr();
            }, 500);
        }
        else
        {
            message = 'No data found';
            callback_sr();
        }
      },
    // Step- 6 : Final Result Response
      function(callback_sr) {
        callback({
            status: 'success',
            //data: childCompanyList,
            data: null,
            message: message
        });
        callback_sr();
      }
    ]);
}

/**
 * @author : Gunjan
 * @Thing dummy data
 * send Simulator Data to MQTT
 * @param : thingsDevicesArray = Device, template attribute and other information
 */
var sendSimulatorDatatoMQTT = function sendSimulatorDatatoMQTT(thingsDevicesArray, obj)
{
	async.waterfall([
		// 1. Get list of sub-attribute based on attribute id
		function(callback_wf) {

			async.forEachSeries(thingsDevicesArray[0].data, function(template, callback_f1) {
					var parnet_attr_id = template.template_attr_id;
					getTemplateSubAttribute(parnet_attr_id, function(subAttr_response_callback){
						if(subAttr_response_callback.status == 'success')
						{
							template.sub_attribute = subAttr_response_callback.data;
							callback_f1();
						}
						else
						{
							callback_f1();
						}
					});
			}, function() {
				callback_wf(null);
			});
		},
		// 2. Set simulator
		function(callback_wf) {

			var mqtt = require('mqtt');
		    var client  = mqtt.connect(mqttConnectionUrl);
		    var mqttTopic = obj.cpid+"topic";
		    client.on('connect', function () {
		    	client.subscribe(mqttTopic);

		        simulatorThingValidation(thingsDevicesArray, obj, client, mqttTopic)

			})
		}
	], function(final) {
		// Call Complete
	})
}

/**
 * @author: Gunjan
 * @Thing dummy data
 * Check thing status and send simulator data
 * @param : thingsDevicesArray : Thing information (obj)
 * @param : obj : General required imformation (obj)
 * @param : client : mqtt client (obj)
 * @param : mqttTopic : mqtt topic
 */
var simulatorThingValidation = function simulatorThingValidation(thingsDevicesArray, obj, client, mqttTopic)
{
	var deviceID = thingsDevicesArray[0].deviceId;
	var properties = PropertiesReader(thingSPath);
    var simulator_status = properties.get('DataSection_'+deviceID+'.'+deviceID+'_simulatorStatus');
    if(simulator_status)
    {
    	setSimulatorData(thingsDevicesArray, obj, client, mqttTopic);
    	setTimeout(function(){
    			simulatorThingValidation(thingsDevicesArray, obj, client, mqttTopic);
    	},2000)
    }
    else
    {
    	console.log('Thing not active, Thing id-'+deviceID)
    }
}

/**
 * @author: Gunjan
 * @Thing dummy data
 * Send data to activeMQ using mqtt protocol
 * @param : thingsDevicesArray : Thing information (obj)
 * @param : obj : General required imformation (obj)
 * @param : client : mqtt client (obj)
 * @param : mqttTopic : mqtt topic
 */
var setSimulatorData = function setSimulatorData(thingsDevicesArray, obj, client, mqttTopic)
{
	var dataArray = [];
    var bulkDataArry = '';
    var today = new Date();
    var get_utc_time_milisecond = today.getTime();
    //obj.time = today;
    obj.data = [];
    var cntArray = 0;
    var elements = {};
    
    for (var i = 0; i < thingsDevicesArray[0].data.length; i++)
    {
        var localID = thingsDevicesArray[0].data[i].localID;
        // Sub Attribute List
        var sub_attribute = thingsDevicesArray[0].data[i].sub_attribute;

        if(sub_attribute.length > 0) // Mutiple Sub-attribute
        {
        	var key = thingsDevicesArray[0].data[i].name;
        	var key_array = {};

        	async.forEachSeries(sub_attribute, function(attr, callback_f1) {
            	
            	var attribute_name = attr.name;
            	var randomNumber = Math.random() * parseFloat( attr.max - attr.min ) + parseFloat(attr.min);
            	
            	key_array[attribute_name] = randomNumber.toFixed(3);
            	callback_f1();

            }, function() {
            	elements[key] = key_array;
            	dataArray.push(elements);
			});	
        }
        else // Single Value
        {
        	var value =   Math.random() * parseFloat( thingsDevicesArray[0].data[i].max - thingsDevicesArray[0].data[i].min ) + parseFloat(thingsDevicesArray[0].data[i].min);

            value = value.toFixed(3);
            var key = thingsDevicesArray[0].data[i].name;
            elements[key] = parseFloat(value); //value;
            dataArray.push(elements);
        }
        cntArray++;
    }
    if(cntArray == thingsDevicesArray[0].data.length)
    {
    	dataArray[0].date = get_utc_time_milisecond;

        obj.data.push(dataArray[0]);
        bulkDataArry = obj;
    	/*console.log('--------------')
    	console.log(bulkDataArry);
    	console.log('--------------')*/
        client.publish(mqttTopic, JSON.stringify(bulkDataArry));
    }

    // Testing perspective
    /*var date = new Date();
	var current_hour = date.getHours();
	var current_minute = date.getMinutes();
	var current_second = date.getSeconds();
	console.log('Data:'+date+', Time :'+current_hour+'-'+current_minute+'-'+current_second);
    console.log('simultor running device ID-::'+thingsDevicesArray[0].deviceId)*/
    // Testing perspective
}

/**
 * @author: Gunjan
 * @Thing dummy data
 * Get sub-attribute based on Parent Attribute Id
 * @param: parent_attr_id = Parent attribute ID
 */
var getTemplateSubAttribute = function getTemplateSubAttribute(parent_attr_id, callback)
{
	db.models.template_attr.findAll( { where: { parent_attr_id: parent_attr_id } } ).then(function(template_attr) {
			if(template_attr)
			{
				var sub_attr_ary = [];
				async.forEachSeries(template_attr, function(attr, callback_f1) {
						var temp = {};
						temp.id = attr.id;
						temp.name = attr.name;
						temp.type = attr.type;
						temp.localId = attr.localId;
						temp.unit = attr.unit;
						temp.min = attr.min;
						temp.max = attr.max;

						sub_attr_ary.push(temp);
						callback_f1();
				}, function() {
						callback({
							status: 'success',
							data: sub_attr_ary,
							message: 'Sub attribute has been loaded successfully'
						});		
				});
			}
			else
			{
				callback({
					status: 'success',
					data: [],
					message: 'Sub attribute has been loaded successfully'
				});
			}
		}).catch(function(err) {
				console.log(err);
				callback({
					status: 'fail',
					data: null,
					message: 'Sub attribute has not been loaded successfully'
				});
	   }); 
}

/*
 ***
 ************ Common Functions ************
 ***
 */

/*
 * @author: Gunjan
 * @Thing dummy data
 * Get template attribute list based on device group
 * @param: company_id = Company Id
 * @param: deviceGroupId  = Device Group Id
 */
var getThingTemplate = function getThingTemplate(companyId, deviceGroupId, callback) {

	sequelizeDb.models.template.findOne({
		include: [{
			model: sequelizeDb.models.template_attr,
			//attributes: ['id', 'name'],
			where: {
				parent_attr_id: '0'
			},
			required: false,

			include: [{
				model: sequelizeDb.models.template_attr,
				as: 'subattributes',
				//attributes: ['id', 'name'],
				required: false
			}],
		}],
		where: {
			company_id: companyId,
			device_group_id: deviceGroupId,
		}
	}).then(function(template) {

		if (template) {
			callback({
				status: 'success',
				data: template.template_attrs,
				message: 'Template has been found for this device group'
			});

		} else {

			callback({
				status : 'fail',
				data: null,
				message: 'Template has not been found for this device group'
			});

		}
	});
};

/*
 * @author: Gunjan
 * @Thing dummy data
 * Set template attribte Array for registration call
 * @param: attributesArray = Template attribute array
 */
var designTemplateAttribute = function designTemplateAttribute(attributesArray, callback)
{
	var templateAttributeArry = [];
	var count = 1;
	async.forEachSeries(attributesArray, function(template_attribute, callback_f1) {

		var temp = [];
			temp = {
				localid: template_attribute.localId,
				sensorid: 's'+template_attribute.localId,
				pin: count,
				name: template_attribute.name,
			}
		templateAttributeArry.push(temp);
		count++;	
		
		callback_f1();

	}, function() {
		callback({
			status: 'success',
			data: templateAttributeArry,
			message: 'Template attribute has been successfully set'
		})
	});
}

var encryptBase64 = function(value) {
	return new Buffer(value).toString('base64');
};

var decryptBase64 = function(value) {
	return new Buffer(value, 'base64').toString('ascii');
}

/*
 * @author: Gunjan
 * @Thing dummy data
 * Simulator restart process
 * @param: device_group_id = Device Group Id
 */
var updateSimulatorDataBasedonTemplateUpdate = function updateSimulatorDataBasedonTemplateUpdate(device_group_id, callback)
{
	var final_group_ids = [];
	var var_thing_list = [];

	async.waterfall([
		// Get list of register devices based on device group id
		function(callback_wf) {
			
			db.models.thing.findAll( { 
							where: { device_group_id: device_group_id, is_dummy: true, status: '2' } 
					}).then(function(thing_list) {
							
							async.forEachSeries( thing_list, function(thing, callback_f1) {
								var thing_id = thing.id;
								var_thing_list.push(thing_id);
								callback_f1();
							}, function() {
								callback_wf(null)
							});
							
			}).catch(function(err) {
				console.log(err);
				callback_wf({
					status: 'fail',
					data: null,
					message: 'simulator data update process gase no been completed'
				});
			});
		},
		// Get child group ids and its thing.
		function(callback_wf)
		{
			var groupListArry = [];
			// Get child Group List based on 'device_group_id'
			commonLib.groupAndChildInformation(device_group_id, '', groupListArry, 0, function(callback_childGroup){
					if(callback_childGroup != null) // Result Not found
                    {
                        callback_wf({
                            status: 'fail',
                            data: null,
                            message: 'Group hierarchy information has not been found'
                        });
                    }
                    else // Result found
                    {
                     	// ForEach of result value
						async.forEachSeries( groupListArry, function(device_group, callback_f1) {
								var get_child_group_id = device_group.id; // Child group id

									// Template group id based on this group id
									commonLib.getGroupIdWhichHaveTemplate(get_child_group_id, function(callback_getTemplateParentId){
											if(callback_getTemplateParentId.status != 'success')
											{
												console.log()
												console.log('Error: Group information has not been found')
												console.log(callback_getTemplateParentId);
											}
											else
											{
												var get_template_group = callback_getTemplateParentId.data.group_id;
												// Compare group id
												if(get_template_group == device_group_id)
												{
													final_group_ids.push(get_child_group_id)
													callback_f1()
												}
												else
												{
													callback_f1()
												}
											}
									})

						}, function() {
							callback_wf(null);
						});   
                    }
			})
		},
		// Get thing list based on group id
		function(callback_wf)
		{
			if(final_group_ids != null && final_group_ids != '')
			{
				db.models.thing.findAll( { 
								where: { device_group_id:{ $in: [final_group_ids] }, is_dummy: true, status: '2' } 
						}).then(function(thing_list) {
								console.log(thing_list);
								async.forEachSeries( thing_list, function(thing, callback_f1) {
									var thing_id = thing.id;
									var_thing_list.push(thing_id);
									callback_f1();
								}, function() {
									callback_wf(null)
								});
								
				}).catch(function(err) {
					console.log(err);
					callback_wf({
						status: 'fail',
						data: null,
						message: 'simulator data update process gase no been completed'
					});
				});
			}
			else
			{
				callback_wf(null)
			}
		},
		// Restart simulator process
		function(callback_wf) {
			console.log(var_thing_list);
			async.forEachSeries( var_thing_list, function(thing, callback_f1) {
					
					var thing_id = thing;
					thing_simulator_restart_process(thing_id, function(callback_simulator){
						if(callback_simulator.status == 'fail')
						{
							console.log('Simulator has not been restarted. Thing=')
							console.log(thing);
						}
						callback_f1();
					})

			}, function() {
				callback_wf(null);
			});
		}
	], function(response) {
		console.log('------- Simulator Restart Process Finish ------------')
		//console.log(response)
	})
}


module.exports = {
	thingDummyInitProcess: thingDummyInitProcess,
	getSensorListbasedonGroup: getSensorListbasedonGroup,
	saveSensorHandShakeData: saveSensorHandShakeData,
	getSimulatorData: getSimulatorData,
	thing_dummy_data_status_change: thing_dummy_data_status_change,
	dummy_thing_deactive_process: dummy_thing_deactive_process,
	updateSimulatorDataBasedonTemplateUpdate: updateSimulatorDataBasedonTemplateUpdate,
	thing_simulator_restart_process: thing_simulator_restart_process
};