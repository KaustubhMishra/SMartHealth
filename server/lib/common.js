var sequelize_file = require('../config/sequelize');
var db = sequelize_file.db; // Company Database
var master_db = sequelize_file.master_db;  // Master Database
var DataTypes = require("sequelize");
var generalConfig = require('../config/generalConfig');
var cassandra = require('cassandra-driver');
var async = require('async');
//var fs = require('fs');
var fs = require('fs-extra');
var path = require('path');  
var lwip = require('lwip');

var base64 = require('base-64');
var utf8 = require('utf8');
var localStorage = require('localStorage');
var secretKey = settings.secretKey;
var jwt = require('jwt-simple');

//var AWS = require("aws-sdk");
var awsConfig = require('../config/awsConfig')
var awsSNS = awsConfig.SNS;

var postDeviceInfo  =  function(deviceType, deviceToken, id)
{
    // console.log("Request COme for Common Function");
    // console.log("Device Type" +  deviceType);
    // console.log("Device Token" + deviceToken);
    // console.log("User " + id);
    awsRegisterDevice(deviceToken, function(err, data){
        if(err) {                
            //console.log(err);
        } else {
            var updatefields = {};
            updatefields['device_type'] = deviceType;
            updatefields['device_token'] = deviceToken;
            updatefields['aws_target_arn'] = data.EndpointArn;

            db.models.user.findOne( { where: { id: id } } ).then(function(user) {
                user.update(updatefields).then(function(user){
                    processPendingPushNotification(data.EndpointArn, id, function(err, data){

                    });
                })
            }).catch(function(err) {
                    return callback({status: false , data: err, message: 'Some Unknown Database error'});
            });
        }
    });
}

var processPendingPushNotification  =  function(targetarn, userId) {
    var currentdatetime = new Date();

    db.models.patient.findOne({
        attributes:['id'],
        where:{
            user_id: userId
        }
    }).then(function(patientData){

        db.models.notification_backup.findAll({
            attributes:['patient_id', 'pushdata'],
            where:{ 
                patient_id: patientData.id,
                createdAt: currentdatetime
            }
        }).then(function(pushNotifications){

            async.forEach(pushNotifications, function (item, callback){
                
                var pushdata = JSON.parse(item.pushdata);
                awsSendPushNotification(targetarn, pushdata, function(err, data){
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
                    } else{
                        db.models.notification_backup.destroy({ where: { patient_id: item.patient_id} }).then(function(){
                            console.log("Notification Deleted successfully");
                        });

                    }
                });

                
                callback();
                
            }, function(err) {
                if(err) {
                    err.responseMessage = 'Error in to loading data.';
                    console.log(err); 
                    //callbackFunc(err);
                } else {
                    console.log('Notification sent successfully');
                    //callbackFunc(null, calenderdata);
                }
            });            
        })        
    });
}

var removeDeviceInfo = function(id, callback) {

    db.models.user.findOne( { where: { id: id } } ).then(function(user) {
        if (user.aws_target_arn) {
            awsDeregisterDevice(user.aws_target_arn, function(err, data){
                if(err) {      
                    //console.log(err);
                    err.responseMessage = 'Error in logout process';
                    callback(err);                
                } else {

                    user.device_type = null;
                    user.device_token = null;
                    user.aws_target_arn = null;

                    user.save().then(() => {
                        callback(null, true);
                    }).catch(function(err) {
                        console.log(err);
                        err.responseMessage = 'Error in logout process'
                        callback(err);
                    });
                }
            });
        } else {
            callback(null, true);            
        }
    }).catch(function(err) {
        console.log(err);
        err.responseMessage = 'Error to loading user detail';
        callback(err); 
    });
}

var storeSFImage = function (options, callback) { 

    var file = options.uploadedfileobj;
    //var filename = Date.now() + path.extname(file.name);  
    var filename = Date.now() + '_' + file.originalFilename;  

    var result = {'status': true}

    var validextensions = settings.validImageExtensions;
    var fileextension = path.extname(file.name).toLowerCase();

    if (file.size > 2000000) {
        result.status = false;
        result.message = "File too large , max file size allowed 2MB";
        callback(result);
    }
    //else if (file.type != 'image/png') {
    //else if (path.extname(file.name).toLowerCase() !== '.png') {
    else if (validextensions.indexOf(fileextension) == -1) {
        result.status = false;
        result.message = "Invalid Image File";
        callback(result);
    }
    else {
        var tempPath = file.path;
        var targetPath = path.resolve(options.storagepath + filename);

        fs.copy(tempPath, targetPath, function(err) {
            if (err) {
                result.status = false;
                result.message = err;
                callback(result);
            } else {

                if(options.resizeinfo) {

                    var thumbtargetDir = path.resolve(options.storagepath + 'thumbnail');
                    var thumbtargetPath = path.resolve(thumbtargetDir + '/' + filename);
                    var thumbsizewidth = '150';
                    var thumbsizeheight = '150';

                    if(!fs.existsSync(thumbtargetDir)){
                    fs.mkdirSync(thumbtargetDir, '0766', function(err){
                        if(err){
                            result.status = false;
                            result.message = err;
                            callback(result);         
                        }
                    });   
                    }

                    lwip.open(targetPath, function(err, image){
                    if(err) {
                        result.status = false;
                        result.message = err;
                        callback(result);
                    } else {

                        var widthRatio =  thumbsizewidth / image.width();
                        var heightRatio = thumbsizeheight / image.height();
                        var ratio = Math.min(widthRatio, heightRatio);

                        image.batch().scale(ratio).writeFile(thumbtargetPath, function(err){
                            if(err) {
                                result.status = false;
                                result.message = err;
                            } else {
                                result.data = {'filename':filename}                                
                            }
                            callback(result);
                        });
                    }
                    });

                } else {
                    result.data = {'filename':filename}
                    callback(result);
                }

            };

        });
    }

};


