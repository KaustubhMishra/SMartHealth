'use strict';

var commonLib = require('../../../../lib/common');
var async = require('async');

sequelizeDb.models.template.hasMany(sequelizeDb.models.template_attr, {
	foreignKey: 'template_id'
});
sequelizeDb.models.template_attr.hasMany(sequelizeDb.models.template_attr, {
	foreignKey: 'parent_attr_id',
	as: 'subattributes'
});

//sequelizeDb.models.template.associate(sequelizeDb.models.template_attr);

var companyUses = require('../../../../lib/usage/usage');

/**
 *  get group from sequeilze db
 */

exports.getGroups = function(req, res, next) {

	var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
		res.json({
			status: 'fail',
			data: null,
			message: 'Unknown user'
		});
	}

	sequelizeDb.models.company_group.findAll({
		attributes: ['id', 'company_id', 'name'],
		where: {
			company_id: userInfo.companyId
		}
	}).then(function(groups) {
		if (groups) {
			res.json({
				status: "success",
				data: groups,
				message: "Data loaded successfully"
			});
		} else {
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

};

exports.getTelemetryDataTopic = function(req, res, next){
	var userInfo = generalConfig.getUserInfo(req);
	if(!userInfo.companyId){
		res.json({
			status:'fail',
			data:null,
			message:'Unknown user'
		});
	}
	
	commonLib.getCompanyInfoById(userInfo.companyId, function(companyResponse){
		if(companyResponse.status == 'success') {
			if(companyResponse.data){
				if(companyResponse.data.cpid){
					return res.json({
						status:'success',
						data:companyResponse.data.cpid+'topic',
						message:'Data loaded successfully.'
					});
				}else{
					return res.json({
						status:'fail',
						data:null,
						message: "Topic not found."
					});
				}
			}else {
				return res.json({
					status:'fail',
					data:null,
					message: "Company not found."
				});
			}
		}else {
			return res.json({
				status:'fail',
				data:null,
				message: "Fail to load data"
			});
		}
	});

}

/*exports.getTelemetryData = function(req, res, next) {
		var userInfo = generalConfig.getUserInfo(req);
		if (!userInfo.companyId) {
			res.json({
				status: 'fail',
				data: null,
				message: 'Unknown user'
			});
		}

		var searchParams = new Array();
		var pageSize = 50;
		var pageNumber = 1;
		var sortBy = 'receivedDate';
		var sortOrder = 'desc';

		//get db name
		sequelizeDb.models.company.findOne({
			attributes: ['id', 'database_name'],
			where: {
				id: userInfo.companyId
			}
		}).then(function(company) {
			if (company) {
				var dbName = company.database_name;

				var telemetry = require('../../../../config/telemetrySequelize');
				return telemetry.db(dbName, function(err, telemetryDb) {
					if (err) {
						res.json({
							status: "fail",
							message: "Fail to load data"
						});
					} else {
						var thingId = req.params.id;

						return telemetryDb.models.sensordatav3.findAndCountAll({
							attributes: ['receivedDate', 'data'],
							where: {
								deviceid: thingId
							},
							order: sortBy + " " + sortOrder,
							offset: pageNumber > 0 ? ((pageNumber - parseInt(1)) * pageSize) : 0,
							limit: pageSize
						}).then(function(sensorData) {
							if (sensorData) {
								return res.json({
									status: 200,
									sensordata: sensorData,
									message: 'Data loaded successfully.'
								});
							} else {
								return res.json({
									status: 401,
									sensordata: [],
									message: 'Fail to load data.'
								});
							}

						}).catch(function(err) {
							return res.json({
								status: "fail",
								message: "Fail to load data"
							});
						});

					}
				});
			} else {
				return res.json({
					status: "fail",
					data: null,
					message: "Fail to load data"
				});
			}
		}).catch(function(err) {
			res.json({
				status: "fail",
				data: null,
				message: "Fail to load data"
			});
		});
};
*/

	/**
	 * @author NB
	 * downloadSampleImportFile will used to download sample file for specified type
	 * @param  {obj}   req
	 * @param  {obj}   res
	 * @param  {Function} next
	 * @return file in case of success
	 */
exports.downloadSampleImportFile = function(req, res, next) {
	var fs = require('fs-extra');
	var filePath = settings.filesPath.sampleImportFile + "/" + req.params.filename;

	if (req.params.filename) {
		fs.stat(filePath, function(err, stat) {
			if (err == null) {
				return res.download(filePath);
			} else {
				return res.json({
					'error': true,
					'code': err.code,
					'message': "Something went wrong."
				});
			}
		});
	} else {
		return res.json({
			status: 'fail',
			message: 'File empty',
			code: 404
		});
	}
};

/**
 * @author NB
 * registerThing will register thing in company
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */

exports.registerThing = function(req, res, next) {
	if (req.body != '') {
		req.checkBody('cpid', 'cpid required').notEmpty();
		req.checkBody('serial_number', 'serial_number required').notEmpty();
		req.checkBody('trial_id', 'Trail Id required').notEmpty();
		req.checkBody('patient_id', 'Patient Id required').notEmpty();		
	
		/*req.checkBody('lat', 'lat (latitude) is required').notEmpty();
		req.checkBody('lng', 'lng (longitude) is required').notEmpty();*/
		var mappedErrors = req.validationErrors(true);
	}
	if (mappedErrors == false) {
		//req.body.sensors = JSON.parse(req.body.sensors);

		var companyId = '';
		var topicName = 'IoTConnect';
		var thingList = [];
		var thing = {};
		var thingId = '';
		var companyDetail = {};
		var queries = [];
		var cnt = 0;
		sequelizeDb.models.company.findOne({
			where: {
				cpid: req.body.cpid
			}
		}).then(function(company) {
			if (!company) {
				return res.json({
					status: 'fail',
					message: 'Company not found.(cpid is case sensitive)',
					code: 404
				});
			} else {

				companyId = company.id;
				sequelizeDb.models.thing.findOne({
					where: {
						company_id: companyId,
						serial_number: req.body.serial_number,
						trial_id: req.body.trial_id,
						patient_id: req.body.patient_id

					}
				}).then(function(thing) {
					if (thing) {
						//Fixed bug
						if(thing.status == '3')
						{
							var start_data_sending_status = false;
						}
						else
						{
							var start_data_sending_status = true;
						}
						var deviceKey = thing.device_key;
						var user = thing.user == '' ? Math.random().toString(36).slice(-6) : thing.user;
						var password = thing.password == '' ? Math.random().toString(36).slice(-6) : thing.password;
						var key = {
							"cs": deviceKey,
							"u": user,
							"p": password,
							"topic": topicName
						};

						key = encryptBase64(JSON.stringify(key));

						if (thing.active == false) {
							if (req.body.additionalinfo != '') {
								thing.additional_info = JSON.stringify(req.body.additionalinfo);
							}

							if (req.body.firmware != '') {
								thing.firmware = JSON.stringify(req.body.firmware);
							}

							thing.status = '1';
							thing.active = true;

							console.log(thing);
							thing.save().then(function(thing){
								return res.json({
									status: true,
									data: {
										deviceid: thing.id,
										dgid: thing.device_group_id,
										key: key,
										thingdetail: thing,
										start_data_sending: start_data_sending_status
									},
									message: "Thing registered successfully."
								});
							}).catch(function(err) {
								return res.json({
									status: 'fail',
									message: 'There is some error in updating status. ',
									error: err
								});
							});
						}
					} else {
						return res.json({
							status: 'fail',
							message: 'The thing with serial number (' + req.body.serial_number + ') not found. '
						});
					}
				});
			}
		}).catch(function(err) {
			return res.json({
				status: 'fail',
				error: err
			});
		});
	} else {
		res.json({
			status: 'fail',
			message: mappedErrors
		});
	}
};



var getThingTemplate = function(companyId, deviceGroupId, callback) {

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
				'status' : true,
				'template' : template.template_attrs
			});

		} else {

			callback({
				'status' : false,
				'message': "Template not found for this device group."
			});

		}
	});
};


