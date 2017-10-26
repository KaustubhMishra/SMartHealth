
'use strict';

var generalConfig = require('../../../../config/generalConfig');
var crypto = require('crypto');
var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");
var fs = require('fs-extra');

/* Common function Lib */
var commonLib = require('../../../../lib/common');
db.models.notification.associate(db.models);
db.models.trial.associate(db.models);
db.models.patient.associate(db.models);
db.models.phase.associate(db.models);
db.models.vital_dosage_status.associate(db.models);
db.models.dosage.associate(db.models);
//db.models.patient.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'patient_id'});
db.models.phase_patient.belongsTo(sequelizeDb.models.patient, {foreignKey: 'patient_id'});


var async = require('async');
var schedule = require('node-schedule');
var moment = require('moment');


var isNotificationTestingMode = false;

if(isNotificationTestingMode) {
    var preReminderDurationValue = 5;
    var preReminderDurationUnit = 'second';
    var postReminderDurationValue = 5;
    var postReminderDurationUnit = 'second';    
    var maxpostReminder = 1;    
} else {
    var preReminderDurationValue = 15;
    var preReminderDurationUnit = 'minute';
    var postReminderDurationValue = 15;
    var postReminderDurationUnit = 'minute';    
    var maxpostReminder = 1;
}


exports.getNotification = function(req, res, next) {
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    }

    db.models.patient.findOne({
        where: {
            user_id: userInfo.id
        }
    }).then(function(patient) {
        if(patient) {

            db.models.notification.findAll({
                where: {
                    patient_id: patient.id
                },
                order:  [
                    ['createdAt', 'DESC']
                ]                
            })
            .then(function(notification) {
                if(notification)
                {
                    res.json({
                        status: true,
                        data: notification,
                        message: 'Data load Successfully'
                    });
                }
                else {
                    res.json({
                        status: false,
                        data: null,
                        message: 'Failed to load data..!'
                    });
                }
            });
            
        } else {
            res.json({
                status: false,
                data: null,
                message: 'Patient data not found.'
            });
        }
    });

};

exports.setNotifications = function(req, res, next) {

    //////////////////////////////////////////////////////////
    ////////////////// notification log //////////////////////
    var trialID = req.params.id;

    var searchTrialParameters = new Array();

    if(trialID != undefined && trialID != 'undefined' && trialID != "") {
      searchTrialParameters.push({
        id: trialID
      });
    }

    var currentdatetime = new Date();
    var requestcontent = '\r\n\r\n';
    requestcontent += '########################################################################\r\n\r\n';
    requestcontent += '========================================================================\r\n\r\n';
    requestcontent += '\r\n';
    requestcontent += 'SET NOTIFICATION Cron Request Started ( Time: ' + currentdatetime + ' )\r\n';
    requestcontent += '\r\n';
    requestcontent += '---------------------------------------------------------------\r\n';
    fs.appendFile('public/lognotification.txt', requestcontent, 'utf8', (err) => {
      if (err) throw err;
    });
    ////////////////// notification log //////////////////////
    //////////////////////////////////////////////////////////

    var today_start_time = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    var today_end_time = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');

    console.log(today_start_time);
    console.log(today_end_time);

    console.log(new Date());

    db.models.trial.findAll({
        include : [{
            model: db.models.dosage,
            required: true,
            include : [{
                model: db.models.drug_type,
                required: true                
            }]
        }, {
            model: db.models.trial_dosage_frequency,
            required: true
        }, {
            model: db.models.phase,
            as : 'activePhase',
            where: {
                start_date: {
                    $lt: new Date()
                },
                tentitive_end_date: {
                    $gt: new Date()
                },
                active: true
            },
            include : [{
                attributes: ['id', 'user_id'],
                model: db.models.patient,
                as : 'phasePatients',
                required: true,
                include : [{
                    attributes: ['id', 'company_id', 'email', 'firstname', 'lastname', 'aws_target_arn'],
                    model: db.models.user,
                    where: {
                        active: true
                        //aws_target_arn: {
                          //$ne: null
                        //}                        
                    }
                }, {
                    model: db.models.vital_dosage_status,
                    where: {
                        schedule_on: {
                            $between: [today_start_time, today_end_time]
                        },
                        type: '2'
                    },
                    order:  [
                        ['schedule_on', 'DESC'],
                    ]                    
                }]
            }]
        }]
        //  for only specific trial
        , where: searchTrialParameters 
    }).then(function(trials) {
        if(trials) {

            
            console.log('Notification........');
            async.forEach(trials, function (trialdosage, callback){
                console.log(trialdosage.name);
                //////////////////////////////////////////////////////////
                ////////////////// notification log //////////////////////
                var currentdatetime = new Date();
                var requestcontent = '\r\n';
                requestcontent += 'Selected Trial Detail :';
                requestcontent += '\r\n'+ JSON.stringify(trialdosage.get({plain:true}), null, 4)+'\r\n';
                fs.appendFile('public/lognotification.txt', requestcontent, 'utf8', (err) => {
                  if (err) throw err;
                });
                ////////////////// notification log //////////////////////
                //////////////////////////////////////////////////////////                            
                                
                var dosagedata = {
                        trial_id: trialdosage.id,
                        phase_id: trialdosage.activePhase.id,
                        patients: trialdosage.activePhase.phasePatients,
                        dosage: trialdosage.dosage,
                        trial_dosage_frequency: trialdosage.trial_dosage_frequency
                    };

                buildVitalFrequencyByDosageFrequency(trialdosage.trial_dosage_frequencies, function(err, frequencydata){
                    async.forEach(frequencydata, function (item, callback){
                        var actualTimeObj = getTimeObj(item.frequency_time);
                        dosagedata.actualTimeObj = actualTimeObj;
                        setPreReminder(actualTimeObj, dosagedata, function(){
                            callback(); 
                        });
                    }, function(err) {
                        if(err) {
                            console.log(err);   
                            if (res) {                        
                                res.json({
                                    status: false,
                                    data: null,
                                    message: 'Error'
                                });
                            }
                        } else {
                           callback(); 
                        }
                    });
                });                                                            

            }, function(err) {
                if(err) {
                    console.log(err);   
                    if (res) {                                            
                        res.json({
                            status: false,
                            data: null,
                            message: 'Error'
                        });
                    }
                } else {
                    if (res) {
                        res.json({
                            status: true,
                            data: null,
                            message: 'Notification scheduled'
                        });                        
                    } else {
                        console.log('Notification scheduled');
                    }
                }
            });            
        } else {
            if (res) {
                res.json({
                    status: false,
                    data: null,
                    message: 'No trail found during setnotification'
                });
            } else {
                console.log('No trail found during setnotification');
            }
        }
    }).catch(function(err) {
        if (res) {
            res.json({
                status: false,
                data: null,
                message: 'Error in setnotification process'
            });
        } else {
            console.log('Error in setnotification process');            
            console.log(err);
        }        
    });
};

