'use strict';

var notification_log_lib = require('../../../../lib/notification_log/notification_log');
var cassandra = require('cassandra-driver');
var async = require('async');
var companyUses = require('../../../../lib/usage/usage');
var commonLib = require('../../../../lib/common');
var thingDummyData = require('../../../../lib/thing_dummy_data/thing_dummy_data');
var commandExecution = require('../../../../lib/command_execution/command_execution');

/**
 * @author NB
 * @changed GK
 * getInactiveThings() will load inactive thing in company
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return  inactive thing list
 */
exports.getInactiveThings = function(req, res, next) {

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information not found.'
        });
    }

    var companyId = userInfo.companyId;
    if (!companyId) {
        res.json({
            status: 'fail',
            data: null,
            message: 'Company information not found'
        });
    }

    var sortBy = req.body.params.sortBy;
    var sortOrder = req.body.params.sortOrder;
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;
    var serachWhere = '';

     // Sorting
    if(sortBy == 'thingName') { sortBy = 'thing.serial_number'; }
    else if(sortBy == 'deviceName') { sortBy = 'device_group.name'; }
    else { sortBy = 'thing.createdAt'; }

    // Pagination
    if(pageNumber == '') { pageNumber = pageNumber; }
    else { pageNumber = (pageNumber - parseInt(1)) * pageSize; }

    // Condition
    if (req.body.searchParams && req.body.searchParams.searchTxt != undefined && req.body.searchParams.searchTxt != "") {
        serachWhere = '( `thing`.`serial_number` LIKE :searchTxt OR `device_group`.`name` like :searchTxt ) and';
    }

    // Fetch Value
    sequelizeDb.query("SELECT device_group.name as groupName, thing.serial_number as serial_number, thing.status, thing.id , ( SELECT count(*) FROM `thing` AS `thing` LEFT JOIN `device_group` AS `device_group` ON `thing`.`device_group_id` = `device_group`.`id` WHERE "+serachWhere+" `thing`.`active` = false AND `thing`.`company_id` = :company_id AND `thing`.`deletedAt` IS NULL ) as totalCount FROM `thing` AS `thing` LEFT JOIN `device_group` AS `device_group` ON `thing`.`device_group_id` = `device_group`.`id` WHERE "+serachWhere+" `thing`.`active` = false AND `thing`.`company_id` = :company_id AND `thing`.`deletedAt` IS NULL ORDER BY "+sortBy+" "+sortOrder+" LIMIT :pageSize OFFSET :offset",
        { replacements: { company_id: companyId, searchTxt: '%'+req.body.searchParams.searchTxt+'%', pageSize: pageSize, offset: pageNumber }, type: sequelizeDb.QueryTypes.SELECT }
    ).then(function(thing)
    {
        if(thing.length > 0) // Result Found
        {
            var thingAry = [];
                thingAry = {
                    count: thing[0].totalCount,
                    rows: thing
                }

            res.json({
                    status: 'success', // 200
                    data: thingAry,
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

};


/**
 * @author NB
 * getActiveThings() will load inactive thing in company
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return  inactive thing list
 */
exports.getActiveThings = function(req, res) {
    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data:null,
            message: 'Unknown user.'
        });
    }

    var companyId = userInfo.companyId;
    var sortBy = req.body.params.sortBy;
    var sortOrder = req.body.params.sortOrder;
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;
    var searchParams = new Array();

    if (req.body.searchParams && req.body.searchParams.searchTxt != undefined && req.body.searchParams.searchTxt != "") {
        searchParams.push({
            name: {
                $like: '%' + req.body.searchParams.searchTxt + '%'
            }
        });
        searchParams.push({
            serial_number: {
                $like: '%' + req.body.searchParams.searchTxt + '%'
            }
        });
        searchParams.push({
            model: {
                $like: '%' + req.body.searchParams.searchTxt + '%'
            }
        });
    }
    if (searchParams.length == 0) {
        var whereval = {
            active: true,
            company_id: companyId
        };
    } else {
        var whereval = {
            active: true,
            company_id: companyId,
            $or: searchParams
        };
    }
    sequelizeDb.models.thing.findAndCountAll({
        where: whereval,
        attributes: Object.keys(sequelizeDb.models.thing.attributes).concat([
            [sequelizeDb.literal('(select count(*) from notification_log where `notification_log`.`thing_id` = `thing`.`id`)'), 'notifications']
        ]),
        order: sortBy + ' ' + sortOrder,
        offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
        limit: pageSize
    }).then(function(thing) {
        if (thing) {
            res.json({
                status: 200,
                data: thing,
                message: 'Data loaded successfully.'
            });
        } else {
            res.json({
                status: 401,
                data:null,
                message: 'No records found'
            });
        }
    }).catch(function(err) {
        res.json({
            status: 'fail',
            message: 'Failed to load things.',
            data:null
        });
    });

}

/**
 * @author HY
 * getThingList() will thing list in company (used for webservice call)
 * @param  {obj}   req
 * @param  {obj}   res
 * @return  active thing list
 */
exports.getThingList = function(req, res) {
    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data:null,
            message: 'Unknown user.'
        });
    }

    //get db name
    sequelizeDb.models.company.findOne({
        attributes: ['id', 'database_name'],
        where: {
            id: userInfo.companyId
        }
    }).then(function(company) {
        if (company) {

            sequelizeDb.models.thing.findAll({
                attributes : ["id","name","serial_number","active","status","lat","lng", [sequelizeDb.literal('(select count(*) from notification_log where `notification_log`.`thing_id` = `thing`.`id`)'), 'notifications']],
                where: {
                    company_id : userInfo.companyId,
                    //active: true,
                },
            }).then(function(things) {
                if (things && things.length > 0) {

                    getLastCommunication(company.database_name, things, function(result) {

                        if(result.status) {

                            return res.json({
                                status: 'success',
                                data: result.things,
                                message: 'Data loaded successfully.'
                            });
                        } else {

                            return res.json({
                                status: 'fail',
                                message: result.message,
                                data:null
                            });
                        }

                    });

                } else {
                    res.json({
                        status: 'success',
                        data : things,
                        message: 'No records found'
                    });
                }
            }).catch(function(err) {
                res.json({
                    status: 'fail',
                    message: 'Failed to load things.',
                    data:null
                });
            });

        } else {
            return res.json({
                status: "fail",
                data:null,
                message: "Company not found"
            });
        }
    }).catch(function(err) {
        return res.json({
            status: "fail",
            message: "Error in finding company detail",
            data: null
        });
    });

}


