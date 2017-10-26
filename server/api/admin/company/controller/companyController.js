'use strict';

var generalConfig = require('../../../../config/generalConfig');
var async = require('async');

var sequelizeConfig = require('../../../../config/sequelize');
var db = sequelizeConfig.db;
var master_db = sequelizeConfig.master_db;

var commonLib = require('../../../../lib/common');
var crypto = require('crypto');

// Compnay Usage Lib
var company_usage = require('../../../../lib/usage/usage');


/*
 * @author: Gunjan
 * Company Management
 * Get list of Company
 */
exports.getCompanyList = function(req, res, next) {

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
	    else if(sortBy == 'cpid') { sortBy = 'cpid'; }
	    else if(sortBy == 'totalEmployeeCount') { sortBy = 'totalEmployeeCount'; }
	    else if(sortBy == 'totalSubCompanies') { sortBy = 'totalSubCompanies'; }
	    else { sortBy = 'createdAt'; }

	    // Pagination
	    if(pageNumber == '') { pageNumber = pageNumber; } 
	    else { pageNumber = (pageNumber - parseInt(1)) * pageSize; }

	    // Condition
		if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "")
        {
            searchWhere += "where totalSubCompanies like :searchTxt or totalEmployeeCount like :searchTxt or name like :searchTxt or cpid like :searchTxt";
	    }

        // Get record 
        var main_innner_query = 'SELECT parent_company.id, parent_company.name, parent_company.cpid,  parent_company.createdAt, parent_company.active, (select count(*) from company as chcom where chcom.parent_id=parent_company.id) as totalSubCompanies, count(user.id) as totalEmployeeCount FROM company parent_company LEFT JOIN user ON user.company_id=parent_company.id WHERE parent_company.parent_id is null group by parent_company.id, parent_company.name, parent_company.cpid, parent_company.createdAt, parent_company.active';

	    // Query
	    db.query("SELECT id, name, cpid, createdAt, active, totalSubCompanies, totalEmployeeCount FROM ("+main_innner_query+") as x "+searchWhere+" ORDER BY "+sortBy+" "+sortOrder+" LIMIT :pageSize OFFSET :offset",
	        { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%', pageSize: pageSize, offset: pageNumber }, type: db.QueryTypes.SELECT }
	    ).then(function(company_response)
	    {
	    	if(company_response.length > 0) // Result Found
	        {
                // Get count for total query
                db.query("SELECT count(*) as totalCount FROM ("+main_innner_query+") as x "+searchWhere,
                    { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%' }, type: db.QueryTypes.SELECT }
                ).then(function(company_count_response)
                {
                    var companyAry = [];
                        companyAry = {
                            count: company_count_response[0].totalCount,
                            rows: company_response
                        }
                    res.json({ 
                        status: 'success',
                        data: companyAry,
                        message: 'Company records has been loaded successfully'
                    });

                }).catch(function(err) {
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Company record request has not been completed'
                    }); 
                });
	        }
	        else  // Result Not Found
	        {
	        	res.json({
	        			status: 'success',
	        			data: [],
	        			error: 'No company records found'
	        		});
	        }
	    }).catch(function(err) {
	        res.json({
        		status: 'fail',
        		data: null,
        		message: 'Company record request has not been completed'
        	}); 
	    });
	}
};

/*
 * @author: Gunjan
 * Company Management
 * Get list of Sub-Company based on parent company
 */