var buildVitalFrequencyByDosageFrequency = function(dosagefrequency, callbackFunc) {  
    async.forEach(dosagefrequency, function (item, callback){
        var vitalfrequency = {};
        var actualTimeObj = getTimeObj(item.frequency_time);
        vitalfrequency.preVitalTime = getTimeObj(getDiffTime(actualTimeObj, '-', 1, 'hour'));
        vitalfrequency.postVitalTime = getTimeObj(getDiffTime(actualTimeObj, '+', 1, 'hour'));
        item.setDataValue('vitalfrequency', vitalfrequency);
        callback();
    }, function(err) {
        if(err) {
            console.log(err);   
            if (res) {                        
                res.json({
                    status: false,
                    data: null,
                    message: 'Error'
                });
            }
        } else {
           callbackFunc(null, dosagefrequency); 
        }
    });
}


var setPreReminder = function(timeObj, dosagedata, callback) {

    if(isNotificationTestingMode) {
        //  testing script (start)
        var currentdatetime = new Date();
        //  testing value set for 10 second before pre reminder (start) /////
        var testingObj = new Date();
        testingObj.setSeconds(currentdatetime.getSeconds() + parseInt(preReminderDurationValue) + 10);
        //  testing script (end)

        //////////////////////////////////////////////////////////
        ////////////////// notification log //////////////////////
        var requestcontent = '\r\n';
        requestcontent += '---------------------------------------------------------\r\n';
        requestcontent += 'SetPreReminder-----------------------------------\r\n';
        requestcontent += '\r\n';
        requestcontent += '---Current Time : '+currentdatetime+'\r\n';
        requestcontent += '---Dosage Time : '+testingObj+'\r\n';
        requestcontent += '\r\n';
        fs.appendFile('public/lognotification.txt', requestcontent, 'utf8', (err) => {
          if (err) throw err;
        });
        ////////////////// notification log //////////////////////
        //////////////////////////////////////////////////////////         
        
        var rTime = getDiffTime(testingObj, '-', preReminderDurationValue, preReminderDurationUnit);
    } else {

        var rTime = getDiffTime(timeObj, '-', preReminderDurationValue, preReminderDurationUnit);
    }        

    var rMessage = 'Its time to take your medicine scheduled at ' + timeObj.toUTCString();
    var rule = new schedule.RecurrenceRule();
    rule.hour = rTime.hour;
    rule.minute = rTime.minute;
    rule.second = rTime.second;
    var j = schedule.scheduleJob(rule, function(){
        executeNotification(rMessage, dosagedata);
        setDosageCheckReminder(1, timeObj, dosagedata);
    });
    callback();
}

var setDosageCheckReminder = function(ilteration, actualTimeObj, dosagedata) {  
    if(ilteration <= maxpostReminder) {

        var byvalue = parseInt(ilteration) * postReminderDurationValue;

        if(isNotificationTestingMode) {
            //  testing script (start)
            var currentdatetime = new Date();
            //  testing value set for 10 second before pre reminder (start) /////
            var testingObj = new Date();
            testingObj.setSeconds(currentdatetime.getSeconds() + parseInt(preReminderDurationValue) + 10);
            //  testing script (end)

            //////////////////////////////////////////////////////////
            ////////////////// notification log //////////////////////
            var requestcontent = '\r\n';
            requestcontent += '---------------------------------------------------------\r\n';
            requestcontent += 'SetDosageCheckReminder-----------------------------------\r\n';
            requestcontent += '\r\n';
            requestcontent += '---Current Time : '+currentdatetime+'\r\n';
            requestcontent += '---Dosage Time : '+testingObj+'\r\n';
            requestcontent += '\r\n';
            fs.appendFile('public/lognotification.txt', requestcontent, 'utf8', (err) => {
              if (err) throw err;
            });
            ////////////////// notification log //////////////////////
            ////////////////////////////////////////////////////////// 

            var rTime = getDiffTime(testingObj, '+', byvalue, postReminderDurationUnit);
        } else {

            var rTime = getDiffTime(actualTimeObj, '+', byvalue, postReminderDurationUnit);
        }

        var rule = new schedule.RecurrenceRule();   
        rule.hour = rTime.hour;
        rule.minute = rTime.minute;
        rule.second = rTime.second;
        var j = schedule.scheduleJob(rule, function(){
            checkDosageTaken(ilteration, actualTimeObj, dosagedata);
        });
    }
}

