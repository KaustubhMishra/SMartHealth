'use strict';

var generalConfig = require('../../../../config/generalConfig');
var async = require('async');

var db = require('../../../../config/sequelize').db;

var commonLib = require('../../../../lib/common');

/*
 * @author: Gunjan
 * Get Dashboard Data
 */
exports.getDashboardData = function(req, res, next) {

    console.log(' Dashboard Data ')
    res.json({
        status: 'success',
        data: null,
        message: 'Dashboard data has been loaded successfully'
    })

};
