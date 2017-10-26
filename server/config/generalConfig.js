var crypto = require('crypto');
var jwt = require('jwt-simple');
var mqtt = require('mqtt');
var settings = require('./settings');

function authenticate(plainText, hashedPassword) {
    return encryptPassword(plainText, settings.saltKey) === hashedPassword;
}

function encryptPassword(password) {
    if (!password) return '';
    return crypto.pbkdf2Sync(password, settings.saltKey, 10000, 64).toString('hex');
}

function getUserInfo(req) {
    if (req.headers.authorization) {
        var accesstoken = req.headers.authorization.split(" ")[1];
        var obj = jwt.decode(accesstoken, settings.secretKey);
        // console.log(obj);
        return obj.user;
    } else {
        return {
            userId: '',
            companyId: ''
        };
    }
}

var mqttPublishMessage = function(cpid) {
    var mqttClient = mqtt.connect(settings.mqttUrl);
    mqttClient.on('connect', function() {
        var commonLib = require('../lib/common');
        commonLib.getCompanyInfoById(cpid, function(companyResponse){
            if(companyResponse.data){
                if(companyResponse.data.cpid){
                    var topic = companyResponse.data.cpid+"topic";
                    mqttClient.publish(topic, 'refresh');
                }
                mqttClient.end(false);
            }else{
                mqttClient.end(false);
            }
        });
    });
};

var company_mqttPublishMessage = function(cpid) {
    console.log('--------Company MQTT--------')
    var mqttClient = mqtt.connect(settings.mqttUrl);
    mqttClient.on('connect', function() {
        var commonLib = require('../lib/common');
        commonLib.getCompanyInfoById(cpid, function(companyResponse){
            if(companyResponse.data){
                if(companyResponse.data.cpid){
                    var msg = 'refreshcompany#' + companyResponse.data.cpid;
                    mqttClient.publish('refreshtoken', msg);
                }
                mqttClient.end(false);
            }else{
                mqttClient.end(false);
            }
        });
    });
};

var mqttRegisterThing = function(thingId, srno, cmd) {
    var mqttClient = mqtt.connect(settings.mqttUrl);
    mqttClient.on('connect', function() {
        mqttClient.publish('thingtopic',
            JSON.stringify({
                did: thingId,
                srno: srno,
                cmd: cmd
            }));
        mqttClient.end(false);
    });
}

var mqttImportThing = function(companyId, status) {
    var mqttClient = mqtt.connect(settings.mqttUrl);
    mqttClient.on('connect', function() {
        mqttClient.publish('thingimporttopic',
            JSON.stringify({
                companyId: companyId,
                status:status
            }));
        mqttClient.end(false);
    });
}

function convertUTCDate(date, timezone){
    var moment = require('moment-timezone');
    var tempdate = moment.tz(date, timezone);

    var newdate = new Date(tempdate.format());
    return newdate;   
}

function toTimeZone(time, zone) {
    var moment = require('moment');

    var format = 'YYYY-MM-DD HH:mm:ss';

    return moment(time, format).tz(zone).format(format);
}

var addtoapilog = function(companyid, userid, url, datasize) {

    if (!datasize) {
        var datasize = 0;
    }

    var db = require('./sequelize').db;
    db.models.company.findOne({
        attributes: ['id', 'database_name'],
        where: {
            id: companyid
        }
    }).then(function(company) {
        if (company) {

            var cdb = require('./cassandra');  
            cdb.client.connect(function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    var apirequestdate = (new Date()).toISOString();
                    var cqlquery = "INSERT INTO "+ company.database_name +".apiLog ( id, companyid, userid, url, datasize, apirequestdate ) VALUES ( uuid(), "+companyid+", "+userid+", '"+url+"', "+datasize+", '"+apirequestdate+"')";
                    //console.log(cqlquery);
                    cdb.client.execute(cqlquery, function (err, response) {
                        if (err) {
                            console.log(err);
                            //callbackFunc(false);
                        } else {
                            //callbackFunc(true);
                        }
                    });
                }
            });

        } else {
            console.log('company not found during api request log creation');
        }

    }).catch(function(err) {
        console.log(err);
    });    
};

module.exports = {
    authenticate: authenticate,
    encryptPassword: encryptPassword,
    getUserInfo: getUserInfo,
    mqttPublishMessage: mqttPublishMessage,
    company_mqttPublishMessage: company_mqttPublishMessage,
    mqttRegisterThing: mqttRegisterThing,
    mqttImportThing:mqttImportThing,
    convertUTCDate:convertUTCDate,
    toTimeZone:toTimeZone,
    addtoapilog:addtoapilog,
};