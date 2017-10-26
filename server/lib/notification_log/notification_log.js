var db = require('../../config/sequelize').db;
var DataTypes = require("sequelize");
var generalConfig = require('../../config/generalConfig');
var async = require('async');
//var fs = require('fs-extra');
//var shell = require('shelljs');

/* Common function Lib */
var commonLib = require('../common');

/* Cassandra DB */
//var cassandra = require('cassandra-driver');
//var _ = require('lodash');

/*
 * @author : GK
 * @ Notification Log
 * Update all Notification Record
 */
var all_notification_update = function all_notification_update(callback)
{
	/* Get all notification log */
	db.models.notification_log.findAll( 
				{ 
					where: [ "sensor_id is null or sensor_id = ''" ]
				}).then(function(notification_res) {
		if(notification_res)
		{
			// ForEach(1) Start
			async.forEachSeries(notification_res, function(notification, callback_f1) {
						var get_thing_id = notification.thing_id; // Thing Id
						var get_rule_id = notification.rule_id; // Rule Id
						var get_company_id = notification.company_id; // Company Id

						if( (get_thing_id != null && get_thing_id != '') &&
							(get_rule_id != null && get_rule_id != '') &&
							(get_company_id != null && get_company_id != '')
						  )
						{  // Validation False

							// Notification Log Update
							notification_record_information_update(get_thing_id, get_rule_id, get_company_id, function(callback_updateInfo){
									if(callback_updateInfo.status == 'fail')
									{	
									}
									callback_f1();
							});
						
						}
						else // Validation True
						{
							callback_f1();
						}
			}, function() {
			  	// ForEach(1) End
			  	callback({
					status: 'success',
					data: null,
					message: 'Notifications update information process has been completed successfully'
				});
			});
		}
		else
		{
			callback({
				status: 'success',
				data: null,
				message: 'Notification Log record is null'
			});
		}
	}).catch(function(err) {
		callback({
			status: 'fail',
			data: err,
			message: 'Notifications update information process has not been completed successfully'
		});
	}); 
}

/*
 * @author : GK
 * @ Notification Log
 * Update Notification Log Record By Thing ID
 * @param: thing_id = Thing Id
 */
var notification_log_update_by_thing_id = function notification_log_update_by_thing_id(thing_id, callback)
{
	/* Get all notification log */
	db.models.notification_log.findAll( 
				{ 
					where: [ "(sensor_id is null or sensor_id = '') and thing_id = ?", thing_id ]
				}).then(function(notification_res) {
		if(notification_res)
		{
			// ForEach(1) Start
			async.forEachSeries(notification_res, function(notification, callback_f1) {
						var get_thing_id = notification.thing_id; // Thing Id
						var get_rule_id = notification.rule_id; // Rule Id
						var get_company_id = notification.company_id; // Company Id

						if( (get_thing_id != null && get_thing_id != '') &&
							(get_rule_id != null && get_rule_id != '') &&
							(get_company_id != null && get_company_id != '')
						  )
						{  // Validation False

							// Notification Log Update
							notification_record_information_update(get_thing_id, get_rule_id, get_company_id, function(callback_updateInfo){
									if(callback_updateInfo.status == 'fail')
									{	
									}
									callback_f1();
							});
						}
						else // Validation True
						{
							callback_f1();
						}
			}, function() {
			  	// ForEach(1) End
			  	callback({
					status: 'success',
					data: null,
					message: 'Notification update information process has been completed successfully'
				});
			});
		}
		else
		{
			callback({
				status: 'success',
				data: null,
				message: 'Notification Log record is null'
			});
		}
	}).catch(function(err) {
		callback({
			status: 'fail',
			data: err,
			message: 'Notification update information process has not been completed successfully'
		});
	}); 
}

/*
 * @author : GK
 * @ Notification Log
 * Notification Record information Update Process
 * @param: thing_id = Thing Id
 * @param: rule_id = Rule Id
 * @param: company_id = Company Id
 */
var notification_record_information_update = function notification_record_information_update(thing_id, rule_id, company_id, callback)
{
	if( (thing_id != null && thing_id != '') &&
		(rule_id != null && rule_id != '') &&
		(company_id != null && company_id != '')
	  )
	{

		db.query('select rule.id as ruleid, tempAttr.localId as temp_local_id, ( select sensor.id as sensorId from thing as thing left join sensor as sensor on sensor.thing_id = thing.id where thing.id = :thing_id and thing.company_id = :company_id and sensor.localid = tempAttr.localId ) as sensor_id from rule as rule left join rule_detail as ruleDetail on ruleDetail.rule_id = rule.id left join template_attr as tempAttr on ruleDetail.template_attr_parent_id = tempAttr.id where rule.id = :rule_id and rule.company_id = :company_id',
			{ replacements: { thing_id: thing_id, rule_id: rule_id, company_id: company_id }, type: db.QueryTypes.SELECT }
		).then(function(result_data)
		{
				if(result_data)
				{

					// Update Record in Notification Log
					async.forEachSeries(result_data, function(data, callback_f1) {
							var get_sensor_id = data.sensor_id; // Sensor ID
							
							// Update Record
							update_notification_information(thing_id, rule_id, company_id, get_sensor_id, function(update_record_callback){
									if(update_record_callback.status != 'fail')
									{
										callback_f1();
									}
									else
									{
										callback(update_record_callback);
									}
							})
					}, function() {
					  	callback({
							status: 'success',
							data: null,
							message: 'Notification information update process has been completed successfully'
						});
					});

				}
				else
				{
					callback({
						status: 'fail',
						data: null,
						message: 'Sensor & Attribute record has not been found'
					});	
				}

		}).catch(function(err){
			callback({
				status: 'fail',
				data: err,
				message: 'Notification information update process has not been completed successfully'
			});
		});
	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Required parameters has not been passed.'
		});
	}
}

/*
 * @author : GK
 * @ Notification Log
 * Update notification Information
 * @param: thing_id = Thing Id
 * @param: rule_id = Rule Id
 * @param: company_id = Company Id
 * @param: sensor_id = Sensor Id
 */
var update_notification_information = function update_notification_information(thing_id, rule_id, company_id, sensor_id, callback)
{

	if( (thing_id != null && thing_id != '') &&
		(rule_id != null && rule_id != '') &&
		(company_id != null && company_id != '') &&
		(sensor_id != null && sensor_id != '')
	  )
	{
		// Update Record
		var notification_record = [];
        notification_record = {
            sensor_id: sensor_id
        }
        db.models.notification_log.update( notification_record, {
               	where : { 
               				company_id: company_id,
               				thing_id: thing_id,
               				rule_id: rule_id
                       	}}).then(function(notification_update) {
            if(notification_update)
            {
            	callback({
					status: 'success',
					data: null,
					message: 'Notification information update process has been completed successfully'
				});
        	}
            else
            {
             	callback({
					status: 'fail',
					data: null,
					message: 'Notification information update process has not been completed successfully'
				});
            }
	    }).catch(function(err) {
	    	 callback({
				status: 'fail',
				data: err,
				message: 'Notification information update process has not been completed successfully'
			});
	    });

	}
	else
	{
		callback({
			status: 'fail',
			data: null,
			message: 'Required parameters has not been passed.'
		});
	}
} 

module.exports = {
	all_notification_update: all_notification_update,
	notification_log_update_by_thing_id: notification_log_update_by_thing_id,
	notification_record_information_update: notification_record_information_update,
	update_notification_information: update_notification_information
};