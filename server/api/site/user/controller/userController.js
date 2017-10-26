'use strict';

var db = require('../../../../config/cassandra');
var generalConfig = require('../../../../config/generalConfig');

var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");

var async = require('async');

var crypto = require('crypto');
/* AWS */
var awsSubscriber = require('../../../../lib/aws/subscriber');
var awsIotConnect = require('../../../../lib/aws/awsiotconnect');

var fs = require('fs-extra');

/* Common function Lib */
var commonLib = require('../../../../lib/common');


db.models.user.associate(db.models);
db.models.company_user_group.associate(db.models);
db.models.company_group.associate(db.models);
db.models.company.associate(db.models);

/**
 * Find user by id
 */
exports.getById = function(req, res, next) {
    if (!req.headers.authorization) {
        res.json({
            status: "Invalid request"
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    var companyId = userInfo.companyId;
    var id = userInfo.id;

    if (!id) {
        return res.json({
            status: "fail"
        });
    }

    var query = 'select id,active,contactdetailid,companyid,createdby,createddate,deleted,email,firstname,lastname,middlename,updatedby,updateddate from user WHERE id = ?;';

    db.client.execute(query, [id], {
        prepare: true
    }, function(err, user) {
        if (user == undefined || user.rowLength == 0) {
            return res.json({
                status: "fail",
                message: 'Failed to load User ' + id
            });
        } else {

            //get company detail of user
            var query = 'select id,active,name,deleted from company WHERE id = ?;';

            db.client.execute(query, [user.rows[0].companyid], {
                prepare: true
            }, function(error, company) {
                var companyInfo = {
                    name: ''
                };

                if (company) {
                    companyInfo = company.rows[0];
                }

                var userDetail = {
                    user: user.rows[0],
                    company: companyInfo
                };

                req.profile = user.rows[0];
                res.json(userDetail);
            });
        }
    });
};

/*
 * AWS Push Notification
 * Register Device Information from DB
 * Push Subscription Process of mobile device ( ios, android )
 * Call from Mobile Device
 */
exports.registerMobileDevice = function(req, res, next) {
    
    var loginUserInfo = generalConfig.getUserInfo(req);
    /* Header authorization validation */
    if (!req.headers.authorization)
    {
        res.json({
            status: "fail",
            data: null,
            message: "User authorization failed"
        });
    }
    else if(!loginUserInfo.companyId) // Check User/company information
    {
        res.json({
            status: "fail",
            data: null,
            message: "User information has not been found"
        });
    }
    else if(!req.body.pushtoken) // Device token validation
    {
        res.json({
            status: "fail",
            data: null,
            message: "Invalid device token"
        });

    }
    else if(!req.body.devicetype) // Device type validation
    {
       res.json({
            status: "fail",
            data: null,
            message: "Invalid device type"
        });

    }
    else if(!req.body.username) // Username validation
    {
        res.json({
            status: "fail",
            data: null,
            message: "Invalid Username"
        })

    }
    else if(!req.body.uuid) // UUID validation
    {
        res.json({
            status: "fail",
            data: null,
            message: "Invalid UUID"
        })
    }
    else 
    {
        /* Variable value Define */
        var pushToken = req.body.pushtoken; // Device Push Token
        var deviceType = req.body.devicetype; // Device Type : 1 = IOS, 2 = Android, 3 = Windows
        var username = req.body.username; // Username
        var deviceOs = req.body.os; // Device OS
        var deviceOsVersion = req.body.osversion; // Device OS Version
        var uuid = req.body.uuid; //  Device UUID
        var companyId = loginUserInfo.companyId; // Company Id
        var user_id = loginUserInfo.id; // User Id

        if( (pushToken != '' && typeof pushToken !== 'undefined') 
                && (deviceType != '' && typeof deviceType !== 'undefined')
                && (user_id != '' && typeof user_id !== 'undefined')
                && (companyId != '' && typeof companyId != 'undefined')
                && (deviceOs != '' && typeof deviceOs != 'undefined')
                && (deviceOsVersion != '' && typeof deviceOsVersion != 'undefined')
                && (uuid != '' && typeof uuid != 'undefined') )
        {
             
              /* Check device record in DB : If not -> Insert */
            db.models.mobile_device.count( { where: { user_id: user_id, push_token: pushToken, type: deviceType, uuid: uuid } } ).then(function(device) {
                if(device)
                {
                    res.json({
                        status: 'success',
                        data: null,
                        message: 'Same record already exists'
                    });
                }
                else
                {
                    /* AWS Device notification Subscription/Unsubscription */
                    awsIotConnect.awsDeviceRegistrationWithNotificationSubscription( user_id, pushToken, deviceType, uuid, deviceOs, deviceOsVersion, companyId, function(deviceReg_callback){
                                return res.json(deviceReg_callback);
                    })
                }
            }).catch(function(err) {
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Device registration process has not been completed successfully'
                    });
            }); 
        }
        else
        {
            res.json({
                status: 'fail',
                data: null,
                message: 'Please pass all parameters with valid value'
            });
        }
    }
}

/*
 * AWS Push Notification
 * Deregister Device Information from DB
 * Push cancling Subscription Process of mobile device ( ios, android )
 * Call from Mobile Device
 */
exports.deregisterMobileDevice = function(req, res, next) {
        
    var loginUserInfo = generalConfig.getUserInfo(req); // Req. Information

    /* Header authorization validation */
    if (!req.headers.authorization)
    {
        res.json({
            status: "fail",
            data: null,
            message: "User authorization failed"
        });
    }
    else if(!loginUserInfo.companyId) // Check User/company information
    {
        res.json({
            status: "fail",
            data: null,
            message: "User information has not been found"
        });
    }
    else if(!req.body.pushtoken) // Device token validation
    {
        res.json({
            status: "fail",
            data: null,
            message: "Invalid device push token"
        });
    }
    else if(!req.body.devicetype) // Device type validation
    {
       res.json({
            status: "fail",
            data: null,
            message: "Invalid device type"
        });
    }
    else if(!req.body.username) // Username validation
    {
        res.json({
            status: "fail",
            data: null,
            message: "Invalid Username"
        })
    }
    else if(!req.body.uuid)  // UUID validation
    {
        res.json({
            status: "fail",
            data: null,
            message: "Invalid device UUID"
        })
    }
    else
    {
        /* Variable value Define */
        var pushToken = req.body.pushtoken; // Device Push Token
        var deviceType = req.body.devicetype; // Device Type : 1 = IOS, 2 = Android, 3 = Windows
        var username = req.body.username; // Username
        var uuid = req.body.uuid; // Device UUID
        var companyId = loginUserInfo.companyId; // Company ID
        var user_id = loginUserInfo.id; // User Id
        
        if( (pushToken != '' && typeof pushToken !== 'undefined') 
            && (deviceType != '' && typeof deviceType !== 'undefined')
            && (user_id != '' && typeof user_id !== 'undefined')
            && (companyId != '' && typeof companyId != 'undefined')
            && (uuid != '' && typeof uuid != 'undefined') )
        {
            awsIotConnect.awsUserSelectedDeviceUnsubscriptionProcess(user_id, pushToken, deviceType, uuid, companyId, function(deregister_device_callback){
                        return res.json(deregister_device_callback);
            })
        }
        else
        {
            res.json({
                status: 'fail',
                data: null,
                message: 'Please pass all parameters with valid value'
            });
        }

    }

}

 /**
 * Get User list for Data Table
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for datatable response
 */
exports.getUserList = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    //console.log(userInfo);
    if (!userInfo.companyId) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }

    if(req.body.params.companyId) {
        var companyId = req.body.params.companyId;
    } else {
        var companyId = userInfo.companyId;
    }
    var sortBy = req.body.params.sortBy;
    var sortOrder = req.body.params.sortOrder;
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;
    var searchParams = new Array();

    if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "") {

        searchParams.push({
            firstname: {
                $like: '%' + req.body.SearchParams.searchTxt + '%'
            }
        });
        searchParams.push({
            lastname: {
                $like: '%' + req.body.SearchParams.searchTxt + '%'
            }
        });
        searchParams.push(
            Sequelize.where(
                Sequelize.fn('concat', Sequelize.col('firstname'), ' ', Sequelize.col('lastname')), {           
                    like: '%' + req.body.SearchParams.searchTxt + '%'
                }
            )
        );
        searchParams.push({
            email: {
                $like: '%' + req.body.SearchParams.searchTxt + '%'
            }
        });
    }

    if(searchParams.length==0) {
        var whereval = { company_id: companyId };
    } else {
        var whereval = { company_id: companyId, $or: searchParams };        
    }

    db.models.user
    .findAndCountAll({
        include: [{
            model: db.models.company_user_group,
            where: { id: { $ne: null } },
            include: [{
                model: db.models.company_group,
                attributes: ['name']
            }],            
            },
            { model: db.models.role, attributes: ['name'] }
        ],
        //attributes: Object.keys(db.models.thing.attributes),        
        where: whereval,
        order: sortBy + ' ' + sortOrder,
        offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
        limit: pageSize
    })
    .then(function(user) {
        if (user) {
            res.json({
                'status': 'success',
                'data': user,
                'message': 'Data loaded successfully.'
            });
        } else {
            res.json({
                'status': 'fail',
                'error': 'Failed to load users.'
            });
        }
    })
    .catch(function(err) {
        
        res.json({
            'status': 'fail',
            'message': 'Failed to load users.',
        });

    });

};
 /**
 * Get User Group list for Data Table
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for datatable response
 */
