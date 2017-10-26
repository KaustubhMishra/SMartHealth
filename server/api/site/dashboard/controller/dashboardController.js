'use strict';

//var db = require('../../../../config/cassandra');
var generalConfig = require('../../../../config/generalConfig');
//var cassandra = require('cassandra-driver');
var async = require('async');

var companyUses = require('../../../../lib/usage/usage');
/* Common function Lib */
var commonLib = require('../../../../lib/common');

var db = require('../../../../config/sequelize').db;
var sequelize = require("sequelize");


db.models.user.associate(db.models);
db.models.company_user_group.associate(db.models);

    
 /**
 * Get Rule list for Data Table
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for datatable response
 */
exports.getDevicesPosition = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }

    var companyId = userInfo.companyId;

    db.models.thing
    .findAll({
        attributes : ['id','serial_number','status','lat','lng','createdAt','updatedAt'],
        where: {
            active: true,
            company_id: companyId,
        },
    })
    .then(function(devices) {
        res.json({
            'status': 'success',
            'data': devices,
            'message': 'Data loaded successfully.'
        });
    })
    .catch(function(err) {
        res.json({
            'status': 'fail',
            'message': err,
        });
    });

};


 /**
 * Get Rule list for Data Table
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for datatable response
 */
exports.getData = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }

    var companyId = userInfo.companyId;

	var statistics = {};
    statistics.activeThings     = 0;
    statistics.users            = 0;
    statistics.rules            = 0;
    statistics.notifications    = 0;    

    async.series([
        function(callback){
		    getActiveThingsCount(companyId, function(result, err) {    	
		    		if(result) {
							statistics.activeThings = result;
							callback(null,null);
		    		} else {
		    			callback(err,null);
		    		}
		    });
        },
        function(callback){
		    getUsersCount(companyId, function(result, err) {    	
		    		if(result) {
							statistics.users = result;
							callback(null,null);
		    		} else {
		    			callback(err,null);
		    		}
		    });
        },
        function(callback){
		    getRulesCount(companyId, function(result, err) {    	
		    		if(result) {
							statistics.rules = result;
							callback(null,null);
		    		} else {
		    			callback(err,null);
		    		}
		    });
        },
        function(callback){
		    getNotificationsCount(companyId, function(result, err) {    	
		    		if(result) {
							statistics.notifications = result;
							callback(null,null);
		    		} else {
		    			callback(err,null);
		    		}
		    });
        },
    ],
    function(err, results) {
      if(err) {
		res.json({
	        'status': 'fail',
	        'message': err,
	    });

      } else {

	    res.json({
	        'status': 'success',
	        'statistics': statistics,
	        'message': 'Data loaded successfully.'
	    });

      }
    })

};


var getActiveThingsCount = function(companyId, callback) {
    db.models.thing
    .count({
        where: {
            active: true,
            company_id: companyId,
        },
    })
    .then(function(item) {
    		callback(item, null);
    })
    .catch(function(err) {
        callback(false, err);
    });
};

var getUsersCount = function(companyId, callback) {

    db.models.user
    .count({
        where: {
            company_id: companyId,
        },

        include: [{
            model: db.models.company_user_group,
            where: { id: { $ne: null } },
            include: [{
                model: db.models.company_group,
                attributes: ['name']
            }],            
        }],        
    })
    .then(function(item) {
    		callback(item, null);
    })
    .catch(function(err) {
        callback(false, err);
    });
};

var getRulesCount = function(companyId, callback) {
    db.models.rule
    .count({
        where: {
            company_id: companyId,
        },
    })
    .then(function(item) {
    		callback(item, null);
    })
    .catch(function(err) {
        callback(false, err);
    });
};

var getNotificationsCount = function(companyId, callback) {
    db.models.notification_log.associate(db.models);
    db.models.notification_log
    .count({
        include: [{
            model: db.models.rule,
            where: {
                company_id: companyId,
            },            
            required:true
        }],
    })
    .then(function(item) {
    	callback(item, null);
    })
    .catch(function(err) {
        callback(false, err);
    });
};


 /**
 * Get Api Log Detail
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for api log detail response
 */