exports.getSubCompanyList = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    var parent_company_id = req.params.parentcompanyid;
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else if(!parent_company_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'Parent company has not been found, Please click to back button'
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
        else if(sortBy == 'cpid') { sortBy = 'cpid'; }
        else if(sortBy == 'totalEmployeeCount') { sortBy = 'totalEmployeeCount'; }
        else { sortBy = 'createdAt'; }

        // Pagination
        if(pageNumber == '') { pageNumber = pageNumber; } 
        else { pageNumber = (pageNumber - parseInt(1)) * pageSize; }

        // Condition
        if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "") {
            searchWhere += "where totalEmployeeCount like :searchTxt or name like :searchTxt or cpid like :searchTxt"
        }

        // Main Query
            var main_innner_query = 'select child_companies.id, child_companies.name, child_companies.cpid, child_companies.active, child_companies.createdAt, count(user.id) as totalEmployeeCount from company child_companies left join user on user.company_id = child_companies.id where child_companies.parent_id = :parent_company_id group by child_companies.id, child_companies.name, child_companies.cpid, child_companies.active, child_companies.createdAt'

        // Query
        db.query("select id, name, cpid, active, createdAt, totalEmployeeCount from ("+main_innner_query+") as x "+searchWhere+" ORDER BY "+sortBy+" "+sortOrder+" LIMIT :pageSize OFFSET :offset",
            { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%', pageSize: pageSize, offset: pageNumber, parent_company_id: parent_company_id }, type: db.QueryTypes.SELECT }
        ).then(function(company_response)
        {
            if(company_response.length > 0) // Result Found
            {
                // Get count for total rows
                db.query("select count(*) as totalCount from ("+main_innner_query+") as x "+searchWhere,
                    { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%', parent_company_id: parent_company_id }, type: db.QueryTypes.SELECT }
                ).then(function(company_count_response)
                {
                    var companyAry = [];
                        companyAry = {
                            count: company_count_response[0].totalCount,
                            rows: company_response
                        }
                    res.json({ 
                        status: 'success',
                        data: companyAry,
                        message: 'Company records has been loaded successfully'
                    });
                }).catch(function(err) {
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Company record request has not been completed'
                    }); 
                });
            }
            else  // Result Not Found
            {
                res.json({
                        status: 'success',
                        data: [],
                        error: 'No company records found'
                    });
            }
        }).catch(function(err) {
            res.json({
                status: 'fail',
                data: null,
                message: 'Company record request has not been completed'
            }); 
        });
    }
};

/*
 * @author: Gunjan
 * Company Management
 * Get company basic information
 */
exports.getCompanyBasicInfo = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    var get_company_id = req.params.id;
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else if(!get_company_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'Compnay Id has not been found'
        });
    }
    else
    {
    	// Get Company Information
    	db.query("select company_1.*, company_2.name as parent_company_name from company as company_1 left join company as company_2 on company_2.id = company_1.parent_id where company_1.id = :company_id",
        	{ replacements: { company_id: get_company_id }, type: db.QueryTypes.SELECT }
	    ).then(function(company_data_response)
	    {
	      if(company_data_response.length > 0) // Data Found
	      {
	      		res.json({
	      			status: 'success',
	      			data: company_data_response[0],
	      			message: 'Company information has been found'
	      		})
	      }
	      else
	      {
	      		res.json({
	      			status: 'fail',
	      			data: null,
	      			message: 'Company information has not been found'
	      		})
	      }
	    }).catch(function(err) {
	        res.json({
        		status: 'fail',
        		data: null,
        		message: 'Company information has not been found'
        	}); 
	    });
   	}
};


/*
 * @author: Gunjan
 * Company Management
 * Update company basic information
 */