exports.getUserGroupList = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }

    if(req.body.params.companyId) {
        var companyId = req.body.params.companyId;
    } else {
        var companyId = userInfo.companyId;
    }
    var sortBy = req.body.params.sortBy;
    var sortOrder = req.body.params.sortOrder;
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;
    var searchParams = new Array();

    if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "") {
        searchParams.push({
            name: {
                $like: '%' + req.body.SearchParams.searchTxt + '%'
            }
        });
    }

    if(searchParams.length==0) {
        var whereval = { company_id: companyId };
    } else {
        var whereval = { company_id: companyId, $or: searchParams };        
    }

    //////////////////////////////////
    //////  process ordering   ///////

    var sortByArray = sortBy.split('.');
    var orderval = [];
    var i = 0;
    if(sortByArray.length > 1) {
        while(i < sortByArray.length - 1) {
            var relationTable = sortByArray[i];
                orderval.push(db.models[relationTable]);
                i++;
        }
    }

    if(sortByArray[i].substring(0, 1) == "@")  {        
        orderval.push(Sequelize.literal(sortByArray[i].substring(1)));
    } else {
        orderval.push(sortByArray[i]);
    }

    orderval.push(sortOrder);

    //////  process ordering   ///////
    //////////////////////////////////


    db.models.company_group
    .findAndCountAll({

        attributes: ['id','name','createdAt','updatedAt',
            [
              Sequelize.literal("(SELECT COUNT('id') FROM "+db.models.company_user_group.tableName+" AS company_user_group JOIN "+db.models.user.tableName+" AS user ON user.id = company_user_group.user_id WHERE `"+db.models.company_group.tableName+"`.id = `company_user_group`.company_group_id and user.deletedAt is null)"),
                'totalusers'
            ]
        ],
        /*include: [{
            model: db.models.company_user_group,
            where: { id: { $ne: null } },
            include: [{
                model: db.models.user,
                //attributes: ['name']
            }],            
        }],*/
        //attributes: Object.keys(db.models.thing.attributes),        
        where: whereval,
        order: [orderval],
        offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
        limit: pageSize
    })
    .then(function(group) {
        if (group) {
            res.json({
                'status': 'success',
                'data': group,
                'message': 'Data loaded successfully.'
            });
        } else {
            res.json({
                'status': 'fail',
                'message': 'No records found'
            });
        }
    })
    .catch(function(err) {
        res.json({
            'status': 'fail',
            'message': 'Failed to load users.',
            'error': err
        });        
    });

};

