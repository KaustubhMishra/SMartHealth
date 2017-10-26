
var db = require('../config/sequelize').db;
var DataTypes = require("sequelize");
var generalConfig = require('../config/generalConfig');
var async = require('async');
var nodecron = require('node-cron');
var fs = require('fs-extra');

// AWS Lib
var awsSubscriber = require('./aws/subscriber');
var awsCustomLib = require('./aws/awsiotconnect');

// Company Usage Count
var company_usage = require('./usage/usage');

// Notification Log Update
var notification_log = require('./notification_log/notification_log');

var commonLib = require('./common');

//  notification controller
var notificationController = require('./../api/site/notification/controller/notificationController');
/*
 Reference : https://www.npmjs.com/package/node-cron

# ┌────────────── second (optional)
# │ ┌──────────── minute
# │ │ ┌────────── hour
# │ │ │ ┌──────── day of month
# │ │ │ │ ┌────── month
# │ │ │ │ │ ┌──── day of week
# │ │ │ │ │ │
# │ │ │ │ │ │
# * * * * * *
*/


/* 
  * Run cron for Autoprocess of AWS notification
  * Cron run Every : 5 min
  1. Get SubscriptionArn of subscribe user from AWS and update database record.
  2. Remove unsubscribe record from database.
  3. Remove dalete rule's subscribe record from databse.
*/

// nodecron.schedule('*/5 * * * *', function(){
  
//   //console.log('####### AWS Cron Process Start');

//   var date = new Date();
//   var current_hour = date.getHours();
//   var current_minute = date.getMinutes();
//   var current_second = date.getSeconds();
//   //console.log('Data:'+date+', Time :'+current_hour+'-'+current_minute+'-'+current_second);

//   async.series([
//   		  // 1. Get AWS ARN of Email Subscription
// 	      function(callbackCron){
// 	      		awsCustomLib.awsGetEmailSubscriptionArn(function(callback){
// 					     //console.log('####### Get AWS ARN of Email Subscription: Finish');
// 					     callbackCron(null, null);
// 				    });
// 	      },
// 	      // 2. Get remove deleted status active(2) subscription record
// 	      function(callbackCron){
// 	      		awsCustomLib.awsRemovePendingSubscribeRecord(function(callback){
// 					     //console.log('####### Remove and unbsubscribe email subscription of pending delete status record: Finish');
// 					     callbackCron(null, null);
// 				    });
// 	      },
// 	      // 3. Deleted rule's subscription record remove process 
// 	      function(callbackCron){
// 	      		awsCustomLib.awsRemoveDeletedRulePendingSubscribeRecord(function(callback){
// 					     //console.log('####### Rule deleted subscription record remove: Finish');
// 					     callbackCron(null, null);
// 				    });
// 	      }
//   	],
//     /* All process Finish */
//   	function(err, results){
//   		//console.log('####### AWS Cron Process Complete');
//   	})
// });


/* 
  * Run cron add/update company & child company usage cound
  * Cron run Every : 3 Min
  1. Add/update company usage on database
*/
/*nodecron.schedule('*\/3 * * * *', function(){

  //console.log('####### Company Usage Process Cron - Start #######');

  var date = new Date();
  var current_hour = date.getHours();
  var current_minute = date.getMinutes();
  var current_second = date.getSeconds();
  //console.log('Data:'+date+', Time :'+current_hour+'-'+current_minute+'-'+current_second);

  async.series([
  	
      // 1. All Company Usage Count add/update
  		function(callbackCron)
      {
	    	company_usage.updateAllcompanyData(function(callback){
				    //console.log('####### All Company Usage Count add/update : Finish');
				    //console.log(callback);
  					callbackCron(null, null);
				});
	    }

	],
    /* All process Finish *
  	function(err, results){
  		//console.log('####### Company Usage Process Cron : Complete');
  	})
});*/

/* 
  * Run cron update Notification Log details
  * Cron run Every : 10 Min
  1. Update Notification log details - Sensor Id

nodecron.schedule('*\/10 * * * *', function(){

  //console.log('####### Notification Log Update Process Cron - Start #######');

  var date = new Date();
  var current_hour = date.getHours();
  var current_minute = date.getMinutes();
  var current_second = date.getSeconds();
  //console.log( 'Notification Log : Data:'+date );

  async.series([
    
      // 1. All Notification Update
      function(callbackCron)
      {
        notification_log.all_notification_update(function(callback){
            //console.log('####### 1. All Notification Update : Finish');
            //console.log(callback);
            callbackCron(null, null);
        });
      }

  ],
    // All process Finish
    function(err, results){
      //console.log('####### Notification Log Update Process Cron : Complete');
    })
});
*/

/*
  * Cron : Create Daily Job to Save last 90 Days data in file.
*/
// nodecron.schedule('0 0 0 * * *', function() {
//   //console.log('Cron run at midnight');
//   commonLib.getHistoricalData(function(resp){
//      //console.log("Historical data cron completed");
//   });
// });

/*
  * Cron : Create Daily Job to Set Notification Schedules
*/
console.log('Cron run at midnight');
notificationController.setNotifications();

nodecron.schedule('0 0 0 * * *', function() {

  console.log('Cron run at midnight');
  notificationController.setNotifications();
});