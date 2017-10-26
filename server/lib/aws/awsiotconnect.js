var awsSubscriber = require('./subscriber');

var db = require('../../config/sequelize').db;
var DataTypes = require("sequelize");
var generalConfig = require('../../config/generalConfig');
var async = require('async');
var fs = require('fs-extra');


/* ############### Common function : Strat ############### */

/* 
 * @author : GK
 * Update registred group status
 * @param : ruleId : Rule Id
 * @param : groupIdList : List of group Id ( Json )
 * @param : notificationType : Notification Type ( 1 = Email, 2 = Push, 3 = SMS )
 * @param : newStatus : New Status for all group(s) ( 1 = Pending, 2 = Active, 3 = Inactive )
 */
var awsUpdateGroupStatus = function awsUpdateGroupStatus(ruleId, groupIdList, notificationType, newStatus, callback)
{
    var groupDataObj = [];
    groupDataObj = {
                status : newStatus
            }

    db.models.aws_group_subscription.update( groupDataObj, {
                               where: ["company_group_id in ( ? ) AND notification_type= ? AND rule_id= ? ", groupIdList, notificationType, ruleId]
                               }).then(function(group) {
            if(group)
            {
                return callback({status: 'success', data: 'Group update', message: 'Group status update successfully'});
            }
            else
            {
                return callback({status: 'success', data: 'No group update', message: 'Group status update successfully'});
            }
            
    }).catch(function(err){
         return callback({status: 'fail', data: err, message: 'Rule notification processed incomplete, Please update this rule'});
    }); 

}

/*
 * @author : GK
 * Get topic Arn fom Rule Id
 * @param : companyId : Company Id
 * @param : ruleId : Rule Id
 */

var awsGetTopicArnByRuleId = function awsGetTopicArnByRuleId( companyId, ruleId, callback)
{
    db.models.rule.findOne( { where: { id: ruleId, company_id: companyId } } ).then(function(rule) {
        if(rule)
        {
            return callback({status: 'success' , data: rule.topic_arn, message: 'Record found successfully'});
        }
        else
        {
            return callback({status: 'fail' , data: 'topicarnnotfound', message: 'Rule record not found'});
        }
    }).catch(function(err) {
            return callback({status: 'fail' , data: err, message: 'Some Unknown Database error'});
       });
}

/*
 * @author : GK
 * Change Group status for unsubscription 
 * All Pass Group(s)'s status change to 3 ( 1 = Pending, 2 = Active, 3 = Inactive )
 * @param : groupId : List of group Id ( Json Data )
 * @param : companyId : Company ID
 * @param : ruleId : Rule ID
 * @param : topicArn : Topic Arn
 * @param : notification_type : Notification Type ( 1 = Email, 2 = Push, 3 = SMS )
 */

var awsUnsubscriptionGroupStatus = function awsUnsubscriptionGroupStatus( groupId, companyId, ruleId, topicArn, notification_type, callback)
{
    var groupDataObj = []
        groupDataObj = {
            status : '3'
        }
    db.models.aws_group_subscription.update( groupDataObj, {
                               where : ["rule_id = ? AND NOT (`company_group_id` IN ( ? )) AND notification_type = ? ", ruleId, groupId, notification_type]
                               }).then(function(group) {
        if(group)
        {
             return callback({status: 'success' , data: 'Unsubscription Group Status : Record update', message: 'Record update successfully.'});        }
        else
        {
            return callback({status: 'success' , data: 'Unsubscription Group Status : No record update', message: 'Record update successfully.'});
        }
    }).catch(function(err){
        
        return callback({status: 'fail' , data: err, message: 'Rule notification processed incomplete, Please update this rule'});
    });
}

/*
 * @author : GK
 * Remove(Delete) groups from database
 * Delete all Status 3 groups
 * @param : ruleId : Rule ID
 * @param : notification_type : Notification Type ( 1 = Email, 2 = Push, 3 = SMS )
 */
var removeGroupByGroupStataus = function removeGroupByGroupStataus( ruleId, notification_type, callback)
{
    db.models.aws_group_subscription.destroy({
            where: [" status = '3' AND rule_id = ? AND notification_type = ? ", ruleId, notification_type]
            }).then(function (deleletGroup)
       {
            if(deleletGroup)
            {
                return callback({status: 'success' , data: 'Unsubscription email Group: Group Record removed', message: 'Record unsubscribe successfully.'});
            }
            else
            {
               return callback({status: 'success' , data: 'Unsubscription email Group: Group No record remove', message: 'Record unsubscribe successfully.'});
            }
       })
       .catch(function(err) {
             return callback({status: 'fail' , data: err, message: 'Rule notification processed incomplete, Please update this rule'});
       });
}

/*
 * @author : GK
 * Check and register new group if group not register
 * @param : ruleId : Rule Id
 * @param : topicArn : Topic Arn
 * @param : groupIdList : List of Group Id ( Json )
 * @param : notificationType : Notification Subscription for ( 1 = Email, 2 = Push, 3 = SMS )
 */

var awsGroupRegistration = function awsGroupRegistration(ruleId, topicArn, groupIdList, notificationType, callback)
{
    //where: ["company_group_id = ? AND rule_id =? AND notification_type = ? AND Status NOT IN (1, 2, 3) ", groupData, ruleId, notificationType],
    /* Group Register : Start */
    var groupRegistration = [];
    groupIdList.forEach(function(groupData) {
        groupRegistration.push(function(groupRegistrationEachLoopMsg)
        {
            db.models.aws_group_subscription.findOrCreate({ where: {company_group_id: groupData, rule_id: ruleId, notification_type: notificationType} }).spread(function(group, created) {
                if(created == true)
                {
                    groupRegistrationEachLoopMsg(null, group.company_group_id);
                }
                else
                {
                    groupRegistrationEachLoopMsg(null, '');
                }
            })
        })
    })
    /* Group Register : End */

    /* After Group Register : Start */
    async.parallel(groupRegistration, function(message, data) {

        var finalGroupList = [];
        var resultLength = data.length;
        var count = 0;
        data.forEach(function(group){
            count++;
            if(group != '')
            {
                finalGroupList.push(group);
            }

            if(count == resultLength)
            {
                return callback({status: 'success', data: finalGroupList, message: 'Group registration processed successfully'});
            }
        })
    })
    /* After Group Register : End */
}

/*
 * @author : GK
 * Change Group status for unsubscription 
 * change all groups status set 3 ( 1 = Pending, 2 = Active, 3 = Inactive ) by rule id
 * @param : companyId : Company ID
 * @param : ruleId : Rule ID
 * @param : topicArn : Topic Arn
 * @param : notification_type : Notification Type ( 1 = Email, 2 = Push, 3 = SMS )
 */

var awsAllGroupStatusChangeByRuleId = function awsAllGroupStatusChangeByRuleId( companyId, ruleId, topicArn, notification_type, callback)
{
    var groupDataObj = []
        groupDataObj = {
            status : '3'
        }
    db.models.aws_group_subscription.update( groupDataObj, {
                               where : ["rule_id = ? AND notification_type = ? ", ruleId, notification_type]
                               }).then(function(group) {
        if(group)
        {
             return callback({status: 'success' , data: 'Unsubscription Group Status : record update', message: 'Record update successfully.'});        }
        else
        {
            return callback({status: 'success' , data: 'Unsubscription Group Status : no record update', message: 'Record update successfully.'});
        }
    }).catch(function(err){
        
        return callback({status: 'fail' , data: err, message: 'Rule notification processed incomplete, Please update this rule'});
    });
}


/* ############### Common function : End ############### */

/* ############### Topic related function(s) : Start ############### */

/*
 * @author : GK
 * Creat new AWS Topic and update Topic ARN on rule Table
 * @param : topicNameByruleName : Topic Name
 * @param : ruleId : Rule Id
 */

var awsCreateTopicAndUpdatRule = function awsCreateTopicAndUpdatRule( topicNameByruleName, ruleId , callback)
{
    
    awsSubscriber.createTopic( topicNameByruleName , function(response){
            var responseStatus = response.response; /* API Resonse Status */
            var responseMessage = response.data; /* API Reponse Message */
            if(responseStatus == 'success')
            {
                var requestId = responseMessage.ResponseMetadata.RequestId; /* Request ID */
                var topicArn = responseMessage.TopicArn; /* Topic Arn */
                if(topicArn != '' && ruleId != '')
                {
                  /* Update Record in Rule table : Start */
                    var ruleDataObj = [];
                        ruleDataObj = {
                                        topic_arn : topicArn
                                      }
                    db.models.rule.update( ruleDataObj, { where : { id: ruleId } }).then(function(rule) {
                            if(rule)
                            {
                                return callback({status: 'success', data: topicArn, message: 'AWS Topic created successfully'});
                            }
                            else
                            {
                                return callback({status: 'fail', data: 'Update Topic ARN Rule', message: 'Rule notification processed incomplete, Please update this rule'});
                            }

                     }).catch(function(err) {
                        return callback({status: 'fail', data: err, message: 'Rule notification processed incomplete, Please update this rule'});
                    });
                  /* Update Record in Rule table : End */
                }
                else
                {
                    return callback({status: 'fail', data: 'Create Topic ARN Rule', message: 'Rule notification processed incomplete, Please update this rule'});
                }
            }
            else if(responseStatus == 'error')
            {
                return callback({status: 'fail', data: responseMessage.message, message: 'Rule notification processed incomplete, Please update this rule'});
            }
    })
}

/* ############### Topic related function(s) : End ############### */

/* ############### Email notification function(s) : Start ############### */

/*
 * @author : GK
 * AWS email User subscription by group ID
 * Get user list by group Id and pass request for subscription to AWS
 * @param : groupIdList : List of group Id ( Json )
 * @param : companyId : Company Id
 * @param : ruleId : Rule Id
 * @param : topicArn : AWS Topic Arn
 * @param : errorFilePath : File path for write error log
 */

var awsEmailUserSubscriptionByGroupId = function awsEmailUserSubscriptionByGroupId( groupIdList, companyId, ruleId, topicArn, errorFilePath, callback)
{
    /* Join Rule */
    db.models.user.hasMany(db.models.company_user_group, {foreignKey: 'user_id'})
    db.models.company_user_group.belongsTo(db.models.user, {foreignKey: 'id'})

    /* Get user list query : start */
    db.models.user.findAll({
                         where: ["company_user_groups.company_group_id in ( ? ) and user.company_id = ? and user.active = '1' ", groupIdList, companyId],
                         include: [db.models.company_user_group],
                         raw: true
                    }) .then(function(usersData)
    {
        if(usersData)
        {
            var userEmailSubscription = [];
            
            /* User data looping for email subscription: start */
            usersData.forEach(function(user) {
                userEmailSubscription.push(function(userEachLoopMsg)
                {
                    var user_email = user.email;
                    var user_firstname = user.firstname;
                    var user_lastname = user.lastname;
                    var user_id = user.id;
                    var company_user_group_id = user['company_user_groups.id'];
                    var company_group_id = user['company_user_groups.company_group_id'];

                    if(user_email == '' || user_email == null) /* Email is null */
                    {
                       var errorMsg = 'Email notification : '+user_firstname+' '+user_lastname+'\'s email address not found. \n';
                       fs.appendFile( errorFilePath, errorMsg, function(err) {
                           if(err) { 
                                //console.log(err);
                           }
                       });
                       userEachLoopMsg(null, null);
                    }
                    else 
                    {
                        /* Process of subscription : Start */
                        awsSubscriber.emailSubscription(topicArn, user_email, function(emailSubscriptionResponse){
                                    var responseStatus = emailSubscriptionResponse.response; /* API Resonse Status */
                                    var responseMessage = emailSubscriptionResponse.data; /* API Reponse Message */
                                    if(responseStatus == 'success')
                                    {
                                        var awsReqId = responseMessage.ResponseMetadata.RequestId;
                                        var awsScriptionArn = responseMessage.SubscriptionArn;

                                        var emailSubDataObj = [];
                                            emailSubDataObj = { 
                                                      user_id : user_id,
                                                      rule_id : ruleId,
                                                      company_group_id: company_group_id,
                                                      notification_type : '1',
                                                      topic_arn : topicArn,
                                                      subsciption_arn : awsScriptionArn
                                                    }
                                       /* Insert Subscription record in DB : Start */
                                           db.models.aws_user_subscription.create(emailSubDataObj).then(function(awsSubscriptionInsert) {
                                              if(awsSubscriptionInsert) /* Success */
                                              {
                                                  /* Delete (delete_request = 2) record for this rule From DB :Start */
                                                      db.models.aws_user_subscription.destroy({
                                                            where: { user_id : user_id, rule_id : ruleId,
                                                                     notification_type : '1',
                                                                     topic_arn : topicArn,
                                                                     delete_request : '2'
                                                             }
                                                            }).then(function (deleletOldSubscription)
                                                       {
                                                            if(deleletOldSubscription)
                                                            {
                                                              userEachLoopMsg(null, 'Inserted / Delete');
                                                            }
                                                            else
                                                            {
                                                              userEachLoopMsg(null, 'Inserted / Delete');          
                                                            }
                                                       })
                                                  /* Delete (delete_req = 2) record for this rule From DB :End */
                                              }
                                              else /* Not Sucess */
                                              {
                                                var errorMsg = 'Email notification : User : '+firstName+' '+lastName+', Error: Some database unknown error';
                                                fs.appendFile( errorFilePath, errorMsg, function(err) {
                                                   if(err) { /*console.log(err);*/ }
                                                });
                                                userEachLoopMsg(null, null);
                                              }
                                          }).catch(function(err){
                                                userEachLoopMsg('Rule notification processed incomplete, Please update this rule', null);
                                          });
                                      /* Insert Subscription record in DB : End */

                                    }
                                    else
                                    {
                                       var errorMsg = 'Email notification : '+user_firstname+' '+user_lastname+'\'s email subscription not processed successfully. \n';
                                       fs.appendFile( errorFilePath, errorMsg, function(err) {
                                           if(err) { /*console.log(err);*/ }
                                       });
                                       userEachLoopMsg(null, null);
                                    }
                        })
                        /* Process of subscription : End */
                    }
                })
            });
            /* User data looping for email subscription : End */

            /* After User data looping : Start */
            async.parallel(userEmailSubscription, function(message, data) {
                    /* AWS Email Subscription */
                    if(message != null) /* Some Error */
                    {
                      return callback({status: 'fail', data: message, message: 'Rule notification processed incomplete, Please update this rule'});
                    }
                    else /* Sucess */
                    {
                        /* Update group status : Start */
                          awsUpdateGroupStatus(ruleId, groupIdList, '1', '2', function(groupStatusUpdate){
                                   var groupResponseStatus = groupStatusUpdate.status;
                                   if(groupResponseStatus == 'success')
                                   {
                                      return callback({status: 'success', data: 'New group email notification subscription', message: 'New group email subscription processed successfully'});
                                   }
                                   else
                                   {
                                      return callback({status: 'fail', data: groupResponseStatus.data, message: 'Rule notification processed incomplete, Please update this rule'});
                                   }
                          })
                        /* Update group status : End */
                    }
            })
            /* After Group Register : End */
        }
        else
        {
            return callback({status: 'success', data: 'Email notification subscription', message: 'Group user data not found'});
        }
    }).catch(function(err){
        return callback({status: 'fail', data: err, message: 'Rule notification processed incomplete, Please update this rule'});
    });
}

/*
 * @author : GK
 * Unsubscription email group functionality
 * Unsubscribe email record from AWS and remove record
 * @param : companyId : Company ID
 * @param : ruleId : Rule ID
 * @param : topicArn : Topic Arn
 * @param : errorFilePath : File path for write error log
 */