/**
 * @author HY
 * get things last communication datetime
 */
var getLastCommunication = function(dbName, things, callback) {

    var db = require('../../../../config/cassandra');
    db.client.connect(function(err, result) {
        if (err) {
            callback({
                status : false,
                message: 'There was some problem in loading data, please contact administrator',
                error: err
            });            
        }
        else 
        {
            //var totalthingchecks = ((things.length==1)? 1 : things.length - 1);
            var totalthingchecks = things.length;
            var itemsProcessed = 0;
            for(var i = 0; i < things.length; i++) {

                (function(i) {

                    var companyDbName = dbName;
                    var table_core_name = 'sensordatav3';
                    var thing_id = things[i].id;
                
                    var dataselquery = "SELECT sensorreceiveddate, data FROM "+companyDbName+"."+table_core_name+" WHERE deviceId="+thing_id+" limit 1 ALLOW FILTERING";
                    return db.client.execute(dataselquery, function(err, sensorData) {
                        if(err)
                        {
                            callback({
                                status : false,
                                message: "Unable to get thing data",
                                error: err,
                                thing: things[i]
                            });                            
                        }
                        else
                        {
                            if (sensorData && sensorData.rows.length > 0) {
                                things[i].setDataValue('is_connected', true);
                                things[i].setDataValue('last_communicated_on', generalConfig.toTimeZone(sensorData.rows[0].sensorreceiveddate,'utc'));

                            } else {

                                things[i].setDataValue('is_connected', false);
                            }

                            itemsProcessed++;
                            
                            if (itemsProcessed == totalthingchecks) {
                                callback({
                                    status : true,
                                    message: "Last communication detail added to each thing in list",
                                    things: things
                                });
                            }
                        }
                    });

                })(i);

            }

        }
    });

};


/**
 * @author NB
 * addThing() will register new  thing in company
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 */
exports.addThing = function(req, res, next) {
    if (req.body != "") {
        req.checkBody('serial_number', 'Serial Number is required').notEmpty();
        //req.checkBody('cpid', 'Cpid  is required').notEmpty();
        req.checkBody('device_group_id', 'Group is required').notEmpty();
        req.checkBody('trial_id', 'Trial Id  is required').notEmpty();
        req.checkBody('patient_id', 'Patient Id is required').notEmpty();
        req.checkBody('device_master_id', 'Patient Id is required').notEmpty();

        var mappedErrors = req.validationErrors(true);
    }
    if (mappedErrors == false) {
        var cassandra = require("cassandra-driver");
        var id = cassandra.types.uuid();

        //Get userinfo from request
        var userInfo = generalConfig.getUserInfo(req);
        if (!userInfo.companyId) {
            return res.json({
                status: 'fail',
                message: 'Unknown user',
                data: null
            });
        }
        var companyId = userInfo.companyId;
        var patientId;

        sequelizeDb.models.patient.find({
            where:{
                user_id: req.body.patient_id
            }
        }).then(function(data){
            //patientId = data.dataValues.id;
            patientId = req.body.patient_id;
            sequelizeDb.models.thing.find({
                where: {
                    serial_number: req.body.serial_number
                }
            }).then(function(thing) {
                var thing = {};
                thing["serial_number"] = req.body.serial_number.trim();
                thing["name"] = req.body.serial_number.trim();
                thing["device_group_id"] = req.body.device_group_id;
                thing["company_id"] = companyId;
                thing["active"] = false;
                thing["trial_id"] = req.body.trial_id;
                thing["patient_id"] = patientId;
                thing["device_master_id"] = req.body.device_master_id;
                                
                console.log(thing);
                var sensorArray = [];

                sequelizeDb.models.thing.create(thing).then(function(FindThing) {

                    sequelizeDb.models.template.findOne({
                        where: {
                            device_group_id: FindThing.device_group_id
                        }
                    }).then(function(templateResult){
                        sequelizeDb.models.template_attr.findAll({
                            where: {
                                template_id: templateResult.id
                            }
                        }).then(function(templateAttrResult){
                            
                            for( var i=0; i<templateAttrResult.length; i++) {
                                
                                var sensorData = {
                                    "company_id": companyId,
                                    "name": templateAttrResult[i].dataValues.name,
                                    "description": templateAttrResult[i].description,
                                    "thing_id": FindThing.id,
                                    "localid": templateAttrResult[i].dataValues.localId,
                                    "serial_number": FindThing.serial_number
                                };
                                
                                sensorArray.push(sensorData);
                            }
                            sequelizeDb.models.sensor.bulkCreate(sensorArray).then(function(result){
                                res.json({
                                    status: true,
                                    message: 'Thing has been registered & active successfully and move on active thing listing',
                                    data: {
                                        template: templateResult,
                                        templateAttr: templateAttrResult,
                                        thing: FindThing
                                    }   
                                });
                            });
                        });
                    })
                }).catch(function(err) {
                        console.log(err);
                    return res.json({
                        status: false,
                        data:null,
                        message: 'Failed to register thing'
                    });
                });
            }).catch(function(err) {
                console.log(err);
                return res.json({
                    status: 'fail',
                    data:null,
                    message: 'Failed to register thing'
                });
            });
        });
    } else {
        res.json({
            status: 'fail',
            data:null,
            message: mappedErrors
        });
    }
};