var checkDosageTaken = function(ilteration, actualTimeObj, dosagedata) {
    // db.models.vital_dosage_status.findOne({
    //     where: {
    //         patient_id: patient.id,
    //         schedule_on: {
    //             $gt: currentdatetime
    //         },
    //         type: '2'
    //     }, 
    //     order: ['schedule_on']
    // }).then(function(dosage) {
    //     if(dosage) {
            //var rMessage = 'You have missed a dose scheduled at ' + actualTimeObj.toUTCString() + '. Please take it as soon as possible.';
            var rMessage = 'Hi ##PATIENTNAME##, looks like you missed your last dosage. Please take your medication. Contact me if you have any questions';
            executeNotification(rMessage, dosagedata);
    //         ilteration = ilteration+1;
    //         setDosageCheckReminder(ilteration, actualTimeObj, dosagedata);            
    //     }
    // }).catch(function(err) {
    //     console.log(err);               
    // });
    
}

var executeNotification = function(rMessage, dosagedata) {

    async.forEach(dosagedata.patients, function (patient, callback){

        rMessage = rMessage.replace('##PATIENTNAME##', patient.user.firstname+' '+patient.user.lastname);

        var vitalDosageStatus = null;

        //////////////////////////////////////////////////////////
        ////////////////// notification log //////////////////////
        var requestcontent = '\r\n';
        requestcontent += '---------------------------------------------------------\r\n';
        requestcontent += 'Executing Notification-----------------------------------\r\n';
        fs.appendFile('public/lognotification.txt', requestcontent, 'utf8', (err) => {
          if (err) throw err;
        });
        ////////////////// notification log //////////////////////
        ////////////////////////////////////////////////////////// 

        async.forEach(patient.vital_dosage_statuses, function (item, callbackInner){

            var schedule_on = item.getScheduleOnDateObj();

            //////////////////////////////////////////////////////////
            ////////////////// notification log //////////////////////
            var requestcontent = '\r\n';
            requestcontent += '\r\n------Matching VitalDosageEntry with ActualDosage :\r\n';
            requestcontent += '\r\n';
            requestcontent += '---Schedule_on : '+ schedule_on+'\r\n';
            requestcontent += '---Schedule_on.valueof: '+ schedule_on.valueOf()+'\r\n';
            requestcontent += '\r\n';
            requestcontent += '---actualTimeObj : '+ dosagedata.actualTimeObj+'\r\n';
            requestcontent += '---actualTimeObj.valueof: '+ dosagedata.actualTimeObj.valueOf()+'\r\n';
            requestcontent += '\r\n';
            requestcontent += '---VDS Entry -----';
            requestcontent += '\r\n'+ JSON.stringify(item.get({plain:true}), null, 4)+'\r\n';
            requestcontent += '\r\n';
            fs.appendFile('public/lognotification.txt', requestcontent, 'utf8', (err) => {
              if (err) throw err;
            });
            ////////////////// notification log //////////////////////
            //////////////////////////////////////////////////////////                
            
            if(dosagedata.actualTimeObj.valueOf() == schedule_on.valueOf()) {
                vitalDosageStatus = item;
            }            
            callbackInner();

        }, function(err) {
            if(err) {
                console.log(err);
            } else {
                
                if(vitalDosageStatus) {

                    vitalDosageStatus.reload().then(() => {

                        if(!vitalDosageStatus.status) {
                            
                            var data = { 
                                        trial_id: dosagedata.trial_id,
                                        phase_id: dosagedata.phase_id,
                                        patient_id: patient.id,
                                        company_id: patient.user.company_id,
                                        vitaldosagestatus_id: vitalDosageStatus.id,
                                        Description: rMessage
                                    };

                            db.models.notification.create(data).then(function(notification) {

                                patient.getNotificationUnreadCount(db.models, patient.id, function(totalunreadnotifications) {

                                    var userobj = patient.user;

                                    userobj.reload().then(() => {
                                        if(userobj.aws_target_arn!=null) {
                                            var targetarn = userobj.aws_target_arn;
                                            var pushdata = {};
                                            pushdata.alert   = rMessage;
                                            pushdata.badge = totalunreadnotifications;
                                            pushdata.data   = {};
                                            pushdata.data.type          = vitalDosageStatus.type;
                                            pushdata.data.drug_type     = dosagedata.dosage.drug_type.name;
                                            pushdata.data.dosage_unit   = dosagedata.dosage.dosage_unit;
                                            pushdata.data.dosageTime    = dosagedata.actualTimeObj;
                                            //pushdata.data.dosageTime2 = vitalDosageStatus.schedule_on;
                                            pushdata.data.vital_dosage_status_id = vitalDosageStatus.id;

                                            //////////////////////////////////////////////////////////
                                            ////////////////// notification log //////////////////////
                                            var currentdatetime = new Date();
                                            var requestcontent = '\r\n';
                                            requestcontent += '---------------------------------------------------------\r\n';
                                            requestcontent += 'Sending Notification-----------------------------------\r\n';
                                            requestcontent += '\r\n';
                                            requestcontent += '---Current Time : '+currentdatetime+'\r\n';
                                            requestcontent += '---Patient Name : '+patient.user.firstname+' '+patient.user.lastname+'\r\n';
                                            requestcontent += '\r\n';
                                            requestcontent += '--- pushdata -----';
                                            requestcontent += '\r\n'+ JSON.stringify(pushdata, null, 4)+'\r\n';
                                            requestcontent += '\r\n';
                                            fs.appendFile('public/lognotification.txt', requestcontent, 'utf8', (err) => {
                                              if (err) throw err;
                                            });
                                            ////////////////// notification log //////////////////////
                                            ////////////////////////////////////////////////////////// 
                  
                                            commonLib.awsSendPushNotification(targetarn, pushdata, function(err, data){
                                                if(err) {

                                                    //////////////////////////////////////////////////////////
                                                    ////////////////// notification log //////////////////////
                                                    var requestcontent = '\r\n';
                                                    requestcontent += '---------------------------------------------------------\r\n';
                                                    requestcontent += 'Error in Sending Notification-----------------------------------\r\n';
                                                    requestcontent += '\r\n';
                                                    requestcontent += '---targetarn : '+targetarn+'\r\n';
                                                    requestcontent += '\r\n';
                                                    requestcontent += '--- err -----';
                                                    requestcontent += '\r\n'+ JSON.stringify(err, null, 4)+'\r\n';
                                                    requestcontent += '\r\n';
                                                    fs.appendFile('public/lognotification.txt', requestcontent, 'utf8', (err) => {
                                                      if (err) throw err;
                                                    });
                                                    ////////////////// notification log //////////////////////
                                                    //////////////////////////////////////////////////////////                                         

                                                    //console.log(err);
                                                    console.log('Error in sending push notification to targetarn : '+ targetarn);
                                                }
                                            });
                                        }
                                    });

                                });

                            }).catch(function(err) {
                                console.log(err);
                            });
                        }

                    });

                }

            }
        });

    }, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log('Notifications Sent');
        }
    });
}