var awsUnsubscriptionOfEmailGroup = function awsUnsubscriptionOfEmailGroup( companyId, ruleId, topicArn, errorFilePath, callback)
{
    
    db.query('select *, awsuser.id as subscription_unique_id, (select count(*) from aws_user_subscription as innerAWSSub left join aws_group_subscription as innerAWSgroup on innerAWSgroup.rule_id = innerAWSSub.rule_id and innerAWSSub.company_group_id = innerAWSgroup.company_group_id where innerAWSSub.user_id = user.id and innerAWSSub.rule_id = :rule_id and innerAWSSub.notification_type = "1" and innerAWSgroup.notification_type = "1" and innerAWSgroup.status = "2" ) as totalcount from aws_user_subscription as awsuser left join aws_group_subscription as awsgroup on awsgroup.rule_id = awsuser.rule_id and awsuser.company_group_id = awsgroup.company_group_id left join user as user on user.id = awsuser.user_id where awsgroup.status = "3" and awsgroup.rule_id = :rule_id and awsgroup.notification_type = "1" and awsuser.notification_type = "1"',
        { replacements: { rule_id: ruleId }, type: db.QueryTypes.SELECT }
    ).then(function(groupUserData)
    {
        if(groupUserData.length > 0)
        {
             var userEmailUnsubscription = [];
            /* User data looping for email subscription: start */
            groupUserData.forEach(function(userGroupData) {
                userEmailUnsubscription.push(function(userEachLoopMsg)
                {
                    var getCount = userGroupData.totalcount;
                    if(getCount < 1) /* Get only one record */
                    {
                        var subscriptionArn = userGroupData.subsciption_arn;
                        if(subscriptionArn != 'pending confirmation' && subscriptionArn != 'PendingConfirmation')
                        {
                            /* AWS unsubscription : Start */
                            awsSubscriber.unSubscribe( subscriptionArn, function(awsUnsubscriptionResponse){
                                if(awsUnsubscriptionResponse.response == 'success')
                                {
                                   userEachLoopMsg(null, userGroupData.subscription_unique_id); /* Delete user from DB */
                                }
                                else
                                {
                                   /* If error rersponse generate in aws Unscription API */ 
                                   var errorMsg = 'Email notification : This '+userGroupData.email+' address not unSubscribe successfully. \n';
                                   fs.appendFile( errorFilePath, errorMsg, function(err) {
                                       if(err) { /*console.log(err);*/ }
                                   });
                               
                                   var awsSubscriptionDataObj = [];
                                   awsSubscriptionDataObj = {
                                                delete_request : "2"
                                        }
                                   db.models.aws_user_subscription.update( awsSubscriptionDataObj, {
                                       where : { id: userGroupData.subscription_unique_id } 
                                       }).then(function(userUns) {
                                            if(userUns)
                                            {
                                                // Noting action
                                                userEachLoopMsg(null, null);
                                            }
                                            else
                                            {
                                                var errorMsg = 'Email notification : Status not update properly for This '+userGroupData.email+' address. \n';
                                                fs.appendFile( errorFilePath, errorMsg, function(err) {
                                                   if(err) { /*console.log(err);*/ }
                                                });
                                                userEachLoopMsg(null, null);
                                            }
                                        }).catch(function(err) 
                                        {
                                            var errorMsg = 'Email notification : Status not update properly for This '+userGroupData.email+' address. \n';
                                               fs.appendFile( errorFilePath, errorMsg, function(err) {
                                                   if(err) { /*console.log(err);*/ }
                                            });
                                            userEachLoopMsg(null, null);
                                        });
                                }
                            })
                            /* AWS unsubscription : End */
                        }
                        else /* Pening Conformation */
                        {
                             /* Change Status for future delete : Start */
                                var awsSubscriptionDataObj = [];
                                   awsSubscriptionDataObj = {
                                                delete_request : "2"
                                        }
                                   db.models.aws_user_subscription.update( awsSubscriptionDataObj, {
                                       where : { id: userGroupData.subscription_unique_id } 
                                       }).then(function(userUns) {
                                            if(userUns)
                                            {
                                                // Noting action
                                                userEachLoopMsg(null, null);
                                            }
                                            else
                                            {
                                               var errorMsg = 'Email notification : Status not update properly for This '+userGroupData.email+' address. \n';
                                                fs.appendFile( errorFilePath, errorMsg, function(err) {
                                                   if(err) { /*console.log(err);*/ }
                                                });
                                                userEachLoopMsg(null, null);
                                            }
                                        }).catch(function(err) 
                                        {
                                            var errorMsg = 'Email notification : Status not update properly for This '+userGroupData.email+' address. \n';
                                               fs.appendFile( errorFilePath, errorMsg, function(err) {
                                                   if(err) { /*console.log(err);*/ }
                                            });
                                            userEachLoopMsg(null, null);
                                        });
                            /* Change Status for future delete : End */
                        }
                    }
                    else /* Found more then one record for same rule id */
                    {
                        userEachLoopMsg(null, userGroupData.subscription_unique_id); /* Delete user from DB */
                    }
                })
            });
            /* User data looping for email subscription: End */
            
            /* After User data looping : Start */
            async.parallel(userEmailUnsubscription, function(message, data) {
                       
                if(data.length > 0)
                {
                       db.models.aws_user_subscription.destroy({
                            where: ["`id` IN ( ? )", data]
                            }).then(function (deleletSubscription)
                       {
                            if(deleletSubscription)
                            {
                                removeGroupByGroupStataus(ruleId, '1', function(removeGroup){
                                        if(removeGroup.status == 'success')
                                        {
                                            return callback({status: 'success' , data: 'Unsubscription email Group: Record removed', message: 'Record unsubscribe successfully.'});            
                                        }
                                        else
                                        {
                                            return callback({status: 'success' , data: removeGroup.data, message: removeGroup.message });
                                        }
                                })
                            }
                            else
                            {
                               removeGroupByGroupStataus(ruleId, '1', function(removeGroup){
                                        if(removeGroup.status == 'success')
                                        {
                                            return callback({status: 'success' , data: 'Unsubscription email Group: No record remove', message: 'Record unsubscribe successfully.'});            
                                        }
                                        else
                                        {
                                            return callback({status: 'success' , data: removeGroup.data, message: removeGroup.message });
                                        }
                                }) 
                            }
                       })
                }
                else
                {
                   return callback({status: 'success' , data: 'Unsubscription email Group: No record remove', message: 'Record unsubscribe successfully.'});  
                }
           });
            /* After User data looping : End */
        }
        else /* No data for remove */
        {
            removeGroupByGroupStataus(ruleId, '1', function(removeGroup){
                    if(removeGroup.status == 'success')
                    {
                        return callback({status: 'success' , data: 'Unsubscription email Group: no record unsubscribe', message: 'Record unsubscribe successfully.'});
                    }
                    else
                    {
                        return callback({status: 'success' , data: removeGroup.data, message: removeGroup.message });
                    }
            })
        }
    }).catch(function(err) {
           return callback({status: 'fail' , data: err, message: 'Rule notification processed incomplete, Please update this rule'});
       });
}

/* 
 * @author : GK
 * Resubscription Email functionality
 * @param : groupIdList : List of group Id ( Json )
 * @param : companyId : Company Id
 * @param : ruleId : Rule Id
 * @param : topicArn : Topic Arn
 * @param : errorFilePath : File path for write error log
 */
var awsResubscriptionProcessOfPendingUser = function awsResubscriptionProcessOfPendingUser( groupIds, companyId, ruleId, topicArn, errorFilePath, callback)
{
      db.models.user.hasMany(db.models.aws_user_subscription, {foreignKey: 'user_id'})
      db.models.aws_user_subscription.belongsTo(db.models.user, { foreignKey: 'user_id' })

      /* Get record of pending subscription : Start  */
      db.models.aws_user_subscription.findAll( { 
            where: { 
                 rule_id: ruleId,
                 notification_type: '1',
                 delete_request: {
                  $ne: '2'  
                 },
                 subsciption_arn: ['pending confirmation', 'PendingConfirmation'],
                 company_group_id: {
                  $notIn: [groupIds]
                 }
             },
            include: [ {  model: db.models.user , attributes: ['email', 'firstname', 'lastname', 'active']  , required: true ,  where: {active:true} }],
            group: 'user_id',
            raw : true
          } ).then(function(reEmailSubscription) {
        if(reEmailSubscription)
        {
            if(reEmailSubscription.length > 0)
            {
                /* Foreach(1) of subscription list: Start */
                 async.forEachSeries(reEmailSubscription, function(subscription, callback_f1) {
                        var emailAddress = subscription['user.email'];
                        var topicArn = subscription.topic_arn;
                            /* AWS email subscription : Start */
                              awsSubscriber.emailSubscription(topicArn, emailAddress, function(emailSubscriptionResponse){
                                  var responseStatus = emailSubscriptionResponse.response; /* API Resonse Status */
                                  var responseMessage = emailSubscriptionResponse.data; /* API Reponse Message */
                                  if(responseStatus == 'success') // Success
                                  {
                                     callback_f1(); 
                                  }
                                  else // Not success
                                  {
                                     callback_f1();
                                  }
                              })
                            /* AWS email subscription : End */
                 }, function() {
                     // ForEach(1) finish
                    return callback({status: 'success' , data: 'Email Resubscription: Record Found', message: 'Pending email Resubscription process completed successfully.'});
                  });
              /* Foreach(1) of subscription list: End */
            }
            else
            {
              return callback({status: 'success' , data: 'Email Resubscription: No record found', message: 'Pending email Resubscription process complete successfully.'});
            }
        }
        else
        {
          return callback({status: 'success' , data: 'Email Resubscription: No record found', message: 'Pending email Resubscription process complete successfully.'});
        }
      }).catch(function(err) {
          return callback({status: 'fail' , data: err, message: 'Rule notification processed incomplete, Please update this rule'});
      });
      /* Get record of pending subscription : End */
}

/* ############### Email notification function(s) : End ############### */

/* ############### Push Notification function(s) : Strat ############### */

/*
 * @author : GK
 * Subscribe use from GroupId for Push Notification
 * @param : groupIdList : Group List Id (Json)
 * @param : companyId : Company ID
 * @param : ruleId : Rule ID
 * @param : topicArn : Topic Arn
 * @param : errorFilePath : File path for write error log
 * @param : iOSApplicationArn : Application Arn of IOS
 * @param : androidApplicationArn : Application Arn of Android(GCM)
 */
var awsPushUserSubscriptionByGroupId = function awsPushUserSubscriptionByGroupId(groupIdList, companyId, ruleId, topicArn, errorFilePath, iOSApplicationArn, androidApplicationArn, callback)
{

  db.query('select mobiledevice.*, usergroup.*, user.firstname, user.lastname, mobiledevice.id as device_reg_id from mobile_device as mobiledevice left join company_user_group as usergroup on usergroup.user_id = mobiledevice.user_id left join user as user on user.id = mobiledevice.user_id where usergroup.company_group_id in ( :groupList ) AND user.active = "1" AND user.deletedAt is null',
        { replacements: { groupList: groupIdList }, type: db.QueryTypes.SELECT }
    ).then(function(usersData)
    {
        if(usersData) /* Group Data found */
        {
          /* user data foreach for subscription : Start */
            var userPushSubscription = [];
            usersData.forEach(function(userData) {
                userPushSubscription.push(function(userEachLoopMsg)
                {
                    var endpointArn = userData.aws_application_endpoint_arn; /* Get Application endPoint Arn */
                    var devicePushToken = userData.push_token; /* Get User Device Push Token */
                    
                    if(devicePushToken == '' || devicePushToken == null) /* If device token not register */
                    {
                      var errorMsg = 'Push notification : '+firstname+' '+lastname+'\'s Device Token not registred.\n';
                      fs.appendFile( errorFilePath, errorMsg, function(err) {
                         if(err) { /*console.log(err);*/ }
                      });
                      userEachLoopMsg(null, null);
                    }
                    
                    if(endpointArn == '' || endpointArn == null) /* If endpoint not subscription in application */
                    {
                        var getDeviceType = userData.type; /* Device Type */
                        var tempApplicationArn = '';
                        if(getDeviceType == '1' && iOSApplicationArn != '') /* IOS application */
                        {
                          tempApplicationArn = iOSApplicationArn;
                        }
                        else if(getDeviceType == '2' && androidApplicationArn != '') /* Android application */
                        {
                          tempApplicationArn = androidApplicationArn;
                        }
                        else /* Device Type not found */
                        {
                            var errorMsg = 'Push notification : '+userData.firstname+' '+userData.lastname+'\'s Device Type not registred.\n';
                            fs.appendFile( errorFilePath, errorMsg, function(err) {
                               if(err) { /*console.log(err);*/ }
                            });
                        }

                        if(tempApplicationArn != '') // Application Arn Check
                        {
                          //var custom_userInformation = 'USERID:'+userData.user_id+',OS:'+userData.os+',VERSION:'+userData.os_version;
                          var custom_userInformation = 'COMPANY ID:'+companyId;
                          /* Create endPoint for Application */
                          awsSubscriber.createPlatformEndpoint(tempApplicationArn, devicePushToken, custom_userInformation, function(endPointRegResponse){
                                var responseMessage = endPointRegResponse.data;
                                if(endPointRegResponse.response == 'success') /* endPoint Application created successfully */
                                {
                                    var new_endPointArn = responseMessage.EndpointArn;
                                    var mobileDataObj = [];
                                    mobileDataObj = {
                                              aws_application_endpoint_arn : new_endPointArn
                                            }
                                    /* Update information in device : Start */
                                    db.models.mobile_device.update( mobileDataObj, {
                                               where : { id: userData.device_reg_id } 
                                               }).then(function(mobileDevice) {
                                      if(mobileDevice)
                                      {
                                            var ReponseArnArray = [];
                                            ReponseArnArray = {
                                                  user_id : userData.user_id,
                                                  company_group_id : userData.company_group_id,
                                                  device_type : userData.type,
                                                  application_arn : tempApplicationArn,
                                                  application_endpoint_arn : new_endPointArn,
                                                  userFirstName : userData.firstname,
                                                  userLastName : userData.lastname
                                            }
                                        userEachLoopMsg(null, ReponseArnArray);
                                      }
                                      else /* Not update record */
                                      {
                                        var errorMsg = 'Push notification : Some unknow error generate for user : '+userData.firstname+' '+userData.lastname+'\n ';
                                        fs.appendFile( errorFilePath, errorMsg, function(err) {
                                           if(err) { /*console.log(err);*/ }
                                        });
                                        userEachLoopMsg(null, null);
                                      }
                                    }).catch(function(err) {
                                        /* Some Error */
                                        userEachLoopMsg('Rule notification processed incomplete, Please update this rule', null);
                                    });
                                    /* Update information in device : End */
                                }
                                else /* endPoint Application not created */
                                {
                                    var errorMsg = 'Push notification : User : '+userData.firstname+' '+userData.lastname+', Error: '+responseMessage.message+' \n';
                                    //var errorMsg = 'Push notification : Some unknow error generate for user : '+userData.firstname+' '+userData.lastname+'\n ';
                                    fs.appendFile( errorFilePath, errorMsg, function(err) {
                                       if(err) { /*console.log(err);*/ }
                                    });
                                    userEachLoopMsg(null, null);
                                }
                          })
                        }
                        else
                        {
                          userEachLoopMsg(null, null);
                        }
                    }
                    else /* Application endpoint all ready register */
                    {

                        var getDeviceType = userData.type; /* Device Type */
                        var tempApplicationArn = '';
                        if(getDeviceType == '1' && iOSApplicationArn != '') /* IOS application */
                        {
                          tempApplicationArn = iOSApplicationArn;
                        }
                        else if(getDeviceType == '2' && androidApplicationArn != '') /* Android application */
                        {
                          tempApplicationArn = androidApplicationArn;
                        }
                        else /* Device Type not found */
                        {
                            var errorMsg = 'Push notification : '+userData.firstname+' '+userData.lastname+'\'s Device Type not registred.\n';
                            fs.appendFile( errorFilePath, errorMsg, function(err) {
                               if(err) { /*console.log(err);*/ }
                            });
                        }

                        if(tempApplicationArn != '') // Application Arn Check
                        {
                          var ReponseArnArray = [];
                                ReponseArnArray = {
                                      user_id : userData.user_id,
                                      company_group_id : userData.company_group_id,
                                      device_type : userData.type,
                                      application_arn : tempApplicationArn,
                                      application_endpoint_arn : endpointArn,
                                      userFirstName : userData.firstname,
                                      userLastName : userData.lastname
                                }
                            userEachLoopMsg(null, ReponseArnArray);
                        }
                        else // Application Arn Empty
                        {
                            userEachLoopMsg(null, null);
                        }
                    }
                })
            });
          /* user data foreach for subscription : End */

          /* user data after foreach for subscription : Start */
            async.parallel(userPushSubscription, function(message, data) {
                  if(message != null)
                  {
                    return callback({status: 'success', data: 'Push notification create application subscription', message: message});
                  }
                  else
                  {
                     //if(data.length > 0) // User record found
                     //{
                        /* endPointSubscription Process : Start */
                          awsPushSubscription( data, ruleId, groupIdList, topicArn, errorFilePath, function(getSubscriptionResponse){
                              if(getSubscriptionResponse.status == 'success')
                              {
                                return callback({status: 'success', data: getSubscriptionResponse.data, message: getSubscriptionResponse.message});
                              }
                              else
                              {
                                return callback({status: 'fail', data: getSubscriptionResponse.data, message: getSubscriptionResponse.message});
                              }
                          });
                        /* endPointSubscription Process : Start */  
                     //}
                     /*else // User record not found
                     {
                      return callback({status: 'success', data: 'Push notification create application subscription', message: message});
                     }*/
                  }
            })
          /* user data after foreach for subscription : End */  
        }
        else /* Not Group Data found */
        {
            return callback({status: 'success', data: 'Push notification subscription', message: 'Group user data not found'});
        }
    }).catch(function(err){
        return callback({status: 'fail', data: err, message: 'Rule notification processed incomplete, Please update this rule'});
    });
}

/*
 * @author : GK
 * User(Device) subscription by Group
 * @param : endPointData : All Data for subscription
 * @param : ruleId : Rule Id
 * @param : groupIdList : Group List Id (Json)
 * @param : topicArn : Topic Arn
 * @param : errorFilePath : File path for write error log
 */
var awsPushSubscription = function awsPushSubscription( endPointData, ruleId, groupIdList, topicArn, errorFilePath, callback)
{
    /* Endpoint Subscription functionality loop : Start */
    var endPushSubscription = [];
    endPointData.forEach(function(endpoint) {
        endPushSubscription.push(function(endPointEachLoopMsg)
        {
           if(endpoint != null && endpoint != '')
           {
             var endpointArn = endpoint.application_endpoint_arn; /* Application Arn */
             var companyGroupId = endpoint.company_group_id; /* company Group ID */
             var deviceType = endpoint.device_type; /* Device Type */
             var applicationArn = endpoint.application_arn; /* Application Arn */
             var user_id = endpoint.user_id; /* user ID */
             var firstName = endpoint.firstname; /* First Name of user */
             var lastName = endpoint.lastname; /* Last Name of user */

             awsSubscriber.pushSubscription( topicArn, endpointArn, function(pushSubscriptionResponse){
                    var responseMessage = pushSubscriptionResponse.data;
                    if(pushSubscriptionResponse.response == 'success')
                    {
                        var awsSubscriptionArn = responseMessage.SubscriptionArn;
                        var awsSubscriptionRequestId = responseMessage.ResponseMetadata.RequestId;
                        
                        var awsSubscriptionTemp = []
                            awsSubscriptionTemp = {
                                       user_id : user_id,
                                       rule_id : ruleId,
                                       company_group_id : companyGroupId,
                                       notification_type : '2',
                                       device_type : deviceType,
                                       topic_arn : topicArn,
                                       subsciption_arn : awsSubscriptionArn,
                                       application_endpoint_arn : endpointArn,
                                       application_arn : applicationArn
                                  }

                                  /* Insert Subscription record in DB : Start */
                                  db.models.aws_user_subscription.create(awsSubscriptionTemp).then(function(awsSubscriptionInsert) {
                                      if(awsSubscriptionInsert) /* Success */
                                      {
                                        endPointEachLoopMsg(null, 'Inserted');
                                      }
                                      else /* Not Sucess */
                                      {
                                        var errorMsg = 'Push notification : User : '+firstName+' '+lastName+', Error: Some database unknown error';
                                        fs.appendFile( errorFilePath, errorMsg, function(err) {
                                           if(err) { /*console.log(err);*/ }
                                        });
                                        endPointEachLoopMsg(null, null);
                                      }
                                  }).catch(function(err){
                                        endPointEachLoopMsg('Rule notification processed incomplete, Please update this rule', null);
                                  });
                                  /* Insert Subscription record in DB : End */
                    }
                    else
                    {
                        //var errorMsg = 'Push notification : Some unknow error generate for User : '+userData.firstname+' '+userData.lastname+'\n ';
                        var errorMsg = 'Push notification : User : '+firstName+' '+lastName+', Error: '+responseMessage.message;
                        fs.appendFile( errorFilePath, errorMsg, function(err) {
                           if(err) { /*console.log(err);*/ }
                        });
                        endPointEachLoopMsg(null, null);
                    }
             })  
          }
          else
          {
            endPointEachLoopMsg(null, null);
          }
        })
    });
    /* Endpoint Subscription functionality loop : End */

    /* After Endpoint Subscription functionality loop : Start */
    async.parallel(endPushSubscription, function(message, data) {
        if(message != null) /* Some Error */
        {
          return callback({status: 'fail', data: message, message: 'Rule notification processed incomplete, Please update this rule'});
        }
        else /* Sucess */
        {
          /* Update group status : Start */
              awsUpdateGroupStatus(ruleId, groupIdList, '2', '2', function(groupStatusUpdate){
                     var groupResponseStatus = groupStatusUpdate.status;
                     if(groupResponseStatus == 'success')
                     {
                        return callback({status: 'success', data: 'Update group status in push notification subscription', message: 'New group email subscription processed successfully'});
                     }
                     else
                     {
                        return callback({status: 'fail', data: groupResponseStatus.data, message: 'Rule notification processed incomplete, Please update this rule'});
                     }
              })
          /* Update group status : End */
        }
    })
    /* After Endpoint Subscription functionality loop : End */


}