/**
 * getCompanyGroupList will load company group list
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.getCompanyGroupList = function(req, res, next) {

    if(req.body.cid != '' && req.body.cid != undefined)
    {
        var companyID = req.body.cid;
    }
    else
    {
        var userInfo = generalConfig.getUserInfo(req);
        var companyID = userInfo.companyId;
    }

    //get user info from request
    if (!companyID) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }
    else
    {
        db.models.company_group
        .findAll({
            where: { 
                    company_id: companyID,
                    name: {
                            $ne: 'Admin'
                          }
                    },
        })
        .then(function(groups) {
            return res.json( groups );
        })
        .catch(function(err) {
            return res.status(400).send({
                message: err
            });
        });
    }
};

/**
 * checkEmailExist will check if email exist or not
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.checkEmailExist = function(req, res, next) {

    if(req.body.userid==undefined || req.body.userid== "") {
        var whereval = {
            email: req.body.email
          };
    } else {
        var whereval = {
            email: req.body.email,
            id: {
              $ne: req.body.userid
            }
          };
    }

    db.models.user
    .findOne({
      where: whereval
    })
    .then(function(user) {
        var isEmailUnique = ( (user) ? false : true );
        res.json({
            status: "success",
            data: { 'isEmailUnique': isEmailUnique }
        });            
    })
    .catch(function(err) {
        return res.json({
            status: "fail",
            message: err
        });
    });  

};


/**
 * addUser will add new user
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.addUser = function(req, res, next) {
    var signupmode = (req.params.usertype=="user") ? true: false;

    if (req.body != "") {
        req.checkBody('firstname', 'First Name is required').notEmpty();
        req.checkBody('lastname', 'Last Name is required').notEmpty();
        req.checkBody('email', 'Email is required').notEmpty();
        req.checkBody('phone', 'Phone is required').notEmpty();
        req.checkBody('role_id', 'User role is required').notEmpty();
        if(signupmode) {
            req.checkBody('cpid', 'cpid is required').notEmpty();
            req.checkBody('password', 'Password is required').notEmpty();
        } else {
            req.checkBody('timezone', 'Timezone is required').notEmpty();
            req.checkBody('group', 'User Group is required').notEmpty();
            //req.checkBody('status', 'Status is required').notEmpty();            
        }

        var mappedErrors = req.validationErrors(true);
    }
    if (mappedErrors == false) {

        db.models.user.find({
            where: {
                email: req.body.email
            }
        }).then(function(findUser) {
            
            if (findUser) {
            
                return res.json({
                    status: 'fail',
                    data: null,
                    message: 'Email already exist'
                });
            } else {

                retrieveCompanyId(req, function(compresult) {

                    if(compresult.status) {
                                        
                        var companyId = compresult.data.company_id;
                        var company_default_groups = compresult.data.default_groups;
                        //  set user data
                        var userdata = {};
                        userdata.company_id = companyId;                        
                        userdata.firstname  = req.body.firstname;
                        userdata.lastname   = req.body.lastname;
                        userdata.email      = req.body.email;
                        userdata.phonecode  = req.body.phonecode;
                        userdata.phone      = req.body.phone;
                        userdata.role_id    = req.body.role_id;
                        if(signupmode) {
                            
                            userdata.customer_number = req.body.customer_number;
                            userdata.active     = true;

                            var successmessage = "Signup process completed successfully.";
                            var failmessage = "Signup process failed due to some error, please try later.";

                            var rawpassword = req.body.password;
                            userdata.password   = generalConfig.encryptPassword(rawpassword);

                            /*
                            req.body.group  = {};
                            req.body.group.name = "Default";
                            */
                            req.body.group = company_default_groups;                            

                        } else {

                            userdata.active     = false;
                            userdata.timezone   = req.body.timezone;

                            var successmessage = "User created successfully.";
                            var failmessage = "User creation process failed due to some error, please try later.";

                            var userTokenGen = new Date().getTime()+userdata.email;

                            var userToken = crypto.createHash('md5').update(userTokenGen).digest('hex');
                            userdata.usertoken   = userToken;
                        }

                        var group = req.body.group;

                        addUserData(signupmode, userdata, companyId, group, function(result) {

                            if(result.status) {

                                return res.json({
                                    status: "success",
                                    message: successmessage
                                });

                            } else {

                                return res.json({
                                    status: "fail",
                                    message: failmessage,
                                });

                            }                            

                        });

                    } else {

                        return res.json({
                            status: 'fail',
                            message: compresult.message,
                        });
                    }
                });

            }

        }).catch(function(err) {
            return res.json({
                status: 'fail',
                message: 'Something went wrong. Please try again.'
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
 * @author HY
 * add user data from user json data object
 * @param  {object} user
 * @param  {string} companyId
 * @param  [array] group
 * @param  [func] callback 
 * @return json
 */
var addUserData = function(signupmode, userdata, companyId, group, callback) {
      
    db.models.user
    .create(userdata)
    .then(function(user) {
        saveUserRole(user, function(result) {
            if(result.status) {
            } else {
                callback({
                    'status': false,
                    'message': result.message
                });
            }                           
        });

        saveUserData(user, companyId, group, function(result) {
            if(result.status) {

                if(signupmode) {
                    var userdetail = {};
                    userdetail.userfullname = user.firstname+" "+user.lastname;
                    userdetail.username     = user.email;
                    userdetail.email        = user.email;
                    //userdetail.userpassword = rawpassword;
                    userdetail.userpassword = "{set by you}";
                    sendUserCredentails(userdetail, callback);

                } else {
                    var userdetail = {};
                    userdetail.userfullname = user.firstname+" "+user.lastname;
                    userdetail.usertoken    = user.usertoken;
                    userdetail.email        = user.email;
                    sendCreatePasswordLink(userdetail, callback);
                    
                }

            } else {
                callback({
                    'status': false,
                    'message': result.message
                });
            }                           
        });
    })
    .catch(function(err) {
        callback({
            'status': false,
            'message': err
        });
    });    
}


/**
 * retrieveCompanyId used to get company Id from cpid or login user session
 * @param  integer  company_id
 * @param  {obj} grouplist
 * @param  [func] callback
 * @return boolean true or false on error
 */

var retrieveCompanyId = function (req, callback) {

    if(req.body.cpid) {        
        db.models.company.findOne({
            attributes: ['id'],
            include: [{
                model: db.models.company_group,
                where: { name: 'Default' },
            }],            
            where: {
                cpid: req.body.cpid
            }
        }).then(function(company) {         

            if(company) {                   
                callback({
                    status: true,
                    data: { 'company_id' : company.id, 'default_groups': company.company_groups }
                });

            } else {
                callback({
                    status: false,
                    message: 'cpid not found.'
                });
            }
        }).catch(function(err) {            
            callback({
                status: false,
                error: err,
                message: 'Something went wrong.Try again.'
            });
        });    

    } else {
        //Get userinfo from request
        var userInfo = generalConfig.getUserInfo(req);
        callback({
            status: true,
            data: { 'company_id' : userInfo.companyId }            
        });
    }
};

/**
 * send user mail with login credentails
 * @param  {obj} userdetail
 * @param  [func] callback
 * @return boolean true or false on error
 */
var sendUserCredentails = function sendUserCredentails(userdetail, callback) {

    var emailTemplate = settings.emailTemplate;
    var emailbody = emailTemplate.usercredentailsEmailBody;

    var link = "<a href='"+settings.siteUrl+"/login'>"+settings.siteUrl+"/login</a>";

    emailbody = emailbody.replace("%userfullname%", userdetail.userfullname);     
    emailbody = emailbody.replace("%username%", userdetail.username);     
    emailbody = emailbody.replace("%userpassword%", userdetail.userpassword);
    emailbody = emailbody.replace("%loginlink%", link);

    var emailmessage = emailTemplate.emailContainerHeaderString;
    emailmessage += emailbody;
    emailmessage += emailTemplate.emailContainerFooterString;


    var message = {
        from:    "kaustubh.mishra@softwebsolutions.com", 
        to:      userdetail.email,
        subject: emailTemplate.usercredentailsSubject,
        attachment: 
            [
                {data:emailmessage, alternative:true}
            ]
    };

    settings.emailserver.send(message, function(err, message) {         
        if(err) {
            callback({
                'status': false,
                'message': err
            });            
        } else {
            callback({
                'status': true
            });
        }
    });
};

/**
 * send user mail with create password link
 * @param  {obj} userdetail
 * @param  [func] callback
 * @return boolean true or false on error
 */
var sendCreatePasswordLink = function sendCreatePasswordLink(userdetail, callback) {

    var emailTemplate = settings.emailTemplate;
    var emailbody = emailTemplate.createpasswordEmailBody;
    var userToken = userdetail.usertoken;
    var link = "<a href='"+settings.siteUrl+"/createpassword/"+userToken+"'>"+settings.siteUrl+"/createpassword/"+userToken+"</a>";

    emailbody = emailbody.replace("%companyname%", userdetail.userfullname);
    emailbody = emailbody.replace("%createpasswordlink%", link);     

    var emailmessage = emailTemplate.emailContainerHeaderString;
    emailmessage += emailbody;
    emailmessage += emailTemplate.emailContainerFooterString;


    var message = {
        from:    "kaustubh.mishra@softwebsolutions.com", 
        to:      userdetail.email,
        subject: emailTemplate.createpasswordSubject,
        attachment: 
        [
          {data:emailmessage, alternative:true}
        ]
    };

    settings.emailserver.send(message, function(err, message) {
        if(err) {
            callback({
                'status': false,
                'message': err
            });
        } else {
            callback({
                'status': true
            });
        }
    });
};


/**
 * get group id
 * @param  string group_name
 * @param  [func] callback 
 * @return int id or false on error
 */

var getGroupId = function getGroupId(group_name, companyId, callback) {
    db.models.company_group
    .findOne({
      where: {
        name: group_name,
        company_id: companyId,        
      }
    })
    .then(function(group) {
        callback(group.id);
    })
    .catch(function(err) {
        callback(false);
    });    
};



/**
 * prepare company group id list for inserting in user group mapping
 * @param  integer  company_id
 * @param  {obj} grouplist
 * @param  [func] callback
 */
var prepareCompanyGroups = function (company_id, grouplist, callback) {
    var newgroups = [];
    var selgroupids = [];  
      
    grouplist.forEach(function(selgroup) {
        if(selgroup.isnew=='1') {
            newgroups.push( { name: selgroup.name, company_id : company_id} );
        } else {
            selgroupids.push(selgroup.id);
        }
    });

    if(newgroups.length > 0) {

        createCompanyGroups(newgroups, function(result) {
            if(result.status) {                
                            
                result.data.forEach(function(addedgroup) {
                    selgroupids.push(addedgroup.id);
                });

                callback({
                    status: true,
                    data: selgroupids                         
                });

            } else {

                callback({
                    status: false,
                    message: result.message
                });
            }                           
        });  

    } else {

        callback({
            status: true,
            data: selgroupids                         
        });

    }

};



/**
 * save new groups
 * @param  [array] newgroups
 * @param  [func] callback
 */

var createCompanyGroups = function (newgroups, callback) {
    db.models.company_group
    .bulkCreate(newgroups) 
    .then(function(groups) {
        callback({
            status: true,
            data: groups
        });
    })    
    .catch(function(err) {
        callback({
            status: false,
            message: 'Error in adding new groups in bulk.'
        });
    });
};

/**
 * set user mapping with company group
 * @param  integer  user_id
 * @param  integer company_group_id
 * @param  [func] callback 
 * @return boolean true or false on error
 */
var setUserGroup = function setUserGroup(user_id, company_group_id, callback) { 
    var usergroupdata = { user_id: user_id, company_group_id: company_group_id };

    db.models.company_user_group
    .destroy({
      where: {
        user_id: user_id
      }
    })
    .then(function(affectedrowcount) {

        db.models.company_user_group
        .create(usergroupdata)
        .then(function(usergroup) {
            callback(null, null);
        })
        .catch(function(err) {
            callback(err, null);
        });

    })
    .catch(function(err) {
        callback(err, null);
    });

};


/**
 * set user mapping with company group
 * @param  integer  user_id
 * @param  integer grouplist
 * @param  [func] callback 
 * @return boolean true or false on error
 */
var setUserGroupMapping = function (user_id, groupids, callback) { 
    db.models.company_user_group
    .destroy({
      where: {
        user_id: user_id,
        company_group_id: {
          $notIn: groupids
        }
      }
    })
    .then(function(affectedrowcount) {

        db.models.company_user_group
        .findAll({
          attributes: ['company_group_id'],
          where: {
            user_id: user_id,
            company_group_id: {
              $in: groupids
            }
          }
        })
        .then(function(existgrouplist) {

            if(existgrouplist.length > 0) {                               
                existgrouplist.forEach(function(groupobj) {
                    var index = groupids.indexOf(groupobj.company_group_id);
                    if (index > -1) {
                        groupids.splice(index, 1);
                    }
                });

                createUserGroupMapping(user_id, groupids, function(result) {
                    if(result.status) {
                        callback({
                            status: true,
                            data: result.data
                        });

                    } else {
                        callback({
                            status: false,
                            message: result.message
                        });
                    }                           
                });

            } else {

                createUserGroupMapping(user_id, groupids, function(result) {
                    if(result.status) {
                        callback({
                            status: true,
                            data: result.data
                        });

                    } else {
                        callback({
                            status: false,
                            message: result.message
                        });
                    }                           
                });

            }

        })
        .catch(function(err) {
            callback(false);
        });  

    })
    .catch(function(err) {
        callback(err, null);
    });

};

/**
 * save user group mappings
 * @param  [string] user_id
 * @param  [array] groupids
 * @param  [func] callback
 */

var createUserGroupMapping = function (user_id, groupids, callback) {

    var usergroupdata = [];

    if(groupids.length > 0) {  

        groupids.forEach(function(groupid) {
            usergroupdata.push( { user_id: user_id, company_group_id: groupid } );
        });

        db.models.company_user_group
        .bulkCreate(usergroupdata) 
        .then(function(addedrowslist) {
            callback({
                status: true,
                data: addedrowslist
            });
        })    
        .catch(function(err) {
            callback({
                status: false,
                message: 'Error in adding new mappings of user groups in bulk.'
            });
        });

    } else {

        callback({
            status: true,
            data: []
        });
    }
};


/**
 * @author HY
 * save user related data from user object
 * @param  {object} user
 * @param  {string} companyId
 * @param  [array] group
 * @param  [func] callback 
 */
var saveUserData = function(user, companyId, group, callback) {

    var selgroupids = [];

    async.series([
        function(callback){
            prepareCompanyGroups(companyId, group, function(result) {
                if(result.status) {
                    selgroupids = result.data;
                    callback(null, null);
                } else {
                    callback(result, null);
                }                           
            });
        },
        // Add group mapping with user
        function(callback){
            setUserGroupMapping(user.id, selgroupids, function(result) {
                if(result.status) {
                    callback(null, null);
                } else {
                    callback(result, null);
                }                           
            });                
        },
        function(callback)
        {
            
            /* Call User Subscription/Unsubscription functionality : Start */
            /*awsIotConnect.awsUserSubscriptionAndUnSubscriptionByUserId(user.id, companyId, function(awsUserNotificationCallback){
                //console.log(awsUserNotificationCallback);
            })*/
            /* Call User Subscription/Unsubscription functionality : End */
            callback(null, null);
        }

    ],
      // Final Call function
      function(err, results) {
        if(err) {
            callback({
                'status': false,
                'message':err
            });
               
        } else {

            callback({ 'status': true });
        }
      }
    )
}


/**
 * @author MK
 * save user role 
 * @param  {object} user
 * @param  [func] callback 
 */
var saveUserRole = function(user, callback) {
    db.models.user_role.create({
        user_id: user.id,
        role_id: 2
    }).then(function(result) {
        if(result)
        {
            callback({
                'status': true,
                data:result
            });
        }
        else
        {
            callback({
                'status': false,
                'message':err
            });
        }
    });
}


/**
 * @author HY
 * update user data from user object
 * @param  {object} user
 * @param  {string} companyId
 * @param  [array] group
 * @param  [func] callback 
 * @return json
 */
var updateUserData = function(user, companyId, group, callback) {

    user.save().then(function() {
        saveUserData(user, companyId, group, function(result) {
            if(result.status) {
                callback({
                    'status': true
                });
            } else {
                callback({
                    'status': false,
                    'message': result.message
                });
            }                           
        });
    })
}


/**
 * updateUser will update user detail
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.updateUser = function(req, res, next) {

    var id = req.params.id || null;
    if (!id) {
        return res.json({
            status: "fail",
            message: 'Invalid user'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }


    if (req.body != "") {
        req.checkBody('firstname', 'First Name is required').notEmpty();
        req.checkBody('lastname', 'Last Name is required').notEmpty();
        req.checkBody('email', 'Email is required').notEmpty();
        req.checkBody('group', 'User Group is required').notEmpty();
        req.checkBody('phone', 'Phone is required').notEmpty();
        req.checkBody('status', 'Status is required').notEmpty();
        req.checkBody('timezone', 'Timezone is required').notEmpty();
        req.checkBody('role_id', 'User role is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {

        var companyId = userInfo.companyId;        

        var status = req.body.status == 1 ? true : false;
        var updateduser = req.body;

         db.models.user.find({
            where: {
                email: req.body.email,
                id: {
                  $ne: id
                }
            }
        }).then(function(findUser) 
        {
            if (findUser)
            {
                return res.json({
                    status: 'fail',
                    data: null,
                    message: 'Email already exist'
                });
            }
            else
            {
                db.models.user
                    .findOne({ where: {
                        id: id
                      }
                }).then(function(user) {

                    user.firstname  = updateduser.firstname;
                    user.lastname   = updateduser.lastname;
                    user.email      = updateduser.email;
                    user.phonecode  = updateduser.phonecode;            
                    user.phone      = updateduser.phone;
                    user.timezone   = updateduser.timezone;
                    user.role_id    = updateduser.role_id;
                    //user.active     = true;
                    //user.company_id = companyId;

                    var newGroupList = updateduser.newGroupList;
                    var group = updateduser.group;   

                    if (req.files && req.files.profilepicture) {
                        var profilepicture = req.files.profilepicture;
                        commonLib.storeProfilePicture(profilepicture, user.id, function(result) {
                            if(result.status) {
                                commonLib.removeProfilePicture(user.profile_image);
                                user.profile_image = result.filename;
                                updateUserData(user, companyId, group, function(result) {
                                    if(result.status) {
                                        return res.json({
                                            status: "success",
                                            message: "User updated successfully"
                                        });
                                    } else {
                                        return res.json({
                                            status: "fail",
                                            message: "There was some problem updating user, please try later or contact administrator.",
                                            error: result.message
                                        });                   
                                    }                            

                                });

                            } else {

                                return res.json({
                                    status: 'fail',
                                    message: result.message
                                });                        

                            }
                        });

                    } else {

                        updateUserData(user, companyId, group, function(result) {

                            if(result.status) {

                                return res.json({
                                    status: "success",
                                    message: "User updated successfully"
                                });

                            } else {

                                return res.json({
                                    status: "fail",
                                    message: "There was some problem updating user, please try later or contact administrator."
                                });

                            }                            

                        });

                    }

                })
                .catch(function(err) {

                    return res.json({
                        status: "fail",
                        message: "There was some problem updating user, please try later or contact administrator.",
                    });

                });  

          }
        }).catch(function(err) {
            return res.json({
                status: 'fail',
                message: 'Something went wrong.Try again.'
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
 * changeStatus() will change user status
 * @param  {obj}   req 
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.changeStatus = function(req, res, next) {
    var id = req.params.id || null;

    if (!id) {
        res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

    if (req.body != "") {
        req.checkBody('activate', 'Activate required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {
        var active = req.body.activate != true ? 0 : 1;        
        var user = {
            active: active
        };

        db.models.user.update(user, {
            where:{
                id:id,
            }
         }).then(function(updatedUser){
            if(updatedUser){
                res.json({
                    status:'success',
                    data: '',
                    message:'User has been updated successfully.'
                });
            }else {
                res.json({
                    status: 'fail',
                    data: '',
                    message: 'Failed to update user' + req.params.id
                });
            }

         }).catch(function(err) {
            res.json({
                status: 'fail',
                data: '',
                message: 'Failed to update user' + req.params.id,
                error: err
            });
        });

    } else {
        res.json({
            status: "fail",
            message: mappedErrors
        });
    }

};

/**
 * getUserById will find user by id
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json of user detail
 */
exports.getUserById = function(req, res, next) {
    var id = req.params.id;

    if (!id) {
        return res.json({
            status: "fail",
            message: 'Invalid user'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }


    db.models.user
    .findOne({
        include: [{
            model: db.models.company_user_group,
            where: { id: { $ne: null } },
            include: [{
                model: db.models.company_group,
                //attributes: ['name']
            }],            
        }],

        where: {
            id: id
        }
    })
    .then(function(user) {

        user.setDataValue('profilepictureurl', settings.siteUrl + '/theme/img/avatar-sign.png' );
        if(user.profile_image) {
            var imagePath = settings.filesPath.userPicture + user.profile_image;
            try{
                fs.accessSync(imagePath);
                if(imagePath.startsWith("public/")) {
                    var imageurl = settings.siteUrl + imagePath.slice(6);
                } else {
                    var imageurl = settings.siteUrl + '/' + imagePath;
                }                
                user.setDataValue('profilepictureurl', imageurl);
            }catch(e){
               //code to action if file does not exist
            }  
            
        }

        user.setDataValue('profilepicturethumburl', settings.siteUrl + '/theme/img/avatar-sign.png' );
        if(user.profile_image) {
            var imagePath = settings.filesPath.userPicture + 'thumbnail/' + user.profile_image;
            try{
                fs.accessSync(imagePath);
                if(imagePath.startsWith("public/")) {
                    var imageurl = settings.siteUrl + imagePath.slice(6);
                } else {
                    var imageurl = settings.siteUrl + '/' + imagePath;
                }                
                user.setDataValue('profilepicturethumburl', imageurl);
            }catch(e){
               //code to action if file does not exist
            }  
            
        }

        return res.json({
                    status:'success',
                    data: user,
                    message:'User record has been found successfully'
                });            
    })
    .catch(function(err) {
      return res.status(400).send({
        message: err
      });
    });
};


/**
 * deleteUser() will delete user
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.deleteUser = function(req, res, next) {

    var id = req.params.id;

    if (!id) {
        return res.json({
            status: "fail",
            message: 'Invalid user'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }


    async.series([
                // AWS remove subscription
                function(callback){
                    
                    /* Call User Unsubscription functionality : Start */
                    awsIotConnect.awsDeleteUserUnSubscription(id, userInfo.companyId, function(awsUserUnsubscriptionCallback){
                        callback(null, null);
                    })
                    /* Call User Unsubscription functionality : End */
                },
                // Delete record from DB
                function(callback){
                    
                    db.models.user.findOne({
                        where: { id: id }
                    })
                    .then(function(user) {  
                        

                        //commonLib.removeProfilePicture(user.profile_image);

                        /* Delete User */
                        db.models.user.destroy({ where: { id: id } }).then(function(affectedrowcount) {
                            // db.models.company_user_group
                            // .destroy({
                            //   where: {
                            //     user_id: id
                            //   }
                            // })
                            // .then(function(affectedrowcount) {
                                var msg = ({  status: "success" });
                                callback(msg);
                            // })
                            // .catch(function(err) {
                            //     var msg = ({ status: 'fail', message: err });
                            //     callback(msg);
                            // });
                        })
                        .catch(function(err) {
                          var msg = ({ status: 'fail', message: err });
                          callback(msg);
                        });

                    })
                    .catch(function(err) {
                      var msg = ({ status: 'fail', message: err });
                      callback(msg);
                    });                    
                }
              ],
              function(err, results) {
                    return res.json(err)
                }
            )

};




/**
 * addUserGroup will add usergroup
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.addUserGroup = function(req, res, next) {

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            data: null,
            message: 'User information not found'
        });
    }

    if (req.body != "") {
        req.checkBody('name', 'Group Name is required').notEmpty();
        req.checkBody('name', 'You can\'t create group with this name').notEquals('Admin');
        req.checkBody('name', 'You can\'t create group with this name').notEquals('admin');
        req.checkBody('name', 'You can\'t create group with this name').notEquals('Default');
        req.checkBody('name', 'You can\'t create group with this name').notEquals('default');
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false)
    {

        var companyId = userInfo.companyId;
        var newusergroup = req.body;

        var successmessage = "User Group added successfully";
        var failmessage = "There was some problem adding user group, please try later or contact administrator.";

        // Check name exist or Not
        db.models.company_group.findAll({
                              where: [" name = ? AND company_id = ? ", newusergroup.name, companyId]
                            }) .then(function(groupFetch)
        {

            if(groupFetch.length > 0) // Name Found
            {
                res.json({
                    status: 'fail',
                    data: null,
                    message: 'Requested group name already exist'
                });
            }
            else // Name Not Found
            {
                    //  set user group data
                    var usergroupdata = {};
                    usergroupdata.name  = newusergroup.name;
                    usergroupdata.company_id = companyId;

                db.models.company_group.create(usergroupdata)
                      .then(function(usergroup) {
                        res.json({
                            status: 'success',
                            data: null,
                            message: 'Group registration process has been successfully completed'
                        });
                    })
                    .catch(function(err) {
                        res.json({
                            status: 'fail',
                            data: null,
                            message: 'Group registration process has not been successfully completed'
                        });
                    });
            }
        }).catch(function(err){
            res.json({
                status: 'fail',
                data: null,
                message: 'Group registration process has not been successfully completed'
            });
        }); 

    }
    else
    {
        res.json({
            status: 'fail',
            data: null,
            message: mappedErrors
        });
    }
};


/**
 * getUserGroupById will find usergroup by id
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json of user detail
 */
exports.getUserGroupById = function(req, res, next) {
    var id = req.params.id;

    if (!id) {
        return res.json({
            status: "fail",
            message: 'Invalid user group'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }


    db.models.company_group
    .findOne({
        where: {
            id: id,
            company_id: userInfo.companyId,            
        }
    })
    .then(function(group) {

        return res.json({
            status: "success",
            data: group,
            message: "Data loaded successfully."
        }); 

    })
    .catch(function(err) {
        
        return res.json({
            status: "fail",
            message: "There was some problem fetching group data, please try later or contact administrator."
        });

    });
};

/**
 * updateUserGroup will update usergroup detail
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.updateUserGroup = function(req, res, next) {

    var id = req.params.id || null;
    if (!id) {
        return res.json({
            status: "fail",
            data: null,
            message: 'User Group information not found'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            data: null,
            message: 'User information not found'
        });
    }


    if (req.body != "") {
        req.checkBody('name', 'Group Name is required').notEmpty();
        req.checkBody('name', 'You can\'t update group to this name').notEquals('Admin');
        req.checkBody('name', 'You can\'t update group to this name').notEquals('admin');
        req.checkBody('name', 'You can\'t update group to this name').notEquals('Default');
        req.checkBody('name', 'You can\'t update group to this name').notEquals('default');
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {

        var updatedusergroup = req.body;

        var successmessage = "User Group has been updated successfully";
        var failmessage = "There was some problem updating user group, please try later or contact administrator.";

        db.models.company_group.findOne({
              where: {
                    id: id,
                    company_id: userInfo.companyId,
                }
        }).then(function(company_group) {

            if(company_group.name=='Admin' || company_group.name=='Default' || company_group.name=='admin' || company_group.name=='default')
            {
                    return res.json({
                        status: "fail",
                        data: null,
                        message: "You can't update this user group.",
                    });
            }
            else
            {

                 // Check name exist or Not
                db.models.company_group.findAll({
                          where: [" name = ? AND id != ? AND company_id = ? ", updatedusergroup.name, id, userInfo.companyId]
                        }) .then(function(groupFetch)
                {

                    if(groupFetch.length > 0) // Name Found
                    {
                        res.json({
                            status: 'fail',
                            data: null,
                            message: 'Requested group name already exist'
                        });
                    }
                    else // Name Not Found
                    {
                        company_group.name  = updatedusergroup.name;
                        company_group.save().then(function() {
                            return res.json({
                                status: "success",
                                data: null,
                                message: successmessage
                            });
                        })
                        .catch(function(err) {
                            return res.json({
                                status: "fail",
                                data: null,
                                message: failmessage,
                            });
                        });
                    }
                }).catch(function(err){
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Group registration process has not been successfully completed'
                    });
                }); 
            }

        })
        .catch(function(err) {
            return res.json({
                status: "fail",
                data: null,
                message: failmessage,
            });
        });        

    }
    else
    {
        res.json({
            status: 'fail',
            data: null,
            message: mappedErrors
        });
    }
};


/**
 * deleteUserGroup() will delete usergroup
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.deleteUserGroup = function(req, res, next) {
    var id = req.params.id;

    if (!id) {
        return res.json({
            status: "fail",
            message: 'Invalid user'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

    db.models.company_group
    .findOne({
        attributes: ['id','name','createdAt','updatedAt',
            [
              Sequelize.literal("(SELECT COUNT('id') FROM "+db.models.company_user_group.tableName+" AS company_user_group JOIN "+db.models.user.tableName+" AS user ON user.id = company_user_group.user_id WHERE `"+db.models.company_group.tableName+"`.id = `company_user_group`.company_group_id and user.deletedAt is null)"),
                'totalusers'
            ]
        ],        
        where: {
            id: id,
            company_id: userInfo.companyId,
        } 
    }).then(function(company_group) {

        if(company_group.name=='Admin' || company_group.name=='Default') {
            return res.json({
                status: "fail",
                message: "You can't delete this user group.",
            });
        } else if(company_group.dataValues.totalusers > 0) {
            return res.json({
                status: "fail",
                message: "You can't delete this user group as there are users assigned to this group.",
            }); 
        } else {

            db.models.company_group.destroy({
                where: {
                    id: id,
                    company_id: userInfo.companyId,
                } 
            }).then(function(affectedrowcount) {
                return res.json({
                    status: "success",
                    message: "User Group deleted successfully"
                });
            })
            .catch(function(err) {
                return res.json({
                    status: "fail",
                    message: "There was some problem deleting user group, please try later or contact administrator.",
                    error: err
                });
            });

        }

    })
    .catch(function(err) {
        return res.json({
            status: "fail",
            message: "There was some problem deleting user group, please try later or contact administrator."
        });
    });

};



/**
 * checkNameExist will check if user group name exist or not
 * @author  HY
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.checkNameExist = function(req, res, next) {

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

    db.models.company_group
    .findOne({
      where: {
        name: req.body.name,
        company_id: userInfo.companyId,
      }
    })
    .then(function(companygroup) {        
        var isNameUnique = ( (companygroup) ? false : true );
        return res.json({
            status: "success",
            data : { 'isNameUnique':isNameUnique }
        });            
    })
    .catch(function(err) {
        return res.json({
            status: "fail",
            message: err
        });          
    });  
};


/**
 * checkRoleNameExist will check if user Role name exist or not
 * @author  MK
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.checkRoleNameExist = function(req, res, next) {

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

    db.models.role
    .findOne({
      where: {
        name: req.body.name,
        company_id: userInfo.companyId,
      }
    })
    .then(function(companygroup) {        
        var isNameUnique = ( (companygroup) ? false : true );
        return res.json({
            status: "success",
            data : { 'isNameUnique':isNameUnique }
        });            
    })
    .catch(function(err) {
        return res.json({
            status: "fail",
            message: err
        });          
    });  
};

/*---- User Role module start ----*/

/**
 * getCompanyRoleList will load company group list
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.getCompanyRoleList = function(req, res, next) {

    if(req.body.cid != '' && req.body.cid != undefined)
    {
        var companyID = req.body.cid;
    }
    else
    {
        var userInfo = generalConfig.getUserInfo(req);
        var companyID = userInfo.companyId;
    }

    //get user info from request
    if (!companyID) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }
    else
    {
        db.models.role
        .findAll({
            where: { 
                    company_id: companyID,
                    name: {
                            $ne: 'Admin'
                          }
                    },
        })
        .then(function(roles) {
            return res.json( {"status" : true, "data" : roles, "message" : "Role list loaded successfully."}  );
        })
        .catch(function(err) {
            return res.json( {"status" : false, "data" : null, "message" : err.message });
        });
    }
};


 /**
 * Get User Role list for Data Table
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for datatable response
 */
exports.getUserRoleList = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }

    if(req.body.params.companyId) {
        var companyId = req.body.params.companyId;
    } else {
        var companyId = userInfo.companyId;
    }
    var sortBy = req.body.params.sortBy;
    var sortOrder = req.body.params.sortOrder;
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;
    var searchParams = new Array();

    if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "") {
        searchParams.push({
            name: {
                $like: '%' + req.body.SearchParams.searchTxt + '%'
            }
        });
    }

    if(searchParams.length==0) {
        var whereval = { company_id: companyId };
    } else {
        var whereval = { company_id: companyId, $or: searchParams };        
    }

    //////////////////////////////////
    //////  process ordering   ///////

    var sortByArray = sortBy.split('.');
    var orderval = [];
    var i = 0;
    if(sortByArray.length > 1) {
        while(i < sortByArray.length - 1) {
            var relationTable = sortByArray[i];
                orderval.push(db.models[relationTable]);
                i++;
        }
    }

    if(sortByArray[i].substring(0, 1) == "@")  {        
        orderval.push(Sequelize.literal(sortByArray[i].substring(1)));
    } else {
        orderval.push(sortByArray[i]);
    }

    orderval.push(sortOrder);

    //////  process ordering   ///////
    //////////////////////////////////

    db.models.role.hasMany(db.models.user, {
        foreignKey: 'role_id'
    });

    db.models.role
    .findAndCountAll({

        attributes: ['id','name','createdAt','updatedAt'],
        include: [
            { model: db.models.user, attributes: ['id','role_id'] }
        ],    
        where: whereval,
        order: [orderval],
        offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
        limit: pageSize
    })
    .then(function(group) {
        if (group) {
            res.json({
                'status': 'success',
                'data': group,
                'message': 'Data loaded successfully.'
            });
        } else {
            res.json({
                'status': 'fail',
                'message': 'No records found'
            });
        }
    })
    .catch(function(err) {
        res.json({
            'status': 'fail',
            'message': 'Failed to load users.',
            'error': err
        });        
    });
};

/**
 * addUserRole will add userrole
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.addUserRole = function(req, res, next) {
    
    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            data: null,
            message: 'User information not found'
        });
    }

    if (req.body != "") {
        req.checkBody('name', 'Role Name is required').notEmpty();
        req.checkBody('name', 'You can\'t create role with this name').notEquals('Admin');
        req.checkBody('name', 'You can\'t create role with this name').notEquals('admin');
        req.checkBody('permissionsArray', 'Permission list should not be empty').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false)
    {
        var companyId = userInfo.companyId;
        var newuserrole = req.body;

        var successmessage = "User Role added successfully";
        var failmessage = "There was some problem adding user role, please try later or contact administrator.";

        // Check name exist or Not
        db.models.role.findAll({
          where: [" name = ? AND company_id = ? ", newuserrole.name, companyId]
        }) .then(function(roleFetch)
        {
            if(roleFetch.length > 0) // Name Found
            {
                res.json({
                    status: 'fail',
                    data: null,
                    message: 'Requested role name already exist'
                });
            }
            else // Name Not Found
            {
                var userroledata = {};
                userroledata.name  = newuserrole.name;
                userroledata.company_id = companyId;

                var permissionArray = req.body.permissionsArray;
                db.transaction(function(t) { 
                    return Promise.all([
                        db.models.role.create(userroledata, {
                            transaction: t
                        }).then(function (role) {
                            var role_id = role.id;
                            if(permissionArray.length > 0 && role_id)
                            {
                                async.forEach(Object.keys(permissionArray), function (item, callback){ 
                                    permissionArray[item].role_id = role_id;
                                    callback(); 
                                }, function(err) {
                                    if(!err)
                                    {
                                        db.models.role_permission.bulkCreate(permissionArray,{
                                            transaction: t
                                        });
                                    }
                                });
                            }
                            else
                            {
                                res.json({
                                    status: 'fail',
                                    data: null,
                                    message: 'Role or Permission list are missing.'
                                });
                            }
                        })
                    ]).then(function() {
                        res.json({
                            status: 'success',
                            data: null,
                            message: 'Role registration process has been successfully completed'
                        });
                    });
                }).catch(function(err) {
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Role registration process has not been successfully completed'
                    });
                });
            }
        }).catch(function(err){
            res.json({
                status: 'fail',
                data: null,
                message: 'Role registration process has not been successfully completed'
            });
        }); 
    }
    else
    {
        res.json({
            status: 'fail',
            data: null,
            message: mappedErrors
        });
    }
};


/**
 * getUserRoleById will find userrole by id
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json of user detail
 */
exports.getUserRoleById = function(req, res, next) {
    var id = req.params.id;

    if (!id) {
        return res.json({
            status: "fail",
            message: 'Invalid user group'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

    db.models.role.hasMany(db.models.role_permission, {
        foreignKey: 'role_id'
    });

    db.models.role
    .findOne({
        include: [
            { model: db.models.role_permission, attributes: ['role_id','permission_id','permission'] }
        ], 
        where: {
            id: id,
            company_id: userInfo.companyId,            
        }
    })
    .then(function(role) {

        return res.json({
            status: "success",
            data: role,
            message: "Data loaded successfully."
        }); 

    })
    .catch(function(err) {
        
        return res.json({
            status: "fail",
            message: "There was some problem fetching role data, please try later or contact administrator."
        });

    });
};

/**
 * updateUserRole will update userrole detail
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.updateUserRole = function(req, res, next) {

    var id = req.params.id || null;
    if (!id) {
        return res.json({
            status: "fail",
            data: null,
            message: 'User Group information not found'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            data: null,
            message: 'User information not found'
        });
    }


    if (req.body != "") {
        req.checkBody('name', 'Role Name is required').notEmpty();
        req.checkBody('name', 'You can\'t update role to this name').notEquals('Admin');
        req.checkBody('name', 'You can\'t update role to this name').notEquals('admin');
        req.checkBody('permissionsArray', 'Permission list should not be empty').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {

        var updateduserrole = req.body;
        var permissionArray = req.body.permissionsArray;

        var successmessage = "User Role has been updated successfully";
        var failmessage = "There was some problem updating user role, please try later or contact administrator.";

        db.models.role.findOne({
              where: {
                    id: id,
                    company_id: userInfo.companyId,
                }
        }).then(function(role) {

            if(role.name=='Admin'|| role.name=='admin')
            {
                return res.json({
                    status: "fail",
                    data: null,
                    message: "You can't update this user role.",
                });
            }
            else
            {
                 // Check name exist or Not
                db.models.role.findAll({
                    where: [" name = ? AND id != ? AND company_id = ? ", updateduserrole.name, id, userInfo.companyId]
                }) .then(function(roleFetch)
                {

                    if(roleFetch.length > 0) // Name Found
                    {
                        res.json({
                            status: 'fail',
                            data: null,
                            message: 'Requested role name already exist'
                        });
                    }
                    else // Name Not Found
                    {
                        role.name  = updateduserrole.name;
                        role.save().then(function() {

                            var role_id = role.id;

                            async.forEach(Object.keys(permissionArray), function (item, callback){ 
                                //permissionArray[item].role_id = role_id;
                                var obj = {
                                    "permission" : permissionArray[item].permission
                                };
                                db.models.role_permission.update(obj, {
                                    where:{
                                        role_id:role_id,
                                        permission_id:permissionArray[item].permission_id ,
                                    }
                                }).then(function(updatedRolePermission){
                                    callback(); 
                                });

                                /*db.models.role_permission.findOrCreate({
                                    where:{
                                        role_id:role_id,
                                        permission_id:permissionArray[item].permission_id
                                    },
                                    defaults: obj
                                }).spread(function(user, created) {
                                    console.log(user.get({
                                      plain: true
                                    }))
                                    console.log(created)
                                    callback(); 
                                });*/
                            }, function(err) {
                                return res.json({
                                    status: "success",
                                    data: null,
                                    message: successmessage
                                });
                            });
                        })
                        .catch(function(err) {
                            return res.json({
                                status: "fail",
                                data: null,
                                //message: failmessage,
                                message: err.message,
                            });
                        });
                    }
                }).catch(function(err){
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Role registration process has not been successfully completed'
                    });
                }); 
            }

        })
        .catch(function(err) {
            return res.json({
                status: "fail",
                data: null,
                message: failmessage,
            });
        });        

    }
    else
    {
        res.json({
            status: 'fail',
            data: null,
            message: mappedErrors
        });
    }
};