exports.updateThing = function(req, res, next) {

    var id = req.params.id || null;
    if (!id) {
        return res.json({
            status: "fail",
            data:null,
            message: 'Unknown thing.'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: 'fail',
            message: 'Unknown user',
            data: null
        });
    }
    var companyId = userInfo.companyId;

    if (req.body != "") {
        req.checkBody('name', 'Name required').notEmpty();
        req.checkBody('serial_number', 'Serial Number is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {
        var thing = req.body;
        thing.firmware = JSON.stringify(thing.firmware);
        thing.additional_info = JSON.stringify(thing.additional_info);
        sequelizeDb.models.thing.update(thing, {
            where: {
                id: id,
                company_id: companyId
            }
        }).then(function(updatedThing) {
            if (updatedThing) {
                generalConfig.mqttPublishMessage(companyId);
                res.json({
                    status: 'success',
                    data:null,
                    message: 'Thing has been updated successfully.'
                });
            } else {
                res.json({
                    status: 'fail',
                    data:null,
                    message: 'Failed to update thing' + req.body.id
                });
            }
        }).catch(function(err) {
            console.log(err);
            res.json({
                status: 'fail',
                data: null,
                message: 'Failed to update thing ' + req.body.id
            });
        });
    } else {
        res.json({
            status: 'fail',
            data:null,
            message: mappedErrors
        });
    }

};



/**
 * @author NB
 * change thing status
 */

exports.changeThingStatus = function(req, res, next) {
    var id = req.params.thingId || null;

    if (!id) {
        return res.json({
            status: "fail",
            data:null,
            message: 'Unknown thing'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            data:null,
            message: 'Unknown user'
        });
    }

    if (req.body != "") {
        req.checkBody('activate', 'Activate required').notEmpty();
        req.checkBody('serial_number', 'Serial number is required.').notEmpty();
        req.checkBody('is_sample', 'Status of sample data for thing is required.').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {

        var status = req.body.activate != true ? '3' : '2';
        var serialNumber = req.body.serial_number;

        if(req.body.is_sample) // This thing is sample(dummy) thing
        {
            console.log('-1-')
            thingDummyData.thing_dummy_data_status_change(id, req.body.activate, userInfo.companyId, function(dummy_data_status_change_callback){
                    res.json(dummy_data_status_change_callback);
            })
        }
        else  // Ragular thing
        {
            console.log('-2-')
            commonLib.getCompanyInfoById(userInfo.companyId, function(companyResponse){
                if(companyResponse.status == 'success') {
                    if(companyResponse.data){
                        if(companyResponse.data.cpid){
                            var mqtt = require('mqtt');
                            var mqttClient = mqtt.connect(settings.mqttUrl);
                            var c2dtopic = "c2d"+companyResponse.data.cpid+"topic";
                            var d2ctopic = "d2c"+companyResponse.data.cpid+"topic";
                            mqttClient.subscribe(d2ctopic);
                            mqttClient.on('connect', function(){
                                mqttClient.publish(c2dtopic, JSON.stringify({
                                    did: id,
                                    command: status == '2' ? 'start_data_sending':'stop_data_sending'
                                }));
                            });
                            mqttClient.on("message", function(topic, payload) {
                                if(topic == d2ctopic){
                                    var thingObj = JSON.parse(payload.toString());

                                    if(thingObj.ack == 'true' && thingObj.did == id && thingObj.cpid == companyResponse.data.cpid){
                                        mqttClient.end(false);
                                        var thing = {
                                            status: status
                                        };
                                        //update thing
                                        return sequelizeDb.models.thing.update(thing, {
                                            where: {
                                                id: id,
                                                company_id: userInfo.companyId,
                                                serial_number: serialNumber
                                            }
                                        }).then(function(updatedThing) {
                                            if (updatedThing) {
                                                /*var command = 'thing_start';
                                                if (!active) {
                                                    command = 'thing_stop';
                                                }*/
                                                //publish mqtt message to device
                                                //generalConfig.mqttPublishMessage(userInfo.companyId);
                                                //generalConfig.mqttRegisterThing(id, serialNumber, command);
                                                if(status == '2'){
                                                    return res.json({
                                                        status: 'success',
                                                        data:null,
                                                        message: 'Thing has been activated successfully.'
                                                    });

                                                }else{
                                                    return res.json({
                                                        status: 'success',
                                                        data:null,
                                                        message: 'Thing has been deactivated successfully.'
                                                    });
                                                }
                                            } else {
                                                return res.json({
                                                    status: 'fail',
                                                    data: null,
                                                    message: 'Failed to change status of the thing.'
                                                });
                                            }

                                        }).catch(function(err) {
                                            return res.json({
                                                status: 'fail',
                                                data: null,
                                                message: 'Failed to change status of the thing.'
                                            });
                                        });
                                    }
                                }
                            });
                            setTimeout(function(){
                                if(res){
                                    return res.json({
                                        status: 'fail',
                                        data: null,
                                        message: 'Failed to change status of the thing.'
                                    });
                                }
                            },2000);
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
                        message: 'Failed to change status of the thing.'
                    });
                }
            });
        }
    } else {
        res.json({
            status: "fail",
            data:null,
            message: mappedErrors
        });
    }

};

/**
 * @author NB
 * regenerate username and password for the thing
 */
// exports.regenerateCredentials = function(req, res, next) {
//     var id = req.params.id || null;

//     if (!id) {
//         return res.json({
//             status: "fail",
            
//             message: 'Unknown thing'
//         });
//     }

//     //Get userinfo from request
//     var userInfo = generalConfig.getUserInfo(req);
//     if (!userInfo.companyId) {
//         return res.json({
//             status: "fail",
//             message: 'Unknown user'
//         });
//     }

//     var username = Math.random().toString(36).slice(-6);
//     var password = Math.random().toString(36).slice(-6);
//     var query = "Update things set user = ?, password = ? where id = ?;";

//     sequelizeDb.client.execute(query, [username, password, id], {
//         prepare: true
//     }, function(err, result) {
//         if (err) {
//             return res.json({
//                 status: "fail"
//             });
//         }

//         //publish mqtt message to device
//         generalConfig.mqttPublishMessage(userInfo.companyId);
//         res.json({
//             status: "success",
//             data: {
//                 username: username,
//                 password: password
//             }
//         });
//     });
// };


exports.deleteThing = function(req, res, next) {
    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: 'fail',
            data:null,
            message: 'Unknown user'
        });
    }
    var companyId = userInfo.companyId;
    var thing_id = req.params.id;

    async.waterfall([
        // 1. Change thing status
        function(callback_wf) {
            sequelizeDb.models.thing.findOne({
                attributes: ['id', 'is_dummy'],
                where: {
                    company_id: companyId,
                    id: thing_id
                }
            }).then(function(thing_info) {
                if(thing_info)
                {
                    callback_wf(null, thing_info);
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
        // 2. If thing is sample thing then deactive thing (Stop simulator)
        function(thing_info, callback_wf) {
             if(thing_info.is_dummy)
             {
                thingDummyData.thing_dummy_data_status_change(req.params.id, false, companyId, function(deactive_device){
                        if(deactive_device.status == 'success')
                        {
                            callback_wf(null);
                        }
                        else
                        {
                            callback_wf({
                                status: 'fail',
                                data: null,
                                message: 'Failed to delete the thing'
                            });
                        }    
                })
             }
             else
             {
                callback_wf(null);
             }
        },
        // 3. Remove thing
        function(callback_wf) {
            sequelizeDb.models.thing.destroy({
                where: {
                    id: req.params.id,
                    company_id: companyId
                }
            }).then(function(response) {
                if (response) {
                    // sequelizeDb.models.sensor.destroy({
                    //     where: {
                    //         thing_id: {
                    //             $eq: req.params.id
                    //         },
                    //         company_id: companyId
                    //     }
                    // }).then(function(deleteSensor) {
                        callback_wf({
                            status: 'success',
                            data:null,
                            message: 'Thing has been deleted successfully'
                        });
                    // });
                } else {
                    callback_wf({
                        status: 'fail',
                        data:null,
                        message: 'Thing not found.'
                    });
                }
            }).catch(function(err) {
                callback_wf({
                    status: 'fail',
                    message: 'Failed to delete the thing',
                    data:null
                });
            });
        }
    ], function(response) {
        return res.json(response);
    })
};

exports.getThingById = function(req, res, next) {
    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            data:null,
            message: 'Unknown user'
        });
    }

    sequelizeDb.models.thing.associate(sequelizeDb.models);

    //get db name
    sequelizeDb.models.company.findOne({
        attributes: ['id', 'database_name'],
        where: {
            id: userInfo.companyId
        }
    }).then(function(company) {
        if (company) {

            sequelizeDb.models.thing.findOne({
                include: [{
                    model: sequelizeDb.models.device_group,
                    attributes: ['name'],
                }],                            
                where: {
                    id: req.params.id,
                    company_id: userInfo.companyId
                }
            }).then(function(findThing) {

                var things = [];
                things.push(findThing);


                // Set WaterFall
                    async.waterfall([
                        // 1. Get Device Group id
                        function(callback_wf) {
                            // Get device group which have template based on thing selected device group id
                            commonLib.getGroupIdWhichHaveTemplate( findThing.device_group_id, function(getTemplateGroupId_callback){
                                    if(getTemplateGroupId_callback.status == 'success')
                                    {
                                        things[0].setDataValue('template_device_group_id', getTemplateGroupId_callback.data.group_id )
                                        callback_wf(null);
                                    }
                                    else
                                    {
                                        callback_wf(getTemplateGroupId_callback);
                                    }
                            })
                        },
                        // 2. Get last communication date of thing
                        function(callback_wf) {
                            getLastCommunication(company.database_name, things, function(result) {
                                if(result.status)
                                {
                                    callback_wf(null, result.things[0])
                                }
                                else
                                {
                                    // Throw error in cassandra response
                                    callback_wf(null, things[0])
                                }
                            });    
                        }
                    ], function(err, response) {
                        if(err)
                        {
                            return res.json(err)
                        }
                        else
                        {
                            return res.json({
                                        status: 'success',
                                        data: response,
                                        message: 'Data loaded successfully.'
                                    });
                        }
                    })


                // Get device group which have template based on thing selected device group id
                /*commonLib.getGroupIdWhichHaveTemplate( findThing.device_group_id, function(getTemplateGroupId_callback){
                        if(getTemplateGroupId_callback.status == 'success')
                        {
                            things[0].setDataValue('template_device_group_id', getTemplateGroupId_callback.data.group_id )


                            // Get last communication date of thing
                            getLastCommunication(company.database_name, things, function(result) {
                                if(result.status) {
                                    return res.json({
                                        status: 'success',
                                        data: result.things[0],
                                        message: 'Data loaded successfully.'
                                    });
                                } else {
                                    return res.json({
                                        status: 'fail',
                                        message: result.message,
                                        data:null
                                    });
                                }
                            });
                        }
                        else
                        {
                            res.json(getTemplateGroupId_callback);
                        }
                })*/

            }).catch(function(err) {
                res.json({
                    status: 'fail',
                    data:null,
                    message: 'Failed to find thing ' + req.params.id
                });
            });
        } else {
            return res.json({
                status: "fail",
                data:null,
                message: "Company not found"
            });
        }

    }).catch(function(err) {
        return res.json({
            status: "fail",
            message: "Error in finding company detail",
            data: null
        });
    });

};