exports.updateCompanyBasicInfo = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    var get_company_id = req.params.id;
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else if(!get_company_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'Compnay Id has not been found'
        });
    }
    else
    {
        req.checkBody('name', 'Name is required').notEmpty();
		req.checkBody('address1', 'Address first is required').notEmpty();
		req.checkBody('country', 'Country is required').notEmpty();
		req.checkBody('state', 'State is required').notEmpty();
		req.checkBody('city', 'City is required').notEmpty();
		req.checkBody('phone', 'Phone number is required').notEmpty();
        req.checkBody('phonecodeCom', 'Phone Code is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
   	}

   	if(mappedErrors == false)
    {
    	// Check Company Name Status    
        commonLib.checkCompanyExistStatus(req.body.name, get_company_id, function(company_callback){
            if(company_callback.status == 'success')
            {
                if(company_callback.data)
                {
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Same Company name already exist'
                    });
                }
                else
                {
                    // Check company registred or not
                    db.models.company.
                        findOne({
                            where: { id: get_company_id }
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

                            // Update Company Information
                            company.update(compObj).then(function(updateCompany_callback)
                            {
                                    res.json({
                                        status: 'success',
                                        data: null,
                                        message: "Company information has been updated successfully"
                                    });
                            }).catch(function(err) {
                                    res.json({ 
                                        status: 'fail',
                                        data: null,
                                        message: 'Company information has not been updated successfully'
                                    });
                            });
                        }
                        else
                        {
                            res.json({                
                                status: 'fail',
                                data: null,
                                message: 'Requested company record has not been found'
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

/*
 * @author: Gunjan
 * Company Management
 * Update company basic information
 */
exports.getCompanyUsage = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    var get_company_id = req.params.id;
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else if(!get_company_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'Compnay Id has not been found'
        });
    }
    else
    {
        // Get company Usage count data
        company_usage.getParentChildCompanyTotalRecord(get_company_id, function(usage_callback){
                res.json(usage_callback);
        })
    }
}

/*
 * @author: Gunjan
 * Company Management
 * Get company Statstics information
 */
exports.getCompanyStatistics = function(req, res, next) {
    var userInfo = generalConfig.getUserInfo(req);
    var get_company_id = req.params.id;
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else if(!get_company_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'Compnay Id has not been found'
        });
    }
    else
    {
        async.parallel({
            // Get Thing Count
            thing: function(callback_par) {
                
                db.query("select count(*) as count from thing where active = true and company_id = :company_id",
                    { replacements: { company_id: get_company_id }, type: db.QueryTypes.SELECT }
                ).then(function(thing_count_response)
                {
                    callback_par(null, thing_count_response[0].count);

                }).catch(function(err) {
                    callback_par(err);
                     
                });

            },
            // Get Rule Count
            rule: function(callback_par) {
                 db.query("select count(*) as count from rule where company_id = :company_id",
                    { replacements: { company_id: get_company_id }, type: db.QueryTypes.SELECT }
                ).then(function(rule_count_response)
                {
                    callback_par(null, rule_count_response[0].count);

                }).catch(function(err) {
                    callback_par(err);
                });
            },
            // Get Command Count
            command: function(callback_par) {
                 db.query("select count(*) as count from company_command where company_id = :company_id",
                    { replacements: { company_id: get_company_id }, type: db.QueryTypes.SELECT }
                ).then(function(command_count_response)
                {
                    callback_par(null, command_count_response[0].count);

                }).catch(function(err) {
                    callback_par(err);
                });
            },
            // Get Group Count
            group: function(callback_par) {
                 db.query("select count(*) as count from device_group where company_id = :company_id",
                    { replacements: { company_id: get_company_id }, type: db.QueryTypes.SELECT }
                ).then(function(group_count_response)
                {
                    callback_par(null, group_count_response[0].count);

                }).catch(function(err) {
                    callback_par(err);
                });
            },
            // Get Template Count
            template: function(callback_par) {
                 db.query("select count(*) as count from template where company_id = :company_id",
                    { replacements: { company_id: get_company_id }, type: db.QueryTypes.SELECT }
                ).then(function(template_count_response)
                {
                    callback_par(null, template_count_response[0].count);

                }).catch(function(err) {
                    callback_par(err);
                });
            },
            // Get Android App Status Count
            android_app: function(callback_par) {
                 db.query("select IF(android_aws_app_data IS NULL, FALSE, TRUE) AS android_status from setting where company_id = :company_id",
                    { replacements: { company_id: get_company_id }, type: db.QueryTypes.SELECT }
                ).then(function(android_status_response)
                {
                    callback_par(null, android_status_response[0].android_status);

                }).catch(function(err) {
                    callback_par(err);
                });
            },
            // Get IOS App Status Count
            ios_app: function(callback_par) {
                 db.query("select IF(ios_aws_app_data IS NULL, FALSE, TRUE) AS ios_status from setting where company_id = :company_id",
                    { replacements: { company_id: get_company_id }, type: db.QueryTypes.SELECT }
                ).then(function(ios_status_response)
                {
                    callback_par(null, ios_status_response[0].ios_status);

                }).catch(function(err) {
                    callback_par(err);
                });
            }
        }, function(err, results) {
                if(err)
                {
                    res.json({
                        status: 'fail',
                        data: null,
                        message: 'Company statistics has not loaded successfully'
                    });
                }
                else
                {
                   res.json({
                        status: 'success',
                        data: results,
                        message: 'Company statistics has loaded successfully'
                    });
                }
        });
    }
}

/*
 * @author: Gunjan
 * Company Management
 * Company Proxy Login
 * Select admin User and update Temporary password
 */
exports.companyProxyLogin = function(req, res, next) {
    
    var userInfo = generalConfig.getUserInfo(req);
    var get_company_id = req.params.id;
    if(!userInfo.id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else if(!get_company_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'Compnay Id has not been found'
        });
    }
    else
    {
        db.query("select company_group.id as group_id, company_group.name as group_name, user.id as user_id, user.email as user_email from company_group as company_group left join company_user_group as company_user_group on company_user_group.company_group_id = company_group.id left join user as user on user.id = company_user_group.user_id where company_group.company_id = :company_id and company_group.name = 'Admin' and user.active = true limit 1",
            { replacements: { company_id: get_company_id }, type: db.QueryTypes.SELECT }
        ).then(function(userData_response)
        {
            if(userData_response.length > 0) // Data Found
            {
                var user_id = userData_response[0].user_id; // User Id

                 proxyLoginUpdateTempPassword(user_id, function(proxy_response){
                    if(proxy_response.status == 'success')
                    {
                        var send_response_data = { tmpvar: proxy_response.data, user_email: userData_response[0].user_email }

                        res.json({
                            status: 'success',
                            data: send_response_data,
                            message: 'Request for company proxy login has been completed'
                        });
                    }
                    else
                    {
                        res.json({
                            status: 'success',
                            data: null,
                            message: 'Request for company proxy login has not been completed'
                        });
                    }
                 })
            }
            else
            {
                res.json({
                    status: 'fail',
                    data: null,
                    message: 'Admin User is not active of this company'
                });
            }
        }).catch(function(err) {
            res.json({
                status: 'fail',
                data: null,
                message: 'Request for company proxy login has not been completed'
            });
        });
    }
}

/*
 * @author: Gunjan
 * Company Management
 * Company Proxy Login
 * Update Temporary password for Proxy Login
 */
var proxyLoginUpdateTempPassword = function proxyLoginUpdateTempPassword(user_id, callback)
{
    var tmp_pwd_string = Math.random().toString(36)+new Date().getTime();
    var tmp_hashed_password = generalConfig.encryptPassword(tmp_pwd_string);

    // Update user Temporary password
    db.models.user.update( { tmp_password: tmp_hashed_password }, {
        where:{ id: user_id,}
     }).then(function(updated_tmp_pwd_response)
     {
            if(updated_tmp_pwd_response)
            {
                callback({
                    status: 'success',
                    data: tmp_pwd_string,
                    message: 'Temporary passwrod has been set successfully',
                });
            }
            else
            {
                callback({
                    status: 'fail',
                    data: null,
                    message: 'Temporary passwrod has not been set successfully',
                });  
            }
     }).catch(function(err) {
        callback({
            status: 'fail',
            data: null,
            message: 'Temporary passwrod has not been set successfully',
        }); 
    });
}

/*
 * @author: Gunjan
 * Company Management
 * Get Common list of Company
 */
exports.getCommonCompanyList = function (req, res, next) {

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
        if(sortBy == 'sw_product') { sortBy = 'sw_product.name'; }
        else if(sortBy == 'company_id') { sortBy = 'company.company_id'; }
        else if(sortBy == 'cpid') { sortBy = 'company.cpid'; }
        else if(sortBy == 'database_name') { sortBy = 'company.database_name'; }
        else { sortBy = 'company.createdAt'; }

        // Pagination
        if(pageNumber == '') { pageNumber = pageNumber; } 
        else { pageNumber = (pageNumber - parseInt(1)) * pageSize; }

        // Condition
        if (req.body.SearchParams && req.body.SearchParams.searchTxt != undefined && req.body.SearchParams.searchTxt != "")
        {
            searchWhere += "where sw_products.name like :searchTxt or company.company_id like :searchTxt or company.cpid like :searchTxt or company.database_name like :searchTxt";
        }

        // Query
        master_db.query("select *, company.id as common_company_record_id from company left join sw_products on sw_products.id = company.sw_product_id "+searchWhere+" ORDER BY "+sortBy+" "+sortOrder+" LIMIT :pageSize OFFSET :offset",
            { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%', pageSize: pageSize, offset: pageNumber }, type: master_db.QueryTypes.SELECT }
        ).then(function(company_response)
        {
            if(company_response.length > 0) // Result Found
            {
                // Get count for total query
                master_db.query("select count(*) as totalCount from company left join sw_products on sw_products.id = company.sw_product_id "+searchWhere,
                    { replacements: { searchTxt: '%'+req.body.SearchParams.searchTxt+'%' }, type: master_db.QueryTypes.SELECT }
                ).then(function(company_count_response)
                {
                    var companyAry = [];
                        companyAry = {
                            count: company_count_response[0].totalCount,
                            rows: company_response
                        }

                    res.json({ 
                        status: 'success',
                        data: companyAry,
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
 * Company Management
 * Delete Common Comapny Record
 */
exports.deleteCommonCompanyData = function(req, res, next) {

    //get user info from request
    var userInfo = generalConfig.getUserInfo(req);
    var req_company_id = req.params.id;
    
    if(!userInfo.id && !req_company_id)
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'User information has not been found'
        });
    }
    else
    {
        master_db.models.company.destroy({ 
            where: { id: req_company_id } 
        }).then(function(delete_company_response) {
            if(delete_company_response)
            {
                res.json({
                    status: 'success',
                    data: null,
                    message: 'Company record has been deleted successfully'
                });
            }
            else
            {
                res.json({
                    status: 'fail',
                    data: null,
                    message: 'Company record has not been deleted successfully'
                });
            }
        }).catch(function(err) {
                res.json({
                    status: 'fail',
                    data: null,
                    message: 'Company record has not been deleted successfully'
                });
        });
    }
}

/*
 * @author: Gunjan
 * Company Management
 * Add New Company
 */
exports.addNewCommonCompany = function(req, res, next) {

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
        req.checkBody('companyid', 'Company ID is required').notEmpty();
        req.checkBody('cpid', 'Company CPID is required').notEmpty();
        req.checkBody('product_id', 'Product Id is required').notEmpty();
        req.checkBody('dbname', 'Database username is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if(mappedErrors == false)
    {
            async.waterfall([
                // 1. Check unique product name
                function(callback_wf) {
                    master_db.models.company.findAll({
                        attributes: ['id'],
                        where: {
                             $or: [ { cpid: req.body.cpid }, { company_id: req.body.companyid } ],
                        }
                    }).then(function(company_check) {
                        if(company_check.length == 0)
                        {
                            callback_wf(null);
                        }
                        else
                        {
                            callback_wf({
                              status: 'fail',
                              data: null,
                              message: 'Same Company id or CPID already registered',
                            });
                        }
                    }).catch(function(err) {
                        callback_wf({
                          status: 'fail',
                          data: null,
                          message: 'Company has not been registered successfully'
                        });
                    });
                },
                // 2. Register Company
                function(callback_wf) {
                    var companyDataObj = [];
                    companyDataObj = {
                             company_id: req.body.companyid,
                             cpid: req.body.cpid,
                             sw_product_id: req.body.product_id,
                             database_name: req.body.dbname,
                           };
                    master_db.models.company.create(companyDataObj).then(function(company) {
                            if(company)
                            {
                                callback_wf({
                                    status: 'success',
                                    data: null,
                                    message: 'Company has been registered successfully'
                                });
                            }
                            else
                            {
                                callback_wf({
                                    status: 'fail',
                                    data: null,
                                    message: 'Company has not been registered successfully'
                                });
                            }
                    }).catch(function(err) {
                            callback_wf({
                                status: 'fail',
                                data: null,
                                message: 'Company has not been registered successfully'
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