/*
 * @author : GK
 * Get Company Information By Company Id
 */

var getCompanyInfoById  =  function getCompanyNameById(companyId, callback)
{
	 /* Get all rules */
	db.models.company.findOne( { where: { id: companyId } } ).then(function(company) {
		if(company)
		{
			return callback({status: 'success' , data: company, message: 'Record found successfully'});
		}
		else
		{
			return callback({status: 'fail' , data: null, message: 'Company record not found'});
		}
	}).catch(function(err) {
			return callback({status: 'fail' , data: err, message: 'Some Unknown Database error'});
	   });
}

/*
 * @author : MK
 * Get User Information By User Id
 */

var getUserInfoById  =  function getUserInfoById(userID, callback)
{
     /* Get all rules */
    db.models.user.findOne( { where: { id: userID } } ).then(function(user) {
        if(user)
        {
            return callback({status: true , data: user, message: 'Record found successfully'});
        }
        else
        {
            return callback({status: false , data: null, message: 'Company record not found'});
        }
    }).catch(function(err) {
        return callback({status: false , data: null, message: 'Some Unknown Database error'});
    });
}

/*
 * @author : GK
 * Remove all parent and child  directories
 */
var deleteFolderRecursive = function deleteFolderRecursive(path) {
	
  if( fs.existsSync(path) ) {
    
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }

};

var checkUserEmailExistStatus = function checkUserEmailExistStatus(emailAddress, callback)
{
    db.models.user
        .findOne({
              where: {
                email: emailAddress
              }
        })
       .then(function(user) {

          var isEmailUnique = ( (user) ? true : false );
          callback({
                status: "success",
                data: isEmailUnique,
                message: 'User email status request has been completed successfully'
           });
        })
        .catch(function(err) {
            callback({
                status: "success",
                data: null,
                message: 'User email status request has not been completed successfully'
           });
        }); 
}

var checkCompanyExistStatus = function checkCompanyExistStatus(companyName, companyId, callback)
{
    var whereCondition = '';
    if(typeof companyId !== undefined || companyId != '')
    {
        whereCondition = 'and id != "'+companyId+'"';
    }


    db.models.company
        .findOne({
              where: ["name = ? "+whereCondition, companyName],
        })
    .then(function(company) {        
        var isNameUnique = ( (company) ? true : false );
        callback({
            status: 'success',
            data: isNameUnique,
            message: 'Company name status request has been completed successfully'
        });
    })
    .catch(function(err) {
        callback({
            status: 'fail',
            data: null,
            message: 'Company name status request has not been completed successfully'
        });          
    });
}

/**
 * @author HY
 * load user group into user object
 * @param  [object] user
 */
var loadUserGroup = function (user, callback) {
    if(user) {        
        db.models.company_user_group
        .findOne({
            where: { user_id: user.id },
            include: [{
                model: db.models.company_group,
            }]
        })
       .then(function(company_user_group) {            
            user.setDataValue('usergroup', company_user_group.company_group.name);
            callback();
        })
        .catch(function(err) {
        });
    }
};

/**
 * @author HY
 * load profile images urls into user object
 * @param  [object] user
 */
var loadProfileImages = function (user, callback) {
    
  if(user) {

    //  set profile picture original image url
    user.setDataValue('profilepictureurl', generalConfig.siteUrl + '/theme/img/avatar-sign.png' );
    if(user.profile_image) {
        var imagePath = settings.filesPath.userPicture + user.profile_image;
        try{
            fs.accessSync(imagePath);
            if(imagePath.startsWith("public/")) {
                var imageurl = generalConfig.siteUrl + imagePath.slice(6);
            } else {
                var imageurl = generalConfig.siteUrl + '/' + imagePath;
            }                
            user.setDataValue('profilepictureurl', imageurl);
        }catch(e){
           //code to action if file does not exist
        }  
        
    }

    //  set profile picture thumbnail image url
    user.setDataValue('profilepicturethumburl', generalConfig.siteUrl + '/theme/img/avatar-sign.png' );
    if(user.profile_image) {
        var imagePath = settings.filesPath.userPicture + 'thumbnail/' + user.profile_image;
        try{
            fs.accessSync(imagePath);
            if(imagePath.startsWith("public/")) {
                var imageurl = generalConfig.siteUrl + imagePath.slice(6);
            } else {
                var imageurl = generalConfig.siteUrl + '/' + imagePath;
            }                
            user.setDataValue('profilepicturethumburl', imageurl);
        }catch(e){
           //code to action if file does not exist
        }  
        
    }

    callback();

  }

};

/**
 * @author HY
 * store profile picture
 * @param  file file
 * @param  [func] callback 
 * @return json
 */