/**
 * @author GK
 * Update Notification log of required thing
 */
exports.updateNotification = function(req, res, next) {
    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            data:null,
            message: 'Unknown user'
        });
    }

    var thing_id = req.params.thingId; // Thing ID
    if(thing_id)
    {
        // Update Notification Log
        notification_log_lib.notification_log_update_by_thing_id(thing_id, function(callback){
                res.json(callback);
        })
    }
    else
    {
        res.json({
            status: 'fail',
            data:null,
            message: 'Thing id has not been found'
        });
    }
};

/**
 * @author NB
 * exportHistoricalData will export historical sensors data in csv or json 
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return historical data of the thing in case of success
 */
/*exports.exportHistoricalData = function(req, res, next) {
        var userInfo = generalConfig.getUserInfo(req);
        if (!userInfo.companyId) {
            res.json({
                status: 'fail',
                data: null,
                message: 'Unknown user'
            });
        }

        //get db name
        sequelizeDb.models.company.findOne({
            attributes: ['id', 'database_name'],
            where: {
                id: userInfo.companyId
            }
        }).then(function(company) {
            if (company) {
                var telemetry = require('../../../../config/telemetrySequelize');
                return telemetry.db(company.database_name, function(err, telemetryDb) {
                    if (err) {
                        res.json({
                            status: "fail",
                            message: "Fail to load data"
                        });
                    } else {
                        return telemetryDb.models.sensordatav3.findAndCountAll({
                            attributes: [[sequelizeDb.fn('date_format',sequelizeDb.col('receivedDate'),'%Y-%m-%d %H:%i:%s'), 'receivedDate'],'data'],
                            where: ["deviceid = ? and date_format(receivedDate,'%Y-%m-%d') >= ? and date_format(receivedDate,'%Y-%m-%d') <= ?", req.body.id, req.body.frmDate, req.body.toDate],
                            order: "receivedDate desc"
                        }).then(function(sensorData) {
                            if (sensorData && sensorData.count>0) {
                                var fs = require('fs-extra');
                                var logFileName = new Date().getTime();
                                var filePath = settings.filesPath.tmp + logFileName;

                                if (!fs.existsSync(settings.filesPath.tmp)){
                                    fs.mkdirSync(settings.filesPath.tmp);
                                }

                                if(req.params.exporttype !='json'){
                                    var fields = ['receivedDate', 'data'];
                                    var json2csv = require('json2csv');
                                    var csv = json2csv({ data: sensorData.rows, fields: fields});
                                    //
                                    // //
                                    //
                                    fs.writeFile(filePath+'.csv',csv, function(err) {
                                            return res.json({
                                                status: 'success',
                                                message: 'Data is exported successfully',
                                                path: '/upload/tmp/' + logFileName+'.csv'
                                            });
                                    });
                                }else{
                                    var replacer = function(key,value)
                                    {
                                        if (key=="data") {
                                            return JSON.parse(value);
                                        }else{
                                            return value;
                                        }
                                    }
                                    fs.writeFile(filePath+'.json',JSON.stringify(sensorData.rows, replacer), function(err) {
                                        return res.json({
                                            status: 'success',
                                            message: 'Data is exported successfully',
                                            path: '/upload/tmp/' + logFileName+'.json'
                                        });
                                    });
                                }
                            } else {
                                return res.json({
                                    status: 200,
                                    data: [],
                                    message: 'No Records Found!'
                                });
                            }

                        }).catch(function(err) {
                            return res.json({
                                status: "fail",
                                data: null,
                                message: "Fail to export data."
                            });
                        });

                    }
                });
            } else {
                return res.json({
                    status: "fail",
                    data: null,
                    message: "Fail to export data."
                });
            }
        }).catch(function(err) {
            res.json({
                status: "fail",
                data: null,
                message: "Fail to export data."
            });
        });
};*/