/*
 * @author : GK
 * Push Notification : Group unsubscription
 * Group unsubscription functionality.
 * @param : companyId : Company ID
 * @param : ruleId : Rule ID
 * @param : topicArn : Topic Arn
 * @param : errorFilePath : File path for write error log
 */
var awsUnsubscriptionOfPushGroup = function awsUnsubscriptionOfPushGroup( companyId, ruleId, topicArn, errorFilePath, callback)
{
    /* Get all group Status = 3 record  : Start */
    db.query('select *, awsuser.id as subscription_unique_id from aws_user_subscription as awsuser left join aws_group_subscription as awsgroup on awsgroup.rule_id = awsuser.rule_id and awsuser.company_group_id = awsgroup.company_group_id left join user as user on user.id = awsuser.user_id where awsgroup.status = "3" and awsgroup.rule_id = :rule_id and awsgroup.notification_type = "2" and awsuser.notification_type = "2"',
        { replacements: { rule_id: ruleId }, type: db.QueryTypes.SELECT }
    ).then(function(groupUserData)
    {
        if(groupUserData.length > 0)
        {
            var userPushUnsubscription = [];
            /* User data looping for Push subscription: start */
            groupUserData.forEach(function(userGroupData) {
                userPushUnsubscription.push(function(userEachLoopMsg)
                {
                         var subscriptionArn = userGroupData.subsciption_arn;
                          /* Get count of same subscription Arn :Start */
                            /* get count from subscribe group count of this ARN  */
                          db.query('select * from aws_user_subscription as awsUserSub left join aws_group_subscription as awsGroupSub on awsGroupSub.rule_id = awsUserSub.rule_id and awsUserSub.company_group_id = awsGroupSub.company_group_id where awsUserSub.rule_id = :rule_id and awsUserSub.notification_type = "2" and awsGroupSub.notification_type = "2" and awsGroupSub.status = "2" and awsUserSub.subsciption_arn = :subscription_arn',
                              { replacements: { rule_id: ruleId, subscription_arn: subscriptionArn }, type: db.QueryTypes.SELECT }
                          ).then(function(sameSubsCount)
                          {
                              if(sameSubsCount.length < 1)
                              {
                                /* AWS unsubscription : Start */
                                    awsSubscriber.unSubscribe( subscriptionArn, function(awsUnsubscriptionResponse){
                                        if(awsUnsubscriptionResponse.response == 'success')
                                        {
                                           /* Unsubscribe Successfully : Start */
                                           userEachLoopMsg(null, userGroupData.subscription_unique_id); /* Delete user from DB */
                                          /* Unsubscribe Successfully : End */
                                        }
                                        else 
                                        {
                                         /* Not Unsubscribe : Start */  
                                           /* If error rersponse generate in aws Unscription API */ 
                                           var errorMsg = 'Push notification : USER: '+userGroupData.firstname+' '+userGroupData.lastname+' ERROR: '+awsUnsubscriptionResponse.message+' \n'; 
                                           fs.appendFile( errorFilePath, errorMsg, function(err) {
                                               if(err) { /*console.log(err);*/ }
                                           });

                                           /* Update record delete status: Start */
                                           var awsSubscriptionDataObj = [];
                                           awsSubscriptionDataObj = {
                                                        delete_request : "2"
                                                }
                                           db.models.aws_user_subscription.update( awsSubscriptionDataObj, {
                                               where : { id: userGroupData.subscription_unique_id } 
                                               }).then(function(userUns) {
                                                    if(userUns)
                                                    {
                                                        // Noting action
                                                        userEachLoopMsg(null, null);
                                                    }
                                                    else
                                                    {
                                                        var errorMsg = 'Push notification :  USER: '+userGroupData.firstname+' '+userGroupData.lastname+' ERROR: Delete request not update successfully ';
                                                        fs.appendFile( errorFilePath, errorMsg, function(err) {
                                                           if(err) { /*console.log(err);*/ }
                                                        });
                                                        userEachLoopMsg(null, null);
                                                    }
                                                }).catch(function(err) 
                                                {
                                                    var errorMsg = 'Push notification :  Some Unkown error in unsubscribe status update process';
                                                       fs.appendFile( errorFilePath, errorMsg, function(err) {
                                                           if(err) { /*console.log(err);*/ }
                                                    });
                                                    userEachLoopMsg(null, null);
                                                })
                                             /* Update record delete status: End */   
                                        /* Not Unsubscribe : End */
                                        }
                                    })
                                /* AWS unsubscription : End */
                              }
                              else /* Same subscription ID for another User */
                              {
                                userEachLoopMsg(null, userGroupData.subscription_unique_id);
                              }
                          })
                         /* Get count of same subscription Arn :End */
               })
            })
            /* User data looping for Push subscription: End */

            /* User data AFTER looping for Push subscription: start */
            async.parallel(userPushUnsubscription, function(message, data) {

                    if(data.length > 0 )
                    {
                         db.models.aws_user_subscription.destroy({
                            where: ["`id` IN ( ? )", data]
                            }).then(function (deleletSubscription)
                       {
                            if(deleletSubscription)
                            {
                                removeGroupByGroupStataus(ruleId, '2', function(removeGroup){
                                    if(removeGroup.status == 'success')
                                    {
                                        return callback({status: 'success' , data: 'Unsubscription Push Group: Record removed', message: 'Record unsubscribe successfully.'});
                                    }
                                    else
                                    {
                                        return callback({status: 'success' , data: removeGroup.data, message: removeGroup.message });
                                    }
                                })
                            }
                            else
                            {
                               removeGroupByGroupStataus(ruleId, '2', function(removeGroup){
                                  if(removeGroup.status == 'success')
                                  {
                                      return callback({status: 'success' , data: 'Unsubscription Push Group: No record remove', message: 'Record unsubscribe successfully.'});            
                                  }
                                  else
                                  {
                                      return callback({status: 'success' , data: removeGroup.data, message: removeGroup.message });
                                  }
                              })
                            }
                       })
                    }
                    else /* No data for remove */
                    {
                        return callback({status: 'success' , data: 'Unsubscription Push Group: No record unsubscribe', message: 'Record unsubscribe successfully.'});
                    }

            })
            /* User data AFTER looping for Push subscription: End */

        }
        else
        {
          removeGroupByGroupStataus(ruleId, '2', function(removeGroup){
              if(removeGroup.status == 'success')
              {
                  return callback({status: 'success' , data: 'Unsubscription Push Group: No record unsubscribe', message: 'Record unsubscribe successfully.'});
              }
              else
              {
                  return callback({status: 'success' , data: removeGroup.data, message: removeGroup.message });
              }
          })
          
        }
  }).catch(function(err) {
      return callback({status: 'fail' , data: err, message: 'Rule notification processed incomplete, Please update this rule'});
   });
  /* Get all group Status = 3 record : End */
}

/*
 * @author : GK
 * Push Notification : Get setting records from Comapnay ID
 * @param : companyId : Company ID
 */
var awsGetApplicationData = function awsGetApplicationData(companyId, callback)
{

db.query('select android_aws_app_data, ios_aws_app_data, company_id from setting where company_id = :company_id',
        { replacements: { company_id: companyId }, type: db.QueryTypes.SELECT }
    ).then(function(setting)
    {
        /*db.models.setting.findOne( { 
              attributes: ['android_aws_app_data', 'ios_aws_app_data', 'company_id'],
              where: { company_id: companyId } 
           } ).then(function(setting) {*/
    if(setting)
    {
      return callback({status: 'success', data: setting[0], message: 'Data loaded successfully'});
    }
    else
    {
      return callback({status: 'fail', data: 'Get application setting details', message: 'Application details not found, Rule notification processed incomplete 1'});
    }
  }).catch(function(err) {
      return callback({status: 'fail', data: err, message: 'Application details not found, Rule notification processed incomplete 2'});
  });
}


/* ############### Push Notification function(s) : End ############### */


/* ############### Delete Topic & Subscription : Start ############### */

/*
 * @author : GK
 * Remove Rule and notification records
 * Remove subscription(Change Status) all record from DB and AWS.
 * @param : ruleId : Rule ID
 * @param : companyId : Company ID
 * @param : errorFilePath : File path for write error log
 */
var removeFullRule = function removeFullRule(ruleId, companyId, errorFilePath, callback)
{
   awsGetTopicArnByRuleId( companyId, ruleId, function(awsRemoveRepsonse)
   {
      if(awsRemoveRepsonse.status == 'success') /* topic Arn found */
      {
          var topicArn =  awsRemoveRepsonse.data; /* Topic ARN */

          /* unsubscribed all AWS notification : Start */
              async.series([
                  
                  /******* Remove email notification : Start *******/
                  function(callbackRemoveNotification){
                        /* Change Unsubscribe all group stataus : Start */
                          awsAllGroupStatusChangeByRuleId( companyId, ruleId, topicArn, '1', function(statusChangeUnsubscription){
                            if(statusChangeUnsubscription.status == 'success')
                            { 
                              /* Unsubscribe group user : Start */
                              awsUnsubscriptionOfEmailGroup( companyId, ruleId, topicArn, errorFilePath, function(emailUnsubscription){
                                 if(emailUnsubscription.status == 'success')
                                 {
                                   callbackRemoveNotification(null, null);
                                 }
                                 else
                                 {
                                   callbackRemoveNotification(emailUnsubscription.message, null);
                                 }
                               })
                               /* Unsubscribe group user : End */
                            }
                            else
                            {
                               callbackRemoveNotification(statusChangeUnsubscription.message, null);
                            }
                          });
                          /* Change Unsubscribe all group stataus : End */

                  }, /******* Remove email notification : End *******/

                  /******* Remove Push notification : Start *******/
                  function(callbackRemoveNotification){
                      /* Change Unsubscribe all group stataus : Start */
                          awsAllGroupStatusChangeByRuleId( companyId, ruleId, topicArn, '2', function(statusChangeUnsubscription){
                            if(statusChangeUnsubscription.status == 'success')
                            {
                              /* Unsubscribe group user : Start */
                              awsUnsubscriptionOfPushGroup( companyId, ruleId, topicArn, errorFilePath, function(pushUnsubscription){
                                if(pushUnsubscription.status == 'success')
                                {
                                  callbackRemoveNotification(null, null);                             
                                }
                                else
                                {
                                  callbackRemoveNotification(pushUnsubscription.message, null);
                                }
                              })
                              /* Unsubscribe group user : End */
                            }
                            else
                            {
                              callbackRemoveNotification(statusChangeUnsubscription.message, null);
                            }
                          });
                        /* Change Unsubscribe all group stataus : End */
                    /* Unsubscription all group : End */
                }, /******* Remove Push notification : End *******/
                /******* Remove SMS notification : Start *******/
                function(callbackRemoveNotification){
                    awsAllGroupStatusChangeByRuleId( companyId, ruleId, topicArn, '3', function(statusChangeUnsubscription){
                          if(statusChangeUnsubscription.status == 'success')
                          {
                            /* SMS Unsubscribe user group: Start */
                              awsUnsubscriptionOfSMSGroup( companyId, ruleId, topicArn, errorFilePath, function(smsUnsubscription){
                                if(smsUnsubscription.status == 'success') // Success
                                {
                                  callbackRemoveNotification(null, null);
                                }
                                else  // Fail
                                {
                                  callbackRemoveNotification(smsUnsubscription.message, null);
                                }
                              })
                            /* SMS Unsubscribe user group: End */ 
                          }
                          else
                          {
                            callbackRemoveNotification(statusChangeUnsubscription.message, null);
                          }
                        });
                }, /******* Remove SMS notification : End *******/
                /******* Remove Topic : Start *******/
                function(callbackRemoveNotification){
                    awsSubscriber.deleteTopic(topicArn, function(responseRemoveTopic){
                          var responseStatus = responseRemoveTopic.response; /* API Resonse Status */
                          if(responseStatus == 'success')
                          {
                              callbackRemoveNotification(null, null);
                          }
                          else if(responseStatus == 'error')
                          {
                              var responseMessage = responseRemoveTopic.data;
                              callbackRemoveNotification(responseMessage, null);
                          }
                    })
                }
                /******* Remove Topic : End *******/  
              ],

              /******* All Process final response *******/
              function(err, results){
                  if(err)
                  {
                     return callback({status: 'fail' , data: 'AWS unSubscription: Final Process Response', message: err});
                  }
                  else
                  {
                     return callback({status: 'success' , data: 'AWS unSubscription: Final Process Response', message: 'Notification unsubscription successfully completed'});
                  }
              }
            )
          /* unsubscribed all AWS notification : End */
      }
      else /* Not get topic Arn */
      {
        return res.json({ status: 'fail', data: 'AWS unSubscription: Get topic arn', message: awsRemoveRepsonse.message });
      }
   })
}
/* ############### Delete Topic & Subscription : End ############### */

/* ############### Cron Function(s) : Start ############### */

/*
 * @author : GK
 * AWS get SubscriptionArn from AWS
 * Get subscriptionArn from AWS
 * Cron functionality
 */
var awsGetEmailSubscriptionArn = function awsGetEmailSubscriptionArn(callback)
{
  db.models.rule.findAll().then(function(ruleData)
  {
    if(ruleData)
    {
        /* ForEach(1) Rule : Start */
        async.forEachSeries(ruleData, function(rule, callback_f1) {
            var getTopicArn = rule.topic_arn;
            var ruleID = rule.id;
            awsSubscriber.getSubscriptionRecord(getTopicArn, function(awsSubScriptionRecordCallback){
                  if(awsSubScriptionRecordCallback.response == 'success')
                  {
                    var awsRecordData = awsSubScriptionRecordCallback.data.Subscriptions; // Aws record Data
                    /* ForEach(2) AWS Record : Start */
                      async.forEachSeries(awsRecordData, function(awsRecord, callback_f2) {
                            
                            var protocol = awsRecord.Protocol;
                            if(protocol == 'email')
                            {
                               var endPointArn = awsRecord.Endpoint;
                               var subscriptionArn = awsRecord.SubscriptionArn;

                               /* update subscription in DB : End */
                               var subscriptionObj = [];
                                   subscriptionObj = {
                                        subsciption_arn : subscriptionArn
                                   }
                               db.models.aws_user_subscription.update( subscriptionObj, {
                                           where : { rule_id: ruleID, 
                                                     notification_type : '1',
                                                     topic_arn: getTopicArn,
                                                     user_id: db.literal("user_id = (select id from user where email='"+endPointArn+"')")
                                                   }}).then(function(subscriptionUpdate) {
                                        if(subscriptionUpdate)
                                        {
                                            callback_f2();
                                        }
                                        else
                                        {
                                          callback_f2();
                                        }
                               }).catch(function(err) {
                                    //console.log('Error : '+err);
                               });
                               /* update subscription in DB : End */
                            }
                            else
                            {
                              callback_f2();
                            }

                      }, function() {
                          /* ForEach(2) finish and call to ForEach(1) for next loop */ 
                          callback_f1();
                      });
                    /* ForEach(2) AWS Record : End */
                  }
                  else
                  {
                      callback_f1();
                  }
            });
        }, function() {
            // ForEach(1) finish
            callback();
        });
       /* ForEach(1) Rule : End */
    }
    else
    {
      callback();
    }
  }).catch(function(err){
     // Some unknow error
     callback();
  });
}

/*
 * @author : GK
 * AWS Remove Subscription record
 * Remove subscription record who's delete_record status is 2.
 * Cron functionality
 */
var awsRemovePendingSubscribeRecord = function awsRemovePendingSubscribeRecord(callback)
{
    db.models.aws_user_subscription.findAll({ 
              where: { delete_request: '2' },
         }).then(function(unSubscriptionData) {
      if(unSubscriptionData)
      {
          /* ForEach(1) Get unSubscription record : Start */
          async.forEachSeries(unSubscriptionData, function(subscription, callback_f1) {
            var getTopicArn = subscription.topic_arn;
            var subscriptionID = subscription.id;
            var subscriptionArn = subscription.subsciption_arn;
            var notificationType = subscription.notification_type;

            /* Email & Push notification */
           if((notificationType == '1' && subscriptionArn != 'PendingConfirmation' && subscriptionArn != null && subscriptionArn != '') ||
              (notificationType == '2' && subscriptionArn != 'PendingConfirmation' && subscriptionArn != null && subscriptionArn != '')
              )
            {
                  awsSubscriber.unSubscribe(subscriptionArn ,function(unSubscriptionCallback){
                        if(unSubscriptionCallback.response == 'success')
                        {
                                /* Delete record from DB : Start */
                                db.models.aws_user_subscription.destroy({where: { id: subscriptionID, subsciption_arn : subscriptionArn }}).then(function (deleletSubscriptionDetails)
                                 {
                                        if(deleletSubscriptionDetails)
                                        {
                                            //console.log('Success: unSubscribe completed successfully. Subscription Record ID: '+subscriptionID);
                                              callback_f1();
                                        }
                                        else
                                        {
                                            //console.log('Error: unSubscribe completed successfully but record not deleted from database. Subscription Record ID: '+subscriptionID);
                                            callback_f1();
                                        }
                                  }).catch(function(err) {
                                         //console.log('Error :'+ err);
                                         callback_f1();
                                  });
                                /* Delete record from DB : End */                                
                        }
                        else 
                        {
                          //console.log('Error: unSubscribe not completed successfully. Subscription Record ID: '+subscriptionID);
                          callback_f1();
                        }
                  })
            }
            else /* no record match */
            {
                //console.log('Error: Unknow notification type or not get subscriptionArn. Subscription Record ID: '+subscriptionID);
                callback_f1();
            }
          }, function() {
             // ForEach(1) finish
            // Complete: Remove subscribe record process completed successfully.;
            callback();
          });
          /* ForEach(1) Rule : End */
      }
      else
      {
        // Success : No record for delete.
        callback();
      }
    }).catch(function(err){
     // Some unknow error
     //console.log('Error :'+ err);
     callback();
  });
}

/*
 * @author : GK
 * AWS Remove Subscription record
 * Remove subscription record of deleted rules.
 * Cron functionality
 */
