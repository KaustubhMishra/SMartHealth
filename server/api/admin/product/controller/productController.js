'use strict';

var generalConfig = require('../../../../config/generalConfig');
var async = require('async');

var sequelizeConfig = require('../../../../config/sequelize');
var db = sequelizeConfig.db;
var master_db = sequelizeConfig.master_db;

var commonLib = require('../../../../lib/common');
var crypto = require('crypto');

/*
 * @author: Gunjan
 * Product Management
 * Get list of Product
 */
exports.getProductList = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else
    {
	    var sortBy = req.body.params.sortBy;
	    var sortOrder = req.body.params.sortOrder;
	    var pageNumber = req.body.params.pageNumber;
	    var pageSize = req.body.params.pageSize;
	    var searchWhere = '';

	    // Sorting
	    if(sortBy == 'name') { sortBy = 'name'; }
	    else if(sortBy == 'db_ip') { sortBy = 'db_ip'; }
        else if(sortBy == 'db_port') { sortBy = 'db_port'; }
	    else if(sortBy == 'db_name') { sortBy = 'db_name'; }
	    else if(sortBy == 'db_user') { sortBy = 'db_user'; }
        else if(sortBy == 'db_pass') { sortBy = 'db_pass'; }
	    else { sortBy = 'createdAt'; }

	    // Pagination
	    if(pageNumber == '') { pageNumber = pageNumber; } 
	    else { pageNumber = (pageNumber - parseInt(1)) * pageSize; }

	    // Condition
		if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "")
        {
            searchWhere += "where name like :searchTxt or db_ip like :searchTxt or db_name like :searchTxt or db_user like :searchTxt or db_pass like :searchTxt or db_port like :searchTxt";
	    }

	    // Query
	    master_db.query("select * from sw_products "+searchWhere+" ORDER BY "+sortBy+" "+sortOrder+" LIMIT :pageSize OFFSET :offset",
	        { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%', pageSize: pageSize, offset: pageNumber }, type: master_db.QueryTypes.SELECT }
	    ).then(function(product_response)
	    {
	    	if(product_response.length > 0) // Result Found
	        {
                // Get count for total query
                master_db.query("SELECT count(*) as totalCount FROM sw_products "+searchWhere,
                    { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%' }, type: master_db.QueryTypes.SELECT }
                ).then(function(product_count_response)
                {
                    var productAry = [];
                        productAry = {
                            count: product_count_response[0].totalCount,
                            rows: product_response
                        }
                    res.json({ 
                        status: 'success',
                        data: productAry,
                        message: 'Product records has been loaded successfully'
                    });

                }).catch(function(err) {
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Product record request has not been completed'
                    }); 
                });
	        }
	        else  // Result Not Found
	        {
	        	res.json({
	        			status: 'success',
	        			data: [],
	        			error: 'No Product records found'
	        		});
	        }
	    }).catch(function(err) {
	        res.json({
        		status: 'fail',
        		data: null,
        		message: 'Product record request has not been completed'
        	}); 
	    });
	}
};

/*
 * @author: Gunjan
 * Product Management
 * Add New Product
 */