exports.exportHistoricalData = function(req, res, next) {
    var userInfo = generalConfig.getUserInfo(req);
    
    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data: null,
            message: 'Unknown user'
        });
    }
    var companyId = userInfo.companyId;
    var userId = userInfo.id;
    var deviceId = req.body.id;

    sequelizeDb.models.company.hasOne(sequelizeDb.models.user, {
        foreignKey: 'company_id',
         as: 'user'
    });
    
          //get db name
    sequelizeDb.models.company.findOne({
        attributes: ['id', 'database_name'],
        include: [{
            model: sequelizeDb.models.user,
            attributes: ['timezone'],
            where: {id:userId} ,            
            required: true
          }] , 
        where: {
            id: companyId
        }
    }).then(function(company) {
        if (company) {
            var tableName = company.database_name + ".sensordatav3";
            var dbCassandra = require('../../../../config/cassandra');
            var dateFormat = require('dateformat');
            var query = "select toUnixTimestamp(sensorreceiveddate) as sensorreceiveddate,data from "+ tableName + " where companyId=? and deviceid=? and sensorreceivedDate>=? and sensorreceivedDate < ?  allow filtering;";            
            var timezone = company.users[0].timezone;
            var frmDate = generalConfig.convertUTCDate(req.body.frmDate, timezone);
            var toDate = generalConfig.convertUTCDate(req.body.toDate, timezone);
            toDate.setDate(toDate.getDate() + 1);
            dbCassandra.client.execute(query,[companyId, deviceId, frmDate, toDate],{prepare:true},function(err,response){
                if (err) {
                    return res.json({
                        status: "fail",
                        data: null,
                        message: "Fail to export data."
                    });
                }

                if (response.rowLength > 0) {
                    var fs = require('fs-extra');
                    var logFileName = new Date().getTime();
                    var filePath = settings.filesPath.tmp + logFileName;

                    if (!fs.existsSync(settings.filesPath.tmp)){
                        fs.mkdirSync(settings.filesPath.tmp);
                    }

                    if(req.params.exporttype !='json'){
                        var fields = ['sensorreceiveddate', 'data'];
                        var json2csv = require('json2csv');
                        response.rows.forEach(function(v,k){  
                            var d1  = generalConfig.toTimeZone(dateFormat(parseInt(response.rows[k].sensorreceiveddate), "yyyy-mm-dd HH:MM:ss"), timezone);
                            response.rows[k].sensorreceiveddate = generalConfig.toTimeZone(dateFormat(parseInt(response.rows[k].sensorreceiveddate), "yyyy-mm-dd HH:MM:ss"), timezone);
                        });
                        var csv = json2csv({ data: response.rows, fields: fields});

                        fs.writeFile(filePath+'.csv',csv, function(err) {
                                return res.json({
                                    status: 'success',
                                    data:null,
                                    message: 'Data is exported successfully',
                                    path: '/upload/tmp/' + logFileName+'.csv'
                                });
                        });
                    }else{
                        var replacer = function(key,value)
                        {
                            if (key=="sensorreceiveddate") {
                                //value = new Date(parseInt(value));
                                //return dateFormat(value, "UTC:yyyy-mm-dd h:MM:ss TT");
                                return generalConfig.toTimeZone(dateFormat(parseInt(value), "yyyy-mm-dd h:MM:ss"), timezone)
                            }else if (key=="data") {
                                return JSON.parse(value);
                            }else{
                                return value;
                            }
                        }
                        fs.writeFile(filePath+'.json',JSON.stringify(response.rows, replacer), function(err) {
                            return res.json({
                                status: 'success',
                                data:null,
                                message: 'Data is exported successfully',
                                path: '/upload/tmp/' + logFileName+'.json'
                            });
                        });
                    }
                } else {
                    return res.json({
                        status: 200,
                        data: [],
                        message: 'No Records Found!'
                    });
                }
            });
        } else {
            return res.json({
                status: "fail",
                data: null,
                message: "Failed to export data."
            });
        }
    }).catch(function(err) {
        res.json({
            status: "fail",
            data: null,
            message: "Failed to export data."
        });
    });
};