var storeProfilePicture = function storeProfilePicture(profilePictureFile, userid, callback) { 

    var file = profilePictureFile;
    var filename = userid + "-" + Date.now() + path.extname(file.name);    

    var result = {'status': true}

    var validextensions = settings.validImageExtensions;
    var fileextension = path.extname(file.name).toLowerCase();

    if (file.size > 2000000) {
        result.status = false;
        result.message = "File too large , max file size allowed 2MB";
        callback(result);
    }
    //else if (file.type != 'image/png') {
    //else if (path.extname(file.name).toLowerCase() !== '.png') {
    else if (validextensions.indexOf(fileextension) == -1) {
        result.status = false;
        result.message = "Invalid Image File";
        callback(result);
    }
    else {
        var tempPath = file.path;
        var targetPath = path.resolve(settings.filesPath.userPicture + filename);

        fs.copy(tempPath, targetPath, function(err) {
            if (err) {
                result.status = false;
                result.message = err;
                callback(result);
            } else {

            var thumbtargetDir = path.resolve(settings.filesPath.userPicture + 'thumbnail');
            var thumbtargetPath = path.resolve(thumbtargetDir + '/' + filename);
            var thumbsizewidth = '150';
            var thumbsizeheight = '150';

                if(!fs.existsSync(thumbtargetDir)){
                    fs.mkdirSync(thumbtargetDir, '0766', function(err){
                        if(err){
                            result.status = false;
                            result.message = err;
                            callback(result);         
                        }
                    });   
                }

                lwip.open(targetPath, function(err, image){
                    if(err) {
                        result.status = false;
                        result.message = err;
                        callback(result);
                    } else {


                        var widthRatio =  thumbsizewidth / image.width();
                        var heightRatio = thumbsizeheight / image.height();
                        var ratio = Math.min(widthRatio, heightRatio);

                        image.batch().scale(ratio).writeFile(thumbtargetPath, function(err){
                            if(err) {
                                result.status = false;
                                result.message = err;
                            } else {
                                result.filename = filename;
                            }
                            callback(result);
                        });
                    }
                });

            };

        });
    }

};

/**
 * @author HY
 * remove profile picture
 * @param  file file
 * @param  [func] callback 
 * @return json
 */
var removeProfilePicture = function (profileimagefile) { 
    if(profileimagefile != undefined && profileimagefile != "") {
        var imagePath = path.resolve(settings.filesPath.userPicture + profileimagefile);
        fs.unlink(imagePath, function (err) {
            //if (err) throw err;
            var imageThumbPath = path.resolve(settings.filesPath.userPicture + 'thumbnail/' + profileimagefile);
            fs.unlink(imageThumbPath, function (err) {
                //if (err) throw err;
            });        
        });
    }
};

/**
 * @author MK
 * Authentication before login
 * @param  authorization token
 * @param  [func] callback 
 * @return json response
 */
var checkAuthentication  =  function checkAuthentication(authorizationToken, callback)
{

    var str = authorizationToken.split(' ');
    if (str.length == 2) {
        var scheme = str[0];
        if (/^Basic/i.test(scheme)) {
            var basicToken = str[1];
            var encoded = basicToken;
            var bytes = base64.decode(encoded);
            var actualStr = utf8.decode(bytes);

            var strText = actualStr.split(':');
            if (strText.length == 2) {
                var scheme2 = strText[0];
                if (/^screteKEY/i.test(scheme2)) {
                    var clientSecret = strText[1];
                    var decoded = jwt.decode(clientSecret, secretKey);
                    var randNum = localStorage.getItem('randNum');
                    console.log(randNum);
                    console.log(decoded.import);
                    if(decoded.import === randNum)
                    {   
                        //localStorage.clear();
                        callback({'status' : true, 'message' : 'Signup authentication success.!'});
                    }
                    else
                    {   
                        //localStorage.clear();
                        callback({'status' : false, 'message' : 'Authentication failed.!'});
                    }
                }
            }
            else
            {
                callback({'status' : false, 'message' : 'Data mission or Authentication failed.!'});
            }
        }
        else
        {
            callback({'status' : false, 'message' : 'Data mission or Authentication failed.!'});
        }
    } else {
        callback({'status' : false, 'message' : 'Data mission or Authentication failed.!'});
    }
}


/**
 * @author HY
 * setup new company, add company, settings, user, groups and their mappings
 * @param  [json] company
 * @param  [json] adminuser
 * @param  [String] cpid_string
 * @param  [func] callback 
 */
var setupNewCompany = function (company, adminuser, cpid_string, callback) {

    var companyAdminGroupId = cassandra.types.uuid();
    var companyDefaultGroupId = cassandra.types.uuid();

    db.transaction(function(t) {
        return Promise.all([
            db.models.company.create(company, {
                transaction: t
            }),
            db.models.user.create(adminuser, {
                transaction: t
            }),
            db.models.setting.create({
                company_id: company.id
            }, {
                transaction: t
            }),            
            db.models.company_group.create({
                id: companyAdminGroupId,
                company_id: company.id,
                name: 'Admin'
            }, {
                transaction: t
            }),
            db.models.company_group.create({
                id: companyDefaultGroupId,
                company_id: company.id,
                name: 'Default'
            }, {
                transaction: t
            }),
            db.models.company_user_group.create({
                user_id: adminuser.id,
                company_group_id: companyAdminGroupId
            }, {
                transaction: t
            }),
            db.models.company_usage.create({  // Company Usage
                company_id: company.id,
                api_count: 0,
                device_count: 0,
                email_notification_count: 0,
                push_notification_count: 0,
                sms_notification_count: 0,
                mysql_db_size: 0,
                cassandra_db_size: 0
            }, {
                transaction: t
            }),
            db.models.role.create({
                name: "Admin",
                company_id: company.id
            }, {
                transaction: t
            }).then(function (role) {
                roleID = role.id;
                db.models.user.update({
                    role_id: role.id
                }, {
                    where:{
                        id:adminuser.id,
                    }
                 },{
                    transaction: t
                });
            })
        ]).then(function() {
            getModulesAndPermission(function(permissionArray){
                async.forEach(Object.keys(permissionArray.data), function (index, callbackPermission){ 
                    permissionArray.data[index].role_id = roleID;
                    callbackPermission();
                }, function(err) {
                    if(!err)
                    {
                            async.waterfall([
                                // 1. Add record in master database
                                function(callback_wf) {
                                    // Add record in master database
                                    master_db.models.company.create({
                                            sw_product_id: settings.softweb_product_id,
                                            company_id: company.id,
                                            cpid: cpid_string,
                                            database_name: company.database_name
                                    }).then(function(company) {
                                            callback_wf(null);
                                    }).catch(function(err) {
                                        callback_wf({
                                            'status':false,
                                            'error':err
                                        });
                                    })
                               },
                               // 2. Remove CPID record from unique_cpid table
                               function(callback_wf) {
                                    master_db.models.unique_cpid.destroy({
                                            where: { cpid: cpid_string }
                                    }).then(function(unique_cpid){
                                        callback_wf(null);
                                    }).catch(function(err) {
                                        callback_wf({
                                            'status':false,
                                            'error':err
                                        });
                                    })
                               },
                               // 3. Give Role permission
                               function(callback_wf) {
                                     // give role permission
                                    db.models.role_permission.bulkCreate(permissionArray.data)
                                    .then(function (role) {
                                        callback_wf({
                                            'status':true,
                                        });
                                    });
                                }
                            ], function(response) {
                                callback(response);
                            })
                    }
                    else
                    {
                        callback({
                            'status':false,
                            'error':err
                        });
                    }
                });
            });
        });
    }).catch(function(err) {
        callback({
            'status':false,
            'error':err
        });
    });
};