exports.addNewProduct = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else
    {
        req.checkBody('productname', 'Product Name is required').notEmpty();
        req.checkBody('dbip', 'Database connection IP is required').notEmpty();
        req.checkBody('dbport', 'Connection Port is required').notEmpty();
        req.checkBody('dbname', 'Database Name is required').notEmpty();
        req.checkBody('dbusername', 'Database username is required').notEmpty();
        req.checkBody('dbpassword', 'Database password is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if(mappedErrors == false)
    {
            async.waterfall([
                // 1. Check unique product name
                function(callback_wf) {
                    master_db.models.sw_products.findAll({
                        attributes: ['id'],
                        where: {
                             name: req.body.productname
                        }
                    }).then(function(product_check) {
                        if(product_check.length == 0)
                        {
                            callback_wf(null);
                        }
                        else
                        {
                            callback_wf({
                              status: 'fail',
                              data: null,
                              message: 'Same product name already exist',
                            });
                        }
                    }).catch(function(err) {
                        callback_wf({
                          status: 'fail',
                          data: null,
                          message: 'Product has not been registered successfully'
                        });
                    });
                },
                // 2. Register product
                function(callback_wf) {
                    var productDataObj = [];
                    productDataObj = {
                             name: req.body.productname,
                             db_ip: req.body.dbip,
                             db_port: req.body.dbport,
                             db_name: req.body.dbname,
                             db_user: req.body.dbusername,
                             db_pass: req.body.dbpassword
                           };
                    master_db.models.sw_products.create(productDataObj).then(function(product) {
                            if(product)
                            {
                                callback_wf({
                                    status: 'success',
                                    data: null,
                                    message: 'Product has been registered successfully'
                                });
                            }
                            else
                            {
                                callback_wf({
                                    status: 'fail',
                                    data: null,
                                    message: 'Product has not been registered successfully'
                                });
                            }
                    }).catch(function(err) {
                            callback_wf({
                                status: 'fail',
                                data: null,
                                message: 'Product has not been registered successfully'
                             });
                    });       
                }
            ], function(response) {
                // Final Response
                  res.json(response);
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
}

/*
 * @author: Gunjan
 * Product Management
 * Get Product Information
 */
exports.getProductData = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    var req_product_id = req.params.id;
    
    if(!userInfo.id && !req_user_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else
    {
        // Load user information
        master_db.models.sw_products
            .findOne({
                attributes: ['id', 'name', 'db_ip', 'db_port', 'db_name','db_user', 'db_pass'],
                where: {
                    id: req_product_id
                }
            })
            .then(function(product) {
                
                    res.json({
                       status: 'success',
                       data: product,
                       message: 'Product Information has not been fetched succssfully',
                    });
                
            })
            .catch(function(err) {
                  res.json({
                      status: 'fail',
                      data: null,
                      message: 'Product Information has not been fetched succssfully',
                  });
            });
    }
}

/*
 * @author: Gunjan
 * Product Management
 * Update Product
 */
exports.updateProduct = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    var req_product_id = req.params.id;
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else if(!req_product_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'Product reference id has not been found'
        });
    }
    else
    {
        req.checkBody('productname', 'Product Name is required').notEmpty();
        req.checkBody('dbip', 'Database connection IP is required').notEmpty();
        req.checkBody('dbport', 'Connection Port is required').notEmpty();
        req.checkBody('dbname', 'Database Name is required').notEmpty();
        req.checkBody('dbusername', 'Database username is required').notEmpty();
        req.checkBody('dbpassword', 'Database password is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if(mappedErrors == false)
    {
            async.waterfall([
                // 1. Check unique product name
                function(callback_wf) {
                    master_db.models.sw_products.findAll({
                        attributes: ['id'],
                        where: {
                             name: req.body.productname,
                             id: {
                                $ne: req_product_id
                             }
                        }
                    }).then(function(product_check) {
                        if(product_check.length == 0)
                        {
                            callback_wf(null);
                        }
                        else
                        {
                            callback_wf({
                              status: 'fail',
                              data: null,
                              message: 'Same product name already exist',
                            });
                        }
                    }).catch(function(err) {
                        callback_wf({
                          status: 'fail',
                          data: null,
                          message: 'Product has not been updated successfully'
                        });
                    });
                },
                // 2. Register product
                function(callback_wf) {
                    var productDataObj = [];
                    productDataObj = {
                             name: req.body.productname,
                             db_ip: req.body.dbip,
                             db_port: req.body.dbport,
                             db_name: req.body.dbname,
                             db_user: req.body.dbusername,
                             db_pass: req.body.dbpassword
                           };
                    master_db.models.sw_products.update( productDataObj, {
                                where : { id: req_product_id }
                          }).then(function(product) {
                            if(product)
                            {
                                callback_wf({
                                    status: 'success',
                                    data: null,
                                    message: 'Product has been updated successfully'
                                });
                            }
                            else
                            {
                                callback_wf({
                                    status: 'fail',
                                    data: null,
                                    message: 'Product has not been updated successfully'
                                });
                            }
                    }).catch(function(err) {
                            callback_wf({
                                status: 'fail',
                                data: null,
                                message: 'Product has not been updated successfully'
                             });
                    });       
                }
            ], function(response) {
                // Final Response
                  res.json(response);
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
}

/*
 * @author: Gunjan
 * Product Management
 * Add New Product
 */
exports.getProductDataList = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else
    {
        master_db.models.sw_products.findAll().then(function(product_list) {
                if(product_list.length > 0)
                {
                    res.json({
                      status: 'success',
                      data: product_list,
                      message: 'Product information has been found successfully',
                    });
                }
                else
                {
                    res.json({
                      status: 'fail',
                      data: null,
                      message: 'Product information has not been found successfully',
                    });
                }
            }).catch(function(err) {
                res.json({
                  status: 'fail',
                  data: null,
                  message: 'Product information has not been found successfully'
                });
            });
    }
}