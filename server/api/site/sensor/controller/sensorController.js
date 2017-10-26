'use strict';
var async = require('async');
var Sequelize = require("sequelize");
var dbCassandra = require('../../../../config/cassandra');
var dateFormat = require('dateformat');

/**
 * deleteSensor() will delete the sensor within thing
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 */

exports.deleteSensor = function(req, res, next) {
    var id = req.params.id;

    if (!id) {
        res.json({
            status: "fail",
            data:null,
            message: 'Unknown sensor.'
        });
    }

    var thingId = req.params.thingId;

    if (!thingId) {
        res.json({
            status: "fail",
            data:null,
            message: 'Unknown sensor'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            data:null,
            message: 'Unknown user.'
        });
    }

    sequelizeDb.models.sensor.destroy({
        where: {
            id: id,
            thing_id: thingId,
            company_id: userInfo.companyId
        }
    }).then(function(deletedSensor) {
        if (deletedSensor) {
            //publish mqtt message to device
            generalConfig.mqttPublishMessage();
            res.json({
                status: 'success',
                data:null,
                message: 'Sensor has been deleted.'
            });
        } else {
            res.json({
                status: 'fail',
                message: 'Sensor not found.',
                data:null
            });
        }
    }).catch(function(err) {
        return res.json({
            status: 'fail',
            message: 'Failed to delete the sensor with id ' + id,
            data:null
        });
    });

};

/**
 * getSensorById() will return sensor detail by it id
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return  sensor detail
 */

exports.getSensorById = function(req, res, next) {
    var id = req.params.id;

    if (!id) {
        res.json({
            status: "fail",
            data:null,
            message: 'Unknown device, please select valid device'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        res.json({
            status: "fail",
            data:null,
            message: 'Unknown user'
        });
    }

    var query = 'select * from sensor WHERE id = ?;';

    sequelizeDb.client.execute(query, [id], {
        prepare: true
    }, function(err, data) {
        if (err) {
            return res.json({
                status: 'fail',
                data:null,
                error: 'Failed to load device ' + id
            });
        }

        res.json(data.rows[0]);
    });
};


/**
 * getSensors() will load sensor inside thing in company
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return  sensor list inside thing
 */

exports.getSensors = function(req, res, next) {

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        res.json({
            status: "fail",
            data:null,
            message: 'Unknown user'
        });
    }

    var thingId = req.params.thingId;
    if (!thingId) {
        res.json({
            status: 'fail',
            data:null,
            message: 'Please provide thingId'
        });
    }

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
    }

    if (searchParams.length == 0) {
        var whereval = {
            thing_id: thingId,
            company_id: userInfo.companyId
        };
    } else {
        var whereval = {
            thing_id: thingId,
            company_id: userInfo.companyId,
            $or: searchParams
        };
    }

    sequelizeDb.models.sensor.findAndCountAll({
        where: whereval,
        attributes: Object.keys(sequelizeDb.models.sensor.attributes).concat([
            [sequelizeDb.literal('(select count(*) from notification_log where notification_log.sensor_id= sensor.id)'), 'notifications']
        ]),
        order: sortBy + ' ' + sortOrder,
        offset: pageNumber == '' ? 0 : (pageNumber - parseInt(1)) * pageSize,
        limit: pageSize
    }).then(function(sensors) {
        if (sensors) {
            res.json({
                status: 200,
                data: sensors,
                message: 'Data loaded successfully.'
            });
        } else {
            res.json({
                status: 401,
                data:null,
                error: 'No records found.'
            });
        }
    }).catch(function(err) {
        res.json({
            status: 'fail',
            data:null,
            message: 'Failed to load sensor.'
        });
    });

};


/**
 * getSensorsNotifications() will load notifcation for the sensor
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return  notification list
 */