/**
 * @author NB
 * getHistoricalGraphData will return historical sensors data for drawing graph
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return historical data of the thing in case of success
 */
exports.getHistoricalGraphData = function(req, res, next) {
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data: null,
            message: 'Unknown user'
        });
    }
    var companyId = userInfo.companyId;

    var deviceId = req.params.thingId;
    var userId = userInfo.id;
    var fs = require('fs-extra');
    var logFileName = companyId+".json";
    var filePath = settings.filesPath.cassHistData +  "/" + companyId;
    filePath =  filePath + "/" +  logFileName;
    fs.readFile(filePath, 'utf8', function(err, contents) {
        if(err){            
            commonLib.getHistoricalDataCompanyWise(companyId, userId, deviceId, function(result){
                if(result.status == 'success'){
                    if(result.data && result.data.length>0){
                            var allData = JSON.parse(result.data);
                            var data = [];
                            var len = allData.length;
                            var i = 0;
                            allData.forEach(function(val,k){
                                i++;
                                if(i == len){
                                    return res.json({
                                        status:'success',
                                        data:data,
                                        message:"Data loaded successfully."
                                    });
                                }

                                if(val.deviceid == deviceId){
                                    data.push(val);
                                }
                            });
                    } else {
                        return res.json({
                            status:'success',
                            data:[],
                            message:"Data loaded successfully."
                        });
                    }
                }else{
                    return res.json({
                        status:'fail',
                        data:null,
                        message:"Failed to get historical data.Please click on refresh button to get data."
                    })
                }
            });
        }else {
            if(contents && contents.length>0){
                var allData = JSON.parse(contents);
                var data = [];
                var len = allData.length;
                var i = 0;
                allData.forEach(function(val,k){
                    i++;
                    if(i == len){
                        return res.json({
                            status:'success',
                            data:data,
                            message:"Data loaded successfully."
                        });
                    }

                    if(val.deviceid == deviceId){
                        data.push(val);
                    }
                });
            } else {
                return res.json({
                    status:'success',
                    data:[],
                    message:"Data loaded successfully."
                });
            }
        }
    });
};

exports.refreshHistoricalGraphData = function(req,res,next){
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.companyId){
        res.json({
            status:'fail',
            data:null,
            message: 'Unknown user'
        });
    }

    var companyId = userInfo.companyId;
    var userId = userInfo.id;
    var deviceId = req.params.thingId;
    commonLib.getHistoricalDataCompanyWise(companyId, userId, deviceId, function(result){
        if(result.status == 'success'){
            if(result.data && result.data.length>0){
                    var allData = JSON.parse(result.data);
                    var data = [];
                    var len = allData.length;
                    var i = 0;
                    allData.forEach(function(val,k){
                        i++;
                        if(i == len){
                            return res.json({
                                status:'success',
                                data:data,
                                message:"Data loaded successfully."
                            });
                        }

                        if(val.deviceid == deviceId){
                            data.push(val);
                        }
                    });
            } else {
                return res.json({
                    status:'success',
                    data:[],
                    message:"Data loaded successfully."
                });
            }
        }else{
            return res.json({
                status:'fail',
                data:null,
                message:"Failed to get historical data.Please click on refresh button to get data."
            })
        }
    });
};

/**
 * @author HY
 * getHistoricalData will list weekly avg data of specific sensor, used for webservice only
 */
