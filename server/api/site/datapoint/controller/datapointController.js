'use strict';

var generalConfig = require('../../../../config/generalConfig');
var crypto = require('crypto');
var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");
/* Common function Lib */
var commonLib = require('../../../../lib/common');
var request = require('request'); /*[SOFTWEB]*/
var async = require('async');
var totalDays = 15;// No of previous days
var generalCount = 0;
var base64 = require('base-64');
var utf8 = require('utf8');

/*---set configuration----*/

//---Local 192.168.3.195
var mqttConnectionUrl = settings.mqttUrl;

//---QA 192.168.4.88
//var mqttConnectionUrl = 'mqtt://192.168.4.88';

/*---set configuration----*/

 


var sensorRange = [
    { 'id' : 0,  'name' : 'temperature', 'min' : 15, 'max'   : 35 },
    { 'id' : 1,  'name' : 'Gyroscope', 'min' : -125, 'max'   : 125 },
    { 'id' : 2,  'name' : 'Accelerometer', 'min' : -10, 'max'   : 10 },
    { 'id' : 3,  'name' : 'Magnetometer', 'min' : -200, 'max'   : 200 },
    { 'id' : 4,  'name' : 'Pressure', 'min' : 300, 'max'   : 700 },
    { 'id' : 5,  'name' : 'Light', 'min' : 2000, 'max'   : 4000 },
    { 'id' : 6,  'name' : 'Humidity', 'min' : 10, 'max'   : 90 },
    { 'id' : 7,  'name' : 'Liquid Flow', 'min' : 1, 'max'   : 30 },
    { 'id' : 8,  'name' : 'Load Cell', 'min' : 0, 'max'   : 100 },
    { 'id' : 9,  'name' : 'Distance', 'min' : 0, 'max'   : 200 },
    { 'id' : 10, 'name' : 'Frequency', 'min' : 0, 'max'   : 100 },
    { 'id' : 11, 'name' : 'Voltage', 'min' : 0, 'max'   : 300 },
    { 'id' : 12, 'name' : 'Current', 'min' : 0, 'max'   : 20 },
    { 'id' : 13, 'name' : 'CO2', 'min' : 1000, 'max'   : 3000 },
    { 'id' : 14, 'name' : 'Altitude', 'min' : 15000, 'max'   : 25000 },
    { 'id' : 15, 'name' : 'Fuel', 'min' : 0, 'max'   : 50 },
    { 'id' : 16, 'name' : 'Battery level', 'min' : 0, 'max'   : 100 },
    { 'id' : 17, 'name' : 'speed', 'min' : 0, 'max'   : 100 },
    { 'id' : 18, 'name' : 'Electric Power Consumption', 'min' : 10, 'max'   : 100 },
    { 'id' : 19, 'name' : 'Motor Speed', 'min' : 0, 'max'   : 10000 },
];



/**
 * @author : MK
 * @Changed : 
 * Store data points 
 */