/**
 * @author GK
 * Byte value convert to Bytes', 'KB', 'MB', 'GB', 'TB'
 * @param : bytes = bytes Value
 */
function bytesToSize(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseFloat(Math.floor(Math.log(bytes) / Math.log(1024)));
   var result =  bytes / Math.pow(1024, i);
   return Math.round(result*100)/100 + ' ' + sizes[i];
};

/**
 * @author GK
 * Generate Random CPID String
 */
function generateCPID() {
    var d = new Date().getTime();
    var r = Math.random() * d * Math.random();
    return r.toString(36).slice(0,6);
};

/**
 * @author GK
 * Get unique CPID from unique_cpid table on new company regitration
 */
var getUniqueCpid  =  function getUniqueCpid(callback)
{
    // Fetch Value
    master_db.query("select uc.cpid from unique_cpid as uc where uc.cpid not in( select cpid from company )  order by uc.id asc limit 0,1",
        { type: master_db.QueryTypes.SELECT }
    ).then(function(cpid_response)
    { 
        if(cpid_response.length > 0) // Result Found
        {
            var new_cpid = cpid_response[0].cpid;
            callback({
                status: 'success',
                data: new_cpid,
                message: 'Company CPID record has been found'
            });
        }
        else
        {
            callback({
                status: 'fail',
                data: null,
                message: 'Company CPID Record has not been found, Please contact administrator'
            });
        }
    }).catch(function(err) { // Some unknow error
        callback({
            status: 'fail',
            data: err,
            message: 'Company CPID Record has not been found, Please contact administrator'
        }); 
    });
}

/**
 * @author GK
 * Get CPID from company Id
 * @param : company_id = Company Id
 */
var getCPIDFromCompanyID  =  function getCPIDFromCompanyID(company_id, callback)
{
     /* Get all rules */
    db.models.company.findOne({
                    attributes: ['cpid'], 
                    where: { id: company_id }
                }).then(function(company) {
        if(company)
        {
          return callback({status: 'success' , data: company.cpid, message: 'Company CPID has been found successfully'});
        }
        else
        {
          return callback({status: 'fail' , data: null, message: 'Company CPID has not been found'});
        }
    }).catch(function(err) {
        return callback({status: 'fail' , data: err, message: 'Company CPID has not been found'});
    });
}

/**
  * @author: Gunjan
  * Get group hierarchy information
  * Get Rule Count & Thing Count
  * @param : group_id : Group Id
  */
var checkAssignRuleOrThingToGroupAndChildGroup = function checkAssignRuleOrThingToGroupAndChildGroup(group_id, callback)
{
    if(group_id)
    {
        // Get group & child group information
        getGroupHierarchyInformation(group_id, function(groupData_callback){
            if(groupData_callback.status == 'success')
            {
                var rule_assign_count = 0;
                var thing_assign_count = 0;
                // forEach(1) Start
                async.forEachSeries(groupData_callback.data, function(groupData, callback_f1) {
                        // Rule
                        rule_assign_count = parseInt(rule_assign_count) + parseInt(groupData.rule_count);
                        // Thing
                        thing_assign_count = parseInt(thing_assign_count) + parseInt(groupData.thing_count);
                        callback_f1();

                }, function() {
                    // forEach(1) End
                        var result_data = [];
                            result_data = {
                                  rule_count: rule_assign_count,
                                  thing_count: thing_assign_count
                            }

                        callback({
                            status: 'success',
                            data: result_data,
                            message: 'Group hierarchy information has been found'
                        })
                });
            }
            else
            {
                callback({
                    status: 'fail',
                    data: null,
                    message: 'Group hierarchy has not been found, please try again'
                })
            }
        })
    }
    else
    {
        callback({
            status: 'fail',
            data: null,
            message: 'Group id has not been found'
        })
    }
}

/**
  * @author: Gunjan
  * Get group hierarchy information
  * @param : group_id : Group Id
  * @param : company_id : Company Id
  */
