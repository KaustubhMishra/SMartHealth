'use strict';

var generalConfig = require('../../../../config/generalConfig');
var crypto = require('crypto');
var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");
var fs = require('fs-extra');
var async = require('async');
var schedule = require('node-schedule');
var moment = require('moment');

 exports.getvitalDataList = function(req, res, next) {
 	console.log('Come From vital API.....');
 	
 	console.log(req.body);

 var userInfo = generalConfig.getUserInfo(req);
 	console.log(userInfo);

    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

    if (req.body != "") {
        req.checkBody('patient_user_id', 'patient_user_id is required').notEmpty();
        req.checkBody('start_date', 'start_date is required').notEmpty();
        req.checkBody('end_date', 'end_date is required').notEmpty();
        req.checkBody('type', 'type is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    
    if (mappedErrors == false) {

        var patient_user_id = req.body.patient_user_id;
        var start_date      = req.body.start_date;
        var end_date        = req.body.end_date;
        var type            = req.body.type;

        fetchDosageCalenderData(patient_user_id, start_date, end_date, type, function(err, result){
            if(err) {
            	console.log('err1...' + err);
                res.json({
                    status: false,
                    data: null,
                    message: err.responseMessage
                });                
            } else {
            	console.log(result);            
                res.json({
                    status: true,
                    data: result,
                    message: 'Calender data loaded successfully'
                });
            }
        });  

    } else {
    	console.log('err2...');
        res.json({
            status: false,
            data: null,
            message: mappedErrors
        });       
    }

 	
};

var fetchDosageCalenderData = function(patient_user_id, start_date, end_date, type, callbackFunc) {

	console.log('Come from fetchDosageCalenderData ...........');

    db.models.patient.findOne({
        where: {
            user_id: patient_user_id
        }
    }).then(function(patient) {
    	console.log(patient);
        if(patient) {

            db.models.vital_dosage_status.findAll({
                attributes: ['id', 'type', 'schedule_on', 'status', 'execution_date'],
                where: {
                    patient_id: patient.id,
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
            	console.log(vitaldosagestatus);
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
