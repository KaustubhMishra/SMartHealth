'use strict';
//var db = require('../../../../config/cassandra');
var generalConfig = require('../../../../config/generalConfig');
//var cassandra = require('cassandra-driver');

/* Common function Lib */
var commonLib = require('../../../../lib/common');

/* AWS */
var awsSubscriber = require('../../../../lib/aws/subscriber');
var awsIotConnect = require('../../../../lib/aws/awsiotconnect');
/* DB connection */
var db = require('../../../../config/sequelize').db;
var DataTypes = require("sequelize");

var fs = require('fs-extra');
var path = require('path');  

/**
 * updateSetting will update setting of company
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.updateSettings = function(req, res, next) { 
    var settingId = req.params.id || null;
    if(!settingId){
        return res.json({
            status:'fail',
            message:'Unknown Settings'
        });
    }

    if (req.body != "") {
        req.checkBody('settingName', 'Setting Name required').notEmpty();
        if(req.body.settingName){
            var settingName = (req.body.settingName.trim()).toLowerCase();
            switch(settingName){
                case 'apnscertificate':
                    //req.checkBody('apnsCertificate','APNS Certificate required').notEmpty();
                    req.checkBody('apnsPassword','APNS Password required').notEmpty();
                    break;
                case 'gcmapikey':
                    req.checkBody('gcmapikey', 'GCM API Key required').notEmpty();
                    break;
                case 'wnskeys':
                    req.checkBody('wnsPackageSid', 'Package SID required').notEmpty();
                    req.checkBody('wnsSecretKey', 'WNS Secret Key required').notEmpty();
                    break;
                case 'smtp':
                    req.checkBody('smtp.frmEmail', 'From email required').notEmpty();
                    req.checkBody('smtp.frmName', 'From name required').notEmpty();
                    req.checkBody('smtp.host', 'SMTP host required').notEmpty();
                    req.checkBody('smtp.port', 'SMTP port required').notEmpty();
                    req.checkBody('smtp.encryption', 'SMTP encryption required').notEmpty();
                    //req.checkBody('smtp.username', 'Username required').notEmpty();
                    req.checkBody('smtp.password', 'Password required').notEmpty();
                    break;
                default:
                    req.checkBody('apnsCertificate','APNS Certificate required').notEmpty();
                    req.checkBody('apnsPassword','APNS Password required').notEmpty();
                    req.checkBody('gcmapikey', 'GCM API Key required').notEmpty();
                    req.checkBody('wnsPackageSid', 'Package SID required').notEmpty();
                    req.checkBody('wnsSecretKey', 'WNS Secret Key required').notEmpty();
                    req.checkBody('smtp.frmEmail', 'From email required').notEmpty();
                    req.checkBody('smtp.frmName', 'From name required').notEmpty();
                    req.checkBody('smtp.host', 'SMTP host required').notEmpty();
                    req.checkBody('smtp.port', 'SMTP port required').notEmpty();
                    req.checkBody('smtp.encryption', 'SMTP encryption required').notEmpty();
                    //req.checkBody('smtp.username', 'Username required').notEmpty();
                    req.checkBody('smtp.password', 'Password required').notEmpty();
                    break;
            }
        }

        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {
        var settingQuery = '';
        var params = [];

        //Get userinfo from request
        var userInfo = generalConfig.getUserInfo(req);
        if(!userInfo.companyId){
            return res.json({status:'fail',message:'Unknown user', code:401});
        }

        switch(settingName){
            case 'apnscertificate':
                var fs = require('fs-extra');
                //file should not be empty                
                if(!req.files || (req.files&& !req.files.apnsCertificate)){
                    settingQuery = 'update settings  set apnsPassword = ? where id = ?;';
                    params = [req.body.apnsPassword, settingId];                    
                    break;
                    // return res.json({
                    //     status: "fail",
                    //     message:"APNS Key File is required."
                    // });    
                }

                var file = req.files.apnsCertificate;

                
                //file should not exceed 1MB
                if(file.size>1000000){
                    return res.json({
                        status: "fail",
                        message:"File too large , max file size allowed 1MB"
                    });
                }

                //file should be p12 type only
                if(file.type !='application/x-pkcs12'){
                    return res.json({
                        status: "fail",
                        message:"Invalid File"
                    });

                }

                var tmpPath = file.path;
                var fileName = file.originalFilename;
                var destPath = settings.filesPath.certificate+"/"+userInfo.companyId+"/ios/"+fileName;
                
                fs.copy(tmpPath, destPath, { replace: true }, function (fileErr) {
                    if (fileErr) {
                        res.json({status:"fail", msg : fileErr});
                    }
                    
                    //reomve old file
                    if(req.body.oldCertificate){
                        var deleteFile = settings.filesPath.certificate+"/"+userInfo.companyId+"/ios/"+req.body.oldCertificate;                        
                        fs.unlink(deleteFile);
                    }

                    settingQuery = 'update settings  set apnsCertificatePath = ?, apnsPassword = ? where id = ?;';
                    params = [fileName,req.body.apnsPassword, settingId];
                    db.client.execute(settingQuery, params, {
                        prepare: true
                    }, function(err, response) {
                        if (err) {
                            return res.json({
                                status: "fail",
                                message:err
                            });
                        }

                        return res.json({
                            status: "success"
                        });
                    });
                });
                return;
                break;                
            case 'gcmapikey':
                settingQuery = 'update settings  set gcmapikey = ? where id = ?;';
                params = [req.body.gcmapikey, settingId];
                break;
            case 'wnskeys':
                settingQuery = 'update settings  set wnsSid = ?,wnsSecretKey = ? where id = ?;';
                params = [req.body.wnsPackageSid, req.body.wnsSecretKey, settingId];
                break;
            case 'smtp':
                settingQuery = 'update settings  set smtp = ? where id = ?;';
                params = [JSON.stringify(req.body.smtp), settingId];
                break;
            default:
                settingQuery = 'update settings  set apnsCertificatePath = ?, apnsPassword = ?, gcmapikey = ?, wnsSid = ?, wnsSecretKey = ? where id = ?;';
                params = [req.body.apnsCertificate,req.body.apnsPassword, req.body.gcmapikey, req.body.wnsPackageSid, req.body.wnsSecretKey, settingId];                
                break;
        }
        db.client.execute(settingQuery, params, {
            prepare: true
        }, function(err, response) {
            if (err) {
                return res.json({
                    status: "fail",
                    message:err
                });
            }

            res.json({
                status: "success"
            });
        });

    } else {
        res.json({
            status: 'fail',
            message: mappedErrors
        });
    }
};

/**
 * updateDeviceSettings will update device/mobile related setting of company
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.updateDeviceSettings = function(req, res, next) { 
    var settingId = req.params.id || null;
    
    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.companyId){
        return res.json({
            status:'fail',
            message:'Unknown user', 
        });
    }

    if (req.body != "") {
        req.checkBody('connection_timeout', 'Connection Timeout is required').notEmpty();
        req.checkBody('log_threshold', 'Log Threshold is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {

        var connection_timeout = req.body.connection_timeout;
        var log_threshold = req.body.log_threshold;

        db.models.setting.findOne({
              where: {
                    company_id: userInfo.companyId,
                }
        }).then(function(setting) {

            if(setting)
            {
                setting.connection_timeout  = connection_timeout;
                setting.log_threshold       = log_threshold;
                setting.save().then(function() {
                    return res.json({
                        status: "success",
                        data: null,
                        message: 'Setting has been updated successfully'
                    });
                })
                .catch(function(err) {
                    return res.json({
                        status: "fail",
                        data: null,
                        message: 'There was some problem updating setting. please try later or contact administrator.',
                    });
                });                

            } else {

                return res.json({
                    status: "fail",
                    data: null,
                    message: "Company setting information not found.",
                });
            }

        })
        .catch(function(err) {
            return res.json({
                status: "fail",
                data: null,
                message: 'There was some problem updating setting. please try later or contact administrator.',
            });
        }); 

    } else {

        var validationmessages = [];
        if (mappedErrors['connection_timeout']) {
            validationmessages.push(mappedErrors['connection_timeout']['msg']);
        }   
        if (mappedErrors['log_threshold']) {
            validationmessages.push(mappedErrors['log_threshold']['msg']);
        }

        res.json({
            status: 'fail',
            message: validationmessages
        });
    }
};

/**
 * getSettings will return company settings
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json of company settings
 */