var getGroupHierarchyInformation = function getGroupHierarchyInformation(group_id, callback)
{
        var groupListArry = []; // Result Group Array
        var currentLoopStep = 0;  // Lopping Child Steps ( First Group = 0)

        // Get Group Information
        db.query("select deviceGroup.id as result_group_id, deviceGroup.parent_id as parent_id, deviceGroup.name as group_name, deviceGroup.company_id as company_id, ( select count(*) from rule where device_group_id = :group_id and deletedAt is null ) as rule_count,  ( select count(*) from thing where device_group_id = :group_id and deletedAt is null ) as thing_count from device_group as deviceGroup where id = :group_id",
           { replacements: { group_id: group_id }, type: db.QueryTypes.SELECT }
        ).then(function(group_data_res)
        {
          if(group_data_res.length > 0) // Data Found
          {
                var getGroupInformation = group_data_res[0];
                var groupNameTempArry = []; // Temp Group Array
                    groupNameTempArry = {
                                id : group_id,
                                name : getGroupInformation.group_name,
                                level : currentLoopStep,
                                pid : getGroupInformation.parent_id,
                                rule_count: getGroupInformation.rule_count,
                                thing_count: getGroupInformation.thing_count,
                                company_id: getGroupInformation.company_id
                            }
                groupListArry.push(groupNameTempArry); // Push Value in Loop Global Array

                // Get Child Information
                groupAndChildInformation(group_id, getGroupInformation.group_name, groupListArry, currentLoopStep, function(main_callback){
                        if(main_callback != null) // Result Not found
                        {
                            callback({
                                status: 'fail',
                                data: null,
                                message: 'Group hierarchy information has not been found'
                            });
                        }
                        else // Result found
                        {
                            callback({
                                status: 'success',
                                data: groupListArry,
                                message: 'Group hierarchy information has been found'
                            });
                        }
                })
          }
          else
          {
            callback({
                status: 'fail',
                data: null,
                message: 'Group information has not been found'
            })
          }
        }).catch(function(err) {
            callback({
                status: 'fail',
                data: null,
                message: 'Group & child group information has not been found'
            })
        });
}


/**
  * @author: Gunjan
  * Get information of group & its child group
  * Call Recursion function for N-Level Group
  * @param : parentId : Parent group Id
  * @param : parentName : Parent group name
  * @param : groupListArry : Final result Data (Hierarchy)
  * @param : currentLoopStep : Group level ( 1, 2, 3, 4 etc... )
  */
var groupAndChildInformation = function groupAndChildInformation(parentId, parentName, groupListArry, currentLoopStep, callback) {
    
    db.query("select deviceGroup.id as group_id, deviceGroup.parent_id as parent_id, deviceGroup.name as group_name, deviceGroup.company_id as company_id, ( select count(*) from rule where device_group_id = group_id and deletedAt is null ) as rule_count,  ( select count(*) from thing where device_group_id = group_id and deletedAt is null ) as thing_count from device_group as deviceGroup left join template as template on template.device_group_id = deviceGroup.id where deviceGroup.parent_id = :parent_group_id and (template.device_group_id IS NULL OR template.deletedAt IS NOT NULL)",
        { replacements: { parent_group_id: parentId }, type: db.QueryTypes.SELECT }
    ).then(function(group_data_res)
    {
      if(group_data_res) // Data Found
      {
            currentLoopStep++;
            //  ForEach(1): Start
            async.forEachSeries(group_data_res, function(group, callback_f1) {
                var groupNameTempArry = []; // Temp Group Array
                groupNameTempArry = {
                        id : group.group_id,
                        name : group.group_name,
                        level : currentLoopStep,
                        pid : group.parent_id,
                        rule_count: group.rule_count,
                        thing_count: group.thing_count,
                        company_id: group.company_id
                }
                groupListArry.push(groupNameTempArry); // Push Value in Loop Global Array
                
                // Call Recursion Function
                groupAndChildInformation(group.group_id, group.group_name, groupListArry, currentLoopStep, function(callback_1){
                     callback_f1(callback_1)
                })

            },function(listValue) {
                // ForEach(1) finish
                callback(listValue); // Call Back to Parent Loop
            });
      }
      else
      {
        callback({
            status: 'fail',
            data: null,
            message: 'Group & child group information has not been found'
        })
      }
    }).catch(function(err) {
        callback({
            status: 'fail',
            data: null,
            message: 'Group & child group information has not been found'
        }) 
    });
}

/**
  * @author: Gunjan
  * Get Parent Group id which have template.
  * @param: group_id = Group Id
  */
var getGroupIdWhichHaveTemplate = function getGroupIdWhichHaveTemplate(group_id, callback)
{
    if(group_id == null || typeof group_id === 'undefined')
    {
        callback({
            status: 'fail',
            data: null,
            message: 'No template found for the group or it\'s parent group, please add appropriate template first and then try again.'
        })
    }
    else
    {
        db.query('select count(*) as template_count, DGroup.parent_id as parent_id, DGroup.id as group_id from template left join device_group as DGroup on DGroup.id = template.device_group_id where DGroup.id = :device_group_id and DGroup.deletedAt is null and template.deletedAt is null',
            { replacements: { device_group_id: group_id }, type: db.QueryTypes.SELECT }
        ).then(function(groupData_response)
        {
           var device_group_data = groupData_response[0];
           if(device_group_data.template_count > 0) // Template found
           {
              callback({
                    status: 'success',
                    data: device_group_data,
                    message: 'Device Group has been found successfully'
              })
           }
           else // Not template found
           {
                getGroupIdWhichHaveTemplate(device_group_data.parent_id, function(recurring_callback){
                        callback(recurring_callback);
                })
           }
         }).catch(function(err) {
            console.log(err);
            callback({
                status: 'fail',
                data: null,
                message: 'Device Group has not been found successfully'
              })
         });
     }
}


/**
 * Get Historical data from cassandra db on the basic of company Id  and thing id
 * @param : company_id = Company Id
 */
