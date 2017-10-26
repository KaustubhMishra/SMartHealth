'use strict';

var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");

exports.getCountryData = function(req, res, next) {
    db.models.country.findAll()
    .then(function(data){
        if(data) {
            res.json({
                status: true,
                data: data,
                message: 'Country data load successfully'
            }); 
        } else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load country data'
            }); 
        }
    })    
};


exports.getStateData = function(req, res, next) {
    db.models.state.findAll({
        attributes: ['id','name'],
        where:{
            country_id: req.body.id
        }
    })
    .then(function(data){
        if(data) {
            res.json({
                status: true,
                data: data,
                message: 'Country data load successfully'
            }); 
        } else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load country data'
            }); 
        }
    })
}