var awsRemoveDeletedRulePendingSubscribeRecord = function awsRemoveDeletedRulePendingSubscribeRecord(callback)
{
    db.models.aws_user_subscription.findAll({ 
              where: { delete_request: '2' },
              attributes: Object.keys(db.models.aws_user_subscription.attributes).concat([
                [db.literal('(select count(*) as count from rule where `rule`.`id` = `aws_user_subscription`.`rule_id` and `rule`.`deletedAt` is null )'), 'rulecount']
              ])
         }).then(function(unSubscriptionData) {
      if(unSubscriptionData)
      {
          async.forEachSeries(unSubscriptionData, function(subscription, callback_f1) {

                var ruleCount = subscription.dataValues.rulecount;
                var topicArn = subscription.topic_arn;
                var subscriptionId = subscription.id;

                if(ruleCount == 0) /* Rule deleted (AWS Topic Also) */
                {
                    /* Delete record from DB : Start */
                    db.models.aws_user_subscription.destroy({where: { id: subscriptionId }}).then(function(deleletSubscriptionDetails)
                     {
                            if(deleletSubscriptionDetails)
                            {
                                //console.log('Success: Record deleted successfully. Subscription Record ID: '+subscriptionId);
                                callback_f1();
                            }
                            else
                            {
                                //console.log('Error: Record deleted not deleted from database. Subscription Record ID: '+subscriptionId);
                                callback_f1();
                            }
                      }).catch(function(err) {
                             callback_f1();
                      });
                    /* Delete record from DB : End */
                }
                else  /* Rule present */
                {
                    callback_f1();
                }
           }, function() {
             // ForEach(1) finish
             // Complete: Remove subscribe record process completed successfully.
            callback();
          });
      }
      else
      {
        // Success : No record for delete.
        callback();
      }
    }).catch(function(err){
     // Some unknow error
     callback();
  });
}

/* ############### Cron Function(s) : End ############### */

/* ############### User Notification Function(s) : Start ############### */

/*
 * @author : GK
 * User Subscription :
 * User notification subscription/unsubscription functionality
 * @param : userId : User ID
 * @param : companyId : Company ID
 */
var awsUserSubscriptionAndUnSubscriptionByUserId = function awsUserSubscriptionAndUnSubscriptionByUserId(userId, companyId, callback)
{
    async.waterfall(
    [
        // 1. Get Subscribe User Group
        function(callback_wt) { // Get subscribe Group data : Strat
              
              db.models.company_user_group.findAll( { where: { user_id: userId } } ).then(function(groupRecord) {
                if(groupRecord)
                {
                   var groupData = [];
                   // ForEach(1) Start
                     async.forEachSeries(groupRecord, function(group, callback_f1) {
                          groupData.push(group.company_group_id);
                          callback_f1();
                     }, function() {
                          callback_wt(null, groupData); //ForEach(1) finish 
                          //Group record: Record found
                    });
                }
                else
                {
                   var groupData = [];
                   callback_wt(null, groupData);
                     //Group record: Record not found
                }
              }).catch(function(err) { // Some Error 
                  callback_wt(err, 'User Subscription: Get user group record');
              });
            
        }, // Get subscribe Group data: End

        // 2. Check User Status
        function(groupData, callback_wt) { // Check User Status : Start

            db.models.user.findOne( { where: { id: userId } } ).then(function(user_record_callback) {
                if(user_record_callback)
                {
                    var get_user_status = user_record_callback.active; // User Status : true / false
                    callback_wt(null, groupData, get_user_status);
                }
                else
                {
                   callback_wt('User record not found', 'User Subscription: Get User Record');
                }
              }).catch(function(err) { // Some Error 
                  callback_wt(err, 'User Subscription: Get User Record');
              });  

        }, // Check User Status : End

        // 3. Subscription / Unsubscription Notification Process 
        function(groupData, userStatus, callback_wt) { // Process Series for subscription/Unsubscription process : Start
                
            if(userStatus)
            {
                // USER ACTIVE
                async.series([
                        
                        // 1. Unsubscription Process
                        function(callback_ser){ // Unsubscribe Process : Start
                            
                            //console.log('###### Active: 1. User unsubscription Process');
                            awsUserUnSubscriptionByUserId(userId, companyId, groupData, function(callback_unsub){
                                  callback_ser(null);
                            });
                            
                        }, // Unsubscribe Process : End
                        // 2. Subscription Process
                        function(callback_ser){ // Subscribe Process : Start
                            //console.log('###### Active: 2. User subscription Process');
                            awsUserSubscriptionByUserId(userId, companyId, groupData, function(callback_sub){
                                  callback_ser(null);
                            });
                        } // Subscribe Process : End
               ],
               function(err, results){ // Final Series Process complete
                       //console.log(' Active: Subscription / Unsubscription Process has been completed');
                       callback_wt(null);
                 }
               )
            }
            else
            {
               // USER NOT ACTIVE
               async.series([
                        
                        // 1. Unsubscription Process
                        function(callback_ser){ // Unsubscribe Process : Start
                            
                            //console.log('###### Not Active: 1. User unsubscription Process');
                            awsUserUnSubscriptionByUserId(userId, companyId, [], function(callback_unsub){

                                  // Delete device Record
                                  awsDeleteUserMobileDeviceByUserId( userId, function(deviceDelete_callback){
                                        //console.log(deviceDelete_callback);
                                        callback_ser(null);
                                  })
                                 
                            });
                            
                        } // Unsubscribe Process : End
               ],
               function(err, results){ // Final Series Process complete
                       //console.log(' Not Active: Unsubscription Process has been completed');
                       callback_wt(null);
                 }
               )
            }
            
        }  // Process Series for subscription/Unsubscription process : End
    ],
     function (err, data) { // Final Waterfall Process complete
           //console.log('Error :'+err)
           //console.log('Data :'+data);
           // User AWS notification subscription all process complete.
           if(err)
           {
              callback({ 
                  status: 'fail',
                  data: err,
                  message: 'User notification subscription/unsubscription process has not been completed successfully'
              });
           }
           else
           {
              callback({ 
                  status: 'success',
                  data: null,
                  message: 'User notification subscription/unsubscription process has been completed successfully'
              });
           }
     }
    );
}

/*
 * @author : GK
 * User Subscription :
 * User notification unsubcription process
 * @param : userId : User ID
 * @param : companyId : Company ID
 * @param : groupData : Group Data Array. [10,20,30,...] 
 */
var awsUserUnSubscriptionByUserId = function awsUserUnSubscriptionByUserId(userId, companyId, groupData, callback)
{
  /* #### Start Unsubscription Process : Start */
    
    async.waterfall(
    [
      
      function(callback_wt) { // Get Subscription record : Start
            //console.log('#### 1.1. Unsubscription Get Subscription Records');
            db.models.aws_user_subscription.findAll( { where: { user_id: userId, delete_request: '1' } } ).then(function(subscriptionRecord) {
                if(subscriptionRecord)
                {
                   callback_wt(null, subscriptionRecord); // Record found
                }
                else
                {
                   callback_wt(null, null); //User Notification: Record not found
                }
              }).catch(function(err) { // Some Error 
                  callback_wt(err, 'User Unsubscription : Get subscription record');
              });
            
      }, // Get Subscription record : End

      function(subsRecord, callback_wt) { // Check subscription record with group : Start
            //console.log('#### 1.2. Check subscription record');
            /* forEach(1) Start */
              async.forEachSeries(subsRecord, function(subscription, callback_f1) {
                        var companyGroupId = subscription.company_group_id; // Group Id
                        if(groupData.indexOf(companyGroupId) >= 0) // Record Found
                        {
                            callback_f1(); 
                            // This user is subscribe for this group.
                        }
                        else // Record not found
                        {
                            var user_id = subscription.user_id; // User ID
                            var rule_id = subscription.rule_id; // Rule Id
                            var subscription_arn = subscription.subsciption_arn; // Aws subscription Arn
                            var subscription_record_id = subscription.id; // Subscription record Id
                            var notification_type = subscription.notification_type; // Notification Type
                            /* Per user unsubscription process : Start */
                              if(notification_type == '1') // Email
                              {
                                awsUserEmailUnSubscriptionProcess(user_id, companyGroupId, rule_id, companyId, subscription_arn, subscription_record_id, function(callback_userUnSub){
                                      callback_f1();
                                });
                              }
                              else if(notification_type == '2') // Push
                              {
                                var device_type = subscription.device_type; // Device Type
                                awsUserPushUnSubscriptionProcess(user_id, companyGroupId, rule_id, companyId, subscription_arn, subscription_record_id, device_type, function(callback_userUnSub){
                                      callback_f1();
                                });
                              }
                              else if(notification_type == '3') // SMS
                              {
                                awsUserSMSUnSubscriptionProcess(user_id, companyGroupId, rule_id, companyId, subscription_arn, subscription_record_id, function(callback_userUnSub){
                                      callback_f1();
                                });
                              }
                              else
                              {
                                  callback_f1();
                              }
                            /* Per user unsubscription process : End */
                        }
                    
              }, function() {
                callback_wt(null); // ForEach(1) finish
             });
          /* forEach(1) End */
      } // Check subscription record with group : End

    ],
    function (err, caption) { // Final Call back of waterfall
           return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription Process', message: 'Process completed successfully' });
        }
    );
}

/*
 * @author : GK
 * User Subscription :
 * Email unsubscription functionality of user
 * @param : userId : User ID
 * @param : groupId : Group ID
 * @param : ruleId : Rule ID
 * @param : companyId : Company ID
 * @param : subscriptionArn : AWS SubscriptionArn
 * @param : subscriptionRecordId : Subscription Registred record Id
 */
var awsUserEmailUnSubscriptionProcess = function awsUserEmailUnSubscriptionProcess(userId, groupId, ruleId, companyId, subscriptionArn, subscriptionRecordId, callback)
{
    // ## EMAIL PROCESS
    
   db.query('SELECT id FROM aws_user_subscription WHERE user_id = :userId AND rule_id = :ruleId AND NOT (`company_group_id` IN ( :groupId )) AND notification_type = "1"',
        { replacements: { userId: userId, ruleId: ruleId, groupId: groupId }, type: db.QueryTypes.SELECT }
    ).then(function(groupUserData)
    {
        if(groupUserData.length == 0) // No record in other group for this user
        {
              if(subscriptionArn != 'pending confirmation' && subscriptionArn != 'PendingConfirmation')
              {
                  /* AWS unsubscription : Start */
                      awsSubscriber.unSubscribe( subscriptionArn, function(awsUnsubscriptionResponse){
                          if(awsUnsubscriptionResponse.response == 'success') // unsubscription process success
                          {
                             /* Delete user from DB : Start */
                             db.models.aws_user_subscription.destroy({
                                  where: ["`id` =  ? ", subscriptionRecordId]
                                  }).then(function (deleletSubscription)
                             {
                                  if(deleletSubscription)
                                  {
                                      return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and remove record', message: 'Process completed successfully' });
                                  }
                                  else
                                  {
                                      return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and remove record', message: 'Process completed successfully' });
                                  }
                             })
                            /* Delete user from DB : End */
                          }
                          else  // unsubscription process not successed
                          {
                             /* If error rersponse generate in aws Unscription API */ 
                             var errorMsg = 'Email notification : This '+userGroupData.email+' address not unSubscribe successfully. \n';
                             
                             /* update record in database : start */
                                 var awsSubscriptionDataObj = [];
                                 awsSubscriptionDataObj = {
                                              delete_request : "2"
                                      }
                                 db.models.aws_user_subscription.update( awsSubscriptionDataObj, {
                                     where : { id: subscriptionRecordId } 
                                     }).then(function(userUnsubs) {
                                          if(userUnsubs)
                                          {
                                              // Noting action
                                              return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process completed successfully' });
                                          }
                                          else
                                          {
                                              // Some Error
                                              var errorMsg = 'Process not completed successfully';

                                              return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process not completed successfully' });
                                          }
                                      }).catch(function(err)
                                      {
                                          // Some error
                                          return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process not completed successfully' });
                                      });
                            /* update record in database : End */
                          }
                      })
                  /* AWS unsubscription : End */
              }
              else
              {
                 /* update record in database : start */
                     var awsSubscriptionDataObj = [];
                     awsSubscriptionDataObj = {
                                  delete_request : "2"
                          }
                     db.models.aws_user_subscription.update( awsSubscriptionDataObj, {
                         where : { id: subscriptionRecordId } 
                         }).then(function(userUnsubs) {
                              if(userUnsubs)
                              {
                                  // Noting action
                                  return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process completed successfully' });
                              }
                              else
                              {
                                  // Some Error
                                  var errorMsg = 'Process not completed successfully';

                                  return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process not completed successfully' });
                              }
                          }).catch(function(err)
                          {
                              // Some error
                              return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process not completed successfully' });
                          });
                /* update record in database : End */
              }
        }
        else // Record in other group for this user
        {
           /* Delete user from DB : Start */
             db.models.aws_user_subscription.destroy({
                  where: ["`id` =  ? ", subscriptionRecordId]
                  }).then(function (deleletSubscription)
             {
                  if(deleletSubscription)
                  {
                      return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and remove record', message: 'Process completed successfully' });
                  }
                  else
                  {
                      return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and remove record', message: 'Process completed successfully' });
                  }
             })
          /* Delete user from DB : End */
        }
    }).catch(function(err) { // Some Error
         return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process not completed successfully' });
    });
}

/*
 * @author : GK
 * User Subscription :
 * Push Notification unsubscription functionality of user
 * @param : userId : User ID
 * @param : groupId : Group ID
 * @param : ruleId : Rule ID
 * @param : companyId : Company ID
 * @param : subscriptionArn : AWS SubscriptionArn
 * @param : subscriptionRecordId : Subscription Registred record Id
 * @param : device_type : Device Type
 */
var awsUserPushUnSubscriptionProcess = function awsUserPushUnSubscriptionProcess(userId, groupId, ruleId, companyId, subscriptionArn, subscriptionRecordId, device_type, callback)
{

    // Check same user subscribe in other group
    db.query('SELECT id FROM aws_user_subscription WHERE user_id = :userId AND rule_id = :ruleId AND NOT (`company_group_id` IN ( :groupId )) AND notification_type = "2" AND device_type = :deviceType',
        { replacements: { userId: userId, ruleId: ruleId, groupId: groupId, deviceType : device_type }, type: db.QueryTypes.SELECT }
    ).then(function(groupUserData)
    {
        if(groupUserData.length == 0) // No record in other group for this user in same rule
        {
              // Check same subscriptionArn for other user in same rule
              db.models.aws_user_subscription.findAll({
                      where: ["subsciption_arn = ? AND rule_id = ? AND device_type = ? AND id != ? AND notification_type = 2", subscriptionArn, ruleId, device_type, subscriptionRecordId]
                      }).then(function (sameRecordSubscptn)
                      {
                         if(sameRecordSubscptn.length == 0) // Zero record found
                         {
                           /* unsubscription & delete record : Start */
                             awsSubscriber.unSubscribe( subscriptionArn, function(awsUnsubscriptionResponse){
                                    if(awsUnsubscriptionResponse.response == 'success') // Unsubscribe Successfully
                                    {
                                       /* Delete user from DB : Start */
                                         db.models.aws_user_subscription.destroy({
                                              where: ["`id` =  ? ", subscriptionRecordId]
                                              }).then(function (deleletSubscription)
                                         {
                                              if(deleletSubscription)
                                              {
                                                  return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and remove record', message: 'Process completed successfully' });
                                              }
                                              else
                                              {
                                                  return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and remove record', message: 'Process completed successfully' });
                                              }
                                         });
                                      /* Delete user from DB : End */
                                    }
                                    else // Unsubscribe not Successfully
                                    {
                                       var errorMsg = 'Subscription process not completed successfully.'; 

                                       /* Update record delete status: Start */
                                       var awsSubscriptionDataObj = [];
                                       awsSubscriptionDataObj = {
                                                    delete_request : "2"
                                            }
                                       db.models.aws_user_subscription.update( awsSubscriptionDataObj, {
                                           where : { id: subscriptionRecordId } 
                                           }).then(function(userUnsubs) {
                                              if(userUnsubs)
                                              {
                                                 // Noting action
                                                  return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process completed successfully' });
                                              }
                                              else
                                              {
                                                 // Some Error
                                                var errorMsg = 'Process not completed successfully';

                                                return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process not completed successfully' });
                                              }
                                          }).catch(function(err) 
                                          {
                                               // Some error
                                                return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process not completed successfully' });
                                          })
                                         /* Update record delete status: End */   
                                    }
                                })
                           /* unsubscription & delete record : End */  
                         }
                         else // Record found
                         {
                            /* Delete user from DB : Start */
                               db.models.aws_user_subscription.destroy({
                                    where: ["`id` =  ? ", subscriptionRecordId]
                                    }).then(function (deleletSubscription)
                               {
                                    if(deleletSubscription)
                                    {
                                        return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and remove record', message: 'Process completed successfully' });
                                    }
                                    else
                                    {
                                        return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and remove record', message: 'Process completed successfully' });
                                    }
                               });
                            /* Delete user from DB : End */ 
                         }
                      })
        }
        else // this user subscribe in other group for same rule
        {
            /* Delete user from DB : Start */
               db.models.aws_user_subscription.destroy({
                    where: ["`id` =  ? ", subscriptionRecordId]
                    }).then(function (deleletSubscription)
               {
                    if(deleletSubscription)
                    {
                        return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and remove record', message: 'Process completed successfully' });
                    }
                    else
                    {
                        return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and remove record', message: 'Process completed successfully' });
                    }
               });
            /* Delete user from DB : End */ 
        }
    }).catch(function(err) { // Some Error
        return callback({ status: 'success', data: 'AWS user unsubscription: Unsubscription and update record status', message: 'Process not completed successfully' });
    });
}

/*
 * @author : GK
 * User Subscription :
 * SMS Notification unsubscription functionality of user
 * @param : userId : User ID
 * @param : groupId : Group ID
 * @param : ruleId : Rule ID
 * @param : companyId : Company ID
 * @param : subscriptionArn : AWS SubscriptionArn
 * @param : subscriptionRecordId : Subscription Registred record Id
  */