var getHistoricalData  =  function getHistoricalData(callback)
{

    var dbCassandra = require('../config/cassandra');
    var dateFormat = require('dateformat');
    sequelizeDb.models.company.hasOne(sequelizeDb.models.user, {
        foreignKey: 'company_id',
         as: 'user'
    });


    sequelizeDb.models.company.hasMany(sequelizeDb.models.company, {
            foreignKey: 'parent_id',
            as: 'childcompany'
        });

    //get db name
    sequelizeDb.models.company.findAll({
        attributes: ['id', 'name', 'database_name'],
        include:[
        {
            model:sequelizeDb.models.user,
            attributes:['timezone'],
            required:false
        },
        {
            model:sequelizeDb.models.company,
            as: 'childcompany',
            attributes:['id', 'name','database_name'],
            required:false
        }
        ],
        where: {
            parent_id: null
        }
    }).then(function(companies) {
        var toDate = new Date();
        var frmDate = new Date();
        //toDate.setDate(toDate.getDate()-1);
        //frmDate.setDate(frmDate.getDate() - 89);
        frmDate.setDate(frmDate.getDate() - 89);
            // frmDate = generalConfig.convertUTCDate(frmDate, timezone);
            // toDate = generalConfig.convertUTCDate(toDate, timezone);
       
         async.forEachSeries(companies, function(company, callback_f1) {
                      
                        async.forEachSeries(company.childcompany,function(childcompany, callback_f2){
                            var tableName = childcompany.database_name + ".sensordatav3";
                            //
                            var query = "select toUnixTimestamp(sensorreceiveddate) as sensorreceiveddate,data,deviceid from "+ tableName + " where companyId=? and sensorreceiveddate>=? and sensorreceiveddate < ?  allow filtering;";
                            SaveCompanyWiseData(dbCassandra, dateFormat, query, childcompany.id, frmDate, toDate, function(rr){
                                callback_f2();
                            });    
                            
                        }, function(r){
                            var tableName = company.database_name + ".sensordatav3";
                            var query = "select toUnixTimestamp(sensorreceiveddate) as sensorreceiveddate,data,deviceid from "+ tableName + " where companyId=? and sensorreceiveddate>=? and sensorreceiveddate < ?  allow filtering;";
                            SaveCompanyWiseData(dbCassandra, dateFormat, query, company.id, frmDate, toDate, function(rr){
                                callback_f1();
                            });
                        });
                        

                }, function(respp) {
                    callback({
                       status: 'success',
                       data: respp,
                       message: 'Cron: Daily Job to Save last 90 Days data in file, has been completed successfully.'
                    });
       }); 
        
    }).catch(function(err) {
        return callback({
            status: "fail",
            data: err,
            message: "Cron: Daily Job to Save last 90 Days data in file, has failed."
        });
    });
}


/**
 * Get Historical data from cassandra db on the basic of company Id  and thing id
 * @param : company_id = Company Id
 */
var getHistoricalDataCompanyWise  =  function getHistoricalDataCompanyWise(companyId, userId, deviceId, callback)
{

    var dbCassandra = require('../config/cassandra');
    var dateFormat = require('dateformat');
    sequelizeDb.models.company.hasOne(sequelizeDb.models.user, {
        foreignKey: 'company_id',
         as: 'user'
    });
    
    //get db name
    sequelizeDb.models.company.findOne({
        attributes: ['id', 'name', 'database_name'],
        include:[
        {
            model:sequelizeDb.models.user,
            attributes:['timezone'],
            where:{id: userId},
            required:true
        }
        ],
        where: {
            id: companyId
        }
    }).then(function(company) {
        var toDate = new Date();
        var frmDate = new Date();
        //toDate.setDate(toDate.getDate()-1);
        //frmDate.setDate(frmDate.getDate() - 89);
        frmDate.setDate(frmDate.getDate() - 89);
        if (company) {
            var tableName = company.database_name + ".sensordatav3";
            var query = "select toUnixTimestamp(sensorreceiveddate) as sensorreceiveddate,data,deviceid from "+ tableName + " where companyId=? and sensorreceiveddate>=? and sensorreceiveddate < ?  allow filtering;";
            
            //var timezone = company.users[0].timezone;
            SaveCompanyWiseData(dbCassandra, dateFormat, query, company.id, frmDate, toDate, function(rr){
                return callback(rr);
                //callback_f1();
            }); 
        } else {
            return callback({
                status: "fail",
                data: null,
                message: "Failed to get historical data."
            });
        }
    }).catch(function(err) {
        return callback({
            status: "fail",
            data: null,
            message: "Failed to get historical data."
        });
    });
}

var SaveCompanyWiseData = function(dbCassandra, dateFormat, query, companyId,frmDate, toDate, callback){
    dbCassandra.client.execute(query,[companyId, frmDate, toDate],{prepare:true,fetchSize : 0,readTimeout: 30000},function(err,response){
             if (err) {
                return callback({
                    status: "fail",
                    data: null,
                    message: "Failed to get historical data."
                });
             }

             if (response.rowLength > 0) {
                    var fs = require('fs-extra');
                    var logFileName = companyId+".json";

                    var filePath = settings.filesPath.cassHistData +  "/" + companyId;

                    if(!fs.existsSync(settings.filesPath.cassHistData)){
                        fs.mkdirSync(settings.filesPath.cassHistData);
                         if (!fs.existsSync(filePath)){
                            fs.mkdirSync(filePath);
                        }
                    } else{
                        if (!fs.existsSync(filePath)){
                            fs.mkdirSync(filePath);
                        }                        
                    }                   
                    filePath =  filePath + "/" +  logFileName;
                    var replacer = function(key,value)
                        {   
                            /*if (key=="sensorreceiveddate") {
                                 value = new Date(parseInt(value));
                               return dateFormat(value, "UTC:yyyy-mm-dd h:MM:ss TT");
                               // return generalConfig.toTimeZone(dateFormat(parseInt(value), "yyyy-mm-dd h:MM:ss"), timezone)
                            }else */
                            if (key=="data") {
                                try{
                                    return JSON.parse(value);
                                }catch(ex){
                                    return [];
                                }
                            }else{
                                return value;
                            }
                        }
                        // var data = JSON.stringify(response.rows, replacer);
                        fs.writeFile(filePath,JSON.stringify(response.rows, replacer), function(err) {
                            return callback({
                                status: 'success',
                                data:JSON.stringify(response.rows, replacer),
                                message: 'Data loaded successfully.'
                            });
                        });
                   
                } else {
                    return callback({
                        status: 'success',
                        data: [],
                        message: 'No Records Found!'
                    });
                }
    });
}