/**
 * @author NB
 * sendData will get data from device and format it and return back
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return  return data on success and failiur notification otherwise
 */
exports.sendData = function(req, res, next) {

	if (req.body != '') {
		req.checkBody('cpid', 'cpid is required').notEmpty();
		req.checkBody('did', 'device id required').notEmpty();
		req.checkBody('key', 'key id required').notEmpty();
		req.checkBody('data', 'data required').notEmpty();
		var mappedErrors = req.validationErrors(true);
	}
	if (mappedErrors == false) {
		sequelizeDb.models.company.findOne({
			where: {
				cpid: req.body.cpid
			}
		}).then(function(company) {
			if (!company) {
				return res.json({
					status: 'fail',
					message: 'Company not found.(cpid is case sensitive)',
					code: 400
				});
			} else {
				var companyId = company.id;
				sequelizeDb.models.thing.find({
					where: {
						company_id: companyId,
						id: req.body.did
					}
				}).then(function(thing) {
					if (thing) {
						sequelizeDb.models.template.findOne({
							where: {
								company_id: companyId
							}
						}).then(function(template) {
							if (template) {
								var template = JSON.parse(template.value) || [];
								var dataArr = {};
								//return;
								var data = req.body.data;
								var key = '';
								var k = '';
								/*data.forEach(function(value){
									key = Object.keys(value);
									k = template[key[0]];
									if(k){
										dataArr.push({[k]:value[key[0]]});
									}else{

										// return res.json({
										// 	status: "success",
										// 	data: dataArr,
										// 	message:"Data loading failed.Template json invalid"
										// });
									}
								});*/
								var keys = Object.keys(data);
								keys.forEach(function(key) {
									k = template[key];
									if (k) {
										dataArr[k] = data[key];
									} else {
										return res.json({
											status: "success",
											data: dataArr,
											message: "Data loading failed.Template json invalid"
										});
									}
								});
								generalConfig.mqttSendData(JSON.stringify({
									cpid: req.body.cpid,
									key: req.body.key,
									did: req.body.did,
									data: dataArr
								}));
								return res.json({
									status: "success",
									data: dataArr,
									message: "Data loaded successfully."
								});
							} else {
								return res.json({
									status: "success",
									data: [],
									message: "Data loading failed.Template doesn't exits."
								});
							}
						});
					}
				}).catch(function(err) {
					return res.json({
						status: 'fail',
						error: err
					});
				});
			}
		}).catch(function(err) {
			return res.json({
				status: 'fail',
				error: err
			});
		});
	} else {
		return res.json({
			status: 'fail',
			message: mappedErrors
		});
	}
};