var awsUserSMSUnSubscriptionProcess = function awsUserSMSUnSubscriptionProcess(userId, groupId, ruleId, companyId, subscriptionArn, subscriptionRecordId, callback)
{
   
   db.query('SELECT id FROM aws_user_subscription WHERE user_id = :userId AND rule_id = :ruleId AND NOT (`company_group_id` IN ( :groupId )) AND notification_type = "3"',
        { replacements: { userId: userId, ruleId: ruleId, groupId: groupId }, type: db.QueryTypes.SELECT }
    ).then(function(groupUserData)
    {
        if(groupUserData.length == 0) // No same subscribe record found in other Groups, Process for unsubscription
        {
            /* AWS unsubscription : Start */
                awsSubscriber.unSubscribe( subscriptionArn, function(awsUnsubscriptionResponse){
                      if(awsUnsubscriptionResponse.response == 'success') // unsubscription process success
                      {
                         // Delete subscription record from DB
                         db.models.aws_user_subscription.destroy({
                              where: ["`id` =  ? ", subscriptionRecordId]
                              }).then(function (deleletSubscription)
                         {
                              return callback({ status: 'success', data: 'AWS user SMS unsubscription', message: 'SMS unsubscription process has been successfully completed' });
                         })
                        /* Delete user from DB : End */
                      }
                      else // Unsubscription process unsuccessfull
                      {
                          var awsSMSDataObj = [];
                              awsSMSDataObj = {
                                  delete_request : "2"
                                }

                          db.models.aws_user_subscription.update( awsSubscriptionDataObj, {
                                     where : { id: subscriptionRecordId } 
                                     }).then(function(userUnsubs) {
                                          if(userUnsubs)
                                          {
                                              return callback({ status: 'success', data: 'AWS user SMS unsubscription', message: 'SMS unsubscription process has been successfully completed' });
                                          }
                                          else
                                          {
                                              return callback({ status: 'success', data: 'AWS user SMS unsubscription', message: 'SMS unsubscription process has been successfully completed' });
                                          }
                          }).catch(function(err)
                          {
                              // Some error
                              return callback({ status: 'fail', data: err, message: 'SMS unsubscription process has not been successfully completed' });
                          });
                      }
                })
            /* AWS unsubscription : End */
        }
        else // same subscribe record found in other Groups, Delete record only
        {
          // Delete subscription record from DB
          db.models.aws_user_subscription.destroy({
                where: ["`id` =  ? ", subscriptionRecordId]
                }).then(function (deleletSubscription)
           {
                return callback({ status: 'success', data: 'AWS user SMS unsubscription', message: 'SMS unsubscription process has been successfully completed' });
           })
        }

    }).catch(function(err) { // Some Error
         return callback({ status: 'fail', data: err, message: 'SMS unsubscription process has not been successfully completed' });
    });
}

/*
 * @author : GK
 * User Subscription :
 * User subscription functionality of all rule where group subscribe
 * @param : userId : User ID
 * @param : companyId : Company ID
 * @param : groupData : Group id list Data array [10,20,30,...]
 */
var awsUserSubscriptionByUserId = function awsUserSubscriptionByUserId(userId, companyId, groupData, callback)
{
    // Get rule id list accrding to group : Start
     db.models.aws_group_subscription.findAll( { 
            where: {
                 status: '2',
                 company_group_id: {
                    $in: [groupData]
                 }
             },
            raw : true
      }).then(function(groupSubList) {

            if(groupSubList)
            {
                /* Group record forEach(1) : Start */
                async.forEachSeries(groupSubList, function(group, callback_f1) {
                        
                        var groupId = group.company_group_id; // Company Group Id
                        var ruleId = group.rule_id; // Rule Id
                        var notificationType = group.notification_type; // Notification Type

                        if(notificationType != '' && ruleId != '' && notificationType != '' )
                        {
                            // Check Subscription Status
                            awsCheckUserSubscriptionStatus( userId, ruleId, notificationType, groupId ,function(checkStatus){
                                    if(checkStatus.status == 'success')
                                    {
                                       var subData = checkStatus.data;
                                       if(notificationType == '1') // Email Subscription Process
                                       {
                                            if(subData.length > 0) // Alreday Subscribe
                                            {
                                                callback_f1();
                                            }
                                            else
                                            {
                                                awsUserEmailSubscriptionProcess(userId, ruleId, groupId, function(emailSubscription){
                                                   callback_f1();
                                                });
                                             }
                                       }
                                       else if(notificationType == '2') // Push Subscription Process
                                       {
                                          awsUserPushSubscriptionProcess(userId, ruleId, groupId, companyId, function(pushSubscription){
                                                callback_f1();
                                          })
                                       }
                                       else if(notificationType == '3') // SMS Subscription Process
                                       {
                                          if(subData.length > 0) // Alreday Subscribe
                                          {
                                            awsUserSMSEndPointChange( ruleId, userId, groupId, companyId, function(response_updateValue){
                                                callback_f1();
                                            });
                                            
                                          }
                                          else
                                          {
                                            awsUserSMSSubscriptionProcess(userId, ruleId, groupId, function(smsSubscription){
                                                callback_f1();
                                            });
                                          }
                                       }
                                       else
                                       {
                                           callback_f1();
                                       }
                                    }
                                    else
                                    {
                                        callback_f1();
                                    }
                                    
                            });
                        }
                        else
                        {
                            // Validation False
                            callback_f1();  
                        }

                  }, function() {
                     // ForEach(1) finish
                    // Complete: Subscribe record process completed successfully.
                    return callback({status: 'Success' , data: 'AWS user subscription: Group user subscription process completed successfully', message: 'Process completed successfully'});
                });
            }
            else
            {
               return callback({status: 'success' , data: 'AWS user subscription: Get group subscription rule Id(s) record', message: 'Process completed successfully'});
            }

      }).catch(function(err) {
          return callback({status: 'fail' , data: 'AWS user subscription: Get group subscription rule Id(s) record', message: 'Process not completed successfully'});
      });
    // Get rule id list accrding to group : End
}

/*
 * @author : GK
 * User Subscription :
 * Push notification user subscription functionality
 * @param : userId : User ID
 * @param : ruleId : Rule ID
 * @param : groupId : Group ID
 * @param : companyId : Company ID
 */
var awsUserPushSubscriptionProcess =  function awsUserPushSubscriptionProcess(userId, ruleId, groupId, companyId, callback)
{
    async.waterfall(
      [
          function(callback_wt) // ## 1. Get AWS Application Data
          {
             awsGetApplicationData(companyId, function(applicationData){
                var appData = applicationData.data;
                var androidAWSapp = appData.android_aws_app_data;
                var iosAWSapp = appData.ios_aws_app_data;
                callback_wt(null, androidAWSapp, iosAWSapp);
             });
          },
          function(androidAppData, iosAppData, callback_wt) // ## 2. Get Topic Arn
          {

              db.query('SELECT * FROM rule where id = :ruleId',
                  { replacements: { ruleId: ruleId }, type: db.QueryTypes.SELECT }
              ).then(function(recordData)
              {
                  if(recordData)
                  {
                      if(recordData.length > 0)
                      {
                          var topicArn = recordData[0].topic_arn; // Rule TopicArn
                          callback_wt(null, androidAppData, iosAppData, topicArn); 
                      }
                      else
                      {
                        callback_wt('Rule id : '+ruleId+'\'s not found');
                      }
                  }
              })
          },
          function(androidAppData, iosAppData, topicArn, callback_wt) // ## 3. AWS Application Endpoint Registration
          {

            // AWS IOS & Android Application    
            var androidApplicationArn = null;
            var iosApplicationArn = null;

            // Android
            if(androidAppData != '' && androidAppData != null )
            {
              var androidAppDataParse = JSON.parse(androidAppData);  
              if(androidAppDataParse != null && androidAppDataParse != '')
              {
                androidApplicationArn = androidAppDataParse.appAwsArn; // Andriod App
              }
            }
            
            // IOS
            if(iosAppData != '' && iosAppData != null)
            {
              var iosAppDataParse = JSON.parse(iosAppData);
              if(iosAppDataParse != null && iosAppDataParse != '')
              {
                iosApplicationArn = iosAppDataParse.appAwsArn; // IOS App
              }
            }

            //Get Registered Device List Id and check user subscribe or not
            db.query('select *, ( select count(*) from aws_user_subscription where user_id = :userId and notification_type = "2" and rule_id = :ruleId and topic_arn = :topicArn and application_endpoint_arn = mobileDevice.aws_application_endpoint_arn and device_type = mobileDevice.type and company_group_id = :groupId ) as subCount from mobile_device as mobileDevice where user_id = :userId',
                { replacements: { userId: userId, ruleId: ruleId, topicArn: topicArn, groupId: groupId }, type: db.QueryTypes.SELECT }
            ).then(function(subscriptionData)
            {
                if(subscriptionData)
                {
                   // Foreach(1) Start
                   async.forEachSeries(subscriptionData, function(subscription, callback_f1) {
                              
                          var ubscriptionCount = subscription.subCount; // Subscription Count
                          var mobileDeviceRecordId = subscription.id; // Record Id
                          var pushToken = subscription.push_token; // Device Id
                          var deviceType = subscription.type; // Device Type
                          var awsApplicationEndPoint = subscription.aws_application_endpoint_arn; // AWS application endpoint

                          if(awsApplicationEndPoint == '' || awsApplicationEndPoint == null) // AWS endpoint Empty
                          {
                              var applicationArn = '';
                              if (
                                  (deviceType == '1' && iosApplicationArn != null && iosApplicationArn != '') ||
                                  (deviceType == '2' && androidApplicationArn != null && androidApplicationArn != '')
                                  ) // Check Device Type Condition
                              {
                                    if(deviceType == '1') // IOS App
                                    {
                                        applicationArn = iosApplicationArn;
                                    }
                                    else if(deviceType == '2') // Android App
                                    {
                                        applicationArn = androidApplicationArn
                                    }
                                      
                                    var custom_userInformation = 'COMPANY ID:'+companyId;
                                    // Create AWS endPoint for Application : Start
                                    awsSubscriber.createPlatformEndpoint(applicationArn, pushToken, custom_userInformation, function(endPointRegResponse){
                                          var responseMessage = endPointRegResponse.data;
                                          if(endPointRegResponse.response == 'success') /* endPoint Application created successfully */
                                          {
                                              var new_endPointArn = responseMessage.EndpointArn;
                                              var mobileDataObj = [];
                                                  mobileDataObj = {
                                                        aws_application_endpoint_arn : new_endPointArn
                                                      }

                                              // Update record in Mobile_device Table
                                              db.models.mobile_device.update( mobileDataObj, {
                                                       where : { id: mobileDeviceRecordId }
                                                       }).then(function(mobileDevice) {
                                              if(mobileDevice)
                                              {
                                                  callback_f1();
                                                  // Device Endpoint information updated in DB
                                              }
                                              else /* Not update record */
                                              {
                                                callback_f1();
                                              }
                                             }).catch(function(err) {
                                                callback_f1();
                                             });
                                          }
                                          else
                                          {
                                              callback_f1();
                                          }
                                      }) // Create AWS endPoint for Application : End
                              }
                              else // Device Type not found OR Application not register
                              { 
                                  callback_f1();
                              }
                          }
                          else
                          {
                            callback_f1();
                          }
                              
                   }, function() {
                      //ForEach(1) finish
                      callback_wt(null, topicArn, androidAppData, iosAppData); 
                  });
                }
                else
                {
                  callback_wt(null, null, androidAppData, iosAppData); 
                }

            }).catch(function(err) {
                callback_wt(null, null, androidAppData, iosAppData);
            });

          },
          function(topicArn, androidAppData, iosAppData, callback_wt) // ## 4. Subscription Process
          {

            if(topicArn != null && topicArn != '')
            {
                  // AWS IOS & Android Application    
                  var androidApplicationArn = '';
                  var iosApplicationArn = '';

                  // Android
                  if(androidAppData != '' && androidAppData != null)
                  {
                    var androidAppDataParse = JSON.parse(androidAppData);
                    if(androidAppDataParse != null && androidAppDataParse != '')
                    {
                      androidApplicationArn = androidAppDataParse.appAwsArn; // Andriod App
                    }
                  }
                  // IOS
                  if(iosAppData != '' && iosAppData != null)
                  {
                    var iosAppDataParse = JSON.parse(iosAppData);
                    if(iosAppDataParse != null && iosAppDataParse != '')
                    {
                      iosApplicationArn = iosAppDataParse.appAwsArn; // IOS App
                    }
                  }

                  //Get Registered Device List Id and check user subscribe or not
                  db.query('select *, ( select count(*) from aws_user_subscription where user_id = :userId and notification_type = "2" and rule_id = :ruleId and topic_arn = :topicArn and application_endpoint_arn = mobileDevice.aws_application_endpoint_arn and device_type = mobileDevice.type and company_group_id = :groupId ) as subCount from mobile_device as mobileDevice where user_id = :userId',
                      { replacements: { userId: userId, ruleId: ruleId, topicArn: topicArn, groupId: groupId }, type: db.QueryTypes.SELECT }
                  ).then(function(subscriptionData)
                  {
                      if(subscriptionData) // Get Data
                      {
                          // ForEach(1) Start
                          async.forEachSeries(subscriptionData, function(subscription, callback_f1) {
                              
                              var ubscriptionCount = subscription.subCount; // Subscription Count
                              
                              if(ubscriptionCount > 0)
                              {
                                 callback_f1(); // Already Subscibe
                              }
                              else // Not Registered, Process for registration
                              {
                                 var awsApplicationEndPoint = subscription.aws_application_endpoint_arn; // AWS application endpointArn
                                 var deviceType = subscription.type; // Device Type

                                if(awsApplicationEndPoint != '' && awsApplicationEndPoint != null) // Endpoint Not Empty
                                {
                                      var applicationArn = '';
                                      if(deviceType == '1' && iosApplicationArn != '') // IOS App
                                      {
                                          applicationArn = iosApplicationArn;
                                      }
                                      else if(deviceType == '2' && androidApplicationArn != '') // Android App
                                      {
                                          applicationArn = androidApplicationArn
                                      }

                                      if(applicationArn != '') // applicationArn not Empty
                                      {
                                         // Push Subscription Process
                                         awsSubscriber.pushSubscription( topicArn, awsApplicationEndPoint, function(pushSubscriptionResponse){
                                                var responseMessage = pushSubscriptionResponse.data;
                                                if(pushSubscriptionResponse.response == 'success') // Success Message
                                                {
                                                    var awsSubscriptionArn = responseMessage.SubscriptionArn;
                                                    var awsSubscriptionRequestId = responseMessage.ResponseMetadata.RequestId;
                                                    
                                                    var awsSubscriptionTemp = []
                                                        awsSubscriptionTemp = {
                                                                   user_id : userId,
                                                                   rule_id : ruleId,
                                                                   company_group_id : groupId,
                                                                   notification_type : '2',
                                                                   device_type : deviceType,
                                                                   topic_arn : topicArn,
                                                                   subsciption_arn : awsSubscriptionArn,
                                                                   application_endpoint_arn : awsApplicationEndPoint,
                                                                   application_arn : applicationArn
                                                            }

                                                            /* Insert Subscription record in DB : Start */
                                                            db.models.aws_user_subscription.create(awsSubscriptionTemp).then(function(awsSubscriptionInsert) {
                                                                if(awsSubscriptionInsert) /* Success */
                                                                {
                                                                  // Record inserted successfully
                                                                  callback_f1();
                                                                }
                                                                else /* Not Sucess */
                                                                {
                                                                  // Record not inserted successfully
                                                                  callback_f1();
                                                                }
                                                            }).catch(function(err){
                                                                  callback_f1();
                                                            });
                                                            /* Insert Subscription record in DB : End */
                                                }
                                                else // Fail Response
                                                {
                                                    callback_f1();
                                                }
                                         })
                                       }
                                       else
                                       {
                                          callback_f1();
                                       }
                                }
                                else
                                {
                                  callback_f1();
                                }
                              }
                          }, function() {
                              callback_wt(null, topicArn); 
                          });
                      }
                      else // Some unknow error
                      {
                        callback_wt(null, 'Some unknown error');
                      }

                  }).catch(function(err) {
                      callback_wt(null, 'Some unknown error');
                  });
            }
            else // TopicArn is null
            {
                callback_wt(null, 'Topic Arn is null or blank');
            }
          }
      ],
    function (err, data) {
          // Push notification final completed
          if(err != null) // Some Error
          {
              return callback({status: 'fail' , data: 'AWS user subscription: Push AWS Subscription Process', message: 'User subscribe processed not completed because of some reasons'});
          }
          else // Not Error, Success
          {
              return callback({status: 'success' , data: 'AWS user subscription: Push AWS Subscription Process', message: 'User push subcription processed successfully'});
          }
     }
    );
}

/*
 * @author : GK
 * User Subscription :
 * Email notification user subscription functionality
 * @param : userId : User ID
 * @param : ruleId : Rule ID
 * @param : groupId : Group ID
 */
var awsUserEmailSubscriptionProcess =  function awsUserEmailSubscriptionProcess(userId, ruleId, groupId, callback)
{ 

    db.query('SELECT * FROM user, rule where user.id = :userId AND rule.id = :ruleId',
        { replacements: { userId: userId, ruleId: ruleId }, type: db.QueryTypes.SELECT }
    ).then(function(recordData)
    {
        if(recordData)
        {
            if(recordData.length > 0)
            {
                var topicArn = recordData[0].topic_arn; // Rule TopicArn
                var userEmail = recordData[0].email; // User's email Address
                if(userEmail != '' && topicArn != '')
                {
                  // AWS email subscription Process
                  awsSubscriber.emailSubscription(topicArn, userEmail, function(emailSubscriptionResponse){
                        var responseStatus = emailSubscriptionResponse.response; /* API Resonse Status */
                        var responseMessage = emailSubscriptionResponse.data; /* API Reponse Message */

                        if(responseStatus == 'success')
                        {
                           var awsReqId = responseMessage.ResponseMetadata.RequestId; // AWS request ID
                           var awsScriptionArn = responseMessage.SubscriptionArn; // SubscriptionArn
                            
                            // Insert record in Db : Start
                              var emailSubDataObj = [];
                                  emailSubDataObj = { 
                                        user_id : userId,
                                        rule_id : ruleId,
                                        company_group_id: groupId,
                                        notification_type : '1',
                                        topic_arn : topicArn,
                                        subsciption_arn : awsScriptionArn
                                      }
                              db.models.aws_user_subscription.create(emailSubDataObj).then(function(awsSubscriptionInsert) {
                                  if(awsSubscriptionInsert)
                                  {
                                      /* Delete (delete_request = 2) record for this rule From DB: Start */
                                          db.models.aws_user_subscription.destroy({
                                                where: { user_id : userId,
                                                         rule_id : ruleId,
                                                         notification_type : '1',
                                                         topic_arn : topicArn,
                                                         delete_request : '2'
                                                 }
                                                }).then(function (deleletOldSubscription)
                                                {
                                                  if(deleletOldSubscription)
                                                  {
                                                    return callback({status: 'success' , data: 'AWS user subscription: Email AWS Subscription Process', message: 'User subscribe and remove old data successfully processed'});
                                                  }
                                                  else
                                                  {
                                                    return callback({status: 'fail' , data: 'AWS user subscription: Email AWS Subscription Process', message: 'User subscribe successfully processed but old data remove processed not completed'});
                                                  }
                                                })
                                      /* Delete (delete_req = 2) record for this rule From DB :End */
                                  }
                                  else /* Not Success */
                                  {
                                     return callback({status: 'fail' , data: 'AWS user subscription: Email AWS Subscription Process', message: 'User not subscribe data not inserted in database'});
                                  }
                              }).catch(function(err){
                                   return callback({status: 'fail' , data: 'AWS user subscription: Email AWS Subscription Process', message: 'User not subscribe data not inserted in database'});
                              });
                          // Insert record in Db : End
                        }
                        else
                        {
                          return callback({status: 'fail' , data: 'AWS user subscription: Email AWS Subscription Process', message: 'User not subscribe in AWS'});
                        }
                  })
                }
                else
                {
                   return callback({status: 'fail' , data: 'AWS user subscription: Email Subscription Process', message: 'User basic record not found'});
                }
            }
            else
            {
                return callback({status: 'fail' , data: 'AWS user subscription: Email Subscription Process', message: 'User basic record not found'});
            }
        }
        else
        {
          return callback({status: 'fail' , data: 'AWS user subscription: Email Subscription Process', message: 'User email Subscription process not completed successfully'});
        }

    }).catch(function(err) {
        return callback({status: 'fail' , data: 'AWS user subscription: Email Subscription Process', message: 'User email Subscription process not completed successfully'});
    });

}