var getTimeObj = function(time) {   
    var now = new Date();
    var date = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    if(typeof time== 'string') {
        var timedata = time.split(':');
        date.setUTCHours(timedata[0]);
        date.setUTCMinutes(timedata[1]);
        date.setUTCSeconds(timedata[2]);
    } else {
        date.setHours(time.hour);
        date.setMinutes(time.minute);
        date.setSeconds(time.second);        
    }
    return date;
}

var getDiffTime = function(actualTimeObj, op, byvalue, unit) {
    var actualTimeObj = new Date(actualTimeObj);
    // console.log('');
    // console.log('Settled Time : ' + actualTimeObj.toLocaleTimeString());
    // console.log('');
    var operators = {
        '+': function(a, b) { return a + b },
        '-': function(a, b) { return a - b }
    };
    switch(unit) {
        case 'second':
            actualTimeObj.setSeconds(operators[op](actualTimeObj.getSeconds(), parseInt(byvalue)));
            break;
        case 'minute':
            actualTimeObj.setMinutes(operators[op](actualTimeObj.getMinutes(), parseInt(byvalue)));
            break;
        case 'hour':
            actualTimeObj.setHours(operators[op](actualTimeObj.getHours(), parseInt(byvalue)));
            break;
        default:
            console.error('Invalid unit type : '+unit);
    }
    // console.log('');
    // console.log('New Settled Time : ' + actualTimeObj.toLocaleTimeString());
    // console.log('');
    var rTime = {};
    rTime.second = actualTimeObj.getSeconds();
    rTime.minute = actualTimeObj.getMinutes();
    rTime.hour = actualTimeObj.getHours();
    return rTime;
}


exports.getNotificationByPatientId = function(req, res, next) {
    console.log("Get Notification Request come");
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    }
    db.models.patient.find({
        attributes: ['id'],
        where:{
            user_id: req.body.patient_id
        },
        include:[{
            model: db.models.notification,
            order: [
            ['createdAt', 'DESC']
        ]
        }],
        limit:1
    })
    .then(function(notification) {
        console.log(notification);
        if(notification)
        {
            res.json({
                status: true,
                data: notification,
                message: 'Data load Successfully'
            });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load data..!'
            });
        }
    });
};

exports.getAllNotificationList = function(req, res, next) {
    console.log("Get Notification List Request come");
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    }
    db.models.notification.findAll({
    })
    .then(function(notification) {
        console.log(notification);
        if(notification)
        {
            res.json({
                status: true,
                data: notification,
                message: 'Data load Successfully'
            });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load data..!'
            });
        }
    });
};

exports.getAllNotificationListForWeb = function(req, res, next) {
    console.log("Get Notification List Request come");
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    } 
    db.models.notification.findAll({
        distinct: true,
        attributes:['description', 'createdAt'],
        include: [
            { 
                model: db.models.trial,
                attributes: ['id','name'],
                where:{
                    $or : {
                        dsmb_id: userInfo.id, 
                        croCoordinator_id: userInfo.id
                    }
                }
            }
            ,{ 
                model: db.models.patient,
                attributes: ['id'],
                include: [
                    {
                        model: db.models.user,
                        attributes:['firstname', 'lastname']
                    }
                ]
            }
        ]
    })
    .then(function(notification) {
        if(notification)
        {
            res.json({
                status: true,
                data: notification,
                message: 'Data load Successfully'
            });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load data..!'
            });
        }
    });
};