/**
 * deleteUserRole() will delete userrole
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.deleteUserRole = function(req, res, next) {
    var id = req.params.id;

    if (!id) {
        return res.json({
            status: "fail",
            message: 'Invalid user'
        });
    }
    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }
    db.models.role.hasMany(db.models.user, {
        foreignKey: 'role_id'
    });

    db.models.role
    .findOne({
        attributes: ['id','name','createdAt','updatedAt'],
        include: [
            { model: db.models.user, attributes: ['id','role_id'] }
        ],      
        where: {
            id: id,
            company_id: userInfo.companyId,
        } 
    }).then(function(role) {

        var totalusers = role.users.length;
        if(role.name=='Admin') {
            return res.json({
                status: "fail",
                message: "You can't delete this user role.",
            });
        } else if(totalusers > 0) {
            return res.json({
                status: "fail",
                message: "You can't delete this role there are some users connected to this role.",
            }); 
        } else {
            db.models.role.destroy({
                where: {
                    id: id,
                    company_id: userInfo.companyId,
                } 
            }).then(function(affectedrowcount) {
                db.models.role_permission.destroy({
                    where: {
                        role_id: id
                    } 
                }).then(function(affectedrowcount) {
                    return res.json({
                        status: "success",
                        message: "User Role deleted successfully"
                    });
                });
            })
            .catch(function(err) {
                return res.json({
                    status: "fail",
                    message: "There was some problem deleting user role, please try later or contact administrator.",
                    error: err
                });
            });
        }
    })
    .catch(function(err) {
        return res.json({
            status: "fail",
            message: "There was some problem deleting user role, please try later or contact administrator."
        });
    });
};

/**
 * getModulesAndPermission will load company group list
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.getModulesAndPermission = function(req, res, next) {
    
    db.models.modules.hasMany(db.models.permission, {
        foreignKey: 'module_id'
    });

    db.models.modules
    .findAll({

        attributes: ['id','name','modules_code'],
        include: [
            { model: db.models.permission, attributes: ['id','name','detail', 'permission_code', 'status'] }//, where: { 'status' : true }
        ],
        where:{ 'status':true },
        order: 'id ASC',
    })
    .then(function(permission) {
        return res.json( {"status" : true, "data" : permission, "message" : "Modules and Permission list loaded successfully."}  );
    })
    .catch(function(err) {
        return res.json( {"status" : false, "data" : null, "message" : err.message });
    });
};


/**
 * updateCompanyAdminRole() Seprate script for set Admin rights for all old Admin 
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return Success message
 */