/*
 * @author : GK
 * User Subscription :
 * SMS notification user subscription functionality
 * @param : userId : User ID
 * @param : ruleId : Rule ID
 * @param : groupId : Group ID
 */
var awsUserSMSSubscriptionProcess =  function awsUserSMSSubscriptionProcess(userId, ruleId, groupId, callback)
{ 
    db.query('SELECT * FROM user, rule where user.id = :userId AND rule.id = :ruleId',
        { replacements: { userId: userId, ruleId: ruleId }, type: db.QueryTypes.SELECT }
    ).then(function(recordData)
    {
        if(recordData)
        {
          if(recordData.length > 0)
          {
              var topicArn = recordData[0].topic_arn; // Rule TopicArn
              var phoneCode = recordData[0].phonecode;  // User's Phone code
              var phoneNumber = recordData[0].phone;  // User's Phone Number
              if(phoneCode != '' && phoneCode != null && phoneNumber != '' && phoneNumber != null && topicArn != '')
              {
                  var contactNumber = phoneCode+phoneNumber;
                  // AWS email subscription Process
                  awsSubscriber.smsSubscription(topicArn, contactNumber, function(smsSubscriptionResponse){
                      var responseStatus = smsSubscriptionResponse.response; /* API Resonse Status */
                      var responseMessage = smsSubscriptionResponse.data; /* API Reponse Message */

                      if(responseStatus == 'success')
                      {
                          var awsReqId = responseMessage.ResponseMetadata.RequestId; // AWS request ID
                          var awsScriptionArn = responseMessage.SubscriptionArn; // SubscriptionArn

                          // Insert record in Db : Start
                            var smsSubDataObj = [];
                                smsSubDataObj = { 
                                      user_id : userId,
                                      rule_id : ruleId,
                                      company_group_id: groupId,
                                      notification_type : '3',
                                      topic_arn : topicArn,
                                      subsciption_arn : awsScriptionArn
                                    }
                            db.models.aws_user_subscription.create(smsSubDataObj).then(function(awsSubscriptionInsert) {
                                if(awsSubscriptionInsert)
                                {
                                    /* Delete (delete_request = 2) record for this rule From DB: Start */
                                        db.models.aws_user_subscription.destroy({
                                              where: { user_id : userId,
                                                       rule_id : ruleId,
                                                       notification_type : '3',
                                                       topic_arn : topicArn,
                                                       delete_request : '2'
                                               }
                                              }).then(function (deleletOldSubscription)
                                              {
                                                
                                                  return callback({status: 'success' , data: 'AWS user SMS subscription', message: 'SMS Subscription process has been completed successfully'});
                                                
                                              })
                                    /* Delete (delete_req = 2) record for this rule From DB :End */
                                }
                                else /* Not Success */
                                {
                                   return callback({status: 'fail' , data: 'AWS user SMS subscription', message: 'SMS Subscription process has not been completed successfully'});
                                }
                            }).catch(function(err){
                                 return callback({status: 'fail' , data: err, message: 'SMS Subscription process has not been completed successfully'});
                            });
                      }
                      else
                      {
                          return callback({status: 'fail' , data: 'AWS user SMS subscription', message: 'SMS Subscription process has not been completed successfully'});
                      }
                  })
              }
              else
              {
                 return callback({status: 'fail' , data: 'AWS user SMS subscription', message: 'User information not found so subscription has not been completed successfully'});
              }
          }
          else
          {
             return callback({status: 'fail' , data: 'AWS user SMS subscription', message: 'SMS Subscription process has not been completed successfully'});
          }
        }
        else
        {
          return callback({status: 'fail' , data: 'AWS user SMS subscription', message: 'SMS Subscription process has not been completed successfully'});
        }

    }).catch(function(err) {
        return callback({status: 'fail' , data: err, message: 'SMS Subscription process has not been completed successfully'});
    });
}

/*
 * @author : GK
 * User Subscription :
 * Check User subscribe or not for notification
 * @param : userId : User ID
 * @param : ruleId : Rule ID
 * @param : notificationType : Notification Type
 * @param : groupId : Group ID
 */
var awsCheckUserSubscriptionStatus = function awsCheckUserSubscriptionStatus( userId, ruleId, notificationType, groupId, callback)
{
    db.models.aws_user_subscription.findAll({
                  where: {
                      user_id: userId,
                      rule_id: ruleId,
                      notification_type: notificationType,
                      company_group_id: groupId,
                      delete_request: '1'
                  },
                  raw: true
    }).then(function(subRecord)
    {
      
      if(subRecord)
      {
         return callback({status: 'success' , data: subRecord, message: 'Get subscription record successfully'});
      }
      else
      {
         return callback({status: 'fail' , data: 'AWS user subscription: Check user subscription status', message: 'Some unknown error'});
      }

    }).catch(function(err) { // Some Error 
        return callback({status: 'fail' , data: 'AWS user subscription: Check user subscription status', message: 'Check user subscription process not completed'});
    });
}

/*
 * @author : GK
 * User Subscription :
 * Delete user time unsubscription process
 * @param : userId : User ID
 * @param : company_id : Company ID
 */
var awsDeleteUserUnSubscription = function awsDeleteUserUnSubscription( userId, company_id, callback)
{
    if(userId != '' && userId != null && company_id != '' && company_id != null)
    {
      // AWS unsubscription
      awsUserUnSubscriptionByUserId(userId, company_id, [], function(unsubscriptionProcess){
          //console.log(unsubscriptionProcess);
          
          // Delete device Record
          awsDeleteUserMobileDeviceByUserId( userId, function(deviceDelete_callback){
                //console.log(deviceDelete_callback);
                return callback({status: 'success' , data: 'Delete User : Delete Record', message: 'Record deleted & unsubscription processed successfully'});
          })
          
      });
    }
    else
    {
      callback({ status: 'fail', data: 'Delete User: Some Unknown Error', message: 'Pass valid parameters' });
    }    
}

/*
 * @author : GK
 * User Subscription :
 * Remove Mobile device record of user when user deleted.
 * @param : userId : User ID
 */
var awsDeleteUserMobileDeviceByUserId = function awsDeleteUserMobileDeviceByUserId( userId, callback)
{
   db.models.mobile_device.findAll( { where: { user_id : userId } } ).then(function(devices) {
    if(devices)
    {
        // ForEach(1) Start
          async.forEachSeries(devices, function(device, callback_f1) {
              
              var endpointArn = device.aws_application_endpoint_arn; // EndPoint Arn
              var deviceType = device.type; // Device Type
              var pushToken = device.push_token; // Device Push Token
              var recordId = device.id; // Device Record Id

              if(endpointArn != '')
              {
                  // Get Device Count
                  db.models.mobile_device.findAll({ 
                            where: { aws_application_endpoint_arn : endpointArn,
                                     type: deviceType,
                                     user_id: {
                                        $ne: userId  
                                       }
                                   }
                      }).then(function(devicesCount) {
                        if(devicesCount.length > 0) // More then one record found
                        {
                            // Remove from Database
                            awsRemoveMobileDeviceRecord( userId, deviceType, recordId, function(deviceDelete_res){
                                callback_f1()
                            })
                        }
                        else // Only one record found
                        {
                             // Remove from AWS & Database
                             awsRemoveEndpointArnAndDeviceRecord( userId, endpointArn, deviceType, recordId, function(delete_res){
                                  callback_f1();
                             })
                        }
                  }).catch(function(err) {
                        callback({ status: "fail", data: 'Delete Device: Get Record, Some Unknown Error', message: err });
                  })
              }
              else
              {
                // Remove from Database
                  awsRemoveMobileDeviceRecord( userId, deviceType, recordId, function(deviceDelete_res){
                      callback_f1()
                  })
              }
          }, function() {
            // ForEach(1) finish
              callback({ status: "success", data: 'Delete Device: Deleted', message: 'Record deleted successfully' });
          });
    }
    else
    {
      callback({ status: "fail", data: 'Delete Device: Get Record, Some Unknown Error', message: "Fail to load data" });
    }
  }).catch(function(err) {
      callback({ status: "fail", data: 'Delete Device: Get Record, Some Unknown Error', message: err });
  }); 
}

/*
 * @author : GK
 * User Subscription :
 * Remove Device record from AWS and delete record from Database
 * @param : userId : User ID
 * @param : endPointArn : Device endpointArn
 * @param : deviceType : Device Type
 * @param : recordId : Database record ID ( Table : mobile_device )
 */
var awsRemoveEndpointArnAndDeviceRecord = function awsRemoveEndpointArnAndDeviceRecord( userId, endPointArn, deviceType, recordId, callback)
{
    awsSubscriber.deleteEndpoint(endPointArn, function(endPointArnRemove_res){
          var responseStatus = endPointArnRemove_res.response; /* API Resonse Status */
          var responseMessage = endPointArnRemove_res.data; /* API Reponse Message */
          if(responseStatus == 'success')
          {
              // Delete record
              awsRemoveMobileDeviceRecord( userId, deviceType, recordId, function(deviceDelete_res){
                  callback(deviceDelete_res);
              })
          }
          else
          {
             callback({ status: 'fail', data: 'Delete Aws endPoint : Some Unknown Error', message: 'Unsubcription process not completed'});
          }
    })
}

/*
 * @author : GK
 * User Subscription :
 * Remove Device record from Database
 * @param : userId : User ID
 * @param : deviceType : Device Type
 * @param : recordId : Database record ID ( Table : mobile_device )
 */
var awsRemoveMobileDeviceRecord = function awsRemoveMobileDeviceRecord( userId, deviceType, recordId, callback )
{
     db.models.mobile_device.destroy({ where: { id: recordId, user_id: userId } }).then(function(delete_mobileDevice) {
            if(delete_mobileDevice)
            {
                callback({ status: 'success', data: 'Delete device record: Delete record', message: 'Record deleted successfully'});
            }
            else
            {
                callback({ status: 'fail', data: 'Delete device record: Delete record', message: 'Record not deleted successfully'});
            }
    })
    .catch(function(err) {
      callback({ status: 'fail', data: err, message: 'Some Unknown Error' });
    });
}


/* ############### User Notification Function(s) : End ############### */

/* ############### Device Registration Function(s) : Start ############### */

/*
 * @author : GK
 * Device Registration :
 * Check Device Registred or not,
 * If Device UUID already registred then process to update new Push Token
 * If device UUID is new then process to registred this UUID and subcribe that device for notification.
 * @param : user_id : User ID
 * @param : pushToken : Device Push ID
 * @param : deviceType : Device Type ( 1 = IOS, 2 = Android, 3 = Window )
 * @param : uuid : Device UUID
 * @param : deviceOs : Device OS link ios or android
 * @param : deviceOsVersion : Devie OS version 
 * @param : companyId : Company Id
 */
var awsDeviceRegistrationWithNotificationSubscription = function awsDeviceRegistrationWithNotificationSubscription( user_id, pushToken, deviceType, uuid, deviceOs, deviceOsVersion, companyId, callback)
{

    db.models.mobile_device.count( { where: { user_id: user_id, type: deviceType, uuid: uuid } } ).then(function(device) {
            if(device)
            {
                // Same UUID Present in Record
                awsDeviceUUIDFoundProcess(user_id, pushToken, deviceType, uuid, deviceOs, deviceOsVersion, function(uuidPresent_callback){
                      callback(uuidPresent_callback); // Pass callback
                });
            }
            else
            {
                // Same UUID not Present in Record
                awsDeviceNewUUIDProcess(user_id, pushToken, deviceType, uuid, deviceOs, deviceOsVersion, companyId, function(uuidNew_callback){
                      callback(uuidNew_callback); // Pass callback
                });
            }
    }).catch(function(err)
    {
       return callback({ status: 'fail', data:'AWS Device Registration: Device Registration Process', message: 'Device registration process not completed' });
    });
}

/*
 * @author : GK
 * Device Registration :
 * Device UUID is found in Database so process for update new Push noken in Database and AWS endpoint record.
 * @param : user_id : User ID
 * @param : pushToken : Device Push ID
 * @param : deviceType : Device Type ( 1 = IOS, 2 = Android, 3 = Window )
 * @param : uuid : Device UUID
 * @param : deviceOs : Device OS link ios or android
 * @param : deviceOsVersion : Devie OS version
 */
var awsDeviceUUIDFoundProcess = function awsDeviceUUIDFoundProcess(user_id, pushToken, deviceType, uuid, deviceOs, deviceOsVersion, callback)
{
    async.waterfall(
      [
          function(callback_wt) // ## 1. Check Device & Push Registered Or Not
          {
               db.models.mobile_device.findOne( { where: { user_id: user_id, push_token: pushToken, type: deviceType, uuid: uuid } } ).then(function(deviceRecord) {
                    if(deviceRecord)
                    {
                        var  msg = ({status: 'success', data:'AWS Device Registration: Device push token check', message: 'Same record already exists'});
                        callback_wt(msg); // Cut WaterFlow
                    }
                    else
                    {
                        callback_wt(null); //  WaterFlow
                    }
              })
          },
          function(callback_wt) // ## 2. Fetch Device Data
          {
              db.models.mobile_device.findOne( { where: { user_id: user_id, type: deviceType, uuid: uuid } } ).then(function(deviceRecord) {
                      if(deviceRecord) // Device Record Found
                      {
                           var deviceRecordId = deviceRecord.id;
                           var getendPointArn = deviceRecord.aws_application_endpoint_arn;
                           if(getendPointArn != null && getendPointArn != '')
                           {
                              
                              /* Update new token on AWS */
                              awsSubscriber.updateEndpointDeviceId(getendPointArn ,pushToken, function(updateDeviceToken){
                                      var responseStatus = updateDeviceToken.response; /* API Resonse Status */
                                      var responseMessage = updateDeviceToken.data; /* API Reponse Message */

                                      if(responseStatus == 'success')
                                      {
                                          awsUpdateDevicePushTokenData( deviceRecordId, user_id, pushToken, deviceType, function(updateToken_callback){
                                                callback_wt(updateToken_callback);
                                          })
                                      }
                                      else
                                      {
                                          var  msg = ({status: 'fail', data:'AWS Device Registration: Update Push Device Token', message: responseMessage.message});
                                          callback_wt(msg); // Cut WaterFlow
                                      }
                              })
                           }
                           else
                           {
                              // Endpoint ARN not registred So update New Device Push Token without any process
                              awsUpdateDevicePushTokenData( deviceRecordId, user_id, pushToken, deviceType, function(updateToken_callback){
                                    callback_wt(updateToken_callback);
                              })
                           }
                      }
                      else // Device Not Record Found
                      {
                          var  msg = ({status: 'fail', data:'AWS Device Registration: Get UUID Record', message: 'Device registration process not completed'});
                          callback_wt(msg); // Cut WaterFlow
                      }
              }).catch(function(err) // Same Unknow error
              {
                 var  msg = ({ status: 'fail', data:'AWS Device Registration: Get UUID record', message: 'Device registration process not completed' });
                 callback_wt(msg); // Cut WaterFlow
              });
          }
      ],
    function (err, data) { // Final Process
          if(err != null && err != '')
          {
              return callback(err);
          }
          else
          {
              //console.log(data);
          }
      }
    );

}

/*
 * @author : GK
 * Device Registration :
 * Device UUID is not registred of this user So new registred this user in Database and
 * Subscribe this record all to all group where user subscribe 
 * @param : user_id : User ID
 * @param : pushToken : Device Push ID
 * @param : deviceType : Device Type ( 1 = IOS, 2 = Android, 3 = Window )
 * @param : uuid : Device UUID
 * @param : deviceOs : Device OS link ios or android
 * @param : deviceOsVersion : Devie OS version
 * @param : companyId : Company Id
 */
var awsDeviceNewUUIDProcess = function awsDeviceNewUUIDProcess(user_id, pushToken, deviceType, uuid, deviceOs, deviceOsVersion, companyId, callback)
{
    async.waterfall(
      [
          function(callback_wt) // ## 1. Check Device & Push Registered Or Not
          {
               db.models.mobile_device.findOne( { where: { user_id: user_id, push_token: pushToken, type: deviceType, uuid: uuid } } ).then(function(deviceRecord) {
                    if(deviceRecord)
                    {
                        var  msg = ({status: 'success', data:'AWS Device Registration: Device push token check', message: 'Same record already exists'});
                        callback_wt(msg); // Cut WaterFlow
                    }
                    else
                    {
                        callback_wt(null); //  WaterFlow
                    }
              })
          },
          function(callback_wt) // ## 2. Registered New Device
          {
             /* Register Device Details in DB : Start */
                var deviceInfoObj = [];
                    deviceInfoObj = {
                                 os : deviceOs,
                                 os_version : deviceOsVersion,
                                 type : deviceType,
                                 push_token : pushToken,
                                 user_id : user_id,
                                 uuid : uuid
                            }

                db.models.mobile_device.create(deviceInfoObj).then(function(deviceAdd) {
                    if(deviceAdd)
                    {
                        var  msg = ({ status: 'success', data:'AWS Device Registration: New record registration', message: 'Device registration process completed' });

                        /* User Subscription Process */
                        awsUserSubscriptionAndUnSubscriptionByUserId(user_id, companyId, function(awsUserSub){
                            //console.log(awsUserSub);
                        });
                        callback_wt(msg); // Cut WaterFlow
                    }
                    else
                    {
                        var  msg = ({ status: 'fail', data:'AWS Device Registration: New record registration', message: 'Device registration process not completed' });
                        callback_wt(msg); // Cut WaterFlow
                    }
                }).catch(function(err) {
                         var  msg = ({ status: 'fail', data:'AWS Device Registration: New record registration', message: 'Device registration process not completed' });
                         callback_wt(msg); // Cut WaterFlow
                    });
               /* Register Device Details in DB : End */
          }
      ],
    function (err, data) { // Final Process
          if(err != null && err != '')
          {
              return callback(err);
          }
          else
          {
              //console.log(data);
          }
      }
    );
}

