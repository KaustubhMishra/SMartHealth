'use strict';

var generalConfig = require('../../../../config/generalConfig');
var cassandra = require('cassandra-driver');
var crypto = require('crypto');
var sequelize_file = require('../../../../config/sequelize');
var db = sequelize_file.db; // Company Database
var master_db = sequelize_file.master_db;  // Master Database
var Sequelize = require("sequelize");
/* Common function Lib */
var commonLib = require('../../../../lib/common');

db.models.user.associate(db.models);
db.models.company_user_group.associate(db.models);
db.models.company_group.associate(db.models);

/**
 * @author : TK
 * @Changed : GK
 * addComapny will add new comapny
 */
exports.addCompany = function(req, res, next) {
    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }
        
    if (req.body != "")
    {
        req.checkBody('userCompany', 'Name required').notEmpty();
        req.checkBody('email', 'Email required').notEmpty();
        req.checkBody('firstname', 'Firstname required').notEmpty();
        req.checkBody('lastname', 'Lastname required').notEmpty();
        req.checkBody('timezone', 'Timezone required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }
    if (mappedErrors == false)
    {

        db.models.company.
        findOne({
            where: { id: userInfo.companyId }
        })
        .then(function(company)
        {
            if(company)
            {
                if (company.parent_id != null) {

                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Access Denied'
                    });

                } else {

                    // Check User email Status
                    commonLib.checkUserEmailExistStatus(req.body.email, function(callback_userEmail){

                            var failmsg = 'There was some problem registering company, please try later or contact administrator';

                            if(callback_userEmail.status == 'success')
                            {
                                if(callback_userEmail.data) // Email address found
                                {
                                    res.json({
                                        status: 'fail',
                                        data: null,
                                        message: 'Email Address already registered'
                                    });
                                }
                                else  // Email address not found
                                {
                                    commonLib.checkCompanyExistStatus(req.body.userCompany, '', function(callback_company){
                                        if(callback_company.status == 'success')
                                        {
                                            if(callback_company.data) // Same company name found
                                            {
                                                res.json({
                                                    status: 'fail',
                                                    data: null,
                                                    message: 'Same company name already registered'
                                                });
                                            }
                                            else
                                            {
                                                // Same company not name found                                    
                                                // Add Company Details
                                                var companyId = cassandra.types.uuid();
                                                var userId = cassandra.types.uuid();                                        
                                                var parentcompanyid = userInfo.companyId;

                                                db.models.company.findById(parentcompanyid)
                                                .then(function(parentcomp) {

                                                 // Get CPID 
                                                 commonLib.getUniqueCpid(function(cpid_callback){

                                                    if(cpid_callback.status == 'fail')
                                                    {
                                                        return res.json({
                                                            status: 'fail',
                                                            data: 'CP not found',
                                                            message: "Ooops!! there is something wrong Signup Process"
                                                        });
                                                    }
                                                    else
                                                    {
                                                        var cpid_string = cpid_callback.data; // CPID
                                                        var company = {
                                                            id: companyId,
                                                            parent_id: parentcompanyid,
                                                            database_name       : parentcomp.database_name,
                                                            database_user       : parentcomp.database_user,
                                                            database_password   : parentcomp.database_password,
                                                            name: req.body.userCompany,
                                                            address1: req.body.companyaddress1,
                                                            address2: req.body.companyaddress2,
                                                            country: req.body.companycountry,
                                                            state: req.body.companystate,
                                                            city: req.body.companycity,
                                                            phone: req.body.companyphone,
                                                            phonecodeCom: req.body.phonecodeCom,
                                                            fax: req.body.companyfax,
                                                            cpid: cpid_string
                                                        };

                                                        var userTokenGen = new Date().getTime()+req.body.email;
                                                        var userToken = crypto.createHash('md5').update(userTokenGen).digest('hex');
                                                        var adminuser = {
                                                            id: userId,
                                                            company_id: companyId,
                                                            email: req.body.email,
                                                            firstname: req.body.firstname,
                                                            lastname: req.body.lastname,
                                                            usertoken:userToken,
                                                            timezone:req.body.timezone
                                                        };

                                                        commonLib.setupNewCompany(company, adminuser, cpid_string, function(result) {

                                                            if(result.status) {

                                                                // Email fire : Start
                                                                var emailTemplate = settings.emailTemplate;
                                                                var emailbody = emailTemplate.createpasswordEmailBody;

                                                                var link = "<a href='"+settings.siteUrl+"/createpassword/"+userToken+"'>"+settings.siteUrl+"/createpassword/"+userToken+"</a>";

                                                                emailbody = emailbody.replace("%companyname%", req.body.userCompany);     
                                                                emailbody = emailbody.replace("%createpasswordlink%", link);     

                                                                var emailmessage = emailTemplate.emailContainerHeaderString;
                                                                emailmessage += emailbody;
                                                                emailmessage += emailTemplate.emailContainerFooterString;


                                                                var message = {
                                                                   from:    "kaustubh.mishra@softwebsolutions.com", 
                                                                   to:      req.body.email,
                                                                   subject: emailTemplate.createpasswordSubject,
                                                                   attachment: 
                                                                   [
                                                                      {data:emailmessage, alternative:true}
                                                                   ]
                                                                };

                                                                settings.emailserver.send(message, function(err, message) {  });
                                                                // Email fire : End

                                                                /* mqtt Call functional */
                                                                generalConfig.company_mqttPublishMessage();
                                                                
                                                                res.json({
                                                                    status: 'success',
                                                                    data: null,
                                                                    message: 'Company has been registered successfully.'
                                                                });

                                                            } else {
                                                                
                                                                return res.json({
                                                                    status: 'fail',
                                                                    //error: result.error,
                                                                    message: 'There are was some registration company, please try later or contact administrator'
                                                                });                                        
                                                            }

                                                        });
                                                    }
                                                }) // Get CPID :END

                                                }).catch(function(err) {
                                                    return res.json({
                                                        status: 'fail',
                                                        message: failmsg
                                                    });
                                                });   

                                            }
                                        }
                                        else
                                        {
                                            res.json({
                                                status: 'fail',
                                                data: null,
                                                message: failmsg
                                            });
                                        }
                                    })
                                    
                                }
                            }
                            else
                            {
                                res.json({
                                    status: 'fail',
                                    data: null,
                                    message: failmsg
                                });
                            }
                    });

                }

            } else {
                res.json({
                    'status': 'fail',
                    'message': 'Unknown user'
                });             
            }
        })
        .catch(function(err) {
            res.json({
                'status': 'fail',
                'message': 'Failed to load login user company detail.'
            });        
        });

    }
    else // Error
    {
        res.json({
            status: 'fail',
            data: null,
            message: mappedErrors
        });
    }
};