exports.updateCompanyAdminRole = function(req, res, next) {
    
    db.models.company.hasMany(db.models.company_group, {
        foreignKey: 'company_id'
    });
    /*db.models.company_group.hasMany(db.models.company_group, {
        foreignKey: 'company_id'
    });*/
    db.models.user.hasMany(db.models.role, {
        foreignKey: 'role_id'
    });

    db.models.company.findAll({
        attributes: ['id','active'],
        include: [
            { model: db.models.company_group, 
                attributes: ['id','name','company_id'], 
                where: { name : { $eq:'Admin'} },
                include: [
                            { model: db.models.company_user_group, attributes: ['id','user_id']}
                        ],
            }
        ],  
        where: { 'parent_id' : null }
    })
    .then(function(company) {

        if(company.length > 0)
        {
            getPermissionList(function(permissionArray){
                if(permissionArray.status == true)
                {
                    permissionArray = permissionArray.data;   
                    async.forEach(Object.keys(company), function (ci, callback){ 
                        var companyID = company[ci].id;
                        var userID = company[ci].company_groups[0].company_user_groups[0].user_id;
                        var roleObj = {
                            'name' : 'Admin',
                            'company_id' : companyID,
                        }
                        db.transaction(function(t) { 
                            return Promise.all([
                                db.models.role.create(roleObj, {
                                    transaction: t
                                }).then(function (role) {
                                    var role_id = role.id;
                                    
                                    if(permissionArray.length > 0 && role_id)
                                    {
                                        db.models.user.update({
                                            role_id: role_id
                                        }, { where:{ id:userID } },{
                                            transaction: t
                                        }).then(function (user) {
                                            setRolePermission(permissionArray, role_id);
                                            callback();
                                        });
                                    }
                                    else
                                    {
                                        res.json({
                                            status: 'fail',
                                            data: null,
                                            message: 'Role or Permission list are missing.'
                                        });
                                    }
                                })
                            ]).then(function() {
                                res.json({
                                    status: 'success',
                                    data: null,
                                    message: 'All opertation done successfully'
                                });
                            });
                        }).catch(function(err) {
                            res.json({
                                status: 'fail',
                                data: null,
                                message: 'Failed to perform given operation'
                            });
                        });
                    }, function(err) {
                        if(!err)
                        {
                            return res.json( {"status" : true, "data" : company, "message" : "Data updated successfully."}  );
                        }
                        else
                        {
                            res.json({
                                status: 'fail',
                                data: null,
                                message: err.message
                            });
                        }
                    });
                }
                else
                {
                    res.json({
                        status: 'fail',
                        data: null,
                        message: "No Permission data found"
                    });
                }
            });
        }
        else
        {
            res.json({
                status: 'fail',
                data: null,
                message: "No Company and other data found"
            });
        }
        
    })
    .catch(function(err) {
        return res.json( {"status" : false, "data" : null, "message" : err.message });
    });
};