exports.getHistoricalData = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data: null,
            message: 'Unknown user'
        });
    }

    //get db name
    sequelizeDb.models.company.findOne({
        attributes: ['id', 'database_name'],
        where: {
            id: userInfo.companyId
        }
    }).then(function(company) {
        if (company) {

            var db = require('../../../../config/cassandra');
            db.client.connect(function(err, result) {
                if (err) {
                    return res.json({
                        status: 'fail',
                        message: 'There was some problem in loading data, please contact administrator',
                        error: err
                    }); 
                }
                else 
                {
                    //var companyDbName = "softwebo_108fcb32_e3f5_4da2_b521_c4319a38ff31";
                    var companyDbName = company.database_name;
                    var table_core_name = 'sensordatav3';
                    var thing_id = req.body.thing_id;     
                    
                    var cql_limit = "";
                    //var allow_filtering = "";
                    var allow_filtering = " ALLOW FILTERING";
                    var condfromdata = "";
                    if(req.params.type=="snapshot") {
                        cql_limit = " limit 1";
                    } else {
                        var sensorname = req.body.sensor_name;                                        
                        var weeks = req.body.weeks;
                        condfromdata = " and sensorreceiveddate >= '"+weeks[0]['start_date']+"' ";
                        //allow_filtering = " ALLOW FILTERING";
                    }

                    var dataselquery = "SELECT sensorreceiveddate, data FROM "+companyDbName+"."+table_core_name+" WHERE deviceId="+thing_id+"  ";
                    dataselquery += condfromdata + cql_limit + allow_filtering;
                                    
                    return db.client.execute(dataselquery, function(err, sensorData) {
                        if (err) {
                            return res.json({
                                status: 'fail',
                                message: 'Error in fetching data from database',
                                error: err
                            }); 
                        }

                        switch(req.params.type) {

                            case "avg":

                                    if (sensorData && sensorData.rows.length > 0) {

                                        var alldata = sensorData.rows;

                                        for(var i = 0; i < alldata.length; i++) {

                                            var parsedata = JSON.parse(alldata[i].data);

                                            // var sensordataobj = parsedata.filter(function(item){
                                            //                       return item[sensorname];
                                            //                     });  
                                            var sensorval = parsedata[sensorname];   

                                            for(var j = 0; j < weeks.length; j++) {

                                                var cur_week = weeks[j];
                                                var rdate = alldata[i].sensorreceiveddate;
                                                //var formatteddate = rdate.getFullYear() + "-0" + (rdate.getMonth()+1) + "-0" + rdate.getDate();
                                                var formatteddate = rdate.yyyymmdd();
                                            
                                                if(formatteddate >= cur_week.start_date && formatteddate <= cur_week.end_date) {

                                                    //  if sensordatavals is undefined then assign empty array
                                                    cur_week.sensordatavals = cur_week.sensordatavals || [];
                                                    cur_week.sensordatavals.push(sensorval);

                                                    if(typeof sensorval == "object") {
                                                        cur_week.sum = cur_week.sum || {};
                                                        cur_week.min = cur_week.min || {};
                                                        cur_week.max = cur_week.max || {};
                                                        for (var key in sensorval) {
                                                          if (sensorval.hasOwnProperty(key)) {
                                                            cur_week.sum[key] = cur_week.sum[key] || "0.00";
                                                            cur_week.sum[key] = parseFloat(cur_week.sum[key]) + parseFloat(sensorval[key]);

                                                            if(cur_week.min[key]==undefined || (cur_week.min[key] > parseFloat(sensorval[key]))) {
                                                                cur_week.min[key] = parseFloat(sensorval[key]);
                                                            }
                                                            
                                                            if(cur_week.max[key]==undefined || (cur_week.max[key] < parseFloat(sensorval[key]))) {
                                                                cur_week.max[key] = parseFloat(sensorval[key]);
                                                            }
                                                          }
                                                        }

                                                    } else {
                                                        cur_week.sum = cur_week.sum || "0.00";
                                                        cur_week.sum = parseFloat(cur_week.sum) + parseFloat(sensorval);

                                                        
                                                        if(cur_week.min==undefined || (cur_week.min > parseFloat(sensorval))) {
                                                            cur_week.min = parseFloat(sensorval);
                                                        }
                                                        
                                                        if(cur_week.max==undefined || (cur_week.max < parseFloat(sensorval))) {
                                                            cur_week.max = parseFloat(sensorval);
                                                        }
                                                    }
                                                    weeks[j] = cur_week;
                                                }

                                            }


                                        }

                                    }

                                    for(var i = 0; i < weeks.length; i++) {
                                        var cur_week = weeks[i];
                                        if (cur_week.sum) {

                                            if(typeof cur_week.sum == "object") {
                                                cur_week.avg = {};
                                                for (var key in cur_week.sum) {
                                                  if (cur_week.sum.hasOwnProperty(key)) {
                                                    cur_week.avg[key] = cur_week.sum[key] / cur_week.sensordatavals.length;
                                                  }
                                                }
                                            } else {
                                                cur_week.avg = cur_week.sum / cur_week.sensordatavals.length;
                                            }
                                            //cur_week.total = cur_week.sensordatavals.length;
                                            delete cur_week.sensordatavals;
                                            delete cur_week.sum;

                                            cur_week.hasdata = 1;
                                        } else {                                                
                                            cur_week.hasdata = 0;
                                        }
                                        weeks[i] = cur_week;
                                    }

                                    var outputdata = {
                                        thing_id: thing_id,
                                        sensor_name: sensorname,
                                        weeks: weeks
                                    };

                                    return res.json({
                                        status: 'success',
                                        message: 'Historical Data listed',
                                        data: outputdata
                                    });

                                break;

                            case "snapshot":

                                    if (sensorData && sensorData.rows.length > 0 ) {

                                        sequelizeDb.models.thing.findOne({                           
                                            where: {
                                                id: thing_id,
                                                company_id: userInfo.companyId
                                            }
                                        }).then(function(thing) {

                                            var deviceKey = thing.device_key;
                                            var user = thing.user == '' ? Math.random().toString(36).slice(-6) : thing.user;
                                            var password = thing.password == '' ? Math.random().toString(36).slice(-6) : thing.password;
                                            var topicName = 'IoTConnect';                                            
                                            var key = {
                                                "cs": deviceKey,
                                                "u": user,
                                                "p": password,
                                                "topic": topicName
                                            };
                                            key = encryptBase64(JSON.stringify(key));
                                            var thingdetail = {                          
                                                deviceid: thing.id,
                                                dgid: thing.device_group_id,
                                                key: key,
                                            };

                                            var outputdata = {
                                                thingdetail : thingdetail,
                                                receivedon : sensorData.rows[0].sensorreceiveddate,
                                                sensors: JSON.parse(sensorData.rows[0].data)
                                            };
                                            return res.json({
                                                status: 'success',
                                                message: 'Last snapshot data listed successfully',
                                                data: outputdata
                                            });

                                        }).catch(function(err) {
                                            res.json({
                                                status: 'fail',
                                                data:null,
                                                message: 'Failed to load thing detail, please contact administrator'
                                            });
                                        });

                                    } else {
                                        return res.json({
                                            status: 'fail',
                                            message: 'Snapshot data not found',
                                        });                                            
                                    }
                                break;

                            default:
                                return res.json({
                                    status: 'fail',
                                    message: 'Invalid url',
                                });
                        }
                    });

                }
            });

        } else {
            return res.json({
                status: "fail",
                data: null,
                message: "Unknown user"
            });
        }
    }).catch(function(err) {
        res.json({
            status: "fail",
            data: null,
            message: "Fail to get historical data"
        });
    });
};

Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-');
};


var encryptBase64 = function(value) {
    return new Buffer(value).toString('base64');
};

var decryptBase64 = function(value) {
    return new Buffer(value, 'base64').toString('ascii');
}

/**
 * @author NB
 * getActiveThings() will load inactive thing in company
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return  inactive thing list
 */
exports.getActiveThingsList = function(req, res) {
    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId)
    {
        res.json({
            status: 'fail',
            data:null,
            message: 'Unknown user.'
        });
    }
    else
    {
        var companyId = userInfo.companyId;    
        
        sequelizeDb.models.thing.findAndCountAll({
            attributes : ["id","name","serial_number","active","device_group_id"],
            where: {
                company_id : userInfo.companyId,
                active: true,
            },
        }).then(function(thing) {
            if (thing) {
                res.json({
                    status: 'success',
                    data: thing,
                    message: 'Thing record has been loaded successfully'
                });
            } else {
                res.json({
                    status: 'success',
                    data:null,
                    error: 'Thing record has not been found'
                });
            }
        }).catch(function(err) {
            res.json({
                status: 'fail',
                data: null,
                message: 'Thing load process has not been completed'
            });
        });
    }
};