exports.getSensorsNotifications = function(req, res) {
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data:null,
            message: 'Unknown user.'
        });
    }

    var thingId = req.params.thingId;
    if (!thingId) {
        res.json({
            status: 'fail',
            data:null,
            message: 'Please provide thingId'
        });
    }

    var companyId = userInfo.companyId;
    var sortBy = req.body.params.sortBy;
    var sortOrder = req.body.params.sortOrder;
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;
    var searchParams = new Array();
    var searchCondition = '';

    if (req.body.sensorId) {
        searchCondition = " notification_log.company_id = '" + companyId + "' and notification_log.thing_id = '" + thingId + "' and notification_log.sensor_id ='" + req.body.sensorId + "'";
    } else {
        searchCondition = " notification_log.company_id = '" + companyId + "' and notification_log.thing_id = '" + thingId + "'";
    }


    if (req.body.searchParams && req.body.searchParams.searchTxt != undefined && req.body.searchParams.searchTxt != "") {
        searchCondition += " AND (sensor.name like '%" + req.body.searchParams.searchTxt + "%' or rule.name like '%" + req.body.searchParams.searchTxt + "%' )";
    }


    sequelizeDb.models.notification_log.belongsTo(sequelizeDb.models.sensor, {
        foreignKey: 'sensor_id',
        as: 'sensor'
    });
    sequelizeDb.models.notification_log.belongsTo(sequelizeDb.models.rule, {
        foreignKey: 'rule_id',
        as: 'rule'
    });

    sequelizeDb.query("SELECT distinct(count(*)) as count FROM `notification_log` AS `notification_log` INNER JOIN     `sensor` AS `sensor` ON `notification_log`.`sensor_id` = `sensor`.`id` INNER JOIN `rule` AS `rule` ON `notification_log`.`rule_id` = `rule`.`id` WHERE " + searchCondition + ";", {
            type: sequelizeDb.QueryTypes.SELECT
        })
        .then(function(data) {
            sequelizeDb.models.notification_log.findAndCountAll({
                include: [{
                    model: sequelizeDb.models.sensor,
                    as: 'sensor',
                    attributes: ['id', 'name'],
                    required: true
                }, {
                    model: sequelizeDb.models.rule,
                    as: 'rule',
                    attributes: ['id', 'name'],
                    required: true
                }],
                where: [searchCondition],
                order: sortBy + ' ' + sortOrder,
                offset: pageNumber == '' ? 0 : (pageNumber - parseInt(1)) * pageSize,
                limit: pageSize
            }).then(function(notifications) {
                if (notifications) {
                    res.json({
                        status: 'success',
                        count: data.count,
                        data: notifications,
                        message: 'Data loaded successfully.'
                    });
                } else {
                    res.json({
                        status: 401,
                        data:null,
                        error: 'No records found.'
                    });
                }
            }).catch(function(err) {
                res.json({
                    status: 401,
                    data:null,
                    error: 'No records found.'
                });
            });
        }).catch(function(err) {
            res.json({
                status: 401,
                data:null,
                error: 'No records found.'
            });
        });
};

/**
 * getSensorList() will list sensors of specific thing (used for webservice call)
 * @param  {obj}   req
 * @param  {obj}   res
 * @return  sensors of specific thing
 */
exports.getSensorList = function(req, res) {
    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }

    var thingId = req.params.thingId;
    if (!thingId) {
        res.json({
            'status': 'fail',
            'message': 'Please provide thingId'
        });
    }

    sequelizeDb.models.sensor.findAll({
        attributes: Object.keys(sequelizeDb.models.sensor.attributes).concat([
            [sequelizeDb.literal('(select count(*) from notification_log where notification_log.sensor_id= sensor.id)'), 'notifications']
        ]),
        where: {
            company_id: userInfo.companyId,
            thing_id: thingId                
        }            
    }).then(function(sensors) {
        if (sensors && sensors.length > 0) {

            return res.json({
                'status': 'success',
                'data': sensors,
                'message': 'Data loaded successfully.'
            });

        } else {

            res.json({
                'status': 'success',
                'data' : sensors,
                'message': 'No records found'
            });
        }

    }).catch(function(err) {
        res.json({
            'status': 'fail',
            'message': 'Failed to load sensors.',
            'error': err
        });
    });

};

