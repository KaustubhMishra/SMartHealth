'use strict';

var db = require('../../../../config/cassandra');
var generalConfig = require('../../../../config/generalConfig');
var cassandra = require('cassandra-driver');

var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");

var async = require('async');

exports.postFeedback = function(req, res, next) {
	console.log("postFeedback Request come");
    console.log(req.body);
    var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
	    return res.json({
	        status: false,
	        message: 'Unknown user'
	    });
	}

	var feedbackData = {};

	feedbackData.category = req.body.category;
	feedbackData.description = req.body.description;

	db.models.feedback
	.create(feedbackData)
	.then(function(user) {
		res.json({
			status: true,
			message: "Feedback posted Successfully"
		})
	}).
	catch(function(err) {
		return res.json({
			'status': false,
			'message': 'Failed to post feedback'
		});
	});
};

exports.getFeedback = function(req, res, next) {
	console.log("getFeedback Request come");
    var userInfo = generalConfig.getUserInfo(req);
	if (!userInfo.companyId) {
	    return res.json({
	        status: false,
	        message: 'Unknown user'
	    });
	}
	db.models.feedback.findAll()
	.then(function(feedback) {
		if(feedback)
		{
			res.json({
				status: true,
				data: feedback,
				message: 'Data load Successfully'
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


