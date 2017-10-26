var db = require('../../config/sequelize').db;
var DataTypes = require("sequelize");
var generalConfig = require('../../config/generalConfig');
var async = require('async');
//var fs = require('fs-extra');
//var shell = require('shelljs');

/* Common function Lib */
var commonLib = require('../common');

var mqttConnectionUrl = settings.mqttUrl;


var getRequestedData = function getRequestedData(command_id, thingGroup_type, thingGroup_array, company_id, callback)
{
	
	async.waterfall([
		// 1. Get command information
		function(callback_wf) {
			get_command_information(command_id, function(callback_command){
					if(callback_command.status == 'success')
					{
						callback_wf(null, callback_command.data)
					}
					else
					{
						callback_wf({
								status: 'fail',
								data: null,
								message: 'Command information has not been found'
							})
					}
			})
		},
		// 2. Get thing listing
		function(command, callback_wf){
			if(thingGroup_type == '1') // Group
			{
				var group_id = [];
				async.forEachSeries( thingGroup_array, function(group, callback_f1) {
							group_id.push(group.id);
							callback_f1();
				}, function() {
					get_things_by_group(group_id, function(callback_thing_by_group){
						if(callback_thing_by_group.status == 'success')
						{
							callback_wf(null, command, callback_thing_by_group.data)
						}
						else
						{
							callback_wf({
									status: 'fail',
									data: null,
									message: 'Thing information has not been found'
							})
						}
					});
				});
			}
			else if(thingGroup_type == '2') // Thing
			{
				callback_wf(null, command, thingGroup_array);
			}
			else
			{
				callback_wf({
						status: 'fail',
						data: null,
						message: 'Unknow selected Group/Thing type, Please try again.'
					})
			}
		},
		function(command, thing_list, callback_wf)
		{
			apply_command_on_device(command.command, command.id, thing_list, company_id, thingGroup_type, function(callback_apply_command){
					if(callback_apply_command.status == 'success')
					{
						callback_wf(null);
					}
					else
					{
						callback_wf({
								status: 'fail',
								data: null,
								message: 'Call of command on thing has not been completed'
							})
					}
			})
		}
	], function(err, response) {
		// Final Call
		if(err)
		{
			callback(err);
		}
		else
		{
			callback({
					status: 'success',
					data: null,
					message: 'command execution process on thing has been completed successfully'
				})
		}
		
	})
}

var get_command_information = function get_command_information(command_id, callback)
{
	db.models.company_command.findOne( { 
				where: { id: command_id }
			} ).then(function(command) {
		if(command)
		{
			callback({ 
				status: "success",
				data: command,
				message: "command information has been found successfully"
			});
		}
		else
		{
			callback({
				status: "fail",
				data: null,
				message: "command information has not been found successfully"
			});
		}
	}).catch(function(err) {
			console.log(err);
			callback({
				status: "fail",
				data: null,
				message: "command information has not been found successfully"
			});
	});
	
}

var get_things_by_group = function get_things_by_group(group_array, callback)
{
	db.models.thing.findAll( {
			    attributes: ['id', 'name', 'device_group_id'],
				where: { 
						active: true,
						is_dummy: false,
						device_group_id: {
							$in: [group_array]
						}
					}
			} ).then(function(thing) {
		if(thing)
		{
			var thing_list = [];			
			async.forEachSeries( thing, function(thing_in, callback_f1) {
					var temp = {};
					temp.id = thing_in.id;
					temp.name = thing_in.name;
					temp.device_group_id = thing_in.device_group_id;
					thing_list.push(temp);
					callback_f1();
			}, function() {

				callback({ 
					status: "success",
					data: thing_list,
					message: "Thing information has been found successfully"
				});
			});
		}
		else
		{
			callback({
				status: "fail",
				data: null,
				message: "Thing information has not been found successfully"
			});
		}
	}).catch(function(err) {
			console.log(err);
			callback({
				status: "fail",
				data: null,
				message: "Thing information has not been found successfully"
			});
	});
}