exports.getApiLogDetail = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            'status': 'fail',
            'message': 'Unknown user.'
        });
    }

    var companyId       = userInfo.companyId;
    var startdatetime   = req.body.startdatetime
    var enddatetime     = req.body.enddatetime

    db.models.company.findOne({
        attributes: ['id', 'database_name'],
        where: {
            id: userInfo.companyId
        }
    }).then(function(company) {
        if (company) {

            var cdb = require('../../../../config/cassandra');
            cdb.client.connect(function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    var cqlquery = "SELECT toUnixTimestamp(apirequestdate) as apirequestdateunixtimestamp, apirequestdate, datasize FROM "+ company.database_name +".apiLog WHERE companyid="+companyId+" AND apirequestdate >= '"+startdatetime+"' AND apirequestdate <= '"+enddatetime+"' ALLOW FILTERING";
                    console.log(cqlquery);
                    cdb.client.execute(cqlquery, function (err, response) {
                        if (err) {
                            console.log(err);
                            res.json({
                                'status': 'fail',
                                'message': 'Problem in loading data.'
                            });
                        } else {
                            res.json({
                                'status': 'success',
                                'data': response.rows,
                                'message': 'Data loaded successfully.'
                            });
                        }
                    });
                }
            });

        } else {
            return res.json({
                status: "fail",
                data:null,
                message: "Company not found"
            });
        }

    }).catch(function(err) {
        console.log(err);
        return res.json({
            status: "fail",
            message: "Error in finding company detail",
            data: null
        });
    });

};

/**
 * @author HY
 * getDashboardInfo will get usage info and thing counts (used in webservice only)
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return {json}
 */
exports.getDashboardInfo = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);

    if (!userInfo.companyId) {
        res.json({
            status: 'fail',
            data:null,
            message: 'Unknown user.'
        });
    }

    var companyId = req.params.companyId;

    //get db name
    sequelizeDb.models.company.findOne({
        attributes: ['id', 'database_name'],
        where: {
            id: companyId
        }
    }).then(function(company) {
        if (company) {

            var countinfodata = {'thingcount': 0, 'connected': 0, 'inactive': 0, 'sensorcount': 0};

            sequelizeDb.models.thing.findAll({
                attributes : ["id","name","serial_number", "active", "status", [sequelizeDb.literal('(select count(*) from sensor where `sensor`.`thing_id` = `thing`.`id`)'), 'sensorcount']],
                where: {
                    company_id : companyId,
                    //active: true,
                },
            }).then(function(things) {
                if (things && things.length > 0) {

                    // getLastCommunication(company.database_name, things, function(result) {

                    //     if(result.status) {

                            // things = result.things;
                            countinfodata.thingcount = things.length

                            async.forEachSeries(things, function(thing, callback2) {                                             
                                // if(thing.getDataValue("is_connected")) {
                                 // Thing active and connected
                                if(thing.status == "2" && thing.active)
                                {
                                    countinfodata.connected++;
                                }
                                else if(thing.status == "3" && thing.active) // Thing active and not connected
                                {
                                    countinfodata.inactive++;
                                }
                                else // Thing not active and not connected
                                {
                                    countinfodata.inactive++;
                                }

                                callback2();
                            }, function() {

                                companyUses.getParentChildCompanyTotalRecord(companyId, function(result){

                                    if (result.status=="success") {

                                        var outputdata = { 'countinfo': countinfodata, 'usageinfo': result.data };

                                        return res.json({
                                            status: 'success',
                                            data: outputdata,
                                            message: 'Data loaded successfully.'
                                        });                                     

                                    } else {

                                        return res.json({
                                            status: 'fail',
                                            message: result.message,
                                            data:null
                                        });
                                        
                                    }
                                })                              
                                
                            });

                    //     } else {

                    //         return res.json({
                    //             status: 'fail',
                    //             message: result.message,
                    //             data:null
                    //         });
                    //     }

                    // });

                } else {

                    companyUses.getParentChildCompanyTotalRecord(companyId, function(result){

                        if (result.status=="success") {

                            var outputdata = { 'countinfo': countinfodata, 'usageinfo': result.data };
                            return res.json({
                                status: 'success',
                                data: outputdata,
                                message: 'Data loaded successfully.'
                            });                                     

                        } else {

                            return res.json({
                                status: 'fail',
                                message: result.message,
                                data:null
                            });
                            
                        }
                    })

                }
            }).catch(function(err) {
                res.json({
                    status: 'fail',
                    message: 'Failed to load things.',
                    data:null
                });
            });

        } else {
            return res.json({
                status: "fail",
                data:null,
                message: "Company not found"
            });
        }
    }).catch(function(err) {
        //
        return res.json({
            status: "fail",
            message: "Error in finding company detail",
            data: null
        });
    });

};