exports.getSettings = function(req, res, next) {

    //Get userinfo from request
   var userInfo = generalConfig.getUserInfo(req);
   if (!userInfo.companyId) {
       return res.json({
           status: "fail",
           message: 'Unknown user',
           code:401
       });
       return false;
   }

   db.models.setting.findOne({
                              where: ["company_id = ? ", userInfo.companyId]
                            }) .then(function(setting)
    {
        if(setting)
        {
            res.json({
                status: "success",
                data: setting,
                message: 'Setting data has been loaded successfully'
            });
            // //  write api request log (start)   //
            // try {
            //     var requesturl = req.method + " " + req.originalUrl;
            //     var responsesize = res.get('content-length');
            //     generalConfig.addtoapilog(userInfo.companyId, userInfo.id, requesturl, responsesize);
            // } catch(err) {
            //     console.log(err);
            // }
            // //  write api request log (end)   //
        }
        else
        {
            res.json({
                status: "success",
                data: [],
                message: 'Setting data has not been found'
            });
        }
    }).catch(function(err){
        return res.json({
                status: 'fail',
                data: err,
                message: 'Setting data has not been found'
            });
    });
};


exports.deleteCertificate = function(req, res, next){
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.companyId){
        return res.json({status:'fail',message:'Unknown user', code:401});
        return false;
    }
    
    var fs = require('fs-extra');
    var destPath = settings.filesPath.certificate + "/" +userInfo.companyId+"/ios/"+req.params.name;  
        
    var deleteQuery = 'update settings set apnsCertificatePath = null where id=?';

    db.client.execute(deleteQuery, [req.params.id], {prepare:true}, function(err, data){
        if(err){
            return res.json({status:'fail',message:err});
            return false;
        }
        fs.unlink(destPath);
        return res.json({status:'success'});
    });
};