/**
 * @author NB
 * importThings will import things in company
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.importThings = function(req, res, next) {
	if (req.files && req.files.deviceFile) {
		var userInfo = generalConfig.getUserInfo(req);
		if (!userInfo.companyId) {
			return res.json({
				status: 'fail',
				message: 'Unknown user',
				code: 401
			});
		}

		var companyId = userInfo.companyId;
		var fs = require('fs-extra');
		var file = req.files.deviceFile;

		if (file.size > 2000000) {
			return res.json({
				status: "fail",
				message: "File too large , max file size allowed 2MB"
			});
		}

		if (!(file.type == 'text/csv' || file.type == 'application/vnd.ms-excel')) {
			return res.json({
				status: "fail",
				message: "Invalid CSV File"
			});
		}

		var thingList = [];
		var isAlreadyTaken = false;
		var havingTemplate = 1;
		var deviceGroupList = [];
		var queries = [];
		var errors = '';
		var isError = false;
		var thing = {};
		var thingId = '';
		var deviceGroupId = '';
		var headers = [];
		var logFileName = new Date().getTime() + ".txt";
		var filePath = settings.filesPath.tmp + logFileName;
		var logs = [];
		var validationLogs = [];
		var csvData = [];
		var srNoArray = [];
		var async = require("async");
		var csv = require("fast-csv");
		var stream = fs.createReadStream(file.path);
		var counter = 1;
		var cnt = 0;

		csv
			.fromStream(stream, {
				headers: true
			})
			.validate(function(data, next) {
				if (counter == 1) {
					counter++;
					headers = Object.keys(data);
					if (headers.length > 0) {
						if (headers.length == 2) {
							if (trim(headers[0]) != 'SerialNumber') {
								isError = true;
								errors = "ERROR: Header first column must match SerialNumber.";
							}
							if (trim(headers[1]) != 'DeviceGroup') {
								isError = true;
								errors = "ERROR: Header second column must match DeviceGroup.";
							}
						} else {
							isError = true;
							errors = "ERROR: Header mismatch as per the sample download file.";
						}
						if (isError) {
							return next(errors);
						}
					}
				}

				isError = false;
				
				if (trim(data.SerialNumber) == '') {
					isError = true;
					validationLogs.push(
						"ERROR: ROW." + counter + "=> SerialNumber: SerialNumber is required."
					);
				} else if (srNoArray.indexOf(trim(data.SerialNumber)) != -1) {
					validationLogs.push(
						"ERROR: ROW." + counter + "=> Thing '" + trim(data.SerialNumber) + "' is duplicate entry."
					);
				}

				if (trim(data.DeviceGroup) == '') {
					isError = true;
					validationLogs.push(
						"ERROR: ROW." + counter + "=> DeviceGroup: DeviceGroup is required."
					);
				}
				csvData.push(data);
				srNoArray.push(data.SerialNumber);
				counter++;
				return next(null, true); //valid if the model does not exist
			})
			.on("error", function(data) {
				logs.push(data);
				stream.destroy();
				return writeLog(fs, filePath, logs, logFileName, 'fail', res);

			})
			.on("data-invalid", function(data) {
				logs.push(data);
				stream.destroy();
				return writeLog(fs, filePath, logs, logFileName, 'fail', res);
			})
			.on("data", function(data) {})
			.on("end", function() {
				generalConfig.mqttImportThing(companyId, 'finishedValidation');
				if (validationLogs.length == 0) {
					var csvDataLen = csvData.length;
					if (csvDataLen > 0) {
						async.parallel([function(callback) {
							sequelizeDb.models.thing.findAll({
								attributes: ['id', 'serial_number', 'device_group_id', 'company_id']
									//, where:{
									// 	company_id:companyId
									// }
							}).then(function(findList) {
								callback(null, findList);
							}).catch(function(err) {
								callback(err, null);
							});
						}, function(callback) {
							sequelizeDb.models.device_group.hasOne(sequelizeDb.models.template, {
								foreignKey: 'device_group_id'
							});

							sequelizeDb.models.device_group.findAll({
								attributes: ['id', 'name'],
								include: [{
									model: sequelizeDb.models.template,
									attributes: ['id', 'name'],
									required: false
								}],
								where: {
									company_id: companyId
								}
							}).then(function(findList) {
								callback(null, findList);
							}).catch(function(err) {
								callback(err, null);
							});
						}], function(err, result) {
							if (err) {
								logs = [];
								logs.push(
									"ERROR: Thing bulk upload process failed."
								);
								return writeLog(fs, filePath, logs, logFileName, 'fail', res);
							} else {
								thingList = result[0];
								deviceGroupList = result[1];
								counter = 2;
								var csvDataCounter = 0;
								
								async.forEachSeries(csvData, function(data, callback_f0)
								{

									thingId = '';
									deviceGroupId = '';
									havingTemplate = 1;
									cnt = 0;
									isAlreadyTaken = false;

									// Set waterfall : Start
									async.waterfall([
										// 1. //get group id
										function(callback_wf) {
											
											//get group id
											async.forEachSeries(deviceGroupList, function(deviceGroup, callback_f1) {

													if (deviceGroup.name == trim(data.DeviceGroup)) {
														deviceGroupId = deviceGroup.id;

														if(!deviceGroup.template)
														{
															// Get device group id which have template
															commonLib.getGroupIdWhichHaveTemplate(deviceGroupId, function(templateGroupFind_callback){

															    if(templateGroupFind_callback.status != 'success')
															    {
															       
															       havingTemplate = 0;
															       callback_f1();
															    }
															    else
															    {
															    	callback_f1();
															    }
															})

														} else {
															callback_f1();
														}
													} else {
														callback_f1();
													}
											}, function() {
												callback_wf(null);
											});
										},
										// 2. check thing and check error status
										function(callback_wf) {
											
											async.forEachSeries(thingList, function(value, callback_f1) {
												
												if (value.serial_number == trim(data.SerialNumber)) {
													if (value.company_id == companyId) {
														thingId = value.id;
													} else {
														isAlreadyTaken = true;
													}
												}

												cnt++;
												if (cnt == thingList.length) {
													
													if (isAlreadyTaken == true) {
														logs.push("INFO: ROW." + counter + "=> Thing '" + trim(data.SerialNumber) + "' already exits in the system.");
													} else if (havingTemplate == 0) {
														logs.push("ERROR: ROW." + counter + "=> DeviceGroup '" + trim(data.DeviceGroup) + "' and it's parent group does not have template.");
													} else if (deviceGroupId == '') {
														logs.push("ERROR: ROW." + counter + "=> DeviceGroup '" + trim(data.DeviceGroup) + "' not found.");
													} else if (thingId == '') {
														logs.push(
															"INFO: ROW." + counter + "=> New Thing '" + trim(data.SerialNumber) + "' inserted succssfully."
														);
														queries.push({
															serial_number: data.SerialNumber,
															company_id: companyId,
															device_group_id: deviceGroupId
														});
														thing.id = thingId;
														thing.serial_number = trim(data.SerialNumber);
														thing.company_id = companyId;
														thingList.push(thing);
													} else {
														logs.push(
															"INFO: ROW." + counter + "=> Thing '" + trim(data.SerialNumber) + "' updated."
														);
														queries.push({
															id: thingId,
															serial_number: data.SerialNumber,
															company_id: companyId,
															device_group_id: deviceGroupId
														});
														thing.id = thingId;
														thing.serial_number = trim(data.SerialNumber);
													}
												}
												callback_f1();

											}, function() {
												callback_wf(null);
											});
										},
										function(callback_wf) {
											counter++;
											csvDataCounter++;
											if (csvDataCounter == csvDataLen) {
												//save to db
												if (queries.length > 0) {
													saveThingsInDB(queries, function(err) {
														if (err) {
															logs = [];
															logs.push(
																"ERROR: Thing bulk upload process failed."
															);
															return writeLog(fs, filePath, logs, logFileName, 'fail', res);
														} else {
															generalConfig.mqttPublishMessage();
															return writeLog(fs, filePath, logs, logFileName, 'success', res);
														}
													});
												} else {
													return writeLog(fs, filePath, logs, logFileName, 'fail', res);
												}
											}
											callback_wf(null);
										}
									], function() {
										// ...
										callback_f0();
									})
									
									// Set waterfall : End
									
								}, function() {

								});
							}
						});
					} else {
						logs.push("ERROR: No Records Found!");
						return writeLog(fs, filePath, logs, logFileName, 'fail', res);
					}

				} else {
					return writeLog(fs, filePath, validationLogs, logFileName, 'fail', res);
				}
			});
	} else {
		return res.json({
			status: 'fail',
			message: 'File is required'
		});
	}

};

var saveThingsInDB = function(queries, callback) {
	return sequelizeDb.transaction(function(t) {
		return sequelizeDb.models.thing.bulkCreate(queries, {
			updateOnDuplicate: ['device_group_id', 'updatedAt']
		});
	}).then(function(resp) {
		callback(null);
	}).catch(function(err) {
		callback(err);
	});
};

var writeLog = function(fs, filePath, logs, logFileName, message, res) {
	if (!fs.existsSync(settings.filesPath.tmp)){
	    fs.mkdirSync(settings.filesPath.tmp);
	}
	fs.writeFile(filePath, logs.join("\n"), function(err) {
		if (message == 'success') {
			return res.json({
				status: 'success',
				message: 'Bulk upload succssfully done.',
				path: '/upload/tmp/' + logFileName
			});
		} else {
			return res.json({
				status: 'fail',
				message: 'Bulk process is failed. Please check log file for more information.',
				path: '/upload/tmp/' + logFileName
			});
		}
	});
};

/**
 * @author NB
 * getTemplate will find template for device identification in thing companywise
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return tempate for things in case of success
 */