/**
 * getPermissionList() Get list of all permissions 
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return JSON response of permission list
 */
var getPermissionList = function (callback) {

    db.models.permission.findAll({
        attributes: ['id','name','detail','permission_code','status'],
        //where: { status : true }
    }).then(function(permission) {
        if(permission.length > 0)
        {
            var permissionArray = [];
            async.forEach(Object.keys(permission), function (pi, callback1){ 
                
                var obj = {
                    'permission_id' :  permission[pi].id,
                    'permission'    :  1
                }
                permissionArray.push(obj);
                callback1(); 
            }, function(err) {
                if(!err)
                {
                    callback({
                        'status':true,
                        'data':permissionArray,
                    });
                }
                else
                {
                    callback({
                        'status':false,
                        'error':"No data array available"
                    });
                }
            });
        }
        else
        {
            callback({
                'status':false,
                'error':err
            });
        }
    });
};

/**
 * setRolePermission() Set Role permission as per selected checkboxes
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return Success message
 */
var setRolePermission = function (permissionArray, role_id) {

    async.forEach(Object.keys(permissionArray), function (item, callbackPermission){ 
        permissionArray[item].role_id = role_id;
        callbackPermission(); 
    }, function(err) {
        if(!err)
        {
            db.models.role_permission.bulkCreate(permissionArray)
            .then(function (result) {
            });
        }
        else
        {
            console.log("Error : ",err.message);
        }
    });
};