/*exports.getsensorDatabyTrialId = function(req,res) {
    console.log('Come From sensor get data..........');
    

    let patientId = req.body.patientDetail.id;
    let trialId = req.body.trialDetail.id;

    console.log(req.body.patientDetail);
    console.log(patientId);
    console.log(trialId);

    var searchCondition = '';

    if (patientId) {
        searchCondition = " thing.patient_id = '" + patientId + "'" ;
    } 

    if (trialId) {
        searchCondition += " AND thing.trial_id = '" + trialId + "'" ;
    }

   

    sequelizeDb.models.thing.hasMany(sequelizeDb.models.sensor,{foreignKey:'thing_id'});
    sequelizeDb.models.sensor.belongsTo(sequelizeDb.models.thing, {foreignKey: 'thing_id'});

    sequelizeDb.models.thing.findAll({
        where: [searchCondition],
        include: [
        {
          model: sequelizeDb.models.sensor
        }]
    }).then(function(things) {
        if (things) {
            console.log(things);
            let sensorData = [];

            async.forEach(Object.keys(things), function (item, callback1)
                       {  

                        if(things[item].dataValues.sensors.length > 0)
                        {
                            async.forEach(Object.keys(things[item].dataValues.sensors), function (item1, callback1)
                            {   
                                sensorData.push(things[item].dataValues.sensors[item1].dataValues);

                            }, function(err) {
                                        
                                         }); 
                        }

                       }, function(err) {
                                        
                                         }); 


            console.log('Sensor Data.....');
            console.log(sensorData);
            res.json({
                status: 200,
                data: sensorData,
                message: 'Data loaded successfully.'
            });
        } else {
            res.json({
                status: 401,
                data:null,
                error: 'No records found.'
            });
        }
    }).catch(function(err) {
        console.log(err);
        res.json({
            status: 'fail',
            data:null,
            message: 'Failed to load sensor.'
        });
    });

} */

exports.getsensorDatabyTrialId = function(req,res) {
    console.log('Come From sensor get data..........');
    
    let trialId = req.body.trialDetail.id;

    var searchCondition = '';


    searchCondition = Sequelize.where(Sequelize.col('device_group.devices.trial_devices.trial_id'), { $eq: trialId});
   

    sequelizeDb.models.template.hasMany(sequelizeDb.models.template_attr,{foreignKey:'template_id'});
    sequelizeDb.models.template_attr.belongsTo(sequelizeDb.models.template, {foreignKey: 'template_id'});

    sequelizeDb.models.device_group.hasMany(sequelizeDb.models.template,{foreignKey:'device_group_id'});
    sequelizeDb.models.template.belongsTo(sequelizeDb.models.device_group, {foreignKey: 'device_group_id'});

    sequelizeDb.models.device_group.hasMany(sequelizeDb.models.device,{foreignKey:'device_group_id'});
    sequelizeDb.models.device.belongsTo(sequelizeDb.models.device_group, {foreignKey: 'device_group_id'});

    sequelizeDb.models.device.hasMany(sequelizeDb.models.trial_device,{foreignKey:'device_id'});
    sequelizeDb.models.trial_device.belongsTo(sequelizeDb.models.device, {foreignKey: 'device_id'});

    
    sequelizeDb.models.template.findAll({
        where : searchCondition,
        attributes:['id','device_group_id'],
        include: [
                    { model: sequelizeDb.models.template_attr,attributes:['id','template_id','name','description']
                    },
                    { model: sequelizeDb.models.device_group,attributes:['id'],
                            include : [{model : sequelizeDb.models.device,attributes:['id','device_group_id'],
                                         include : [{model : sequelizeDb.models.trial_device,attributes:['id','device_id','trial_id']}
                                                   ]
                                        }
                                      ]
                    }
                 ]
    }).then(function(template) {
        if (template) {
            
            let templateDetail = [];

            async.forEach(Object.keys(template), function (item, callback1)
                       {
                            if(template[item].dataValues)
                            {
                                    async.forEach(Object.keys(template[item].dataValues.template_attrs), function (item1, callback1)
                                    {
                                        templateDetail.push(template[item].dataValues.template_attrs[item1].dataValues);
                                    }, function(err) {
                                        
                                         }); 
                            }

                       }, function(err) {
                                        
                                         }); 


           res.json({
                status: 'success',
                data: templateDetail,
                message: 'Data loaded successfully.'
            });
        } else {
            res.json({
                status: 'success',
                data:null,
                error: 'No records found.'
            });
        }
    }).catch(function(err) {
        console.log(err);
        res.json({
            status: 'fail',
            data:null,
            message: 'Failed to load sensor.'
        });
    });

} 