exports.getTemplate = function(req, res, next) {
	var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
		res.json({
			status: 'fail',
			message: 'Unknown user'
		});
	}

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
			company_id: userInfo.companyId,
			device_group_id: req.params.dgid,
		}
	}).then(function(template) {
		if (template) {
			var tempArr = {};
			var unitArr = {};
			template.template_attrs.forEach(function(value,key){

				if(trim(value.type) != 'JSON'){
					tempArr[value.localId] = value.name;
				}else{
					var obj = {};
					var sAttr = [];
					value.subattributes.forEach(function(subAttr){
						 sAttr.push(subAttr.name);
					});
					obj[value.name] = sAttr;
					tempArr[value.localId] = obj;
				}
				unitArr[value.localId] = value.unit;
			});
			res.json({
				status: 'success',
				data:{templates:tempArr,templatesUnit:unitArr},
				message: 'Template found.'
			});
		} else {
			res.json({
				status: 'fail',
				message: "Template not found for this device group."
			});
		}
	}).catch(function(err) {
			res.json({
				status: 'fail',
				message: 'Template not found.'
			});
		});
};

var trim = function(value) {
	if (value) {
		return value.trim();
	} else {
		return '';
	}
};

var encryptBase64 = function(value) {
	return new Buffer(value).toString('base64');
};