/**
 * getUserPermission will load list of all permission for selected role
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return Success json for fail or success permission
 */
exports.getUserPermission = function(req, res, next) {
    var userInfo = generalConfig.getUserInfo(req);
    commonLib.getUserInfoById(userInfo.id, function(result) {
        //console.log(result.data.role_id);
        if(result.status) {
            var role_id = result.data.role_id;
            commonLib.getUserPermission(role_id, function(result) {
                if(result)
                {
                    return res.json( {"status" : true, "data" : result.data, "message" : "Data loaded successfully."}  );
                }
                else
                {
                    return res.json( {"status" : false, "data" : null, "message" : "No data found."}  );
                }
            });
        } else {
            return res.json( {"status" : false, "data" : null, "message" : "No role assigned to user."}  );
        }                           
    });
};

/**
 * getGroupUserList will load users of given groups
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return JSON response of user list
 */
exports.getGroupUserList = function(req, res, next) {
    var userInfo = generalConfig.getUserInfo(req);
    var companyID = userInfo.companyId;
    //get user info from request
    if (!companyID) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    } else {
        var usergroups = req.body.usergroups;        
        db.models.company_group.findAll({
            attributes:['id', 'name'],    
            include: [{
                attributes:['id', 'firstname', 'lastname', 'email'],
                model: db.models.user,
                as: 'Groupusers'
            }],
            where: { 
                    id: {
                            $in: usergroups
                          }
                    },    
        })
        .then(function(userlist) {
            return res.json(userlist);
            res.json({
                status: 'success',
                data: userlist,
                message: "User listed successfully."
            });    
        })
        .catch(function(err) {
            res.json({
                status: 'fail',
                data: null,
                message: "Error in loading selected group users."
            });
        });
    }
};