exports.getAllNotificationListForWebCRO = function(req, res, next) {
    console.log("Get Notification List Request come");
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    } 

    db.models.phase.hasMany(sequelizeDb.models.notification, {foreignKey: 'phase_id'});
    db.models.notification.belongsTo(sequelizeDb.models.phase, {foreignKey: 'phase_id'});
    
    db.models.notification.findAll({
        distinct: true,
        attributes:['description', 'createdAt'],
        include: [
            { 
                model: db.models.trial,
                attributes: ['id','name']
            }
            , { 
                model: db.models.phase,
                attributes: ['id']
            }
            ,{ 
                model: db.models.patient,
                attributes: ['id'],
                include: [
                    {
                        model: db.models.user,
                        attributes:['firstname', 'lastname']
                    }
                ]
            }
        ]
    })
    .then(function(notification) {
        if(notification)
        {
            res.json({
                status: true,
                data: notification,
                message: 'Data load Successfully'
            });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load data..!'
            });
        }
    });
};



exports.getCurrentDosageInfo = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    }

    db.models.patient.findOne({
        where: {
            user_id: userInfo.id
        }
    }).then(function(patient) {
        if(patient) {

            patient.getNotificationUnreadCount(db.models, patient.id, function(totalunreadnotifications) {

                var now = new Date();
                var currentdatetime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

                db.models.vital_dosage_status.findAll({
                    include : [{
                        attributes: ['id', 'drug_name'],
                        model: db.models.trial,
                        required: true,
                        include : [{
                            model: db.models.dosage,
                            required: true,
                            include : [{
                                model: db.models.drug_type,
                                required: true
                            }]                        
                        }]
                    }],
                    where: {
                        patient_id: patient.id,
                        schedule_on: {
                            $gt: currentdatetime
                        },
                        type: '2'
                    }, 
                    order: ['schedule_on'],
                    limit:2
                }).then(function(dosages) {

                    if(dosages) {

                        var dosage = dosages[0];

                        var schedule_on = dosage.getScheduleOnDateObj();

                        var diff = schedule_on.valueOf() - currentdatetime.valueOf();
                        var diffInHours = diff/1000/60/60; // Convert milliseconds to hours
                                                            
                        if (diffInHours > 1) {

                            dosage.getPreviousDosage(db.models, function(previousdosage) {

                                if((!previousdosage) || previousdosage.status) {
                                    dosages[0].setDataValue('isMissed', false);
                                    dosages[1].setDataValue('isMissed', false);
                                } else {
                                    previousdosage.setDataValue('isMissed', true);
                                    dosage.setDataValue('isMissed', false);
                                    dosages[0] = previousdosage;
                                    dosages[1] = dosage;                                                                  
                                }
                            

                                var outputdata = {
                                    'dosages': dosages
                                }
                                outputdata.totalUnreadNotifications = totalunreadnotifications;
                                res.json({
                                    status: true,
                                    data: outputdata,
                                    message: 'Data load successfully'
                                });

                            });

                        } else {
                            
                            dosages[0].setDataValue('isMissed', false);
                            dosages[1].setDataValue('isMissed', false);

                            var outputdata = {
                                'dosages': dosages
                            }
                            outputdata.totalUnreadNotifications = totalunreadnotifications;
                            res.json({
                                status: true,
                                data: outputdata,
                                message: 'Data load successfully'
                            });                        
                        }                

                    } else {

                        db.models.vital_dosage_status.findOne({
                            include : [{
                                model: db.models.trial,
                                required: true,
                                include : [{
                                    model: db.models.dosage,
                                    required: true,
                                    include : [{
                                        model: db.models.drug_type,
                                        required: true
                                    }]                        
                                }]
                            }],
                            where: {
                                patient_id: patient.id,
                                schedule_on: {
                                    $lt: currentdatetime
                                },
                                type: '2'
                            }, 
                            order: ['schedule_on']
                        }).then(function(previousdosage) {                    
                                
                            if(previousdosage) {

                                if(previousdosage.status) {
                                    previousdosage.setDataValue('isMissed', false);
                                } else {
                                    previousdosage.setDataValue('isMissed', true);
                                }

                                previousdosage.setDataValue('isLast', true);

                                var outputdata = {
                                    //'dosages': [previousdosage]
                                }
                                outputdata.totalUnreadNotifications = totalunreadnotifications;
                                res.json({
                                    status: true,
                                    data: outputdata,
                                    message: 'Data load successfully'
                                });   


                            } else {

                                res.json({
                                    status: false,
                                    data: null,
                                    message: 'No data found.'
                                });
                            }

                        }).catch(function(err) {
                            console.log(err); 
                            res.json({
                                status: false,
                                data: null,
                                message: 'Failed to load data..!'
                            });
                        }); 
                                               
                    }

                }).catch(function(err) {
                    console.log(err); 
                    res.json({
                        status: false,
                        data: null,
                        message: 'Failed to load data..!'
                    });                              
                });

            });            
            
        } else {
            res.json({
                status: false,
                data: null,
                message: 'Patient data not found.'
            });
        }
    });

};