exports.downloadCertificate = function(req, res, next){
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.companyId){
        return res.json({status:'fail', message:'Unknown user', code:401});
        return false;
    }

    var fs = require('fs-extra');
    if(req.body.name){
        var filePath = settings.filesPath.certificate + "/" + userInfo.companyId + '/ios/' + req.body.name;
        var fileToSend = fs.readFileSync(filePath);
        var stat = fs.statSync(filePath);
        
        res.writeHead(200, {
            'Content-Type': 'application/x-pkcs12',
            'Content-Length': stat.size,
            'Content-Disposition': req.body.name
        });
        res.end(fileToSend);
    }

    return res.json({status:'fail',message:'File empty', code:400});

}

/*
 @ AWS
 @ Create Application for Push Notification
 */
exports.createAWSNotifictionApp = function(req, res, next){

    var platform = req.body.appPlatform; /* Application Platform Type */

    if(platform == 'apple') /* Apple Application : Start */
    {
        var awsAppleAppData = req.body.appledata;
        /* Get Company Details */
        var userInfo = generalConfig.getUserInfo(req);
        var companyId = userInfo.companyId;

        commonLib.getCompanyInfoById(companyId, function(companyResponse){
            if(companyResponse.status != 'fail') /* Success */
            {
                var companyData = companyResponse.data; /* Company Data */
                var awsAppleAppPlatform = awsAppleAppData.iotAppleAppPlatform; /* Application Platform */
                var companyName = companyData.name; /* Company Name */
                var awsAppleAppName = awsAppleAppData.iotAppleAppName; /* Application Name */
                var awsAppleAppCertificate = awsAppleAppData.iotAppleAppCertif; /* Application Certificate */
                var awsAppleAppPrivateKey = awsAppleAppData.iotAppleAppPrvKey; /* Application Private Key */

                /* Live Application : Production Enviromnent : Start */
                if(awsAppleAppPlatform == 'APNS') 
                {
                    /* Get device record : Start */
                    db.models.setting.findOne({
                              where: ["company_id = ? AND id = ?", companyId, req.params.id]
                            }) .then(function(setting)
                        {
                            if(setting)
                            {

                                var getIosProduction = setting.ios_aws_app_data;
                                if(getIosProduction !== null) /* Found record in DB */
                                {
                                    /** Update AWS Apple Production Application : Start */
                                        getIosProduction =  JSON.parse(getIosProduction);

                                        var awsAppleProdAppArn = getIosProduction.appAwsArn; /* Application ARN From DB */
                                        awsAppleAppName = getIosProduction.iotAppleAppName; /* Application Name From DB */

                                        /* call AWS Update Application Method */
                                        awsSubscriber.updateAppleApplication( awsAppleProdAppArn, awsAppleAppCertificate, awsAppleAppPrivateKey, function(response){
                                            
                                            var responseStatus = response.response; /* API Resonse Status */
                                            var responseMessage = response.data; /* API Reponse Message */

                                            if(responseStatus == 'success')
                                            {
                                                var awsReqId = responseMessage.ResponseMetadata.RequestId;

                                                /* Create Data JSON */
                                                var appleData = [];
                                                appleData = {
                                                        iotAppleAppName: awsAppleAppName,
                                                        iotAppleAppPlatform: awsAppleAppPlatform,
                                                        iotAppleAppCertif : awsAppleAppCertificate,
                                                        iotAppleAppPrvKey : awsAppleAppPrivateKey,
                                                        appAwsArn : awsAppleProdAppArn,
                                                        appAwsReqId : awsReqId
                                                    };
                                                appleData = JSON.stringify(appleData);

                                                var updateSettingData = [];
                                                updateSettingData = {
                                                            ios_aws_app_data : appleData
                                                        }
                                                /* Update Data in Database : Start */
                                                db.models.setting.update( updateSettingData, {
                                                                   where : { company_id: companyId, id: req.params.id } 
                                                                   }).then(function(setting) {
                                                    if(setting)
                                                    {
                                                        // Application Create/Update: User Subscription Process
                                                        awsIotConnect.awsApplicationCreate(companyId, 'ios', function(aws_application_user_sub_callback){
                                                        });
                                                        return res.json({status:'success', data:'Update Setting: IOS application data update' , message: appleData});
                                                    }
                                                    else
                                                    {
                                                        return res.json({
                                                            status: 'fail',
                                                            data: null,
                                                            message: 'Some Unknown Database error'
                                                        });
                                                    }
                                                }).catch(function(err) {
                                                    return res.json({
                                                            status: 'fail',
                                                            data: err,
                                                            message: 'Some Unknown error'
                                                     });
                                                });
                                                /* Update Data in Database : End */

                                            }
                                            else if(responseStatus == 'error')
                                            {
                                                var erorMsg = responseMessage.message;
                                                return res.json({status: 'fail', data: 'create IOS application', message: erorMsg});  
                                            }
                                        });
                                        
                                      /** Update AWS Apple Production Application : End */
                                }
                                else  /* Empty record in DB */
                                {
                                    /* Create AWS Apple Production Application : Start */
                                    awsAppleAppName = companyName+'_application_'+platform+'_'+awsAppleAppPlatform+'_'+ Math.random().toString(36).slice(-10);
                                    awsAppleAppName = awsAppleAppName.replace(/[^A-Za-z0-9_.-]+/ig, "_");

                                    /* call AWS Create Application Method */
                                    awsSubscriber.createAppleApplication(awsAppleAppName, awsAppleAppPlatform, awsAppleAppCertificate, awsAppleAppPrivateKey, function(response){
                                        
                                        var responseStatus = response.response; /* API Resonse Status */
                                        var responseMessage = response.data; /* API Reponse Message */

                                        if(responseStatus == 'success')
                                        {
                                            var awsArn = responseMessage.PlatformApplicationArn;
                                            var awsReqId = responseMessage.ResponseMetadata.RequestId;

                                            /* Create Data JSON */
                                            var appleData = [];
                                            appleData = {
                                                    iotAppleAppName: awsAppleAppName,
                                                    iotAppleAppPlatform: awsAppleAppPlatform,
                                                    iotAppleAppCertif : awsAppleAppCertificate,
                                                    iotAppleAppPrvKey : awsAppleAppPrivateKey,
                                                    appAwsArn : awsArn,
                                                    appAwsReqId : awsReqId
                                                };
                                            appleData = JSON.stringify(appleData);

                                            var updateSettingData = [];
                                                updateSettingData = {
                                                            ios_aws_app_data : appleData
                                                        }
                                            /* Update Data in Database : Start */
                                                db.models.setting.update( updateSettingData, {
                                                                   where : { company_id: companyId, id: req.params.id } 
                                                                   }).then(function(setting) {
                                                    if(setting)
                                                    {
                                                        // Application Create/Update: User Subscription Process
                                                        awsIotConnect.awsApplicationCreate(companyId, 'ios', function(aws_application_user_sub_callback){
                                                        });
                                                        return res.json({status:'success', data:'Update Setting: IOS application data update' , message: appleData});
                                                    }
                                                    else
                                                    {
                                                        return res.json({
                                                            status: 'fail',
                                                            data: 'Update Setting: IOS application data update',
                                                            message: 'Some Unknown Database error'
                                                        });
                                                    }
                                                }).catch(function(err) {
                                                    return res.json({
                                                            status: 'fail',
                                                            data: err,
                                                            message: 'Some Unknown error'
                                                     });
                                                });
                                            /* Update Data in Database : End */
                                        }
                                        else if(responseStatus == 'error')
                                        {
                                            var erorMsg = responseMessage.message;
                                            return res.json({status: 'fail', data: 'create IOS application', message: erorMsg});
                                        }
                                    });
                                 /* Create AWS Apple Production Application : End */
                                }

                            }
                            else
                            {
                                res.json({
                                    status: "success",
                                    data: [],
                                    message: 'Company setting record not found'
                                });
                            }
                        }).catch(function(err){
                            return res.json({
                                    status: 'fail',
                                    data: err,
                                    message: 'Some Unknown error'
                                });
                        });
                    /* Get device record : End */
                }/* Live Application : Production Enviromnent : End */
                else if(awsAppleAppPlatform == 'APNS_SANDBOX') /* SandBox Application : Development/Testing Enviroment Start */
                {
                    // Code Same as Production
                } 
                /* SandBox Application : Development/Testing Enviroment End */
            }     
            else /* Get company details fail */
            {
                return res.json({ status: 'fail', data: 'Setting Apple Device: Company record not found', message: companyResponse.message });
            }
         })
       /* Apple Application : End */
    }
    else if(platform == 'android') /* Android Application : Start */
    {
        var awsAndroidAppData = req.body.androiddata;

        /* Get Company Details */
        var userInfo = generalConfig.getUserInfo(req);
        var companyId = userInfo.companyId;

        commonLib.getCompanyInfoById(companyId, function(companyResponse){
            if(companyResponse.status != 'fail') /* Success */
            {
                var companyData = companyResponse.data; /* Company Data */
                var awsAndroidAppName = awsAndroidAppData.iotAndroidAppName; /* Application Name */
                var companyName = companyData.name; /* Company Name */
                var awsAndroidGCMApiKey = awsAndroidAppData.iotAndroidAppApi; /* Application App API */
                
                var awsAndroidPlatform = 'GCM'; /* Application Platform */

                /* Create New Application: Start */    
                if(awsAndroidAppName == '' || typeof awsAndroidAppName === 'undefined')
                {
                    awsAndroidAppName = companyName+'_application_'+platform+'_'+ Math.random().toString(36).slice(-10);
                    awsAndroidAppName = awsAndroidAppName.replace(/[^A-Za-z0-9_.-]+/ig, "_"); /* Set new Application Name */
                
                    /* Call Create Application Method */         
                    awsSubscriber.createAndroidApplication(awsAndroidAppName, awsAndroidPlatform, awsAndroidGCMApiKey, function(response){ 

                        var responseStatus = response.response; /* API Resonse Status */
                        var responseMessage = response.data; /* API Reponse Message */

                        if(responseStatus == 'success')
                        {
                            var awsArn = responseMessage.PlatformApplicationArn;
                            var awsReqId = responseMessage.ResponseMetadata.RequestId;

                            /* Create Data JSON */
                            var androidData = [];
                            androidData = {
                                    iotAndroidAppName: awsAndroidAppName,
                                    iotAndroidAppPlatform: awsAndroidPlatform,
                                    iotAndroidAppApi : awsAndroidGCMApiKey,
                                    appAwsArn : awsArn,
                                    appAwsReqId : awsReqId
                                };
                            androidData = JSON.stringify(androidData);

                            var updateSettingData = [];
                            updateSettingData = {
                                       android_aws_app_data : androidData
                                    }
                        /* Update Data in Database : Start */
                            db.models.setting.update( updateSettingData, {
                                               where : { company_id: companyId, id: req.params.id } 
                                               }).then(function(setting) {
                                if(setting)
                                {
                                    // Application Create/Update: User Subscription Process
                                    awsIotConnect.awsApplicationCreate(companyId, 'android', function(aws_application_user_sub_callback){
                                    });

                                    return res.json({status:'success', data:'Update Setting: Android application data update' , message: androidData});
                                }
                                else
                                {
                                    return res.json({
                                        status: 'fail',
                                        data: 'Update Setting: Android application data update',
                                        message: 'Some Unknown Database error'
                                    });
                                }
                            }).catch(function(err) {
                                return res.json({
                                        status: 'fail',
                                        data: err,
                                        message: 'Some Unknown error'
                                 });
                            });
                         /* Update Data in Database : End */
                        }
                        else if(responseStatus == 'error')
                        {
                            var erorMsg = responseMessage.message;
                            return res.json({status: 'fail', data: 'Update Setting: Android application data create', message: erorMsg});
                        }
                    })
                } /* Create New Application: End */
                else
                {
                    var awsAndroidARN = awsAndroidAppData.appAwsArn; /* Android Application ARN */
                    
                    /* Call Update Application Method */         
                    awsSubscriber.updateAndroidApplication(awsAndroidARN, awsAndroidGCMApiKey, function(response){ 

                        var responseStatus = response.response; /* API Resonse Status */
                        var responseMessage = response.data; /* API Reponse Message */

                        if(responseStatus == 'success')
                        {
                            var awsReqId = responseMessage.ResponseMetadata.RequestId;

                            /* Create Data JSON */
                            var androidData = [];
                            androidData = {
                                    iotAndroidAppName: awsAndroidAppName,
                                    iotAndroidAppPlatform: awsAndroidPlatform,
                                    iotAndroidAppApi : awsAndroidGCMApiKey,
                                    appAwsArn : awsAndroidARN,
                                    appAwsReqId : awsReqId
                                };
                            androidData = JSON.stringify(androidData);

                            var updateSettingData = [];
                            updateSettingData = {
                                       android_aws_app_data : androidData
                                    }
                            /* Update Data in Database : Start */
                                db.models.setting.update( updateSettingData, {
                                                   where : { company_id: companyId, id: req.params.id } 
                                                   }).then(function(setting) {
                                    if(setting)
                                    {
                                        // Application Create/Update: User Subscription Process
                                        awsIotConnect.awsApplicationCreate(companyId, 'android', function(aws_application_user_sub_callback){
                                        });
                                        
                                        return res.json({status:'success', data:'Update Setting: Android application data update' , message: androidData});
                                    }
                                    else
                                    {
                                        return res.json({
                                            status: 'fail',
                                            data: 'Update Setting: Android application data update',
                                            message: 'Some Unknown Database error'
                                        });
                                    }
                                }).catch(function(err) {
                                    return res.json({
                                            status: 'fail',
                                            data: err,
                                            message: 'Some Unknown error'
                                     });
                                });
                             /* Update Data in Database : End */
                        }
                        else if(responseStatus == 'error')
                        {
                            var erorMsg = responseMessage.message;
                            return res.json({status: 'fail', data: 'Update Setting: Android application data update' , message: erorMsg});
                        }
                    })
                }
            }    
            else /* Get company details fail */
            {
                return res.json({ status: 'fail', data: 'Setting Android Device: Company record not found', message: companyResponse.message });
            }
        })
     /* Android Application : End */
    }
    else
    {
        return res.json({status:'fail', data: 'Application update', message: 'Some Unknown error.' });
    }
}