exports.storeData = function(req, res, next) {

    var childCompanyList = '';
    var thingsDevicesArray = [];
    var thingsArray = {};
    var thingsArray1 = [];
    var cnt = 0;
    var bulkCnt = 0;
    var lastDate = '';
    var message = '';
    async.series([
      function(callback) {
        
        //var companyID = '1afd870d-fc59-46b7-a566-9b64feda4fa4'; // Company 
        var companyID = req.body.companyID; // Company 
        if (!companyID)
        {
            return res.json({
                status: 'fail',
                data: null,
                message: 'Unknown Company record, please select valid Company'
            });
        }
        
        //db.models.company.associate(db.models);
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


        //93cde3cc-9a5f-4ab5-8b8d-a9be7e7ac82a

        db.models.company
        .findAll({
            attributes: ['id','parent_id','name','cpid','database_name','active'],
            include: [
                        { model: db.models.device_group, attributes: ['id', 'name']
                        },
                        { model: db.models.thing, attributes: ['id', 'name', 'device_group_id', 'device_key', 'serial_number', 'active'], where: { $and: [{active: 1}] }
                        },
                        { model: db.models.template, attributes: ['id', 'name', 'device_group_id', 'company_id'], include: [
                            { model: db.models.template_attr, attributes: ['id', 'name', 'localId'], where : { 'parent_attr_id' : '0' }
                            }]
                        },
                     ],
            where: {
                $or: [{parent_id: companyID}, {id: companyID}],
                $and: {active : 1}
                //$and: {id: companyID, active : 1} // For single company
            },
            order: 'localId ASC'
        }).then(function(childCompany) {
            if(childCompany.length > 0)
            {
                childCompanyList = childCompany;
                for (var c = 0; c < childCompany.length; c++) {
                    var companyID = childCompany[c].id;
                    var cpid = childCompany[c].cpid; /*[SOFTWEB]*/
                    var thingsData = childCompany[c].dataValues.things;
                    var companyInfo = childCompany[c].dataValues.templates[0].dataValues.template_attrs;
                    if(thingsData.length > 0)
                    {
                        var cnt = 0;
                        for (var t = 0; t < thingsData.length; t++) {
                            cnt++;
                            var deviceID = thingsData[t].id;
                            var srno = thingsData[t].serial_number; /*[SOFTWEB]*/
                            var sensorActive = thingsData[t].active; /*[SOFTWEB]*/
                            var deviceKey = thingsData[t].device_key;
                            var sensorArray = {};

                            //thingsArray1.deviceID = deviceID;
                            var thingsArray = {};
                            thingsArray.companyId = companyID;
                            thingsArray.databaseName = childCompany[c].database_name;

                            thingsArray.deviceId = deviceID;
                            thingsArray.connectionString = deviceKey;
                            thingsArray.data = [];
                            
                            var sensorArray = []; /*---- [SOFTWEB]----*/
                            for (var i = 0; i < companyInfo.length; i++) {
                                
                                var dataRangeArray = {};
                                for (var j = 0; j <= sensorRange.length; j++) {
                                    if(i == j)
                                    {
                                        var sensorName = companyInfo[i].name;
                                        var sensorLocalID = companyInfo[i].localId;

                                        dataRangeArray.name = companyInfo[i].name;
                                        dataRangeArray.localID = companyInfo[i].localId; /*---- [SOFTWEB]----*/
                                        dataRangeArray.min = sensorRange[j].min;
                                        dataRangeArray.max = sensorRange[j].max;

                                        thingsArray.data.push(dataRangeArray);

                                        /*---- NEW for SENSOR data add ---- [SOFTWEB]*/
                                        sensorArray.push({"localid":sensorLocalID, 
                                          "pin":"2",
                                          "name":sensorName 
                                        });
                                        /*---- NEW for SENSOR data add ---- [SOFTWEB]*/

                                        if(i+parseInt(1) == companyInfo.length)
                                        {   
                                            
                                            thingsDevicesArray.push(thingsArray);

                                            /*---- NEW for SENSOR data add ---- [SOFTWEB]*/
                                            var storeSensorArray = {
                                                "cpid" : cpid,
                                                "srno" : srno,
                                                "sensors" : sensorArray
                                            };

                                            if(sensorActive == 0)
                                            {
                                                saveSensorHandShakeData(storeSensorArray);
                                            }
                                            /*---- NEW for SENSOR data add ---- [SOFTWEB]*/

                                            if((c+parseInt(1) == childCompany.length) && (t+parseInt(1) ==  thingsData.length) && (j+parseInt(1) == sensorRange.length))
                                            {
                                                callback();
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else
            {
                return res.json({
                    status: 'fail',
                    data: null,
                    message: 'Company record could not been found.'
                });      
            }
        });
      },
      function(callback) {
        var companyID = req.body.companyID; // Company 
        var dateFlag = req.body.dateFlag; // Company 
        if(dateFlag == 1)
        {
            var dbName = thingsDevicesArray[0].databaseName;
            var telemetry = require('../../../../config/telemetrySequelize');
            return telemetry.db(dbName, function(err, telemetryDb) {
                if (err) {
                } else {

                    var sensordatav3 = telemetryDb.models.sensordatav3;
                    sensordatav3.max('receivedDate',{ where: { companyId: companyID } 
                    }).then(function(lastDateData) {
                        lastDate = lastDateData;
                        callback();
                    }).catch(function(err) {
                        callback();
                    });
                }
            });
        }
        else
        {
            callback();
        }

      },
      function(callback) {
        
        var dbName = thingsDevicesArray[0].databaseName;
        if(lastDate == "")
        {
            var today = new Date();
            //var today = new Date("2016-04-13");
            var todayDate = today.getUTCDate();
            var totalDays = 15;
            var startDate = today.setUTCDate(todayDate - parseInt(totalDays));
            startDate = new Date(startDate);

            startDate.setUTCHours(0);
            startDate.setUTCMinutes(0);
            startDate.setUTCSeconds(0);
            startDate = new Date(startDate);
        }
        else
        {
            var today = new Date(lastDate);
            var todayDate = today.getUTCDate();
            var startDate = today.setUTCDate(todayDate + parseInt(1));
            startDate = new Date(startDate);

            startDate.setUTCHours(0);
            startDate.setUTCMinutes(0);
            startDate.setUTCSeconds(0);
            startDate = new Date(startDate);

            var date1 = new Date(startDate);
            var date2 = new Date();
            var timeDiff = Math.abs(date2.getTime() - date1.getTime());
            var totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        }

        if(totalDays > 0)
        {
            //return false;
            for (var d = 1; d <= totalDays; d++) {
                var tempDate = startDate;
                var dynamicDate = tempDate.getUTCDate();
                dynamicDate = tempDate.setUTCDate(dynamicDate + 1);
                dynamicDate = new Date(dynamicDate);
                
                var bulkDataArry = [];
                var bulkCount = 0;
                var insertBulkRecord = 0;
                for (var h = 0; h < 24; h++) {

                    var dynamicHour = dynamicDate.setUTCHours(h);
                    dynamicHour = new Date(dynamicHour);

                    if((h % 2) != 0)
                    {
                        if(h >= 0 && h <= 3)
                        {
                            var mValue = 12;
                            var bValue = 120;
                        }
                        else if(h >= 4 && h <= 7)
                        {
                            var mValue = 10;   
                            var bValue = 144;
                        }
                        else if(h >= 8 && h <= 11)
                        {
                            var mValue = 15;   
                            var bValue = 96;
                        }
                        else if(h >= 12 && h <= 15)
                        {
                            var mValue = 15;   
                            var bValue = 96;
                        }
                        else if(h >= 16 && h <= 19)
                        {
                            var mValue = 10;   
                            var bValue = 144;
                        }
                        else if(h >= 20 && h <= 23)
                        {
                            var mValue = 12;   
                            var bValue = 120;
                        }
                    }
                    else
                    {
                        if(h >= 0 && h <= 3)
                        {
                            var mValue = 15;
                            var bValue = 96;
                        }
                        else if(h >= 4 && h <= 7)
                        {
                            var mValue = 12;   
                            var bValue = 120;
                        }
                        else if(h >= 8 && h <= 11)
                        {
                            var mValue = 10;
                            var bValue = 144;   
                        }
                        else if(h >= 12 && h <= 15)
                        {
                            var mValue = 15;
                            var bValue = 96;
                        }
                        else if(h >= 16 && h <= 19)
                        {
                            var mValue = 10;
                            var bValue = 144;   
                        }
                        else if(h >= 20 && h <= 23)
                        {
                            var mValue = 12;   
                            var bValue = 120;
                        }
                    }

                    for (var m = 0; m < 60; m++) {

                        if(m % mValue == 0)
                        {
                            var dynamicMinutes = dynamicHour.setUTCMinutes(m);
                            dynamicMinutes = new Date(dynamicMinutes);
                            
                            for (var td = 0; td < thingsDevicesArray.length; td++) {

                                var obj = {
                                    "companyId" : thingsDevicesArray[td].companyId, 
                                    "receivedDate" : dynamicMinutes,
                                    "connectionString" : thingsDevicesArray[td].connectionString,
                                    "deviceId" : thingsDevicesArray[td].deviceId
                                };
                                var dataArray = [];

                                for (var i = 0; i < thingsDevicesArray[td].data.length; i++) {

                                    var value = Math.random() * (thingsDevicesArray[td].data[i].max - thingsDevicesArray[td].data[i].min) + thingsDevicesArray[td].data[i].min;
                                    value = value.toFixed(2);
                                    var key = thingsDevicesArray[td].data[i].name;

                                    var elements = {};
                                    elements[key] = value;
                                    dataArray.push(elements);

                                    if(i+parseInt(1) == thingsDevicesArray[td].data.length)
                                    {
                                        cnt ++;
                                        obj.data = JSON.stringify(dataArray);
                                        bulkDataArry.push(obj);
                                        bulkCount++;


                                        var insertBulkRecord = bValue * thingsDevicesArray.length;
                                                                            
                                        
                                        if(bulkCount == insertBulkRecord)
                                        {
                                           bulkCount = 0;
                                           bulkCnt++;
                                           saveDeviceData(bulkDataArry,dbName);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            message = "Process successfully completed.";
            callback();
        }
        else
        {
            message = 'Data up-to-date till today';
            callback();
        }
      },
      function(callback) {
        return res.json({
            status: 'success',
            totalCount: cnt,
            data: childCompanyList,
            message: message
        });
        callback();
      }
    ]);
}

/**
 * @author : MK
 * @Changed : 
 * Store data points 
 */
function saveDeviceData(bulkDataArry, dbName) {
    
    async.series([
        function(callback) {
            
            var telemetry = require('../../../../config/telemetrySequelize');
            return telemetry.db(dbName, function(err, telemetryDb) {

                if (err) {
                } else {

                    var sensordatav3 = telemetryDb.models.sensordatav3;
                    
                    sensordatav3.bulkCreate(bulkDataArry).then(function(sensorData) {
                        if(sensorData.id);
                        {
                            generalCount++;
                        }
                        callback();
                    }).catch(function(err) {
                        callback();
                    });
                }
            });
        }
    ]);
}


/**
 * @author : MK
 * @Changed : 
 * Store or update sensor data
 */
function saveSensorHandShakeData(storeSensorArray) {
    
    if(storeSensorArray && storeSensorArray != undefined)
    {
        async.series([
            function(callback) {

                request.post({
                    url:settings.siteUrl+'/thing/register',
                    body : storeSensorArray,
                    json:true
                },
                function (error, response, body){
                    callback();
                });
            }
        ]);
    }
}


var sensorRangeSimulator = [
    { 'id' : 0,  'name' : 'temperature', 'min' : 10, 'max'   : 21 },
    { 'id' : 1,  'name' : 'Gyroscope', 'min' : -0.8, 'max'   : 0.9 },
    { 'id' : 2,  'name' : 'Accelerometer', 'min' : -0.7, 'max'   : 0.4 },
    { 'id' : 3,  'name' : 'Magnetometer', 'min' : -0.2, 'max'   : -0.8 },
    { 'id' : 4,  'name' : 'Pressure', 'min' : 300, 'max'   : 370 },
    { 'id' : 5,  'name' : 'Light', 'min' : 2000, 'max'   : 2700 },
    { 'id' : 6,  'name' : 'Humidity', 'min' : 70, 'max'   : 90 },
    { 'id' : 7,  'name' : 'Liquid Flow', 'min' : 10, 'max'   : 15 },
    { 'id' : 8,  'name' : 'Load Cell', 'min' : 70, 'max'   : 85 },
    { 'id' : 9,  'name' : 'Distance', 'min' : 145, 'max'   : 165 },
    { 'id' : 10, 'name' : 'Frequency', 'min' : 85, 'max'   : 90 },
    { 'id' : 11, 'name' : 'Voltage', 'min' : 235, 'max'   : 250 },
    { 'id' : 12, 'name' : 'Current', 'min' : 17, 'max'   : 20 },
    { 'id' : 13, 'name' : 'CO2', 'min' : 1000, 'max'   : 1350 },
    { 'id' : 14, 'name' : 'Altitude', 'min' : 15000, 'max'   : 15500 },
    { 'id' : 15, 'name' : 'Fuel', 'min' : 10, 'max'   : 15 },
    { 'id' : 16, 'name' : 'Battery level', 'min' : 21, 'max'   : 27 },
    { 'id' : 17, 'name' : 'speed', 'min' : 40, 'max'   : 55 },
    { 'id' : 18, 'name' : 'Electric Power Consumption', 'min' : 20, 'max'   : 45 },
    { 'id' : 19, 'name' : 'Motor Speed', 'min' : 350, 'max'   : 500 },
];

/**
 * @author : MK
 * @Changed : 
 * Get Simulator data for Danaher sensors
 */
exports.getSimulatorData = function(req, res, next) {

    var childCompanyList = '';
    var thingsDevicesArray = [];
    var thingsArray = {};
    var thingsArray1 = [];
    var cnt = 0;
    var bulkCnt = 0;
    var lastDate = '';
    var message = '';

    var companyID = '';
    var deviceID = req.body.deviceID;

    async.series([
      function(callback) {
        
        if (!deviceID)
        {
            return res.json({
                status: 'fail',
                data: null,
                message: 'Unknown Device ID, please select valid Device'
            });
        }
        
        db.models.thing.findOne({
            attributes: ['id','company_id','serial_number','user','password','device_key'],
            where: {
                $and: {id: deviceID, active : 1} // For single company
            }
        }).then(function(thingsDetail) {

            if(thingsDetail && thingsDetail != undefined)
            {
                companyID = thingsDetail.company_id;
                callback();
            }
            else
            {
                return res.json({
                    status: 'fail',
                    data: null,
                    message: 'Device record could not been found.'
                });      
            }
        });
      },
      function(callback) {
        
        if (!companyID && !deviceID)
        {
            return res.json({
                status: 'fail',
                data: null,
                message: 'MIssing company or device detail.'
            });
        }
        
        //db.models.company.associate(db.models);
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
                        { model: db.models.thing, attributes: ['id', 'name', 'device_group_id', 'device_key', 'serial_number', 'active','user','password'], where: { $and: [{active: 1, id: deviceID }] }
                        },
                        { model: db.models.template, attributes: ['id', 'name', 'device_group_id', 'company_id'], include: [
                            { model: db.models.template_attr, attributes: ['id', 'name', 'localId'], where : { 'parent_attr_id' : '0' }
                            }]
                        },
                     ],
            where: {
                $and: {active : 1} // For single company
            },
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
                    for (var t = 0; t < thingsData.length; t++) {
                        cnt++;
                        var deviceID = thingsData[t].id;
                        var deviceKey = thingsData[t].device_key;
                        var thingUser = thingsData[t].user;
                        var thingPassword = thingsData[t].password;
                        var device_group_id = thingsData[t].device_group_id;
                        var thingsArray = {};
                        
                        thingsArray.companyId = companyID;
                        thingsArray.databaseName = childCompany[0].database_name;
                        thingsArray.deviceId = deviceID;
                        thingsArray.connectionString = deviceKey;
                        thingsArray.thingUser = thingUser;
                        thingsArray.thingPassword = thingPassword;
                        thingsArray.device_group_id = device_group_id;
                        thingsArray.cpid = cpid;
                        thingsArray.data = [];
                        
                        for (var i = 0; i < companyInfo.length; i++) {
                            
                            var dataRangeArray = {};
                            for (var j = 0; j <= sensorRangeSimulator.length; j++) {
                                if(i == j)
                                {
                                    var sensorName = companyInfo[i].name;
                                    var localID = companyInfo[i].localId;

                                    dataRangeArray.name = companyInfo[i].name;
                                    dataRangeArray.min =sensorRangeSimulator[j].min;
                                    dataRangeArray.max =sensorRangeSimulator[j].max;
                                    dataRangeArray.localID =localID;
                                    thingsArray.data.push(dataRangeArray);

                                    if(i+parseInt(1) == companyInfo.length)
                                    {   
                                        thingsDevicesArray.push(thingsArray);
                                        if((t+parseInt(1) == childCompany.length) && (j+parseInt(1) == sensorRangeSimulator.length))
                                        {
                                            callback();
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
                
            }
            else
            {
                return res.json({
                    status: 'fail',
                    data: null,
                    message: 'Company record could not been found.'
                });      
            }
        });
      },
      function(callback) {

        //var dbName = thingsDevicesArray[0].databaseName;
        var text = {"cs":thingsDevicesArray[0].connectionString,"u":thingsDevicesArray[0].thingUser,"p":thingsDevicesArray[0].thingPassword,"topic":"IoTConnect"};
        var bytes = utf8.encode(text);
        var encoded = base64.encode(bytes);
        var obj = {
            "did" : thingsDevicesArray[0].deviceId,
            "dgid" : thingsDevicesArray[0].device_group_id, 
            "key" : encoded,
            "cpid" : thingsDevicesArray[0].cpid,
        };
        
        if(thingsDevicesArray[0].data.length > 0)
        {
            sendSimulatorDatatoMQTT(thingsDevicesArray, obj);
            setTimeout(function() {
                callback();
            }, 500);
            /*var mqtt = require('mqtt');
            var client  = mqtt.connect(mqttConnectionUrl);
            var mqttTopic = obj.cpid+"topic";
            client.on('connect', function () {
                client.subscribe(mqttTopic);
                var interval = setInterval(function() {
                    var dataArray = [];
                    var bulkDataArry = '';
                    var today = new Date();
                    obj.time = today;
                    obj.data = [];
                    var cntArray = 0;
                    var elements = {};
                    
                    for (var i = 0; i < thingsDevicesArray[0].data.length; i++)
                    {
                        var localID =thingsDevicesArray[0].data[i].localID;

                        if(localID == 'd002' || localID == 'd003' || localID == 'd004')
                        {
                            var x = Math.random() * (thingsDevicesArray[0].data[i].max - thingsDevicesArray[0].data[i].min) + thingsDevicesArray[0].data[i].min;
                            var y = Math.random() * (thingsDevicesArray[0].data[i].max - thingsDevicesArray[0].data[i].min) + thingsDevicesArray[0].data[i].min;
                            var z = Math.random() * (thingsDevicesArray[0].data[i].max - thingsDevicesArray[0].data[i].min) + thingsDevicesArray[0].data[i].min;

                            //value = value.toFixed(2);
                            var key = thingsDevicesArray[0].data[i].name;
                            elements[key] = {"x":parseFloat(x.toFixed(2)),"y":parseFloat(y.toFixed(2)),"z":parseFloat(z.toFixed(2))};
                            dataArray.push(elements);
                        }
                        else
                        {
                            var value = Math.random() * (thingsDevicesArray[0].data[i].max - thingsDevicesArray[0].data[i].min) + thingsDevicesArray[0].data[i].min;
                            value = value.toFixed(2);
                            var key = thingsDevicesArray[0].data[i].name;
                            elements[key] = parseFloat(value); //value;
                            dataArray.push(elements);
                        }
                        cntArray++;
                    }
                    if(cntArray == thingsDevicesArray[0].data.length)
                    {
                        obj.data.push(dataArray[0]);
                        bulkDataArry = obj;
                        //Send data by MQTT
                        client.publish(mqttTopic, JSON.stringify(bulkDataArry));
                    }
                }, 1000);
            })
            setTimeout(function() {
                callback();
            }, 1000);*/
        }
        else
        {
            message = 'No data found';
            callback();
        }
      },
      function(callback) {
        return res.json({
            status: 'success',
            data: childCompanyList,
            message: message
        });
        callback();
      }
    ]);
}


/**
 * @author : MK
 * @Changed : 
 * Store or update sensor data
 */
function sendSimulatorDatatoMQTT(thingsDevicesArray, obj) {
    
        var mqtt = require('mqtt');
        var client  = mqtt.connect(mqttConnectionUrl);
        var mqttTopic = obj.cpid+"topic";
        client.on('connect', function () {
            client.subscribe(mqttTopic);
            var interval = setInterval(function() {
                var dataArray = [];
                var bulkDataArry = '';
                var today = new Date();
                obj.time = today;
                obj.data = [];
                var cntArray = 0;
                var elements = {};
                
                for (var i = 0; i < thingsDevicesArray[0].data.length; i++)
                {
                    var localID =thingsDevicesArray[0].data[i].localID;

                    if(localID == 'd002' || localID == 'd003' || localID == 'd004')
                    {
                        var x = Math.random() * (thingsDevicesArray[0].data[i].max - thingsDevicesArray[0].data[i].min) + thingsDevicesArray[0].data[i].min;
                        var y = Math.random() * (thingsDevicesArray[0].data[i].max - thingsDevicesArray[0].data[i].min) + thingsDevicesArray[0].data[i].min;
                        var z = Math.random() * (thingsDevicesArray[0].data[i].max - thingsDevicesArray[0].data[i].min) + thingsDevicesArray[0].data[i].min;

                        //value = value.toFixed(2);
                        var key = thingsDevicesArray[0].data[i].name;
                        elements[key] = {"x":parseFloat(x.toFixed(2)),"y":parseFloat(y.toFixed(2)),"z":parseFloat(z.toFixed(2))};
                        dataArray.push(elements);
                    }
                    else
                    {
                        var value = Math.random() * (thingsDevicesArray[0].data[i].max - thingsDevicesArray[0].data[i].min) + thingsDevicesArray[0].data[i].min;
                        value = value.toFixed(2);
                        var key = thingsDevicesArray[0].data[i].name;
                        elements[key] = parseFloat(value); //value;
                        dataArray.push(elements);
                    }
                    cntArray++;
                }
                if(cntArray == thingsDevicesArray[0].data.length)
                {
                    obj.data.push(dataArray[0]);
                    bulkDataArry = obj;
                    //Send data by MQTT
                    client.publish(mqttTopic, JSON.stringify(bulkDataArry));
                    /*client.on('message', function (topic, message) {
                    })*/
                }
            }, 1000);
        })
}