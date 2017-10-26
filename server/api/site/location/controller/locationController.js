'use strict';
var db = require('../../../../config/cassandra');
var generalConfig = require('../../../../config/generalConfig');
var cassandra = require('cassandra-driver');

/**
 * updateSite will add new site
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.addSite = function(req, res, next) {
    if (req.body != "") {
        req.checkBody('name', 'Name required').notEmpty();
        req.checkBody('status', 'Status required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }
    if (mappedErrors == false) {
        var status = req.body.status == 1 ? true : false;
        var query = 'INSERT INTO site (id, name, description, companyid, active, createdby, createddate, updatedby, updateddate,deleted)' + 'VALUES(uuid(), ?, ?, ?, ?, ?, toUnixTimestamp(now()), ?, toUnixTimestamp(now()), false);';

        //Get userinfo from request
        var userInfo = generalConfig.getUserInfo(req);
        var companyId = userInfo.companyId;
        var createdby = userInfo.id;
        var updatedby = userInfo.id;

        db.client.execute(query, [req.body.name, req.body.description, companyId, status, createdby, updatedby], {
            prepare: true
        }, function(err, response) {
            if (err) {
                return res.json({
                    status: "fail"
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
 * updateSite will update site detail
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.updateSite = function(req, res, next) {
    var id = req.params.id || null;
    if (!id) {
        return res.json({
            status: "fail",
            message: 'Unknown site'
        });
    }
    if (req.body != "") {
        req.checkBody('name', 'Name required').notEmpty();
        req.checkBody('status', 'Status required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {
        var status = req.body.status == 1 ? true : false;
        var site = req.body;
        var query = 'update site  set name = ?, description =?, active = ?, updatedby = ?, updateddate = toUnixTimestamp(now()) where id =' + id + ';';
        
        //Get userinfo from request
        var userInfo = generalConfig.getUserInfo(req);
        var updatedby = userInfo.id;

        db.client.execute(query, [req.body.name, req.body.description, status, updatedby], {
            prepare: true
        }, function(err, response) {
            if (err) {
                return res.json({
                    status: "fail"
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
 * changeSiteStatus() will change site status
 * @param  {obj}   req 
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.changeSiteStatus = function(req, res, next) {
    var id = req.params.id || null;

    if (!id) {
        res.json({
            status: "fail",
            message: 'Unknown site'
        });
    }

    if (req.body != "") {
        req.checkBody('status', 'Status required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false) {
        var status = req.body.status == 1 ? true : false;

        //Get userinfo from request
        var userInfo = generalConfig.getUserInfo(req);
        if (!userInfo.companyId) {
            return res.json({
                status: "fail",
                message: 'Unknown user'
            });
        }

        var query = "Update site set active = ? where id = ?;";

        db.client.execute(query, [status, id], {
            prepare: true
        }, function(err, result) {
            if (err) {
                return res.json({
                    status: "fail"
                });
            }

            res.json({
                status: "success"
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
 * getSiteById will find site by id
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json of site detail
 */
exports.getSiteById = function(req, res, next) {
    var id = req.params.id;

    if (!id) {
        return res.json({
            status: "fail",
            message: 'Unknown site'
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

    var query = 'select * from site WHERE id = ?;';

    db.client.execute(query, [id], {
        prepare: true
    }, function(err, data) {
        if (!data) {
            return res.json({
                status: "fail",
                message: 'Failed to load site ' + id
            });
        }

        res.json(data.rows[0]);
    });
};

/**
 * deleteSite() will delete site
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return json for fail or success notification
 */
exports.deleteSite = function(req, res, next) {
    var id = req.params.id;

    if (!id) {
        return res.json({
            status: "fail",
            message: 'Unknown site'
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

    var query = 'delete from site where id = ?;';

    db.client.execute(query, [id], {
        prepare: true
    }, function(err, data) {
        if (err) {
            return res.json({
                status: 'fail',
                message:err
            });
        }

        res.json({
            status: 'success'
        });
    });
}

/**
 * @author NB
 * getSites() will load sites in company
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return  json of site list
 */
exports.getSites = function(req, res, next) {

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

    var query = 'select * from site where companyid=? allow filtering;';
    var pageState = req.params.pageState != 'first' ? req.params.pageState : 0;
    var data = [];
    db.client.eachRow(query, [userInfo.companyId], {
        pageState: pageState,
        prepare: true,
        fetchSize: generalConfig.fetchSize
    }, function(n, row) {
        data.push(row);
    }, function(err, result) {
        if(err){
            return res.json({
                status: 'fail'
            });
        }
        pageState = result.pageState;
        getThingCounts(data, 0);
    });

    /** 
     * Getting associated thing with each site
     */
    var getThingCounts = function(rows, index) {
        if (rows.length <= index) {
            res.json({                    
                    status:'success',
                    data: rows,
                    pageState: pageState
                });
            
        } else {
            var query = "select count(*) as cnt from things where siteid = " + rows[index].id + " allow filtering;";

            db.client.execute(query, function(err, data) {
                if(data){
                    rows[index].count = data.rows[0].cnt;
                    getThingCounts(rows, ++index);                    
                }
            });
        }
    };
};

/**
 * @author NB
 * getThingsInSite() will return things list on site
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return  json of thing list on site
 */
exports.getThingsInSite = function(req, res, next) {
    var siteId = req.params.id;

    if (!siteId) {
        return res.json({
            status: 'fail',
            message: 'Unknown site'
        });
    }

    var query = 'select * from things where siteid = ' + siteId + ' allow filtering;';

    db.client.execute(query, function(err, data) {
        if (err) {
            return res.json({
                status: 'fail'
            });
        }

        res.json({
            status: 'success'
        });
    });
};

/**
 * @author NB
 * getSiteList() will gives site list company wise
 * @param  {obj}   req
 * @param  {obj}   res
 * @param  {Function} next
 * @return  json of site list
 */
exports.getSiteList = function(req, res, next) {

    //Get userinfo from request
    var userInfo = generalConfig.getUserInfo(req);
    var companyId = userInfo.companyId;

    if (!companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

    var query = 'select id,name from site where active=true and companyid =? allow filtering;';

    db.client.execute(query, [companyId], {
        prepare: true
    }, function(err, data) {
        if (err) {
            return res.json({
                status: 'fail'
            });
        }

        if (data) {
            res.json(data.rows);
        } else {
            res.json([]);
        }
    });
};