exports.getHistoricalDataCompanyWise  =  function(req,res,callback)
{
    console.log('getHistoricalDataCompanyWise...............');
    console.log(req.body);
    let trial_id = req.body.trial_id;
    let company_id = req.body.company_id;
    let patient_id = req.body.patient_id;
    let phase_id = req.body.phase_id;

    var dbCassandra = require('../../../../config/cassandra');
    var dateFormat = require('dateformat');
    
    
    //get db name
    sequelizeDb.models.company.findOne({
        attributes: ['id', 'name', 'database_name'],
        where: {
            id: company_id
        }
    }).then(function(company) {
       console.log('Company Response.......');
       
       if (company) {
            var tableName = company.dataValues.database_name + ".sensordatav3";
            var addInfo = "'" + trial_id + "|"+ phase_id +"|"+ patient_id +"|%'";
           var query = "select * from "+ tableName + " WHERE additionalinfo like "+ addInfo +" allow filtering;";
            
            console.log(query);
            
            //var timezone = company.users[0].timezone;
             SaveCompanyWiseData(dbCassandra,query, function(response){
                   console.log('respo............');
                   console.log(response);
                   
                   res.json({
                        status: 'success',
                        data:response,
                        message: 'Success to get Data.'
                    });

            });

        } else {
                   res.json({
                        status: 'success',
                        data:null,
                        message: 'No Record Found.'
                   });
               }

    }).catch(function(err) {
        console.log(err);
        console.log('error from here......1');
        return callback({
            status: "fail",
            data: null,
            message: "Failed to get historical data."
        });
    });
}

var SaveCompanyWiseData = function(dbCassandra, query, callback){
    console.log('Come From SaveCompanyWiseData.........');
    
    dbCassandra.client.execute(query,{prepare:true,fetchSize : 0,readTimeout: 30000},function(err,response){
             if (err) {
                console.log('Error from here............');
                console.log(err);
                 callback({
                    status: "fail",
                    data: null,
                    message: "Failed to get historical data."
                });
             }
            
             if (response.rowLength > 0) {
                   // console.log(response.rows);
                   
                         callback({
                                status: 'success',
                                data:response.rows,
                                message: 'Data loaded successfully.'
                            });
                   
                } else {
                     callback({
                        status: 'success',
                        data: [],
                        message: 'No Records Found!'
                    });
                }
    });
}