exports.setVitalDosageStatus = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    }

    db.models.patient.findOne({
        where: {
            user_id: userInfo.id
        }
    }).then(function(patient) {
        if(patient) {
  
            var vitaldosagestatusid = req.params.vitaldosagestatusid;
            db.models.vital_dosage_status.findOne({
                where: {
                    patient_id: patient.id,
                    id: vitaldosagestatusid
                }
            }).then(function(vitaldosagestatus) {
                if(vitaldosagestatus) {

                    if(vitaldosagestatus.status == 1) {
                        res.json({
                            status: false,
                            data: null,
                            message: 'Status already updated.'
                        }); 
                    } else {                    
                        vitaldosagestatus.status = 1;
                        var now = new Date();                        
                        var utcnow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
                        vitaldosagestatus.execution_date = utcnow;
                        vitaldosagestatus.save().then(() => {
                            res.json({
                                status: true,
                                data: null,
                                message: 'Status updated successfully'
                            });
                        }).catch(function(err) {
                            console.log(err);                
                            res.json({
                                status: false,
                                data: null,
                                message: 'Unable to update status.'
                            }); 
                        });              
                    }

                } else {
                    res.json({
                        status: false,
                        data: null,
                        message: 'Data not found to update.'
                    });
                }

            }).catch(function(err) {
                console.log(err);                
                res.json({
                    status: false,
                    data: null,
                    message: 'Unable to get data.'
                });                
            });
            
        } else {
            res.json({
                status: false,
                data: null,
                message: 'Patient data not found.'
            });
        }
    });   

};

db.models.user.hasMany(db.models.patient,{foreignKey:'user_id'});
db.models.patient.belongsTo(db.models.user, {foreignKey: 'user_id'});

var fetchDosageCalenderData = function(trial_id,patient_user_id, start_date, end_date, type, vitalcallbackFunc) {
    //var patient_user_id1 = '3ac69ad4-b3d3-4d58-b006-98bdfccbe6ab';
    var timeZone = 'America/Chicago';

    db.models.patient.findOne({
        where: {
            user_id: patient_user_id
        },include: [{
              model: db.models.user,
              attributes:['id', 'timezone']
            }]
    }).then(function(patient) {
        if(patient) {
            timeZone = patient.dataValues.user.dataValues.timezone;
            db.models.vital_dosage_status.findAll({
                attributes: ['id', 'type', 'schedule_on', 'status', 'execution_date'],
                where: {
                    trial_id : trial_id,
                    patient_id: patient.dataValues.id,
                    schedule_on: {
                        $between: [start_date, end_date]
                    },
                    type: type
                },
                //group: 'type',
                order:  [
                    ['schedule_on', 'ASC'],
                ]
            }).then(function(vitaldosagestatusResp) {
                console.log('Calender Detail.............');
                var calenderdataformobile = {};

                var currentdatetime = UTCtoPatientTimezoneWithTime(moment(),timeZone);


                async.forEach(vitaldosagestatusResp, function (vitalitem, vitalcallback){

                    

                    
                    /*var schedule_on = item.getScheduleOnDateObj();
                    if(currentdatetime.valueOf() > schedule_on.valueOf()) {
                        item.setDataValue('isUpcoming',false);
                    } else {
                        item.setDataValue('isUpcoming',true);
                    }
                    
                    if(!calenderdata[moment(item.schedule_on).format('YYYY-MM-DD')]) {
                        calenderdata[moment(item.schedule_on).format('YYYY-MM-DD')] = [];
                    }
                    calenderdata[moment(item.schedule_on).format('YYYY-MM-DD')].push(item);*/
                   
                    var schedule_on_Date = UTCtoPatientTimezone(vitalitem.schedule_on,timeZone);
                    var schedule_on = UTCtoPatientTimezoneWithTime(vitalitem.schedule_on,timeZone);


                    vitalitem.setDataValue('schedule_on',schedule_on);

                    if(currentdatetime > schedule_on) {
                        vitalitem.setDataValue('isUpcoming',false);
                    } else {
                        vitalitem.setDataValue('isUpcoming',true);
                    }

                    if(!calenderdataformobile[schedule_on_Date]) {
                        calenderdataformobile[schedule_on_Date] = [];
                    }


                    calenderdataformobile[schedule_on_Date].push(vitalitem);
                    vitalcallback();
                    
                }, function(err) {
                    if(err) {
                        //console.log(err); 
                        err.responseMessage = 'Error in to loading data.';
                        vitalcallbackFunc(err);
                    } else {
                        vitalcallbackFunc(null, calenderdataformobile);
                    }
                });

            }).catch(function(err) {
                err.responseMessage = 'Unable to get data.';
                //console.log(err);
                callbackFunc(err);
            });
            
        } else {
            var err = {};
            err.responseMessage = 'Patient data not found.';
            callbackFunc(err);
        }
    });          
}

var UTCtoPatientTimezone = function(date,timeZone) {
     var momenttz = require('moment-timezone');
     var utc = momenttz.tz(date, "Etc/GMT");
     if(timeZone)
     {
        
         return momenttz.tz(utc, timeZone).format('YYYY-MM-DD');
     }
     else
     {
        return momenttz.tz(utc, 'America/Chicago').format('YYYY-MM-DD');
     }
}

var UTCtoPatientTimezoneWithTime = function(date,timeZone) {
     var momenttz = require('moment-timezone');
     var utc = momenttz.tz(date, "Etc/GMT");
     if(timeZone)
     {
        
         return momenttz.tz(utc, timeZone).format('YYYY-MM-DD HH:mm:ss');
     }
     else
     {
        return momenttz.tz(utc, 'America/Chicago').format('YYYY-MM-DD HH:mm:ss');
     }
}