/*
 * @author : GK
 * Device Registration :
 * Update Push Token ID in database for registred record.
 * @param : deviceRecordId : Device Registation Database record ID
 * @param : userId : User ID
 * @param : newDevicePushId : Device Push ID
 * @param : deviceType : Device Type ( 1 = IOS, 2 = Android, 3 = Window )
 */
var awsUpdateDevicePushTokenData = function awsUpdateDevicePushTokenData( deviceRecordId, userId, newDevicePushId, deviceType, callback)
{
   var awsDeviceDataObj = [];
       awsDeviceDataObj = {
            push_token : newDevicePushId
         }

   db.models.mobile_device.update( awsDeviceDataObj, { where : { id: deviceRecordId, user_id: userId, type: deviceType } }).then(function(updateRecord) {
          if(updateRecord) // Update successfully
          {
              return callback({status: 'success', data:'AWS Device Registration: Update new token', message: 'Device registration process completed'});
          }
          else // Not Update successfully
          {
              return callback({ status: 'fail', data:'AWS Device Registration: Update new token', message: 'Device registration process not completed' });
          }
    }).catch(function(err) //  Some Unknow Error
    {
       return callback({ status: 'fail', data:'AWS Device Registration: Update new token', message: 'Device registration process not completed' });
    });
}

/*
 * @author : GK
 * Device deregistration :
 * Remove Device from AWS and Local DB
 * Remove subscription of user
 * @param : user_id : User Id
 * @param : devicePushToken : Device Push Token
 * @param : deviceType : Device Type ( 1 = IOS, 2 = Android, 3 = Window )
 * @param : uuid : Device UUID
 * @param : company_id : Company Id
 */
var awsUserSelectedDeviceUnsubscriptionProcess = function awsUserSelectedDeviceUnsubscriptionProcess( user_id, devicePushToken, deviceType, uuid, company_id, callback)
{
   async.waterfall([
      // 1. Check device register or not
      function(callback_wf) {

          db.models.mobile_device.findAll( { where: { user_id: user_id, push_token: devicePushToken, type: deviceType, uuid: uuid } } ).then(function(devicesData_response) {
            if(devicesData_response.length > 0)
            {
               // Device information found
               callback_wf(null, devicesData_response);
            }
            else
            {
                callback_wf({
                    status: 'fail',
                    data: null,
                    message: 'Requested Device has not been found'
                });
            }
          }).catch(function(err) {
              callback_wf({
                  status: 'fail',
                  data: err,
                  message: 'Device deregistration process has not been completed successfully'
              });
          });

      },
      // 2. AWS User's device cancle subscription process
      function(devicesData, callback_wf) {
         
          // ForEach(1) Start
          async.forEachSeries(devicesData, function(device_data, callback_f1) {
              
              var endPointArn = device_data.aws_application_endpoint_arn; // Endpoint Arn
              if(endPointArn != '' && endPointArn != null && typeof endPointArn !== undefined)
              {
                var device_reg_record_id = device_data.id; // Device register record id

                awsDeviceUnsubscriptionBasedOnEndpointArn(user_id, deviceType, endPointArn, device_reg_record_id, company_id, function(device_user_unsubscription_callback){
                        if(device_user_unsubscription_callback.status == 'fail')
                        {
                            callback_wf({
                                status: 'fail',
                                data: null,
                                message: 'Device deregistration process has not been completed successfully'
                            });
                        }
                        else
                        {
                            callback_f1();  
                        }
                });
              }
              else
              {
                  callback_f1();                
              }
          }, function() {
              // ForEach(1) Finish
              callback_wf(null, devicesData);
          });
      },
      // 3. Remove Endpoint Arn
      function(devicesData, callback_wf) {
          
          // forEach(1) Start  
          async.forEachSeries(devicesData, function(device_data, callback_f1) {
              
              var endPointArn = device_data.aws_application_endpoint_arn; // Endpoint Arn
              var device_reg_record_id = device_data.id; // Device register record id

              if(endPointArn != '' && endPointArn != null && typeof endPointArn !== undefined)
              {
                // Remove EndPoint Arn
                awsRemoveEndpointArnAndDeviceRecord( user_id, endPointArn, deviceType, device_reg_record_id, function(endPoint_remove_callback){
                    if(endPoint_remove_callback.status == 'fail')
                    {
                        callback_wf({
                            status: 'fail',
                            data: null,
                            message: 'Device deregistration process has not been completed successfully'
                        });
                    }
                    else
                    {
                        callback_f1();   
                    }
                });
              }
              else // No Endpoint
              {
                awsRemoveMobileDeviceRecord( user_id, deviceType, device_reg_record_id, function(deviceDelete_res){
                    if(deviceDelete_res.status == 'fail')
                    {
                        callback_wf({
                            status: 'fail',
                            data: null,
                            message: 'Device deregistration process has not been completed successfully'
                        });
                    }
                    else
                    {
                        callback_f1();   
                    }
                })
              }

          }, function() {
              // ForEach(1) Finish
              callback_wf();
          });
      }
    ], function(err, data) {
        if(err != '' && err != null && typeof err !== undefined) // Error
        {
            callback(err);
        }
        else  // Success
        {
            callback({
                status: 'success',
                data: null,
                message: 'Deregister Mobile Device process has been completed successfully'
            });
        }
    })
}

/*
 * @author : GK
 * Device deregistration :
 * User unsubscription on base of Endpoint Arn
 * @param : user_id : User Id
 * @param : deviceType : Device Type ( 1 = IOS, 2 = Android, 3 = Window )
 * @param : endPointArn : Endpoint Arb
 * @param : device_reg_record_id : Device Registration Record id ( table : aws_user_subscription )
 * @param : company_id : Company Id
 */
var awsDeviceUnsubscriptionBasedOnEndpointArn = function awsDeviceUnsubscriptionBasedOnEndpointArn( user_id, deviceType, endPointArn, device_reg_record_id, company_id, callback)
{
    
    db.query('select * from aws_user_subscription where notification_type = "2" and device_type = :device_type and delete_request = "1" and application_endpoint_arn = :endpointArn and user_id = :user_id',
        { replacements: { device_type: deviceType, endpointArn: endPointArn, user_id: user_id }, type: db.QueryTypes.SELECT }
    ).then(function(subscriptions_record_result)
    {
      if(subscriptions_record_result.length > 0) // Record found
      {

          // ForEach(1) Start
          async.forEachSeries(subscriptions_record_result, function(subscription, callback_f1) {

                  var group_id = subscription.company_group_id; // User group id
                  var rule_id = subscription.rule_id; // Rule ID
                  var subsciption_arn = subscription.subsciption_arn; // Subscription Arn
                  var subscription_record_id = subscription.id; // Subscription Record Id

                  // Push unsubscription process
                  awsUserPushUnSubscriptionProcess(user_id, group_id, rule_id, company_id, subsciption_arn, subscription_record_id, deviceType, function(pushUnsubscription_callback){
                        callback_f1();
                  })

          }, function() {
              callback({
                  status: 'success',
                  data: null,
                  message: 'User unsubscription process has been completed successfully'
              });
          });
      }
      else // Record not found
      {
          callback({
              status: 'success',
              data: null,
              message: 'User subscribe record has not been found'
          });
      }
    })
}
/* ############### Device Registration Function(s) : End ############### */

/* ############### SMS Notification Function(s) : Start ############### */

/*
 * @author : GK
 * SMS Notification :
 * Subscription Process for SMS notification
 * @param : groupIdList : Group List Id (Json)
 * @param : companyId : Company ID
 * @param : ruleId : Rule ID
 * @param : newDevicePushId : Device Push ID
 * @param : deviceType : Device Type ( 1 = IOS, 2 = Android, 3 = Window )
 * @param : errorFilePath : File path for write error log
 */
var awsUserSMSSubscriptionByGroupId = function awsUserSMSSubscriptionByGroupId( groupIdList, companyId, ruleId, topicArn, errorFilePath, callback)
{
  /* Join Rule */
    db.models.user.hasMany(db.models.company_user_group, {foreignKey: 'user_id'})
    db.models.company_user_group.belongsTo(db.models.user, {foreignKey: 'id'})

    /* Get user list query : start */
    db.models.user.findAll({
                         where: ["company_user_groups.company_group_id in ( ? ) and user.company_id = ? and user.active = '1' ", groupIdList, companyId],
                         include: [db.models.company_user_group],
                         raw: true
                    }) .then(function(usersData)
    {
        if(usersData)
        {
            /* forEach(1) Start */
            async.forEachSeries(usersData, function(user, callback_f1) {
                    var user_id = user.id;
                    var phoneCode = user.phonecode;
                    var phoneNumber = user.phone;
                    var company_user_group_id = user['company_user_groups.id'];
                    var company_group_id = user['company_user_groups.company_group_id'];

                    if(phoneCode != '' && phoneCode != null && phoneNumber != '' && phoneNumber != null)
                    {
                        var contactNumber = phoneCode+phoneNumber;
                        //smsSubscription
                        /* Subscription Process : Start */
                        awsSubscriber.smsSubscription(topicArn, contactNumber, function(response_smsSubscription){
                                    var responseStatus = response_smsSubscription.response; // API Resonse Status
                                    var responseMessage = response_smsSubscription.data; // API Reponse Message
                                    if(responseStatus == 'success') // Success
                                    {
                                        var awsReqId = responseMessage.ResponseMetadata.RequestId; // Req Id
                                        var awsScriptionArn = responseMessage.SubscriptionArn; // AWS Subscription Arn
                                        
                                        // Ary obj
                                        var smsSubDataObj = [];
                                            smsSubDataObj = { 
                                                      user_id : user_id,
                                                      rule_id : ruleId,
                                                      company_group_id: company_group_id,
                                                      notification_type : '3',
                                                      topic_arn : topicArn,
                                                      subsciption_arn : awsScriptionArn
                                                    }

                                        db.models.aws_user_subscription.create(smsSubDataObj).then(function(awsSubscriptionInsert) {
                                              if(awsSubscriptionInsert) /* Success */
                                              {
                                                  // Delete (delete_request=2) record for this rule From DB :Start
                                                  db.models.aws_user_subscription.destroy({
                                                            where: { user_id : user_id, rule_id : ruleId,
                                                                     notification_type : '3',
                                                                     topic_arn : topicArn,
                                                                     delete_request : '2'
                                                             }
                                                            }).then(function (deleletOldSubscription)
                                                       {
                                                            callback_f1();
                                                       })
                                                  // Delete (delete_request=2) record for this rule From DB :End
                                              }
                                              else /* Fail */
                                              {
                                                  callback_f1();
                                              } 
                                         }).catch(function(err){
                                                return callback({status: 'fail', data: err, message: 'SMS notification process has not been completed successfully'});
                                          });
                                    }
                                    else // Not Success
                                    {
                                        callback_f1();
                                    }
                          })
                        /* Subscription Process : End */
                    }
                    else
                    {
                      callback_f1();  
                    }
                
            }, function() {
              // ForEach(1) finish
                /* Update group status : Start */
                  awsUpdateGroupStatus(ruleId, groupIdList, '3', '2', function(groupStatusUpdate){
                         var groupResponseStatus = groupStatusUpdate.status;
                         if(groupResponseStatus == 'success')
                         {
                            return callback({status: 'success', data: 'SMS notification subscription', message: 'New group SMS subscription process has been completed successfully'});
                         }
                         else
                         {
                            return callback({status: 'fail', data: groupResponseStatus.data, message: 'New group SMS subscription process has not been completed successfully'});
                         }
                  })
                /* Update group status : End */
            });
        }
        else
        {
            return callback({status: 'success', data: 'SMS notification subscription', message: 'Group user data has not been found'});
        }
    }).catch(function(err){
        return callback({status: 'fail', data: err, message: 'SMS notification process has not been completed successfully'});
    });
}

/*
 * @author : GK
 * SMS Subscription :
 * Unsubscribe Process for SMS notification
 * @param : companyId : Company ID
 * @param : ruleId : Rule ID
 * @param : topicArn : Topic ARN
 * @param : errorFilePath : Error Log
 */
var awsUnsubscriptionOfSMSGroup = function awsUnsubscriptionOfSMSGroup( companyId, ruleId, topicArn, errorFilePath, callback)
{
    db.query('select *, awsuser.id as subscription_unique_id, (select count(*) from aws_user_subscription as innerAWSSub left join aws_group_subscription as innerAWSgroup on innerAWSgroup.rule_id = innerAWSSub.rule_id and innerAWSSub.company_group_id = innerAWSgroup.company_group_id where innerAWSSub.user_id = user.id and innerAWSSub.rule_id = :rule_id and innerAWSSub.notification_type = "3" and innerAWSgroup.notification_type = "3" and innerAWSgroup.status = "2" ) as totalcount from aws_user_subscription as awsuser left join aws_group_subscription as awsgroup on awsgroup.rule_id = awsuser.rule_id and awsuser.company_group_id = awsgroup.company_group_id left join user as user on user.id = awsuser.user_id where awsgroup.status = "3" and awsgroup.rule_id = :rule_id and awsgroup.notification_type = "3" and awsuser.notification_type = "3"',
        { replacements: { rule_id: ruleId }, type: db.QueryTypes.SELECT }
    ).then(function(groupUserData)
    {
      if(groupUserData.length > 0) // Data Found
      {
          var unscriptionRecordList = []; // Record id(s) for remove record in DB
          // ForEach(1) Start
          async.forEachSeries(groupUserData, function(user, callback_f1) {
                 var getCount = user.totalcount;
                 var subsciptionUniqueId = user.subscription_unique_id;
                 if(getCount < 1) // Get only One record
                 {
                    var subscriptionArn = user.subsciption_arn;
                      // AWS Unsubscription Process
                      awsSubscriber.unSubscribe( subscriptionArn, function(response_awsUnsubscription){
                          if(response_awsUnsubscription.response == 'success') // Success
                          {
                             unscriptionRecordList.push(subsciptionUniqueId);
                             callback_f1();
                          }
                          else // Fail
                          {
                              // Update Subscription Record
                              var awsDataObj = [];
                                  awsDataObj = {
                                    delete_request : "2"
                                  }
                              db.models.aws_user_subscription.update( awsDataObj, {
                                        where : { id: subsciptionUniqueId } 
                                }).then(function(userUns) {
                                    callback_f1();
                                }).catch(function(err) 
                                {
                                    return callback({status: 'fail', data: err, message: 'SMS notification unsubscription process has not been completed successfully'});
                                });
                          }
                      })
                 }
                 else // Get more then one record
                 {
                    unscriptionRecordList.push(subsciptionUniqueId);
                    callback_f1();
                 }
          }, function() {

              // SMS : Group Record For Delete
              if(unscriptionRecordList.length > 0)
              {
                  // Remove records from database
                  db.models.aws_user_subscription.destroy({
                        where: ["`id` IN ( ? )", unscriptionRecordList]
                        }).then(function (deleletSubscription)
                  {
                      // Remove Groups
                      removeGroupByGroupStataus(ruleId, '3', function(removeGroup){
                          if(removeGroup.status == 'success')
                          {
                              return callback({status: 'success' , data: 'SMS notification unsubscription', message: 'SMS notification unsubscription process has been completed successfully'});
                          }
                          else
                          {
                              return callback({status: 'success' , data: removeGroup.data, message: removeGroup.message });
                          }
                      })
                  })
              }
              else
              {
                  return callback({status: 'success' , data: 'SMS notification', message: 'SMS notification unsubscription process has been completed successfully'});
              }
            
          });
      }
      else // No data for remove
      {
         // SMS : No Group Record For Delete
        removeGroupByGroupStataus(ruleId, '3', function(removeGroup){
            if(removeGroup.status == 'success')
            {
               return callback({status: 'success' , data: 'SMS notification unsubscription', message: 'SMS unsubscription process has been completed successfully'});
            }
            else
            {
               return callback({status: 'success' , data: removeGroup.data, message: removeGroup.message });
            }
        })
      }
    }).catch(function(err) {
       return callback({status: 'fail' , data: err, message: 'SMS notification unsubscription process has not been completed successfully'});
    });
}

/*
 * @author : GK
 * User/SMS Subscription :
 * Update EndPoint Value of subscribe User
 * @param : ruleId : Rule ID
 * @param : userId : User ID
 * @param : groupId : Group ID
 * @param : companyId : Company ID
 */
var awsUserSMSEndPointChange = function awsUserSMSEndPointChange( ruleId, userId, groupId, companyId, callback)
{
  db.query('SELECT aws_user_subscription.id as subsciption_id, aws_user_subscription.rule_id as rule_id, aws_user_subscription.company_group_id as company_group_id, aws_user_subscription.notification_type as notificationType, aws_user_subscription.topic_arn as topic_arn, aws_user_subscription.subsciption_arn as subscription_arn, user.id as userid, user.phonecode as phonecode, user.phone as phone FROM `aws_user_subscription` AS `aws_user_subscription` left join user as user on user.id = `aws_user_subscription`.`user_id` WHERE `aws_user_subscription`.`user_id` = :userId AND `aws_user_subscription`.`rule_id` = :ruleId AND `aws_user_subscription`.`notification_type` = "3" AND `aws_user_subscription`.`company_group_id` = :groupId AND `aws_user_subscription`.`delete_request` = "1"',
        { replacements: { userId: userId, ruleId: ruleId, groupId: groupId }, type: db.QueryTypes.SELECT }
    ).then(function(subRecord)
    {
      
      if(subRecord)
      {
         var resulrData = subRecord[0]; // Result Data
         var contactNumberCode = resulrData.phonecode; // Contact Number Code
         var contactNumber = resulrData.phone; // Contact Number
         var subscriptionArn = resulrData.subscription_arn; // Subscription Arn
         var subsciption_id = resulrData.subsciption_id; // Subscription Record Id
         var topicArn = resulrData.topic_arn; // Topic Arn
         var new_number = '+'+contactNumberCode+contactNumber;
        
        if(new_number != '' && new_number != null && subscriptionArn != '' &&  subscriptionArn != null)
        {
            // Get subscription Data from AWS
            awsSubscriber.getSubscriptionData(subscriptionArn, function(callback_subData){

                if(callback_subData.response == 'success')
                {
                    var getData = callback_subData.data.Attributes; // Response Result Data
                    var res_contactNo = getData.Endpoint; // Contact Number
                    if(res_contactNo != new_number)
                    {
                        // Different
                        // Unsubscription Process
                        awsUserSMSUnSubscriptionProcess(userId, groupId, ruleId, companyId, subscriptionArn, subsciption_id, function(callback_userUnSub){
                             if(callback_userUnSub.status == 'success')
                             {
                                // Subscription Process
                                 awsUserSMSSubscriptionProcess(userId, ruleId, groupId, function(callback_smsSubscription){
                                      return callback({status: 'success', data: 'AWS SMS Subscription Check', message: 'New number subscription process has been completed successfully' });
                                });
                             }
                             else
                             {
                               return callback({status: 'fail', data: 'AWS SMS Subscription Check', message: 'Unsubscription process of old number has not been completed successfully' });
                             }
                        });  
                    }
                    else
                    {
                      // Same
                      return callback({status: 'success', data: 'AWS SMS Subscription Check', message: 'User contact number same as AWS registred number'});
                    }
                }
                else
                {
                  return callback({status: 'fail', data: 'AWS SMS Subscription Check', message: 'User\'s subscription record has not been found from SubscriptionArn'});
                }
            })
        }
        else
        {
          return callback({status: 'fail' , data: 'AWS SMS Subscription Check', message: 'User\'s contact number has not been found'});
        }
      }
      else
      {
         return callback({status: 'fail' , data: 'AWS SMS Subscription Check', message: 'Contact number update process hase not been completed successfully'});
      }

    }).catch(function(err) { // Some Error 
        return callback({status: 'fail' , data: err, message: 'Contact number update process has not been completed successfully'});
    });
}