/*
 @ AWS
 @ Get Private key & Certificate from P12 File
 */
exports.uploadApnsGetKey = function(req, res, next){
    
    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.companyId){
         return res.json({status:'fail', data: 'Get Certificate: Validation', message:'Unknown user', code:401});
         return false;
    }
    var company_id = userInfo.companyId;
    company_id = company_id.trim();

    var filePassword =  req.body.iotAppleAppP12pw; /* Password For open .p12 file */

    var fs = require('fs-extra');

    //file should not be empty                
    if(!req.files || !req.files.iotAppleAppP12file )
    {
        return res.json({ status: "fail", data: 'Get Certificate: Validation', message:"File is empty" });
        return false;
    }

    var file = req.files.iotAppleAppP12file;
    //file should not exceed 1MB
    if(file.size>1000000)
    {
        return res.json({ status: "fail", data: 'Get Certificate: Validation', message:"File too large , max file size allowed 1MB" });
        return false;
    }
    //file should be p12 type only
    if(file.type !='application/x-pkcs12')
    {
        return res.json({ status: "fail", data: 'Get Certificate: Validation', message:"Invalid File Type" });
        return false;
    }

    var tmpPath = file.path;
    var fileName = file.originalFilename;
    var randFld = Math.random().toString(36).slice(-5)+Math.random().toString(36).slice(-5);
    var destPath = './'+settings.filesPath.certificate+"/"+company_id+"/apns/"+randFld+"/"+fileName;

    /* Upload File */
    fs.copy(tmpPath, destPath, { replace: true }, function (fileErr) {
        if (fileErr) 
        {
            res.json({status:"fail", data: fileErr, message : 'Upload file process has not been completed successfully. Please try again'});
        }
        
        /* Read Files using Command */
            var shell = require('shelljs');
            var fileLocationPath = destPath;
            var newPemFilePath = settings.filesPath.certificate+"/"+company_id+"/apns/"+randFld+"/keyStore.pem";

            /* Convert File .p12 to .pem */
            shell.exec('openssl pkcs12 -in '+fileLocationPath+' -out '+newPemFilePath+' -nodes -password pass:'+filePassword, function(code, stdout, stderr) {
              if(code == 0)
              {
                    /* Get Private Key from .pem file */
                    shell.exec('openssl pkey -in '+newPemFilePath, function(code, stdout, stderr) {
                            if(code == 0)
                            {
                                   var p12PrivateKey = stdout;
                                   /* Get Certificate from .pem file */
                                   shell.exec('openssl x509  -in '+newPemFilePath, function(code, stdout, stderr) {
                                           if(code == 0)
                                           {
                                              var p12Certificate = stdout;

                                                    /* Get other setting from setting Table : Start */
                                                    db.models.setting.findOne({
                                                                                  attributes: ['android_aws_app_data', 'ios_aws_app_data', 'company_id'],
                                                                                  where: ["id = ?", req.params.id]
                                                                                }) .then(function(setting)
                                                        {
                                                            if(setting)
                                                            {
                                                                var dataResultJson = [];
                                                                dataResultJson = {
                                                                                iotAppleAppPrvKey: p12PrivateKey,
                                                                                iotAppleAppCertif: p12Certificate,
                                                                                iotresultdata: setting
                                                                            };

                                                                dataResultJson = JSON.stringify(dataResultJson);
                                                                return res.json({ status: "success", data: dataResultJson, message:"Data read successfully" });
                                                            }
                                                            else
                                                            {
                                                                res.json({ status:"success", data: null, message:"Data read successfully" });
                                                            }
                                                        }).catch(function(err){
                                                            return res.json({ status: "fail", data: err, message:"Some unknown database error" });
                                                        });
                                                    /* Get other setting from setting Table : End */
                                           }
                                           else
                                           {
                                               return res.json({ status: "fail", data: stderr, message: 'Some unknown error' });
                                           }
                                   })
                            }
                            else
                            {
                                return res.json({ status: "fail", data: stderr, message: 'Some unknown error' });
                            }
                    })
              }
              else
              {
                 return res.json({ status: "fail", data: stderr, message: 'File reading operation error, Please check password' });
              }
            });
    });
}

