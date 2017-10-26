'use strict';

var generalConfig = require('../../../../config/generalConfig');
var async = require('async');

/* Common function Lib */
var commonLib = require('../../../../lib/common');

var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");

var async = require('async');
var fs = require('fs-extra');

var mqttConnectionUrl = settings.mqttUrl;


/**
  * @author: GK
  * Execute/update/add fireware on devices
  */
exports.executefirmware = function(req, res, next) {
	
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId)
    {
        return res.json({ 
                status: 'fail',
                data: null,
                message: 'Company record not found, Please re-login in portal'
             });
        return false;
    }
    else if(req.body != '')
    {
        req.checkBody('applyOn', 'Select group type required').notEmpty();
        req.checkBody('selectedThingGroup', 'Device/Group listing required').notEmpty();
        req.checkFiles('firmwarefile', 'Firmware file required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }
    
    if(mappedErrors == false)
    {
        var thingGroup_type = req.body.applyOn;
        var thingGroup_array = req.body.selectedThingGroup;
        var firmwarefile = req.files.firmwarefile;
        var company_id = userInfo.companyId;
        
        async.waterfall([
            // Get thing listing
            function(callback_wf) {
                if(thingGroup_type == '1')
                {
                    var group_id = [];
                    async.forEachSeries( thingGroup_array, function(group, callback_f1) {
                                group_id.push(group.id);
                                callback_f1();
                    }, function() {
                        get_things_by_group(group_id, function(callback_thing_by_group){
                            if(callback_thing_by_group.status == 'success')
                            {
                                callback_wf(null, callback_thing_by_group.data)
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
                else if(thingGroup_type == '2')
                {
                    callback_wf(null, thingGroup_array);
                }
                else
                {
                    callback_wf({
                            status: 'fail',
                            data: null,
                            message: 'Unknow selected Group/Thing type, Please try again'
                        })
                }
            },
            // Send file using MQTT of device
            function(thing_list, callback_wf) {
                
                send_firmware_file_on_device(firmwarefile, thing_list, company_id, thingGroup_type, function(callback_apply_firmware){
                        if(callback_apply_firmware.status == 'success')
                        {
                            callback_wf(null);
                        }
                        else
                        {
                            callback_wf({
                                    status: 'fail',
                                    data: null,
                                    message: 'Send firmware file to thing(s) has not been completed'
                                })
                        }
                })
            }
        ], function(err, response) {
            // Final Call
            if(err)
            {
                res.json({
                    status: "fail",
                    data: null,
                    message: "Send firmware file to thing(s) has not been completed"
                })
            }
            else
            {
                res.json({
                    status: "success",
                    data: null,
                    message: "Send firmware file to thing(s) has been completed"
                })
            }
        })


    }
    else
    {
        console.log('--2--')
        res.json({
            status: 'fail',
            data: null,
            message: mappedErrors
        });
    }
	
};

/**
  * @author: GK
  * Get thing listing from group array
  * @param : group_array : List of group array
  *             Exp:  [1111..111, 2222...333, 4444...4444, ....] 
  */
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

/**
  * @author: GK
  * Send firmware to device
  * Update log in MySQL database.
  * @param : file : File Array
  * @param : thing_list : Thing listing Array
  * @param : company_id : Company Id
  * @param : apply_on : Type of request
  */
var send_firmware_file_on_device = function send_firmware_file_on_device(file, thing_list, company_id, apply_on, callback)
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
        // Read firware file
        function(company_cpid, callback_wf)
        {
            var file_name = file.name;
            var tmpPath = file.path;
            fs.readFile( tmpPath, function (err, data) {
                    if(err)
                    {
                        callback_wf({ 
                            status: "fail",
                            data: null,
                            message: "Processing of firmware file has noe been completed. Please try again"
                        });
                        return false;
                    }
                    else
                    {
                        callback_wf(null, company_cpid, data, file_name)
                    }
            })
        },
        // Insert record in log table
        function(company_cpid, file_content, file_name, callback_wf) {

            var firmware_log = [];
                firmware_log = {
                        company_id: company_id,
                        apply_on: apply_on,
                        firmware_file_data: file_content,
                        firmware_file_name: file_name
                    }
                // Insert Record
                db.models.firmware_request_log.create(firmware_log).then(function(callback_insert) {
                    if(callback_insert)
                    {
                        var insertRecordId = callback_insert.id; // Inserted Record Id
                        callback_wf(null, company_cpid, file_content, file_name, insertRecordId)
                    }
                    else
                    {
                        callback_wf({
                            status: 'fail',
                            data: null,
                            message: 'Firmware request has not been inserted in record table'
                        });
                    }
                }).catch(function(err) {
                        console.log(err);
                        callback_wf({
                            status: 'fail',
                            data: null,
                            message: 'Firmware request has not been inserted in record table'
                        });
                }); 

        },
        // Execute command 
        function(company_cpid, file_content, file_name, insert_record_id, callback_wf)
        {
            //console.log('insert_record_id----'+insert_record_id)
            var mqtt = require('mqtt');
            var client  = mqtt.connect(mqttConnectionUrl);
            var mqttTopic = 'c2d'+company_cpid+'topic';
            //console.log('mqttTopic---'+mqttTopic)
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
                                    insert_thing_record(insert_record_id, thing_id, device_group_id, function(callback_thing_insert){
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
                                    
                                    var json_string_fire_firmware = {
                                                     "did": thing_id,
                                                     "logid": thing_record_id,
                                                     "data": file_content,
                                                     "file_name": file_name,
                                                     "type": "firmware"
                                                    }
                                         
                                    client.publish(mqttTopic, JSON.stringify(json_string_fire_firmware) , {qos: 1}, function(client_response){
                                            /*update_thing_log_status(thing_record_id, '1', function(callback_update_record){
                                                    //console.log(callback_update_record);
                                            })*/
                                            callback_w1f(null);
                                    });
                                }
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
            console.log(err);
            callback({
                status: "fail",
                data: null,
                message: "Send firmware file to thing(s) has not been completed"
            })
        }
        else
        {
            callback({
                status: "success",
                data: null,
                message: "Send firmware file to thing(s) has been completed"
            })
        }
    })  
}

/**
  * @author: GK
  * Insert thing record in log table
  * @param : execution_record_id : firmware_request_log record id
  * @param : thing_id : Thing Id
  * @param : device_group_id : Device group id of thing id
  */
var insert_thing_record = function insert_thing_record(execution_record_id, thing_id, device_group_id, callback)
{
    var thing_record = [];
        thing_record = {
                firmware_request_log_id: execution_record_id,
                did: thing_id,
                dgid: device_group_id,
                status: '2'
            }
        // Insert Record
        db.models.firmware_request_thing_log.create(thing_record).then(function(callback_insert) {
            if(callback_insert)
            {
                var insertRecordId = callback_insert.id; // Inserted Record Id
                callback({
                    status: 'success',
                    data: insertRecordId,
                    message: 'firmware file thing record has been log successfully'
                });
            }
            else
            {
                callback({
                    status: 'fail',
                    data: null,
                    message: 'firmware file thing record has not been log successfully'
                });
            }
        }).catch(function(err) {
                console.log(err);
                callback({
                    status: 'fail',
                    data: null,
                    message: 'firmware file thing record has not been log successfully'
                });
        }); 
}

/**
  * @author: GK
  * Update think record log status.
  * @param : record_id : Record id of firmware_request_thing_log
  * @param : new_status : Status id
  */
var update_thing_log_status = function update_thing_log_status(record_id, new_status, callback)
{
    var thing_firmware_log = [];
        thing_firmware_log = {
                 status: new_status
               };

        db.models.firmware_request_thing_log.update( thing_firmware_log, {
               where : { id: record_id } 
        }).then(function(firmware_log) {
            if(firmware_log)
            {
                callback({
                    status: 'success',
                    data: null,
                    message: 'Firmware thing log record has been update successfully'
                });
            }
            else
            {
                callback({
                    status: 'fail',
                    data: null,
                    message: 'Firmware thing log record has not been update successfully'
                });
            }
        }).catch(function(err) {
            console.log(err)
            callback({
                    status: 'fail',
                    data: null,
                    message: 'Firmware thing log record has not been update successfully'
                });
        });
}