var fetchDosageCalenderDataForWeb = function(trial_id,patient_user_id, start_date, end_date, type, callbackFunc) {

    db.models.patient.findOne({
        where: {
            user_id: patient_user_id
        }
    }).then(function(patient) {
        if(patient) {
            db.models.vital_dosage_status.findAll({
                attributes: ['id', 'type', 'schedule_on', 'status', 'execution_date'],
                where: {
                    patient_id: patient.dataValues.id,
                    trial_id : trial_id,
                    schedule_on: {
                        $between: [start_date, end_date]
                    },
                    type: type
                },
                //group: 'type',
                order:  [
                    ['schedule_on', 'ASC'],
                ]
            }).then(function(vitaldosagestatus) {
                var calenderdata = [];

                var now = new Date();
                var currentdatetime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));

                async.forEach(vitaldosagestatus, function (item, callback){

                    var schedule_on = item.getScheduleOnDateObj();

                    if(currentdatetime.valueOf() > schedule_on.valueOf()) {
                        item.setDataValue('isUpcoming',false);
                    } else {
                        item.setDataValue('isUpcoming',true);
                    }
                    
                    
                    calenderdata.push(item);
                    callback();
                    
                }, function(err) {
                    if(err) {
                        //console.log(err); 
                        err.responseMessage = 'Error in to loading data.';
                        callbackFunc(err);
                    } else {
                        callbackFunc(null, calenderdata);
                    }
                });

            }).catch(function(err) {
                err.responseMessage = 'Unable to get data.';
                //console.log(err);
                callbackFunc(err);
            });
            
        } else {
            var err = {};
            err.responseMessage = 'Patient data not found.';
            callbackFunc(err);
        }
    });          
}

exports.getDosageCalenderData = function(req, res, next) {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    }

    if (req.body != "") {
        req.checkBody('start_date', 'start_date is required').notEmpty();
        req.checkBody('end_date', 'end_date is required').notEmpty();
        req.checkBody('type', 'type is required').notEmpty();
        req.checkBody('trial_id', 'Active Trial Not Found').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {

        var patient_user_id = userInfo.id;
        var start_date      = req.body.start_date;
        var end_date        = req.body.end_date;
        var type            = req.body.type;
        var trial_id            = req.body.trial_id;


        fetchDosageCalenderData(trial_id,patient_user_id, start_date, end_date, type, function(err, result){
            if(err) {
                res.json({
                    status: false,
                    data: null,
                    message: err.responseMessage
                });                
            } else {          
                res.json({
                    status: true,
                    data: result,
                    message: 'Calender data loaded successfully'
                });
            }
        });

    } else {
        res.json({
            status: false,
            data: null,
            message: mappedErrors
        });        
    }

};

exports.getDosageCalenderDataWeb = function(req, res, next) {

    console.log('Notification Service Calll......');
    console.log(req.body);

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    }

    if (req.body != "") {
        req.checkBody('patient_user_id', 'patient_user_id is required').notEmpty();
        req.checkBody('start_date', 'start_date is required').notEmpty();
        req.checkBody('end_date', 'end_date is required').notEmpty();
        req.checkBody('type', 'type is required').notEmpty();
        req.checkBody('trial_id', 'trial_id is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {

        var patient_user_id = req.body.patient_user_id;
        var start_date      = req.body.start_date;
        var end_date        = req.body.end_date;
        var type            = req.body.type;
        var trial_id            = req.body.trial_id;

        fetchDosageCalenderDataForWeb(trial_id,patient_user_id, start_date, end_date, type, function(err, result){
            if(err) {
                res.json({
                    status: false,
                    data: null,
                    message: err.responseMessage
                });                
            } else {            
                res.json({
                    status: true,
                    data: result,
                    message: 'Calender data loaded successfully'
                });
            }
        });  

    } else {
        res.json({
            status: false,
            data: null,
            message: mappedErrors
        });        
    }

};

exports.setNotificationReadStatus = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    }

    db.models.patient.findOne({
        where: {
            user_id: userInfo.id
        }   
    }).then(function(patient) {
        if(patient) {
  
            var notificationid = req.params.notificationid;
            db.models.notification.findOne({
                where: {
                    patient_id: patient.id,
                    id: notificationid
                }
            }).then(function(notificationobj) {
                if(notificationobj) {

                    if(notificationobj.isread == 1) {
                        res.json({
                            status: false,
                            data: null,
                            message: 'Status already updated.'
                        }); 
                    } else {                    
                        notificationobj.isread = 1;
                        notificationobj.save().then(() => {
                            res.json({
                                status: true,
                                data: null,
                                message: 'Status updated successfully'
                            });
                        }).catch(function(err) {
                            console.log(err);                
                            res.json({
                                status: false,
                                data: null,
                                message: 'Unable to update status.'
                            }); 
                        });              
                    }

                } else {
                    res.json({
                        status: false,
                        data: null,
                        message: 'Data not found to update.'
                    });
                }

            }).catch(function(err) {
                console.log(err);                
                res.json({
                    status: false,
                    data: null,
                    message: 'Unable to get data.'
                });                
            });
            
        } else {
            res.json({
                status: false,
                data: null,
                message: 'Patient data not found.'
            });
        }
    });   

};