/*
 @ AWS
 @ Remove Application
 @ PlatForm Type : 1 = IOS, 2 = Android
 */
exports.removeApplication = function(req, res, next){

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.companyId)
    {
        return res.json({
                    status: 'fail',
                    data: null,
                    message: 'User information not found.'
                });
        return false;
    }
    var company_id = userInfo.companyId; // Company ID
    var get_platform_type = req.params.id; // PlatForm Type

    if(get_platform_type != '')
    {
        awsIotConnect.awsApplicationRemove(company_id, get_platform_type, function(removeApplication_callback){
                if(removeApplication_callback.status == 'fail') // Fail
                {
                    return res.json({
                        status: 'fail',
                        data: null,
                        message: 'Remove application process has not been completed successfully'
                    });
                }
                else // Success
                {
                    return res.json({
                        status: 'success',
                        data: null,
                        message: 'Remove application process has been completed successfully'
                    });
                }
        })
    }
    else // PlatFrom not found
    {
        return res.json({
                status: 'fail',
                data: null,
                message: 'Application Platform has not been found'
            });
    }
    
}

/**
 * @author HY
 * update firmware on given ftp account detail
 * @return json
 */
exports.updateFirmware = function(req, res, next) {

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

    if (req.body != "") {
        req.checkBody('host', 'FTP host is required').notEmpty();
        req.checkBody('username', 'FTP username is required').notEmpty();
        req.checkBody('password', 'FTP password is required').notEmpty();
        //req.checkBody('firmwarefile', 'Firmware file is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {

        var ftp = req.body;
        var firmwarefile = req.files.firmwarefile;

        var filename = firmwarefile.originalFilename;
        var tempPath = firmwarefile.path;
        var targetPath = path.resolve('/var/www/iotconnect/adminUI/firmware/' + filename);

        fs.copy(tempPath, targetPath, function(err) {
            if (err) {
                return res.json({
                  'status': 'fail',
                  'message': 'Problem in uploading firmware file, please contact administrator',
                  'error': err,
                });                  
            } else {

                var ftpdetail = {
                    'host' : ftp.host,
                    'port': '22',            
                    'username' : ftp.username,
                    'password' : ftp.password
                };

                var Client = require('ssh2-sftp-client');
                var sftp = new Client();
                sftp.connect(ftpdetail)
                .then(function() {
                    return sftp.put(targetPath, '/var/www/html/iotconnect/adminUI/'+filename);
                }).then(function() {
                    return res.json({
                      'status': 'success',
                      'message': 'Firmware file uploaded successfully',
                      'error': err,
                    }); 
                }).catch((err) => {
                    return res.json({
                      'status': 'fail',
                      'message': 'Problem in uploading firmware file, please contact administrator',
                      'error': err,
                    });            
                });

            }
        });

    } else {
        res.json({
            status: 'fail',
            message: mappedErrors
        });
    }       
};