exports.getCompanyList = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    var parentcompanyid = userInfo.companyId;

    if (!parentcompanyid) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }

    var companyId = parentcompanyid;
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
        var whereval = { parent_id: parentcompanyid };
    } else {
        var whereval = { parent_id: parentcompanyid, $or: searchParams };        
        //var whereval = { $or: searchParams };        
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


    db.models.company.associate(db.models);

    db.models.company
    .findAndCountAll({
        /*include: [
            {
                model: db.models.user,
                //where: { parent_id:companyId }
                attributes: ['id','company_id','firstname','lastname'],
                required: true,                
            }
        ],*/
        attributes: ['id','name','cpid','city','state','country','active','createdAt','updatedAt',
            [
              Sequelize.literal("(SELECT COUNT('id') FROM "+db.models.user.tableName+" AS user WHERE `"+db.models.company.tableName+"`.id = `user`.company_id)"),
                'totalusers'
            ]
        ],
        where: whereval,
        order: [orderval],
        //group: ['id'],
        offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
        limit: pageSize
    })
    .then(function(company) {
        if (company) {
            res.json({
                'status': 'success',
                'data': company,
                'message': 'Data loaded successfully.'
            });
        } else {
            res.json({
                'status': 'fail',
                'message': 'There was some problem loading data, please contact administrator.'
            });
        }
    })
    .catch(function(err) {
        res.json({
            'status': 'fail',
            'message': 'There was some problem loading data, please contact administrator.'
        });        
    });

}

/**
 * @author : TK
 * @Changed : GK
 * Get Company Details by Company Id
 */
exports.getCompanyById = function(req, res, next) {

    var id = req.params.id; // Company Id

    if (!id)
    {
        return res.json({
            status: 'fail',
            data: null,
            message: 'Unknown Company record, please select valid Company'
        });
    }

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: 'fail',
            data: null,
            message: 'User information not found'
        });
    }

    db.models.company.associate(db.models);
    db.models.company
        .findOne({
            include: [
                {
                    model: db.models.user
                }
            ],
        where: {
            id: id
        }
    }).then(function(company) {

        return res.json({
            status: 'success',
            data: company,
            message: 'Company record has been found successfully'
        });

    }).catch(function(err) {
        return res.json({
            status: 'fail',
            data: null,
            message: 'Company record could not been found.'
        });
    });
}

/**
 * @author : TK
 * @Changed : GK
 * Update company record
 */