/**
 * @author HY
 * getThingCountInfo() will list info of connected, not connected and total sensors (used for webservice call)
 * @param  {obj}   req
 * @param  {obj}   res
 * @return  active thing list
 */
/* 
exports.getThingCountInfo = function(req, res) {
    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data:null,
            message: 'Unknown user.'
        });
    }

    //get db name
    sequelizeDb.models.company.findOne({
        attributes: ['id', 'database_name'],
        where: {
            id: userInfo.companyId
        }
    }).then(function(company) {
        if (company) {

            var outputdata = {'thingcount': 0, 'connected': 0, 'inactive': 0, 'sensorcount': 0};

            sequelizeDb.models.thing.findAll({
                attributes : ["id","name","serial_number","active", [sequelizeDb.literal('(select count(*) from sensor where `sensor`.`thing_id` = `thing`.`id`)'), 'sensorcount']],
                where: {
                    company_id : userInfo.companyId,
                    //active: true,
                },
            }).then(function(things) {
                if (things && things.length > 0) {

                    getLastCommunication(company.database_name, things, function(result) {

                        if(result.status) {

                            things = result.things;
                            outputdata.thingcount = things.length

                            async.forEachSeries(things, function(thing, callback2) {                                             
                                if(thing.getDataValue("is_connected")) {
                                    outputdata.connected++;
                                } else {
                                    outputdata.inactive++;
                                }
                                callback2();
                            }, function() {
                                return res.json({
                                    status: 'success',
                                    data: outputdata,
                                    message: 'Data loaded successfully.'
                                });                                
                            });

                        } else {

                            return res.json({
                                status: 'fail',
                                message: result.message,
                                data:null
                            });
                        }

                    });

                } else {
                    res.json({
                        status: 'success',
                        data : outputdata,
                        message: 'No records found'
                    });
                }
            }).catch(function(err) {
                res.json({
                    status: 'fail',
                    message: 'Failed to load things.',
                    data:null
                });
            });

        } else {
            return res.json({
                status: "fail",
                data:null,
                message: "Company not found"
            });
        }
    }).catch(function(err) {
        //
        return res.json({
            status: "fail",
            message: "Error in finding company detail",
            data: null
        });
    });

};
*/

/**
 * @author HY
 * getDashboardInfo will get usage info and thing counts (used in webservice only)
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return {json}
 */
exports.getDashboardInfo = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data:null,
            message: 'Unknown user.'
        });
    }

    var companyId = req.params.companyId;

    //get db name
    sequelizeDb.models.company.findOne({
        attributes: ['id', 'database_name'],
        where: {
            id: companyId
        }
    }).then(function(company) {
        if (company) {

            var countinfodata = {'thingcount': 0, 'connected': 0, 'inactive': 0, 'sensorcount': 0};

            sequelizeDb.models.thing.findAll({
                attributes : ["id","name","serial_number", "active", "status", [sequelizeDb.literal('(select count(*) from sensor where `sensor`.`thing_id` = `thing`.`id`)'), 'sensorcount']],
                where: {
                    company_id : companyId,
                    //active: true,
                },
            }).then(function(things) {
                if (things && things.length > 0) {

                    // getLastCommunication(company.database_name, things, function(result) {

                    //     if(result.status) {

                            // things = result.things;
                            countinfodata.thingcount = things.length

                            async.forEachSeries(things, function(thing, callback2) {                                             
                                // if(thing.getDataValue("is_connected")) {
                                 // Thing active and connected
                                if(thing.status == "2" && thing.active)
                                {
                                    countinfodata.connected++;
                                }
                                else if(thing.status == "3" && thing.active) // Thing active and not connected
                                {
                                    countinfodata.inactive++;
                                }
                                else // Thing not active and not connected
                                {
                                    countinfodata.inactive++;
                                }

                                callback2();
                            }, function() {

                                companyUses.getParentChildCompanyTotalRecord(companyId, function(result){

                                    if (result.status=="success") {

                                        var outputdata = { 'countinfo': countinfodata, 'usageinfo': result.data };

                                        return res.json({
                                            status: 'success',
                                            data: outputdata,
                                            message: 'Data loaded successfully.'
                                        });                                     

                                    } else {

                                        return res.json({
                                            status: 'fail',
                                            message: result.message,
                                            data:null
                                        });
                                        
                                    }
                                })                              
                                
                            });

                    //     } else {

                    //         return res.json({
                    //             status: 'fail',
                    //             message: result.message,
                    //             data:null
                    //         });
                    //     }

                    // });

                } else {

                    companyUses.getParentChildCompanyTotalRecord(companyId, function(result){

                        if (result.status=="success") {

                            var outputdata = { 'countinfo': countinfodata, 'usageinfo': result.data };
                            return res.json({
                                status: 'success',
                                data: outputdata,
                                message: 'Data loaded successfully.'
                            });                                     

                        } else {

                            return res.json({
                                status: 'fail',
                                message: result.message,
                                data:null
                            });
                            
                        }
                    })

                }
            }).catch(function(err) {
                res.json({
                    status: 'fail',
                    message: 'Failed to load things.',
                    data:null
                });
            });

        } else {
            return res.json({
                status: "fail",
                data:null,
                message: "Company not found"
            });
        }
    }).catch(function(err) {
        //
        return res.json({
            status: "fail",
            message: "Error in finding company detail",
            data: null
        });
    });

};

/*
 * @author: Gunjan
 * @Thing dummy data
 * Set simulator data for selected thing
 */
exports.getSimulatorData = function(req, res, next) {

    // Call Simulator function
    thingDummyData.getSimulatorData(req.body.deviceID, '1', function(simulatorData_callback){
            res.json(simulatorData_callback);
    })
}

exports.executionCommand = function(req, res, next){

    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found.'
        });
    }
    else
    {
        var command_id = req.body.command; // Command Id
        var thingGroup_array = req.body.selectedData; // Thing or Group Array
        var thingGroup_type = req.body.type; // Thing or Group Type ( 1 = Group, 2 = Thing )

        commandExecution.getRequestedData(command_id, thingGroup_type, thingGroup_array, userInfo.companyId, function(callback_response){
                    res.json(callback_response);
        })
    }
}