/* ############### SMS Notification Function(s) : End ############### */
/* ############### Application Function(s) : Start ############### */

/*
 * @author : GK
 * Application
 * Create Application
 * New user subscription process when create new application
 * Action for : IOS, Andriod
 * @param : company_id : Company ID
 * @param : reference_data : Reference Data ( Like : IOS, Android )
 */
var awsApplicationCreate = function awsApplicationCreate(company_id, reference_data, callback)
{
    if(company_id != '' && company_id != null && typeof company_id !== undefined)
    {
      db.query('select comp_user_grp.user_id as user_id , rule.id as rule_id, user.active as user_status from rule as rule left join aws_group_subscription as aws_grp_sub on aws_grp_sub.rule_id = rule.id and aws_grp_sub.notification_type = "2" left join company_user_group as comp_user_grp on comp_user_grp.company_group_id = aws_grp_sub.company_group_id left join user as user on user.id = comp_user_grp.user_id  where rule.push_notification = true and rule.company_id = :company_id and user.active = "1" and user.deletedAt is null group by comp_user_grp.user_id',
          { replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
      ).then(function(awsUserGroup)
      {
          // ForEach(1) Start
          async.forEachSeries(awsUserGroup, function(user, callback_f1) {
                    var user_id = user.user_id;
                    if(user_id != '' && user_id != null && typeof user_id !== undefined)
                    {
                        awsUserSubscriptionAndUnSubscriptionByUserId(user_id, company_id, function(aws_user_notification_process_callback){
                                //console.log(aws_user_notification_process_callback);
                                callback_f1();      
                        });
                    }
                    else
                    {
                        callback_f1();
                    }
          }, function() {
              // ForEach(1) End
              callback({
                 status: 'success',
                 data: null,
                 message: 'New subscription process has been completed successfully on Application create time'
              })
          });
        
      }).catch(function(err) { // Some Error 
          callback({
               status: 'fail',
               data: err,
               message: 'New subscription process has not been completed successfully on Application create time'
            });
      });
    }
    else
    {
        callback({
             status: 'fail',
             data: null,
             message: 'Company Record has not been found'
          });
    }
}

/*
 * @author : GK
 * Application
 * Remove Application
 * All user unsubscription, endPoint remove & Application Remove Process
 * @param : company_id : Company ID
 * @param : platform_type : 1 = IOS, 2 = Android
 */
var awsApplicationRemove = function awsApplicationRemove(company_id, platform_type, callback)
{
      if(platform_type != '' && platform_type != null && company_id != '')
      {
          // Waterfall Start
          async.waterfall([

              // 1.  Get Application Data
              function(callback_wf) {
                  
                  awsGetApplicationData(company_id, function(applicationData_callback){
                      var appData = applicationData_callback.data;
                      var applicationArn = ''; // Application Arn
                      
                      if(platform_type == '1') // IOS
                      {
                          var iosAWSapp = appData.ios_aws_app_data;
                          if(iosAWSapp != '' && iosAWSapp != null )
                          {
                              var iosAppDataParse = JSON.parse(iosAWSapp);
                              applicationArn = iosAppDataParse.appAwsArn; // IOS App
                              if(applicationArn != '' && applicationArn != null && typeof applicationArn !== undefined)
                              {
                                callback_wf(null, applicationArn);
                              }
                              else
                              {
                                callback_wf('IOS application has not been found');
                              }
                          }
                          else
                          {
                            callback_wf('IOS application has not been found');
                          }
                      }
                      else if(platform_type == '2') // Android
                      {
                          var androidAWSapp = appData.android_aws_app_data;
                          if(androidAWSapp != '' && androidAWSapp != null )
                          {
                              var androidAppDataParse = JSON.parse(androidAWSapp);  
                              applicationArn = androidAppDataParse.appAwsArn; // Andriod App
                              if(applicationArn != '' && applicationArn != null && typeof applicationArn !== undefined)
                              {
                                  callback_wf(null, applicationArn);
                              }
                              else
                              {
                                  callback_wf('Android application has not been found');
                              }
                          }
                          else
                          {
                            callback_wf('Android application has not been found');
                          }
                      }
                      else
                      {
                          callback_wf('Application Platform has not valid');
                      }
                   });
              },
              // 2.  User Unsubscription Process
              function(applicationArn, callback_wf) {
                    
                    awsApplicationRemoveUserUnsubscription(company_id, platform_type, applicationArn, function(userUnsubscription_callback){
                            if(userUnsubscription_callback.status != 'fail')
                            {
                              callback_wf(null, userUnsubscription_callback.data, applicationArn);
                            }
                            else
                            {
                              callback_wf(userUnsubscription_callback.message);
                            }
                    });
              },
              // 3. Endpoint Remove Process
              function(endPointList, applicationArn, callback_wf) {
                    
                    if(endPointList.length > 0)
                    {
                      awsApplicationRemoveUserEndpoint(endPointList, company_id, platform_type, applicationArn, function(endPoint_remove_callback){
                              
                              if(endPoint_remove_callback.status != 'fail')
                              {
                                callback_wf(null, applicationArn);
                              }
                              else
                              {
                                callback_wf(endPoint_remove_callback.message);
                              }
                      })
                    }
                    else
                    {
                      callback_wf(null, applicationArn);
                    }
              },
              // 4. Remove Application
              function(applicationArn, callback_wf) {
                    
                    awsRemoveApplication(applicationArn, company_id, platform_type, function(application_record_callback){
                          if(application_record_callback.status != 'fail')
                          {
                              callback_wf(null);
                          }
                          else
                          {
                              callback_wf(application_record_callback.message);
                          }
                    })
              }
          ],
          function (err, data)
          {
             // Final Process
              // 5. Remove Application process : finish
              if(err != null && err != '')
              {
                  callback({
                      status: 'fail',
                      data: null,
                      message: 'Application remove process has not been completed successfully'
                  });
              }
              else
              {
                  callback({
                      status: 'success',
                      data: null,
                      message: 'Application remove process has been completed successfully'
                  });
              }
          })  
      }
      else
      {
          callback({
              status: 'fail',
              data: null,
              message: 'Application Platform has not been found'
          });
      }
}

/*
 * @author : GK
 * Application
 * User unsubscription process based on Application Arn & PlatForm Type
 * @param : company_id : Company ID
 * @param : platform_type : 1 = IOS, 2 = Android
 * @param : application_arn : Application Arn
 */
var awsApplicationRemoveUserUnsubscription = function awsApplicationRemoveUserUnsubscription(company_id, platform_type, application_arn, callback)
{
    if(company_id != '' && platform_type != '')
    {
          // Get Value Query
          db.query('select * from aws_user_subscription where application_arn = :application_arn and notification_type = "2" and device_type = :notification_type and delete_request = "1"',
              { replacements: { notification_type: platform_type, application_arn: application_arn }, type: db.QueryTypes.SELECT }
          ).then(function(userData)
          {
                var endPointArnList = [];
                  
                // ForEach(1) Start
                async.forEachSeries(userData, function(user, callback_f1) {
                    var subscription_record_id = user.id; // Subscription Record Id
                    var user_id = user.user_id; // User Id
                    var rule_id = user.rule_id; // Rule Id
                    var group_id = user.company_group_id; // Group Id
                    var subsciption_arn = user.subsciption_arn; // Subsciption Arn
                    var application_end_arn = user.application_endpoint_arn; // Application Endpoint Arn

                    if(
                        subscription_record_id != '' && subscription_record_id != null &&
                        user_id != '' && user_id != null &&
                        rule_id != '' && rule_id != null &&
                        group_id != '' && group_id != null &&
                        subsciption_arn != '' && subsciption_arn != null &&
                        application_end_arn != '' && application_end_arn != null
                      )
                    {
                        // 2.1 - Unsubscription User
                        // Unsubcription Push Notification
                        awsUserPushUnSubscriptionProcess(user_id, group_id, rule_id, company_id, subsciption_arn, subscription_record_id, platform_type, function(pushUnsubscription_callback){
                              endPointArnList.push({
                                    user_id: user_id,
                                    endpoint_arn: application_end_arn
                              })
                              callback_f1();
                        })
                    }
                    else
                    {
                        callback_f1();
                    }
                }, function() {
                    // ForEach(1) End
                    callback({
                        status: 'success',
                        data: endPointArnList,
                        message: 'User unsubscription process has been completed successfully on application remove time'
                    });
                });
          })
    }
    else
    {
        callback({
            status: 'fail',
            data: null,
            message: 'User unsubscription process has not been completed successfully on application remove time'
        });
    }
}

/*
 * @author : GK
 * Application
 * Endpoint Remove process from AWS and Local Database based on Application Arn & PlatForm Type
 * @param : endpoint_json : Endpoint JSON 
 *   [ { user_id : '----', endpoint_arn: '----' }, { user_id : '----', endpoint_arn: '----' }, ... ]
 * @param : company_id : Company ID
 * @param : platform_type : 1 = IOS, 2 = Android
 * @param : application_arn : Application Arn
 */
var awsApplicationRemoveUserEndpoint = function awsApplicationRemoveUserEndpoint(endpoint_json, company_id, platform_type, application_arn, callback)
{
    if(company_id != '' && platform_type != '' && application_arn != '' && endpoint_json != '')
    {
        // ForEach(1) Start
        async.forEachSeries(endpoint_json, function(endPoint, callback_f1) {
                var user_id = endPoint.user_id; // User Id
                var endpoint_arn = endPoint.endpoint_arn; // Endpoint Arn
                if( endpoint_arn != '' && endpoint_arn != null &&
                    user_id != '' && user_id != null
                  )
                {
                    // 3.1 Endpoint valid
                    // Get mobile device record
                    db.models.mobile_device.findOne( { where: { user_id : user_id, aws_application_endpoint_arn: endpoint_arn, type: platform_type } } ).then(function(mobile_device_callback) {
                          if(mobile_device_callback)
                          {
                              var get_mobile_device_record_id = mobile_device_callback.id; // Mobile device record Id
                              if(get_mobile_device_record_id != '' && get_mobile_device_record_id != null)
                              {
                                 // Mobile device record found
                                 // 3.1.1 Remove endpoint process
                                 //Remove Endpoint Record
                                 awsRemoveEndpointArnAndDeviceRecord( user_id, endpoint_arn, platform_type, get_mobile_device_record_id, function(endPoint_remove_callback){
                                      callback_f1();
                                 });
                              }
                              else // Mobile device record not found
                              {
                                  // 3.1.1 endpoint not found
                                  callback_f1();
                              }
                          }
                          else
                          {
                            callback({
                                 status: 'fail',
                                 data: null,
                                 message: 'Mobile device record has not been found'
                            });
                          }
                      }).catch(function(err) {
                            callback({
                                status: 'fail',
                                data: err,
                                message: 'Mobile device record has not been found'
                            });
                      }); 
                }
                else
                {
                    // 3.1 Endpoint not found
                    callback_f1();
                }
        }, function() {
            // ForEach(1) End
            callback({
                status: 'success',
                data: null,
                message: 'Device Endpoint remove process has been completed successfully on application remove time'
            });
        });
    }
    else
    {
      callback({
          status: 'fail',
          data: null,
          message: 'Device Endpoint remove process has not been completed successfully on application remove time'
      });
    }
}

/*
 * @author : GK
 * Application
 * Remove Application Process From AWS and Local Database
 * @param : company_id : Company ID
 * @param : platform_type : 1 = IOS, 2 = Android
 * @param : application_arn : Application Arn
 */
var awsRemoveApplication = function awsRemoveApplication(application_arn, company_id, platform_type, callback)
{
  if(application_arn != '' && application_arn != null)
  {
      // Remove Application Arn
      awsSubscriber.deleteApplication(application_arn, function(remove_application_callback){
            if(remove_application_callback.response != 'error')
            {
                  awsRemoveApplicationRecord(company_id, platform_type, function(application_record_remove_callback){
                          if(application_record_remove_callback.status != 'fail')
                          {
                            callback({
                                status: 'success',
                                data: null,
                                message: 'Remove Application has been processed successfully'
                            });     
                          }
                          else
                          {
                            callback({
                                status: 'fail',
                                data: null,
                                message: 'Remove Application has not been processed successfully'
                            });
                          }
                  })
            }
            else
            {
                callback({
                    status: 'fail',
                    data: remove_application_callback.data,
                    message: 'Remove Application has not been processed successfully'
                });
            }
      })
  }
  else
  {
      callback({
          status: 'fail',
          data: null,
          message: 'Application Arn has not been found'
      });
  }
}

/*
 * @author : GK
 * Application
 * Remove Application record from Local Database
 * @param : company_id : Company ID
 * @param : platform_type : 1 = IOS, 2 = Android
 */
var awsRemoveApplicationRecord = function awsRemoveApplicationRecord(company_id, platform_type, callback)
{
    var applicationObj = '';
    if(platform_type == '1')
    {
        applicationObj = [];
        applicationObj = {
            ios_aws_app_data : null
        }
    }
    else if(platform_type == '2')
    {
        applicationObj = [];
        applicationObj = {
            android_aws_app_data : null
        }
    }
    
    if(applicationObj != '')
    {
        db.models.setting.update( applicationObj, {
                                   where : ["company_id = ? ", company_id]
                                   }).then(function(application_setting_callback) {
                callback({
                      status: 'success',
                      data: null,
                      message: 'Application record has been successfully updated/removed'
                });
        }).catch(function(err){
            callback({
                status: 'fail',
                data: err,
                message: 'Application record has not been successfully updated/removed'
            });
        });
    }
    else
    {
      callback({
          status: 'fail',
          data: null,
          message: 'Application Platform has not been found'
        });
    }    
}

/* ############### Application Function(s) : End ############### */


module.exports = {
    awsCreateTopicAndUpdatRule: awsCreateTopicAndUpdatRule,
    awsGroupRegistration: awsGroupRegistration,
    awsUpdateGroupStatus: awsUpdateGroupStatus,
    awsEmailUserSubscriptionByGroupId: awsEmailUserSubscriptionByGroupId,
    awsGetTopicArnByRuleId: awsGetTopicArnByRuleId,
    awsUnsubscriptionGroupStatus: awsUnsubscriptionGroupStatus,
    awsUnsubscriptionOfEmailGroup: awsUnsubscriptionOfEmailGroup,
    removeGroupByGroupStataus: removeGroupByGroupStataus,
    awsAllGroupStatusChangeByRuleId: awsAllGroupStatusChangeByRuleId,
    awsPushUserSubscriptionByGroupId: awsPushUserSubscriptionByGroupId,
    awsGetApplicationData: awsGetApplicationData,
    awsPushSubscription: awsPushSubscription,
    awsUnsubscriptionOfPushGroup: awsUnsubscriptionOfPushGroup,
    removeFullRule: removeFullRule,
    awsGetEmailSubscriptionArn: awsGetEmailSubscriptionArn,
    awsRemovePendingSubscribeRecord: awsRemovePendingSubscribeRecord,
    awsRemoveDeletedRulePendingSubscribeRecord: awsRemoveDeletedRulePendingSubscribeRecord,
    awsResubscriptionProcessOfPendingUser: awsResubscriptionProcessOfPendingUser,
    awsUserSubscriptionAndUnSubscriptionByUserId: awsUserSubscriptionAndUnSubscriptionByUserId,
    awsUserUnSubscriptionByUserId: awsUserUnSubscriptionByUserId,
    awsUserEmailUnSubscriptionProcess: awsUserEmailUnSubscriptionProcess,
    awsUserPushUnSubscriptionProcess: awsUserPushUnSubscriptionProcess,
    awsUserSubscriptionByUserId: awsUserSubscriptionByUserId,
    awsCheckUserSubscriptionStatus: awsCheckUserSubscriptionStatus,
    awsUserEmailSubscriptionProcess: awsUserEmailSubscriptionProcess,
    awsUserPushSubscriptionProcess: awsUserPushSubscriptionProcess,
    awsDeviceRegistrationWithNotificationSubscription: awsDeviceRegistrationWithNotificationSubscription,
    awsDeviceUUIDFoundProcess: awsDeviceUUIDFoundProcess,
    awsUpdateDevicePushTokenData: awsUpdateDevicePushTokenData,
    awsUserSelectedDeviceUnsubscriptionProcess: awsUserSelectedDeviceUnsubscriptionProcess,
    awsDeviceUnsubscriptionBasedOnEndpointArn : awsDeviceUnsubscriptionBasedOnEndpointArn,
    awsDeleteUserUnSubscription: awsDeleteUserUnSubscription,
    awsDeleteUserMobileDeviceByUserId: awsDeleteUserMobileDeviceByUserId,
    awsRemoveMobileDeviceRecord: awsRemoveMobileDeviceRecord,
    awsRemoveEndpointArnAndDeviceRecord: awsRemoveEndpointArnAndDeviceRecord,
    awsUserSMSSubscriptionByGroupId: awsUserSMSSubscriptionByGroupId,
    awsUnsubscriptionOfSMSGroup: awsUnsubscriptionOfSMSGroup,
    awsUserSMSUnSubscriptionProcess: awsUserSMSUnSubscriptionProcess,
    awsUserSMSSubscriptionProcess: awsUserSMSSubscriptionProcess,
    awsUserSMSEndPointChange: awsUserSMSEndPointChange,
    awsApplicationCreate: awsApplicationCreate,
    awsApplicationRemove: awsApplicationRemove,
    awsApplicationRemoveUserUnsubscription: awsApplicationRemoveUserUnsubscription,
    awsApplicationRemoveUserEndpoint: awsApplicationRemoveUserEndpoint,
    awsRemoveApplication: awsRemoveApplication,
    awsRemoveApplicationRecord: awsRemoveApplicationRecord
};