exports.getPatientVitalHistoricalData  =  function(req,res,callback)
{

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
      return res.json({
          status: false,
          message: 'Unknown user'
      });
    }  

    sequelizeDb.models.company.findOne({
        attributes: ['id', 'name', 'database_name'],
        where: {
            id: userInfo.companyId
        }
    }).then(function(company) {
       
       if (company) {

            dbCassandra.client.connect(function(err, result) {
                if (err) {
                    return res.json({
                        status: 'fail',
                        message: 'There was some problem in loading data, please contact administrator',
                        error: err
                    }); 
                } else {

                    var tableName = company.dataValues.database_name + ".sensordatav3";
                    
                    var device_id   = req.body.device_id;
                    var sensor_name = req.body.sensor_name;                    
                    var vitaltype   = req.body.vitaltype; 

                    var graph_data      = req.body.dateranges;
                    var start_date      = graph_data[0].start_date;

                    var allow_filtering = " ALLOW FILTERING";

                    var condfromdata = " and receiveddate >= '"+start_date+" 00:00:00+0000' ";
                    var dataselquery = "SELECT toDate(receiveddate) as receivedondate, receiveddate, data, additionalinfo FROM "+tableName+" WHERE deviceId="+device_id+"  ";

                    dataselquery += condfromdata + allow_filtering;

                    console.log(dataselquery);

                    dbCassandra.client.execute(dataselquery,{prepare:true,fetchSize : 0,readTimeout: 30000},function(err,response){
                        if (err) {
                            console.log(err);
                            return callback({
                                status: false,
                                data: null,
                                message: "Error in loading vital data."
                            });
                        }
                        
                        if (response.rowLength > 0) {

                            async.forEach(response.rows, function (item, callbackFunc) {

                                var sensordata = JSON.parse(item.data);
                                var sensoradditionalinfo = item.additionalinfo.split('|');

                                if(sensoradditionalinfo[3]==vitaltype) {

                                    async.forEach(graph_data, function (graphitem, callback) {

                                        if(item.receivedondate >= graphitem.start_date && item.receivedondate <= graphitem.end_date) {
                                            graphitem.sensordatavals = graphitem.sensordatavals || [];
                                            if(sensordata[sensor_name]) {
                                                graphitem.sensordatavals.push(sensordata[sensor_name]);
                                            }
                                        }

                                        callback();

                                    }, function(err) {
                                        if(err) {
                                            res.json({
                                                status: false,
                                                data:null,
                                                message: 'Error in loading vital data.'
                                            });
                                        } else {
                                            callbackFunc();                    
                                        }
                                    }); 

                                } else {
                                    callbackFunc();
                                }

                            }, function(err) {
                                if(err) {
                                    res.json({
                                        status: false,
                                        data:null,
                                        message: 'Error in loading vital data.'
                                    });
                                } else {
                                    
                                    async.forEach(graph_data, function (graphitem, callbackFunc1) {

                                        if((graphitem.sensordatavals != undefined) && graphitem.sensordatavals.length > 0) {
                                            var graphitem_sum = graphitem.sensordatavals.reduce((a, b) => parseInt(a) + parseInt(b), 0);
                                            graphitem.average = parseInt(graphitem_sum) / graphitem.sensordatavals.length;
                                            graphitem.hasdata = true;
                                        } else {
                                            graphitem.hasdata = false;
                                        }   

                                        callbackFunc1();

                                    }, function(err) {
                                        if(err) {
                                            res.json({
                                                status: false,
                                                data:null,
                                                message: 'Error in loading vital data.'
                                            });
                                        } else {

                                            var output = req.body;
                                            output.dateranges = graph_data;

                                            res.json({
                                                status: true,
                                                data: output,
                                                message: 'Vital graph data loaded successfully.'
                                            });                 
                                        }
                                    }); 

                                }
                            }); 

                        } else {

                            async.forEach(graph_data, function (graphitem, callbackFunc1) {

                                if((graphitem.sensordatavals != undefined) && graphitem.sensordatavals.length > 0) {
                                    var graphitem_sum = graphitem.sensordatavals.reduce((a, b) => parseInt(a) + parseInt(b), 0);
                                    graphitem.average = parseInt(graphitem_sum) / graphitem.sensordatavals.length;
                                    graphitem.hasdata = true;
                                } else {
                                    graphitem.hasdata = false;
                                }   

                                callbackFunc1();

                            }, function(err) {
                                if(err) {
                                    res.json({
                                        status: false,
                                        data:null,
                                        message: 'Error in loading vital data.'
                                    });
                                } else {

                                    var output = req.body;
                                    output.dateranges = graph_data;

                                    res.json({
                                        status: true,
                                        data: output,
                                        message: 'Vital graph data loaded successfully.'
                                    });                 
                                }
                            }); 

                        }
                    });

                }
            });

        } else {
            res.json({
                status: false,
                data:null,
                message: 'Unable to get user company information.'
            });
        }

    }).catch(function(err) {
        console.log(err);
        return callback({
            status: false,
            data: null,
            message: "Unable to load user company information."
        });
    });
}

