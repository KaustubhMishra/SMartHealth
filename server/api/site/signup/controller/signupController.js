'use strict';

var db = require('../../../../config/cassandra');
var generalConfig = require('../../../../config/generalConfig');
var cassandra = require('cassandra-driver');
var crypto = require('crypto');
var sequelizeDb = require('../../../../config/sequelize').db;
var commonLib = require('../../../../lib/common');

var base64 = require('base-64');
var utf8 = require('utf8');
var localStorage = require('localStorage');
var secretKey = settings.secretKey;
var jwt = require('jwt-simple');
var async = require('async');

/**
 * @author NB
 * signup() will create new company  and create unique keyspace according comany id
 * @param  {object}   req
 * @param  {object}   res
 * @param  {Function} next
 * @return {json} fail or success
 */
exports.signup = function(req, res, next) {

    commonLib.checkAuthentication(req.headers.authorization, function(result) {
        if(result.status === true){

            if (req.body != "") {
                req.checkBody('companyName', 'Name required').notEmpty();
                req.checkBody('email', 'E-Mail required').notEmpty();
                req.checkBody('password', 'Password required').notEmpty();
                req.checkBody('timezone', 'Timezone required').notEmpty();
                var mappedErrors = req.validationErrors(true);
            }
            if (mappedErrors == false) {
                sequelizeDb.models.user.find({
                    where: {
                        email: req.body.email
                    }
                }).then(function(findUser) {
                    if (findUser) {
                        return res.json({
                            status: 'fail',
                            data: null,
                            data: 'Email already exist !!'
                        });
                    } else {

                        var db = require('../../../../config/cassandra');
                        db.client.connect(function(err, result) {
                            if (err) {
                                console.log(err);
                                return res.json({
                                    status: 'fail',
                                    data: null,
                                    message: "Ooops!! there is something wrong with cassandra database connection."
                                });
                            }
                            else 
                            {

                                var companyId = cassandra.types.uuid();
                                var userId = cassandra.types.uuid();
                                var hashedPassword = generalConfig.encryptPassword(req.body.password);
                                var companyDbName = settings.DBPrefix + companyId.toString().replace(/-/g, '_');
                                
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
                                        name: req.body.companyName,
                                        database_name: companyDbName,
                                        cpid: cpid_string
                                    };

                                    var adminuser = {
                                        id: userId,
                                        company_id: companyId,
                                        email: req.body.email,
                                        password: hashedPassword,
                                        timezone:req.body.timezone,
                                        active: true
                                    };

                                    commonLib.setupNewCompany(company, adminuser, cpid_string, function(result) {

                                        if(result.status) {
                                            var sequelizeLib = require('../../../../lib/createsequelizedb/sequelizedb');
                                            var dbUser = Math.random().toString(36).slice(-12);
                                            var dbPassword = Math.random().toString(36).slice(-12);
                                            return sequelizeLib.createDatabse(companyDbName,dbUser,dbPassword, function(err,result){
                                                if(err){
                                                    return res.json(err);
                                                }

                                                return sequelizeDb.models.company.update({
                                                    database_name:companyDbName,
                                                    database_user:dbUser,
                                                    database_password:dbPassword
                                                }, {where:{id:companyId}}).then(function(done){
                                                    if(done == 1){
                                                        // return res.json({
                                                        //    status: 'success',
                                                        //    message:'Database has been created successfully.'
                                                        // });

                                                        // Table "sensorDataV3"
                                                        var table_core_name = 'sensorDataV3';
                                                        var tableName = companyDbName + '.'+table_core_name;

                                                        // Table "apiLog"
                                                        var api_log_table_core_name = 'apiLog';
                                                        var api_log_tableName = companyDbName + '.'+api_log_table_core_name;

                                                        async.waterfall([
                                                            // 1. Creat Database
                                                            function(callback_wf) {
                                                                
                                                                var createKeyspaceQuery = "CREATE KEYSPACE IF NOT EXISTS " + companyDbName + " WITH replication = {'class':'SimpleStrategy','replication_factor':'1'};";

                                                                db.client.execute(createKeyspaceQuery, function(keyspaceErr, keyspaceCreated) {
                                                                    if (keyspaceErr) {
                                                                        callback_wf({
                                                                            status: 'fail',
                                                                            data: null,
                                                                            message: 'Keyspace Creation Failed in Signup Process'
                                                                        });
                                                                    }
                                                                    else
                                                                    {
                                                                        callback_wf(null);
                                                                    }
                                                                })
                                                                
                                                            },
                                                            // 2. Create table - "sensorDataV3"
                                                            function(callback_wf) {
                                                                
                                                                var createTableQuery = "CREATE TABLE " + tableName + " (id UUID,companyId UUID,receivedDate timestamp, sensorReceivedDate timestamp,connectionString text,deviceId UUID,data text,PRIMARY KEY (deviceId,sensorReceivedDate)) WITH CLUSTERING ORDER BY (sensorReceivedDate DESC);";
                                                                db.client.execute(createTableQuery, function(tableErr, SuccessRes) {
                                                                        if (tableErr)
                                                                        {
                                                                            callback_wf({
                                                                                status: 'fail',
                                                                                data: null,
                                                                                message: 'Table Creation Failed in Signup Process'
                                                                            });
                                                                        }
                                                                        else
                                                                        {
                                                                            callback_wf(null);
                                                                        }
                                                                })
                                                            },
                                                            // 3. Create index for table "sensorDataV3"
                                                            function(callback_wf) {
                                                                
                                                                var alterTableQuery_1 = "create index index_"+table_core_name+"_companyId on "+tableName+"(companyId)";
                                                                
                                                                db.client.execute(alterTableQuery_1, function(tableErr_alter, SuccessRes_alter) {
                                                                    if (tableErr_alter)
                                                                    {
                                                                        console.log(tableErr_alter);
                                                                        callback_wf({
                                                                            status: 'fail',
                                                                            data: null,
                                                                            message: 'Table Alter Failed in Signup Process'
                                                                        });
                                                                    }
                                                                    else
                                                                    {
                                                                        callback_wf(null);
                                                                    }
                                                                })
                                                            },
                                                            // 4. Create second index for table "sensorDataV3"
                                                            function(callback_wf)
                                                            {
                                                                
                                                                var alterTableQuery_2 = "create index index_"+table_core_name+"_receivedDate on "+tableName+"(receivedDate)";
                                                                db.client.execute(alterTableQuery_2, function(tableErr_alter, SuccessRes_alter) {
                                                                    if (tableErr_alter)
                                                                    {
                                                                        console.log(tableErr_alter);
                                                                        callback_wf({
                                                                            status: 'fail',
                                                                            data: null,
                                                                            message: 'Table Alter Failed in Signup Process'
                                                                        });
                                                                    }
                                                                    else
                                                                    {
                                                                        callback_wf(null);
                                                                    }
                                                                })
                                                            },
                                                            // 5. Create table - "apiLog"
                                                            function(callback_wf)
                                                            {
                                                                
                                                                var createTableQuery_api_log = "CREATE TABLE " + api_log_tableName + " (userid UUID, apirequestdate timestamp, companyId UUID, datasize int, id UUID, url text, PRIMARY KEY (companyId, apirequestdate)) WITH CLUSTERING ORDER BY (apirequestdate DESC);";
                                                                db.client.execute(createTableQuery_api_log, function(tableErr, SuccessRes) {
                                                                    if (tableErr)
                                                                    {
                                                                        console.log(tableErr);
                                                                        callback_wf({
                                                                            status: 'fail',
                                                                            data: null,
                                                                            message: 'Table Creation Failed in Signup Process'
                                                                        });
                                                                    }
                                                                    else
                                                                    {
                                                                        callback_wf(null);
                                                                    }
                                                                })
                                                            }

                                                        ], function(err, success) {
                                                            if(err)
                                                            {
                                                                res.json(err)
                                                            }
                                                            else
                                                            {
                                                                /* mqtt Call functional */
                                                                generalConfig.company_mqttPublishMessage(companyId);
                                                                
                                                                res.json({
                                                                    status: 'success',
                                                                    data: null,
                                                                    message: 'Registration completed successfull.'
                                                                });
                                                            }
                                                        })
                                                    }
                                                    else
                                                    {
                                                        res.json({
                                                            status:'fail',
                                                            data: null,
                                                            message: "Something went wrong.Please try again."
                                                        });
                                                    }

                                                }).catch(function(err){
                                                    console.log(err);
                                                    res.json({
                                                        status:'fail',
                                                        data: null,
                                                        message: "Something went wrong.Please try again."
                                                    });
                                                });
                                            });



                                        } else {

                                            return res.json({
                                                status: 'fail',
                                                data: null,
                                                message: 'Registration Failed'
                                            });
                                        }

                                    });
                                  }
                              })
                            }
                        });

                    }
                }).catch(function(err) {

                    return res.json({
                        status: 'fail',
                        data: null,
                        message: 'Something went wrong. Please contact administrator.'
                    });
                });
            } else {
                res.json({
                    status: 'fail',
                    data: null,
                    message: mappedErrors
                });
            }
        }
        else
        {
            res.json({
                status: 'fail',
                data: null,
                message: result.message
            });
        }
    });
};

exports.checkForUserExist = function(req, res) {
    return sequelizeDb.models.user.find({
        where: {
            email: req.query.email
        }
    }).then(function(user) {
        if (user) {
            return res.json({
                status: 'success',
                data: 'true'
            });
        } else {
            return res.json({
                status: 'success',
                data: 'false'
            });
        }
    }).catch(function(err) {
        
        return res.json({
            status: 'fail',
            message: 'Something went wrong.Try again.'
        });
    });
};