/**
 * getModulesAndPermission will load company group list
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
var getModulesAndPermission = function(callback){    
    db.models.modules.hasMany(db.models.permission, {
        foreignKey: 'module_id'
    });

    db.models.modules
    .findAll({
        attributes: ['id','name','modules_code'],
        include: [
            { model: db.models.permission, attributes: ['id','name','detail','permission_code','status'], where:{ 'status':true } }
        ],    
        //where:{ 'status':true },
        order: 'id ASC',
    })
    .then(function(permission) {
        
        var rolePermissionArray = [];
        var cnt = 0;
        async.forEach(Object.keys(permission), function (item, callback1){ 
            async.forEach(Object.keys(permission[item].permissions), function (itemPermission, callbackPermission){ 
                var obj = {
                    "permission_id" : permission[item].permissions[itemPermission].id,
                    "permission"    : 1
                };
                rolePermissionArray.push(obj);
                callbackPermission();
            }, function(err) {
                callback1(); 
            });
            //permissionArray[item].role_id = role_id;
        }, function(err) {
            if(!err)
            {
                return callback( {"status" : true, "data" : rolePermissionArray, "message" : "Modules and Permission list loaded successfully."}  );
            }
            else
            {
                return callback( {"status" : false, "data" : null, "message" : err.message });
            }
        });
    })
    .catch(function(err) {
        return callback( {"status" : false, "data" : null, "message" : err.message });
    });
};


var trim = function trim(value) {
    if (value) {
        return value.trim();
    } else {
        return '';
    }
};


/**
 * getUserPermission will load list of all permission for selected role
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success permission
 */
var getUserPermission = function(roleID, callback){    

    getRoleById(roleID,  function(result){
        if(result.status)
        {
        var roleName = result.data.name;
        db.models.modules.hasMany(db.models.permission, {
            foreignKey: 'module_id'
        });

        db.models.permission.hasMany(db.models.role_permission, {
            foreignKey: 'permission_id'
        });

        db.models.modules
        .findAll({
            attributes: ['id','name','modules_code'],
            include: [
                { model: db.models.permission, attributes: ['id','name','detail','permission_code','status'],
                  //where: { 'status':true },
                  include: [ 
                    {model: db.models.role_permission, attributes: ['id','role_id','permission'], where : { 'role_id' : roleID }},
                    //{model: db.models.role, attributes: ['id','name'], where : { 'id' : roleID }}
                  ]
                },
                //{model: db.models.role, attributes: ['id','name'], where : { 'id' : roleID }}
            ],
            where:{ 'status':true },    
            order: 'id ASC',
        })
        .then(function(modules) {
            var dataArray = [];
            async.forEach(Object.keys(modules), function (item, callback1){ 
                //var dataArray = [];
                var modulesName = modules[item].name;
                var modulesCode = modules[item].modules_code;
                async.forEach(Object.keys(modules[item].permissions), function (itemPermission, callbackPermission){ 
                    if(modules[item].permissions[itemPermission].role_permissions[0].permission)
                    {
                        /*var objD = {
                            "permission_code" : modules[item].permissions[itemPermission].permission_code,
                        };*/
                        dataArray.push(modules[item].permissions[itemPermission].permission_code);
                    }
                    /*var objD = {
                        "permission_title" : modules[item].permissions[itemPermission].name,
                        "permission"    : modules[item].permissions[itemPermission].role_permissions[0].permission,
                        "role_id" : modules[item].permissions[itemPermission].role_permissions[0].role_id,
                        "permission_code" : modules[item].permissions[itemPermission].permission_code,
                    };*/
                    callbackPermission();
                }, function(err) {


                    /*var modulesObj = { 
                        "module" : modulesName,
                        "module_code" : modulesCode,
                        "permissions" :  dataArray
                    };
                    rolePermissionArray.push(modulesObj);*/
                    callback1();
                });
            }, function(err) {
                if(!err)
                {
                    var rolePermissionArray = [];
                    var key = roleName;
                    var elements = {};
                    elements[key] = dataArray;
                    rolePermissionArray.push(elements);
                    return callback( {"status" : true, "data" : rolePermissionArray, "message" : "Modules and Permission list loaded successfully."}  );
                }
                else
                {
                    return callback( {"status" : false, "data" : null, "message" : err.message });
                }
            });
        })
        .catch(function(err) {
            return callback( {"status" : false, "data" : null, "message" : err.message });
        });
    }
    else
    {
        return callback( {"status" : false, "data" : null, "message" : "Unauthorised User" });
    }
    }); 


    
};

/*
 * @author : MK
 * Get Role Information By Role Id
 */
var getRoleById = function(roleID, callback){  
      
    db.models.role.find( { where: { id: roleID } } ).then(function(role) { 
        if(role)
        {
            return callback({status: true , data: role, message: 'Record found successfully'});
        }
        else
        {
            return callback({status: false , data: null, message: 'Role detail not found'});
        }
    }).catch(function(err) {
        console.log(err);
        return callback({status: false , data: null, message: 'Some Unknown Database error'});
    });
};