exports.getPatientVitalHistoricalDataV2  =  function(req,res,callback)
{

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
      return res.json({
          status: false,
          message: 'Unknown user'
      });
    }  

    sequelizeDb.models.company.findOne({
        attributes: ['id', 'name', 'database_name'],
        where: {
            id: userInfo.companyId
        }
    }).then(function(company) {
       
        if (company) {

            var thing_id   = req.body.thing_id;
            var sensor_name = req.body.sensor_name;                    
            var vitaltype   = req.body.vitaltype; 

            var start_date      = req.body.start_date;
            var end_date      = req.body.end_date;


            sequelizeDb.models.thing.findOne({
                attributes: ['id', 'name'],
                include : [{
                    attributes: ['id','name'],
                    model: sequelizeDb.models.device,
                    include : [{
                        attributes: ['id', 'name'],
                        model: sequelizeDb.models.device_group,
                        include : [{
                            attributes: ['id', 'name'],
                            model: sequelizeDb.models.template,
                            include : [{
                                attributes: ['name', 'description', 'unit'],
                                model: sequelizeDb.models.template_attr,
                                where: {
                                    name: sensor_name
                                }                                
                            }]
                        }]
                    }]                    
                }],                
                where: {
                    id: thing_id
                }
            }).then(function(thing) {
               
                if (thing) {

                    var sensor_unit = thing.device.device_group.template.template_attrs[0].unit;
                    
                    dbCassandra.client.connect(function(err, result) {
                        if (err) {
                            return res.json({
                                status: 'fail',
                                message: 'There was some problem in loading data, please contact administrator',
                                error: err
                            }); 
                        } else {

                            var tableName = company.dataValues.database_name + ".sensordatav3";
                            
                            var dataselquery = "SELECT receiveddate, data FROM "+tableName+" WHERE deviceId="+thing_id;
                            var condfromdata = " and receiveddate >= '"+start_date+"+0000' and receiveddate <= '"+end_date+"+0000'";
                            var condprepost = " and additionalinfo like '%|"+vitaltype+"'";
                            var condsensor  = " and data like '%"+sensor_name+"%";
                            //var orderby = " ORDER BY receiveddate";
                            var orderby = "";
                            var allow_filtering = " ALLOW FILTERING";

                            //var dataselquery = "SELECT receiveddate, data FROM "+tableName+" WHERE";
                            //var condfromdata = " receiveddate >= '"+start_date+"+0000' and receiveddate <= '"+end_date+"+0000'";
                            

                            dataselquery += condfromdata + condprepost + orderby + allow_filtering;

                            console.log(dataselquery);

                            dbCassandra.client.execute(dataselquery,{prepare:true,fetchSize : 0,readTimeout: 30000},function(err,response){
                                if (err) {
                                    console.log(err);
                                    return callback({
                                        status: false,
                                        data: null,
                                        message: "Error in loading vital data."
                                    });
                                }
                                
                                if (response.rowLength > 0) {

                                    var sensordata = response.rows;                            
                                    var len = response.rowLength;

                                    for (var i = len-1; i >= 0; i--) {
                                        (function(cntr) {

                                            for (var j = 1; j <= i; j++) {
                                                (function(cntr2) {
                                                    var previtem = sensordata[j-1];                                            
                                                    var curritem = sensordata[j];
                                                    curritem.utcreceiveddatetime = dateFormat(sensordata[j].receiveddate, "UTC:yyyy-mm-dd hh:MM:ss");
                                                    curritem.sensorvalue = JSON.parse(sensordata[j].data)[sensor_name];
                                                    curritem.sensorunit = sensor_unit;
                                                    
                                                    if(previtem.receiveddate > curritem.receiveddate){
                                                        sensordata[j-1] = curritem;
                                                        sensordata[j] = previtem;
                                                    }
                                                })(j);
                                            }

                                            if(cntr==0) {
                                                sensordata[len-1].utcreceiveddatetime = dateFormat(sensordata[len-1].receiveddate, "UTC:yyyy-mm-dd hh:MM:ss");
                                                sensordata[len-1].sensorvalue = JSON.parse(sensordata[len-1].data)[sensor_name];
                                                sensordata[len-1].sensorunit = sensor_unit;

                                                sensordata[0].utcreceiveddatetime = dateFormat(sensordata[0].receiveddate, "UTC:yyyy-mm-dd hh:MM:ss");
                                                sensordata[0].sensorvalue = JSON.parse(sensordata[0].data)[sensor_name];
                                                sensordata[0].sensorunit = sensor_unit;
                                                delete sensordata[0].receiveddate;
                                            }

                                        })(i);

                                        if(i==0) {                                    
                                            res.json({
                                                status: true,
                                                data: response.rows,
                                                message: 'Vital graph data loaded successfully.'
                                            });
                                        }
                                    }

                                } else {

                                    res.json({
                                        status: true,
                                        data: response.rows,
                                        message: 'No vital graph data found.'
                                    });
                                }
                            });

                        }
                    });

                } else {

                    res.json({
                        status: false,
                        data: null,
                        message: 'Unable to load sensor information.'
                    });
                }

            }).catch(function(err) {
                console.log(err);
                return callback({
                    status: false,
                    data: null,
                    message: "Unable to load thing information."
                });
            });

        } else {
            res.json({
                status: false,
                data:null,
                message: 'Unable to get user company information.'
            });
        }

    }).catch(function(err) {
        console.log(err);
        return callback({
            status: false,
            data: null,
            message: "Unable to load user company information."
        });
    });
}