exports.getUsers = function(req, res, next) {
    
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;

    db.models.user
    .findAndCountAll({
      attributes: ['id', 'firstname','lastname','email', 'phone', 'timezone', 'role_id', 'active'],
      include: [{
            model: db.models.role,
                where: { 
                    name: {
                        $ne: 'Patient'
                    } 
                }
            }
      ],
      offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
      limit: pageSize
    })
    .then(function(user) {
        if(user)
        {   
            res.json({
                status: true,
                data: user,
                message: 'User Load Successfully'
            });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load data..!'
            });
        }
    }).catch(function(err) {
        console.log(err);
    });
};

exports.getUsersRoles = function(req, res, next) {
    db.models.role
    .findAll({
        where: { 
            name: {
                $ne: 'Patient'
            } 
        }
    })
    .then(function(role) {
        if(role)
        {   
            res.json({
                status: true,
                data: role,
                message: 'Role Load Successfully'
            });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load data..!'
            });
        }
    }).catch(function(err) {
        console.log(err);
    });
};


exports.getUsersRolesName = function(req, res, next) {
    var userInfo = generalConfig.getUserInfo(req);
    
    db.models.user
    .findOne({
        attributes:['role_id'],
        where: { 
            id: userInfo.id
        }
    })
    .then(function(user) {
        db.models.role
        .findOne({
            attributes:['name'],
            where: { 
                id: user.dataValues.role_id
            }
        }).then(function(role){
            if(role)
            {   
                res.json({
                    status: true,
                    data: role,
                    message: 'Role Load Successfully'
                });
            }
            else {
                res.json({
                    status: false,
                    data: null,
                    message: 'Failed to load data..!'
                });
            }    
        }).catch(function(err) {
            console.log(err);
        });
    }).catch(function(err) {
        console.log(err);
    });
};

exports.addUsersData = function(req, res, next) {
    
    var userdata = {};
        userdata.active= 1;
        userdata.firstname = req.body.firstname;
        userdata.lastname = req.body.lastname;
        userdata.email = req.body.email;
        userdata.phone = req.body.phone;
        userdata.timezone = req.body.timezone;
        userdata.role_id = req.body.role_id;
        userdata.company_id = "e2bf5889-a22d-49f5-bf51-8bc2f02178c4";

    db.models.user.find({
        where: {
            email: req.body.email
        }
    }).then(function(findUser) {
        if(findUser) {
            return res.json({
                status: 'fail',
                data: null,
                message: 'User already exist'
            });
        } else {
            db.models.user.create(userdata)
            .then(function(user) {
                if(user){
                    db.models.user
                    .findAndCountAll({
                        attributes: ['id', 'firstname','lastname','email'],
                        include: [{
                            model: db.models.role,
                                where: { 
                                    name: {
                                        $ne: 'Patient'
                                    } 
                                }
                            }
                        ]
                    }).then(function(user){
                        db.models.user.find({
                            where: [ "email = ?", req.body.email ],
                        }).then(function(user){
                            var userTokenGen = new Date().getTime()+user.email;
                            var userToken = crypto.createHash('md5').update(userTokenGen).digest('hex');
                            user.update({
                                usertoken: userToken
                            }).then(function(user) {
                                var emailTemplate = settings.emailTemplate;
                                var emailbody = emailTemplate.resetpasswordEmailBody;
                                var linkurl = settings.siteUrl+"/resetpassword/"+userToken;
                                var linkhtml = "<a href='"+linkurl+"'>"+linkurl+"</a>"; 
                                emailbody = emailbody.replace("%userfullname%", user.firstname+" "+user.lastname );     
                                emailbody = emailbody.replace("%resetpasswordlink%", linkhtml);     
                                var emailmessage = emailTemplate.emailContainerHeaderString;
                                    emailmessage += emailbody;
                                    emailmessage += emailTemplate.emailContainerFooterString;

                                var message = {
                                    from:    settings.adminEmailID,
                                    to:      user.email,
                                    subject: emailTemplate.resetpasswordSubject,
                                    attachment: 
                                    [
                                        {data:emailmessage, alternative:true}
                                    ]
                                };
                                settings.emailserver.send(message, function(err, message) {  });

                                res.json({
                                    status: true,
                                    data: null,
                                    message: 'Registartion link has been sent to entered email address'
                                });

                            }).catch(function(err) {
                                console.log(err);
                            }); 
                        }).catch(function(err) {
                            console.log(err);
                        });    
                    });
                }
                else {
                    res.json({
                        status: false,
                        data: null,
                        message: 'Failed to add user..!'
                    });
                 }
            }).catch(function(err) {
                console.log(err);
            });
        }
    }).catch(function(err) {
        console.log(err);
    });    
};


exports.deleteUserData = function(req, res, next) {
    var userID = req.params.id;
    db.models.user.destroy({ where: { id: userID} })
    .then(function(user) {
        if (user) {
            res.json({
            status: true,
            data: userID,
            message: 'User deleted successfully.'
          });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to delete user.'
            });
        }
    }).catch(function(err){
        res.json({
            status: false,
            data: null,
            message: err.message
        });
    });
};

exports.updateUser = function(req, res, next) {
    var data = {
        "company_id" : "e2bf5889-a22d-49f5-bf51-8bc2f02178c4",
        "firstname" : req.body.firstname,
        "lastname" : req.body.lastname,
        "email" : req.body.email,
        "phone" : req.body.phone,
        "timezone" : req.body.timezone,
        "role_id" : req.body.role_id
    };
    var userID = req.params.id;
    db.models.user.find({ where: { id: userID} })
    .then(function(user) {
        if (user) {
        db.models.user.update(data,{
                where: { id: userID}
            }).then(function (result) {
                res.json({
                status: true,
                data: result,
                message: 'Data updated successfully..!'
              });
        })
      }
      else {
            res.json({
                status: false,
                data: null,
                message: 'Data not found to update..!'
            });
      }
    }).catch(function(err){
        res.json({
            status: false,
            data: null,
            message: err.message
        });
    });
};

exports.disableUserLogin = function(req, res, next) {
    var userID = req.body.id;
    var data = {};
    if(req.body.user == true) {
        data.active = 1;
    }
    else {
        data.active = 0;
    }

    db.models.user.update(data,{ where: { id: userID} })
    .then(function(result) {
        if (data) {
            res.json({
            status: true,
            data: data,
            message: 'User status updated successfully.'
          });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to delete user.'
            });
        }    
    }).catch(function(err){
        res.json({
            status: false,
            data: null,
            message: err.message
        });
    });
};

exports.getUserId = function(req, res, next) {

    db.models.user.find({
        where:{
            id:req.body.id
        }
    })
    .then(function(user) {
        if(user)
        {
            res.json({
                status: true,
                data: user,
                message: 'User load successfully'
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