exports.updateCompany = function(req, res, next) {
    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    var companyId = userInfo.companyId;

    var id = req.params.id || null; // Company Id
    if(!id)
    {
        return res.json({
            status: 'fail',
            data: null,
            message: 'Unknown Company record, please select valid Company'
        });
    }
    // Validation
    if (req.body != "")
    {
        req.checkBody('name', 'Name is required').notEmpty();
        req.checkBody('country', 'Country is required').notEmpty();
        req.checkBody('state', 'State is required').notEmpty();
        req.checkBody('city', 'City is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }
    if (mappedErrors == false)
    {
        // Check Company Name Status    
        commonLib.checkCompanyExistStatus(req.body.name, id, function(callback_company){
            if(callback_company.status == 'success')
            {
                if(callback_company.data)
                {
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Same company name already registered'
                    });
                }
                else
                {
                    //var status = req.body.status == 1 ? true : false;
                    // Check company registred or not
                    db.models.company.
                        findOne({
                            where: { id: id }
                        })
                    .then(function(company)
                    {
                        if(company)
                        {
                            // Update company information
                            var compObj = {
                                name        : req.body.name,
                                address1    : req.body.address1,
                                address2    : req.body.address2,
                                country     : req.body.country,
                                state       : req.body.state,
                                city        : req.body.city,
                                phone       : req.body.phone,
                                phonecodeCom: req.body.phonecodeCom,
                                fax         : req.body.fax
                            }

                            company.update(compObj).then(function(updatecompany) 
                            {
                                    res.json({
                                        status: 'success',
                                        data: null,
                                        message: "Company has been updated successfully"
                                    });
                            }).catch(function(error) {
                                    res.json({                
                                        status: 'fail',
                                        data: null,
                                        message: 'Company has been updated successfully'
                                    });
                            });
                        }
                        else
                        {
                            res.json({                
                                status: 'fail',
                                data: null,
                                message: 'Requested company record could not found'
                            });
                        }
                            
                    }).catch(function(error) {
                        res.json({                
                            status: 'fail',
                            data: null,
                            message: 'Company information has not been updated successfully'
                        });
                    }); 
                }
            }
            else
            {
                res.json({                
                        status: 'fail',
                        data: null,
                        message: 'Company information has not been updated successfully'
                    });
            }
        })
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
 * deleteCompany() will delete company and all it's users
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.deleteCompany = function(req, res, next) {
    var id = req.params.id;

    if (!id) {
        return res.json({
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

    db.transaction(function (t) {

        return db.models.company_group.destroy({
            where: { company_id: id }
        }, {transaction: t})
        .then(function (affectedrowcount) {

            return db.models.company_command.destroy({
                where: { company_id: id }
            }, {transaction: t})
            .then(function (affectedrowcount) {

                return db.models.company_user_group.destroy({
                    where: { 
                        user_id: {
                            $in: Sequelize.literal('(SELECT id FROM user WHERE company_id = "'+id+'")')
                        }                        
                    }
                }, {transaction: t})    
                .then(function (affectedrowcount) {

                    return db.models.user.destroy({
                        where: { company_id: id }   
                    }, {transaction: t})
                    .then(function (affectedrowcount) {

                        return db.models.company.destroy({
                            where: { id: id }
                        }, {transaction: t})

                    });
   
                });
                
            });
            
        });

    }).then(function (result) {
      // Transaction has been committed
      // result is whatever the result of the promise chain returned to the transaction callback
        return res.json({
            status: 'success',
            message: 'Company deleted successfully.'
        });

    }).catch(function (err) {
      // Transaction has been rolled back
      // err is whatever rejected the promise chain returned to the transaction callback
        return res.json({
            status: 'fail',
            message: err
        });

    });

};


/**
 * @author NB
 * change company status
 */

exports.changeStatus = function(req, res, next) {

    var id = req.params.id || null;

    if (!id) {
        return res.json({
            status: "fail",
            message: 'Unknown thing'
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
        var company = {
            active: active
        };

        db.models.company.update(company, {
            where:{
                id:id,
            }
         }).then(function(updatedCompany){
            if(updatedCompany){
                res.json({
                    status:'success',
                    message:'Company has been updated successfully.'
                });
            }else {
                res.json({
                    status: 'fail',
                    message: 'Failed to update company' + req.params.id
                });
            }

         }).catch(function(err) {
            res.json({
                'status': 'fail',
                'message': 'Failed to update company' + req.params.id
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
 * @author: TK
 * @changed: GK
 * Proxy Login functionality of user
 */
exports.subuserdetails = function(req, res, next){
    var useremail = req.body.useremail;
    if(useremail != '' && useremail != undefined)
    {
        var userIn = true;
    }
    else
    {
        var userIn = false;
    }
    var parentcompid = req.body.parentcompid
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        return res.json({
            status: 'fail',
            data: null,
            message: 'Company information could not found',
        });
    }

    db.models.user
    .find({
        include: [{
                model: db.models.company
            }],        
        where: userIn ? {
                company_id: parentcompid,
                email: useremail,
                active: true
              } : {
                company_id: parentcompid,
                active: true
              }
    })
    .then(function(getuser)
    {
        if(getuser)
        {

            if(getuser.company.active==false) {

                return res.json({
                    status: 'fail',
                    data: null,
                    message: 'User company is not active. please contact administrator for activation',
                });

            } else {

                var id = getuser.dataValues.id;
                var tmp_pwdstring = Math.random().toString(36)+new Date().getTime();
                var tmp_hashedPassword = generalConfig.encryptPassword(tmp_pwdstring);
                var sendresponse = {tmpvar:tmp_pwdstring}
                db.models.user.update({tmp_password:tmp_hashedPassword}, {
                    where:{ id:id,}
                 }).then(function(updatedtmppwd){
                        if(updatedtmppwd){

                            return res.json({
                                status: 'success',
                                data: sendresponse,
                                message: 'Your request has been completed successfully.',
                            });


                        }else{

                            return res.json({
                                status: 'fail',
                                data: null,
                                message: 'Your request has not been completed successfully',
                            });  

                        }
                 }).catch(function(err) {
                    return res.json({
                        status: 'fail',
                        data: null,
                        message: 'Your request has not been completed successfully',
                    }); 
                });
            }
                
        }
        else
        {
            return res.json({
                status: 'fail',
                data: null,
                message: 'user account is not active. please contact customer for activation',
            });
        }
    }).catch(function(err) {
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });

}

exports.companyDetails = function(req, res, next){

    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        return res.json({
            status: 'fail',
            data: null,
            message: 'Company information could not found',
        });
        return false;
    }

     db.models.company.
            findOne({
                where: { id: userInfo.companyId }
            })
        .then(function(company)
        {
            if(company)
            {
                var data = {};

                if (company.parent_id != null) {
                    data.parent = true;
                    
                    db.models.company.
                    findOne({
                        attributes: ['name'],
                        where: { id: company.parent_id }
                    })
                    .then(function(parentcompany) {    

                        data.parentcompany = parentcompany;

                        res.json({                
                            status: 'success',
                            data: data,
                            message: 'Requested company record found'
                        });

                    }).catch(function(error) {
                        res.json({                
                            status: 'fail',
                            data: null,
                            message: 'Company information has not been updated successfully'
                        });
                    });

                } else {

                    data.parent = false;

                    res.json({                
                        status: 'success',
                        data: data,
                        message: 'Requested company record found'
                    });                    
                }            
            }
            else
            {
                res.json({                
                    status: 'fail',
                    data: null,
                    message: 'Requested company record could not found'
                });
            }
                
        }).catch(function(error) {
            res.json({                
                status: 'fail',
                data: null,
                message: 'Company information has not been updated successfully'
            });
        }); 
}

/**
 * @author: GK
 * Registered CPID
 */
exports.addcpidrecords = function(req, res, next){

    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        return res.json({
            status: 'fail',
            data: null,
            message: 'Company information could not found',
        });
    }

    var recordCount = 10; // Record Insert
    var cpidDataObj = [];

    for(var c = 1; parseInt(c) <= parseInt(recordCount); c++)
    {
        var cpid_string = commonLib.generateCPID(); // CPID
            cpidDataObj.push({cpid: cpid_string})

            // After Loop Finish
            if(parseInt(c) == parseInt(recordCount))
            {
                // Insert Record in main database
                master_db.models.unique_cpid.bulkCreate(cpidDataObj).then(function()
                {
                    //return db.models.unique_cpid.findAll();
                }).then(function(cpid_callback)
                {
                    return res.json({
                        status: 'success',
                        data: null,
                        message: 'CPID has been registered successfully'
                     });
                }).catch(function(err) {
                    return res.json({
                        status: 'fail',
                        data: err,
                        message: 'CPID has not been registered successfully, Duplicate CPID Generated, Please try again'
                     });
                });
            }
    }
};

/**
 * @author: HY
 * Get My Company list (child company list including self company in the list)
 */
exports.getMyCompanyList = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    var userCompanyId = userInfo.companyId;

    if (!userCompanyId) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }

    var searchParams = new Array();
    searchParams.push({
        id: {
            $like: userCompanyId
        }
    });
    searchParams.push({
        parent_id: {
            $like: userCompanyId
        }
    });

    var whereval = { $or: searchParams };

    db.models.company
    .findAll({
        attributes: ['id','name','parent_id'],
        where: whereval
    })
    .then(function(companylist) {
        if (companylist) {
            res.json({
                'status': 'success',
                'data': companylist,
                'message': 'Data loaded successfully.'
            });
        } else {
            res.json({
                'status': 'fail',
                'message': 'There was some problem loading data, please contact administrator.'
            });
        }
    })
    .catch(function(err) {
        res.json({
            'status': 'fail',
            'message': 'There was some problem loading data, please contact administrator.'
        });        
    });

};