exports.removeNotification = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    }

    db.models.patient.findOne({
        where: {
            user_id: userInfo.id
        }   
    }).then(function(patient) {
        if(patient) {
  
            var notificationid = req.params.notificationid;
            db.models.notification.findOne({
                where: {
                    patient_id: patient.id,
                    id: notificationid
                }
            }).then(function(notificationobj) {
                if(notificationobj) {

                    notificationobj.destroy().then(() => {
                        res.json({
                            status: true,
                            data: null,
                            message: 'Notification removed successfully'
                        });
                    }).catch(function(err) {
                        console.log(err);                
                        res.json({
                            status: false,
                            data: null,
                            message: 'Unable to remove.'
                        }); 
                    });

                } else {
                    res.json({
                        status: false,
                        data: null,
                        message: 'Data not found to remove.'
                    });
                }

            }).catch(function(err) {
                console.log(err);                
                res.json({
                    status: false,
                    data: null,
                    message: 'Unable in fetching data to remove.'
                });                
            });
            
        } else {
            res.json({
                status: false,
                data: null,
                message: 'Patient data not found.'
            });
        }
    });   

};



exports.getTrialsNotificationLists = function(req, res, next) {
    console.log("Get Trial Notification List Request come");
    var trialID = req.params.id;

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    } 
    db.models.notification.findAll({
        distinct: true,
        attributes:['description', 'createdAt'],
        where:{
            trial_id: trialID
        },
        include: [
            { 
                model: db.models.trial,
                attributes: ['id','name']
            }
            ,{ 
                model: db.models.patient,
                attributes: ['id'],
                include: [
                    {
                        model: db.models.user,
                        attributes:['firstname', 'lastname']
                    }
                ]
            }
        ]
    })
    .then(function(notification) {
        if(notification)
        {
            res.json({
                status: true,
                data: notification,
                message: 'Data load Successfully'
            });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load data..!'
            });
}
    });
};
    

exports.sendPushNotificationFromWeb = function(req, res, next) {
    console.log("Hiiiiiiiiiiiiiiiiiiiii123");
    //console.log(req.body);
    var data = { 
        trial_id: req.body.trialId,
        phase_id: req.body.phaseId,
        patient_id: req.body.patientId,
        company_id: req.body.companyId,
        Description: req.body.Message
    };
    var newString = data.Description.split(",");
    
    var Description = newString.toString();
    db.models.user.findOne({
        attributes: ['aws_target_arn'],
        where: {
            id: req.body.userId,
            aws_target_arn: {
                $ne: null
            },
            device_token: {
                $ne: null
            } 
        }
    }).then(function(userData) {
        if(userData) {
            console.log(userData.dataValues)
            var targetarn = userData.dataValues.aws_target_arn;
            var rMessage = Description;
            db.models.notification.create(data).then(function(notification) {
                db.models.notification.count({
                    where: {
                        patient_id: data.patient_id,
                        isread: 0
                    }
                }).then(function(data) {
                    if(notification) {
                        var pushdata = {};
                        pushdata.alert   = rMessage;
                        pushdata.badge = data;
                        
                        //////////////////////////////////////////////////////////
                        ////////////////// notification log //////////////////////
                        var currentdatetime = new Date();
                        var requestcontent = '\r\n';
                        requestcontent += '---------------------------------------------------------\r\n';
                        requestcontent += 'Sending Notification-----------------------------------\r\n';
                        requestcontent += '\r\n';
                        requestcontent += '---Current Time : '+currentdatetime+'\r\n';
                        requestcontent += '\r\n';
                        requestcontent += '--- pushdata -----';
                        requestcontent += '\r\n'+ JSON.stringify(pushdata, null, 4)+'\r\n';
                        requestcontent += '\r\n';
                        fs.appendFile('public/lognotification.txt', requestcontent, 'utf8', (err) => {
                          if (err) throw err;
                        });

                        commonLib.awsSendPushNotification(targetarn, pushdata, function(err, data){
                            if(err) {

                                //////////////////////////////////////////////////////////
                                ////////////////// notification log //////////////////////
                                var requestcontent = '\r\n';
                                requestcontent += '---------------------------------------------------------\r\n';
                                requestcontent += 'Error in Sending Notification-----------------------------------\r\n';
                                requestcontent += '\r\n';
                                requestcontent += '---targetarn : '+targetarn+'\r\n';
                                requestcontent += '\r\n';
                                requestcontent += '--- err -----';
                                requestcontent += '\r\n'+ JSON.stringify(err, null, 4)+'\r\n';
                                requestcontent += '\r\n';
                                fs.appendFile('public/lognotification.txt', requestcontent, 'utf8', (err) => {
                                  if (err) throw err;
                                });
                                ////////////////// notification log //////////////////////
                                //////////////////////////////////////////////////////////                                         

                                //console.log(err);
                                console.log('Error in sending push notification to targetarn : '+ targetarn);
                                res.json({
                                    status: false,
                                    data: null,
                                    message: 'Error in sending push notification'
                                });
                            } else {
                                console.log(data)
                                res.json({
                                    status: true,
                                    data: null,
                                    message: 'Message Sent Successfully'
                                });
                            }
                        });    
                    }
                });
            });
        } else {
            console.log("fail");
            res.json({
                status: false,
                data: null,
                message: 'Unable to send the message as the patient is not logged into the application'
            });
        }
    });
};

                         
    