var readWriteSync = function readWriteSync(file_path, old_word, new_word) {
      fs.readFile(file_path, function(err, data) {
        if(err) throw err;
        data = data.toString();
        data = data.replace(old_word, new_word);
        fs.writeFile(file_path, data, function(err) {
            //err || console.log('Data replaced \n', data);
        });
    });
}


var awsRegisterDevice = function(devicetoken, callback) {  
    //  register endpoint(iphone) to aws sns service
    //var sns = new AWS.SNS();
    var params = {
      PlatformApplicationArn: awsConfig.applicationARN,
      Token: devicetoken,
      //CustomUserData: ''
    };
    awsSNS.createPlatformEndpoint(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            callback({'message':'Error in registering device in aws server','error':err});
        } else {
            callback(null, data);
        }
    });
}

var awsDeregisterDevice = function(targetarn, callback) {  
    //  deregister endpoint(iphone) to aws sns service
    //var sns = new AWS.SNS();
    var params = {
      EndpointArn: targetarn
    };
    awsSNS.deleteEndpoint(params, function(err, data) {
        if (err) {
            //console.log(err, err.stack);
            callback({'message':'Error in deregistering device in aws server','error':err});
        } else {
            callback(null, data);
        }
    });    
}

var awsSendPushNotification = function(targetarn, pushdata, callback) {  
    //  send push notification to endpoint(iphone)
    //var sns = new AWS.SNS();
    if(awsConfig.isDevelopment) {
        var msgkey = 'APNS_SANDBOX';
    } else {
        var msgkey = 'APNS';
    }

    var messagebody = {};
    messagebody[msgkey] = JSON.stringify({
                "aps": {
                    "alert": pushdata.alert,
                    "badge": pushdata.badge, 
                    "sound": "default"
                },
                "data" : pushdata.data
            });
    
    // console.log('----------------------------------------------------------------');
    // console.log('--------- AWS PUSH NOTIFICATION MESSAGE BODY (start) -----------');
    // console.log('');
    // console.log(JSON.parse(messagebody[msgkey]));
    // console.log('');
    // console.log('--------- AWS PUSH NOTIFICATION MESSAGE BODY (end) -------------');
    // console.log('----------------------------------------------------------------');    
    
    var params = {
      Message: JSON.stringify(messagebody),
      MessageStructure: 'json',
      //Subject: 'Notificationhh',
      TargetArn: targetarn,
    };
    awsSNS.publish(params, function(err, data) {
        if (err) {
            //console.log(err, err.stack);
            callback({'message':'Error in sending push notification to device','error':err});
        } else {
            callback(null, data);
        }
    });
}

var storeDocument = function (options, callback) {
  var file = options.uploadedfileobj;
  //var filename = Date.now() + path.extname(file.name);
  var filename = Date.now() + '_' + file.originalFilename;
  var result = {'status': true};
  var validextensions = settings.validFileExtensions;
  var fileextension = path.extname(file.name).toLowerCase();
  console.log('FILE EXTENSION', file.name, fileextension);
//    if (file.size > 2000000) {
//        result.status = false;
//        result.message = "File too large , max file size allowed 2MB";
//        callback(result);
//    }
  if (validextensions.indexOf(fileextension) == -1) {
    result.status = false;
    result.message = "Please choose file only .doc, .docx, .pdf, .ppt, .pptx";
    callback(result);
  } else {
    var tempPath = file.path;
    var targetPath = path.resolve(options.storagepath + filename);

    fs.copy(tempPath, targetPath, function (err) {
      if (err) {
        console.log("1111111111111 errorr");
        result.status = false;
        result.message = err;
        callback(result);
      } else {
        console.log("successfully");
        result.data = {'filename': filename};
        callback(result);
      }

    });
  }

};


module.exports = {
    postDeviceInfo: postDeviceInfo,
    removeDeviceInfo: removeDeviceInfo,
    storeSFImage: storeSFImage,
    getCompanyInfoById: getCompanyInfoById,
    deleteFolderRecursive: deleteFolderRecursive,
    checkUserEmailExistStatus: checkUserEmailExistStatus,
    checkCompanyExistStatus: checkCompanyExistStatus,
    loadUserGroup: loadUserGroup,
    loadProfileImages: loadProfileImages,
    removeProfilePicture: removeProfilePicture,
    storeProfilePicture: storeProfilePicture,
    checkAuthentication: checkAuthentication,
    setupNewCompany: setupNewCompany,
    bytesToSize: bytesToSize,
    generateCPID: generateCPID,
    getUniqueCpid: getUniqueCpid,
    getCPIDFromCompanyID: getCPIDFromCompanyID,
    getGroupHierarchyInformation: getGroupHierarchyInformation,
    groupAndChildInformation: groupAndChildInformation,
    checkAssignRuleOrThingToGroupAndChildGroup: checkAssignRuleOrThingToGroupAndChildGroup,
    getGroupIdWhichHaveTemplate: getGroupIdWhichHaveTemplate,
    getHistoricalData:getHistoricalData,
    getHistoricalDataCompanyWise:getHistoricalDataCompanyWise,
    getModulesAndPermission:getModulesAndPermission,
    trim: trim,
    getUserPermission:getUserPermission,
    getUserInfoById:getUserInfoById,
    getRoleById:getRoleById,
    readWriteSync: readWriteSync,
    awsRegisterDevice: awsRegisterDevice,
    awsDeregisterDevice: awsDeregisterDevice,
    awsSendPushNotification: awsSendPushNotification,
    storeDocument: storeDocument
}