var decryptBase64 = function(value) {
	return new Buffer(value, 'base64').toString('ascii');
}

exports.getCompanyUsesCount = function(req, res, next) {

	var userInfo = generalConfig.getUserInfo(req);
	var company_id = userInfo.companyId;
	if (!userInfo.companyId) {
		res.json({
			status: 'fail',
			data: null,
			message: 'User information not found'
		});
	}

	companyUses.getParentChildCompanyTotalRecord(company_id, function(totaluses_callback){
			res.json(totaluses_callback);
	})

}

/*
  * Get Timezone list
 */

exports.getTimezoneList  =  function getTimezoneList(req, res)
{
	var timezoneLib = require('../../../../lib/timezone/timezones');
	timezoneLib.getTimezones(function(callback){
		res.json({
			status: true,
			data: callback.data,
			message: 'Timezone list has been loaded successfully'
		});
	});
}


/**
 * @author MK
 * Synchronize user with user_role table
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return success message
 */
exports.syncUserRole = function(req, res, next) {

	sequelizeDb.query("SELECT u.id, u.email, cg.name FROM user u LEFT JOIN company_user_group cug ON cug.user_id = u.id LEFT JOIN company_group cg ON cug.company_group_id = cg.id where u.id NOT IN (SELECT user_id from user_role);"
    ).then(function(data)
    {
    	var result = data[0];
    	var bulkDataArry = [];
    	
		if(result.length > 0)
		{
			async.series([
				function(callback) {
					for (var i = 0; i < result.length; i++) {
						if(result[i].name == 'Admin')
						{
							var roleID = 1;
						}
						else
						{
							var roleID = 2;
						}
						var obj = {
							user_id : result[i].id,
							role_id : roleID
						}
						bulkDataArry.push(obj);	

						if(result.length == i+parseInt(1))
						{
							callback();
						}
					}
				},
				function(callback) {

					var user_role = sequelizeDb.models.user_role;
                    user_role.bulkCreate(bulkDataArry).then(function(result) {
                        res.json({
							status: true,
							data: result,
							message: 'Data synchronize successfully'
						});
                    }).catch(function(err) {
                        res.json({
							status: false,
							data: null,
							message: err
						});
                    });
				}
		    ]);
		}
		else
		{
	    	res.json({
				status: false,
				data: null,
				message: 'Data not found..!'
			});
		}
	});
};