var apply_command_on_device = function apply_command_on_device(command, command_id, thing_list, company_id, apply_on, callback)
{

	async.waterfall([
		// Get company information
		function(callback_wf) {
			
			db.models.company.findOne( { 
				attributes: ['id','cpid'],
				where: { id: company_id }
			} ).then(function(company) {
				if(company)
				{
					var company_cpid = company.cpid;
					callback_wf(null, company_cpid);
				}
				else
				{
					callback_wf({
						status: "fail",
						data: null,
						message: "Company information has not been found successfully"
					});
				}
			}).catch(function(err) {
					console.log(err);
					callback_wf({
						status: "fail",
						data: null,
						message: "Company information has not been found successfully"
					});
			});
		},
		// Insert record entry
		function(company_cpid, callback_wf) {

			var apply_command = [];
				apply_command = {
						company_id: company_id,
						apply_on: apply_on,
						command_id: command_id
					}
				// Insert Record
				db.models.command_execution.create(apply_command).then(function(callback_insert) {
					if(callback_insert)
					{
						var insertRecordId = callback_insert.id; // Inserted Record Id
						callback_wf(null, company_cpid, insertRecordId)
					}
					else
					{
						callback_wf({
							status: 'fail',
							data: null,
							message: 'Command record has not been loged successfully'
						});
					}
				}).catch(function(err) {
						console.log(err);
						callback_wf({
							status: 'fail',
							data: null,
							message: 'Command record has not been loged successfully'
						});
				});	
		},
		// Execute command 
		function(company_cpid, record_id, callback_wf)
		{
			var mqtt = require('mqtt');
		    var client  = mqtt.connect(mqttConnectionUrl);
		    var mqttTopic = 'c2d'+company_cpid+'topic';
		    console.log('mqttTopic---'+mqttTopic)
		    client.on('connect', function () {
		    	client.subscribe(mqttTopic);

		    		// Loop of thing
		    		async.forEachSeries( thing_list, function(thing, callback_f1) {
							var thing_id = thing.id;
							var device_group_id = thing.device_group_id;
							
							// Inner WaterFall: Start
							async.waterfall([
								// Inset thing record in log table
								function(callback_w1f) {
									insert_thing_record(record_id, thing_id, device_group_id, function(callback_thing_insert){
											if(callback_thing_insert.status == 'success')
											{
												callback_w1f(null, callback_thing_insert.data);
											}
											else
											{
												callback_f1();
											}
									})
								},
								// Execute command
								function(thing_record_id, callback_w1f) {
									console.log(thing_record_id);
									var json_string_fire_command = {
													 "did": thing_id,
													 "command": command
													}
						       		client.publish(mqttTopic, JSON.stringify(json_string_fire_command), {qos: 1}, function(client_response){
						       				update_thing_status(thing_record_id, '1')
						       		});
						       		callback_w1f(null);
								},
							], function() {
								callback_f1();
							})
							// Inner WaterFall: End

					}, function() {
							callback_wf(null);
					});
			})
		}
	], function(err, response) {
		// Final Call
		if(err)
		{
			callback({
				status: "fail",
				data: null,
				message: "command execution on thing(s) has not been completed"
			})
		}
		else
		{
			callback({
				status: "success",
				data: null,
				message: "command execution on thing(s) has been completed"
			})
		}
	})	
}

var insert_thing_record = function insert_thing_record(execution_record_id, thing_id, device_group_id, callback)
{
	var thing_record = [];
		thing_record = {
				command_execution_id: execution_record_id,
				did: thing_id,
				dgid: device_group_id,
				status: '2'
			}
		// Insert Record
		db.models.command_execution_thing.create(thing_record).then(function(callback_insert) {
			if(callback_insert)
			{
				var insertRecordId = callback_insert.id; // Inserted Record Id
				callback({
					status: 'success',
					data: insertRecordId,
					message: 'Command thing record has been log successfully'
				});
			}
			else
			{
				callback({
					status: 'fail',
					data: null,
					message: 'Command thing record has not been log successfully'
				});
			}
		}).catch(function(err) {
				console.log(err);
				callback({
					status: 'fail',
					data: null,
					message: 'Command thing record has not been log successfully'
				});
		});	
}

var update_thing_status = function update_thing_status(record_id, new_status, callback)
{
	var thing_command_log = [];
		thing_command_log = {
				 status: new_status
			   };

		db.models.command_execution_thing.update( thing_command_log, {
			   where : { id: record_id } 
		}).then(function(rule) {
			if(rule)
			{
				callback({
					status: 'success',
					data: null,
					message: 'Command thing record has been update successfully'
				});
			}
			else
			{
				callback({
					status: 'fail',
					data: null,
					message: 'Command thing record has not been update successfully'
				});
			}
		}).catch(function(err) {
			callback({
					status: 'fail',
					data: null,
					message: 'Command thing record has not been update successfully'
				});
		});
}

module.exports = {
	getRequestedData: getRequestedData,
	get_command_information: get_command_information,
	get_things_by_group: get_things_by_group,
	apply_command_on_device: apply_command_on_device
};