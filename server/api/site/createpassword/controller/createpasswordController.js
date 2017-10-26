'use strict';


var db = require('../../../../config/cassandra');
var generalConfig = require('../../../../config/generalConfig');
var cassandra = require('cassandra-driver');
var crypto = require('crypto');
var sequelizeDb = require('../../../../config/sequelize').db;

/* AWS */
var awsSubscriber = require('../../../../lib/aws/subscriber');
var awsIotConnect = require('../../../../lib/aws/awsiotconnect');


exports.createpassword = function(req, res, next) {

    var usertoken = req.body.userToken;
    var password = req.body.password;

    if (usertoken == "") {
        res.json({
            status: 'fail',
            message: 'You are not authorized person to create password.'
        });
    }else if(password == ""){
        res.json({
            status: 'fail',
            message: 'Password is required.'
        });
    }else{

        var hashedPassword = generalConfig.encryptPassword(password);

        sequelizeDb.models.user.findOne({
          where: {usertoken: usertoken},
          attributes: ['id', 'company_id']
        }).then(function(user) {

          if(user) {

              var companyId = user.company_id;

              sequelizeDb.models.user.update({ usertoken: "", password:hashedPassword,active:1 }, 
                                             { where: { usertoken: usertoken} })
                .then(function(createpassword) {
                  
                  if (createpassword == 1) {

                      /* Call User Subscription/Unsubscription functionality : Start */
                      /*awsIotConnect.awsUserSubscriptionAndUnSubscriptionByUserId(user.id, companyId, function(awsUserNotificationCallback){
                      })*/
                      /* Call User Subscription/Unsubscription functionality : End */              

                      res.json({ 
                            status: 'success',
                            message : "Password has been created successfully. Please login."
                        });
                   } else {
                      res.json({                
                          status: 'fail',
                          message: "Password is already created successfully."
                      });
                      
                  }
                }).catch(function(error) {
                    res.json({                
                          status: 'fail',
                          message: "Some error has been occured while creating password. Please try again."                
                    });
               })

          } else {

              res.json({                
                  status: 'fail',
                  message: "Invalid token for creating password."
              });
          }

        }).catch(function(error) {
            res.json({                
                  status: 'fail',
                  message: "Some error has been occured while creating password. Please try again."                
            });
       })

    }
};