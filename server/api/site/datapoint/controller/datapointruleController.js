'use strict';

var generalConfig = require('../../../../config/generalConfig');
var crypto = require('crypto');
var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");
/* Common function Lib */
var commonLib = require('../../../../lib/common');
var async = require('async');
var generalCount = 0;

var notification_log_lib = require('../../../../lib/notification_log/notification_log');


var sensorValue = [
    { 'name' : 'temperature', 'value' : 33 },
    { 'name' : 'Magnetometer' , 'value' : null,
      'sub' : [
                { 'name' : 'x', 'value' : 166 },
                { 'name' : 'y', 'value' : 166 },
                { 'name' : 'z', 'value' : 166 }
        
        ]
    },
    { 'name' : 'Frequency', 'value' : 68 },
    { 'name' : 'Load Cell', 'value' : 77 },
    { 'name' : 'CO2', 'value' : 2100 },
    { 'name' : 'Voltage', 'value' : 166 },
    { 'name' : 'Pressure', 'value' : 441 },
    { 'name' : 'Battery level', 'value' : 68 },
    { 'name' : 'Gyroscope', 'value': null,
      'sub' : [
                { 'name' : 'x', 'value' : 100 },
                { 'name' : 'y', 'value' : 100 },
                { 'name' : 'z', 'value' : 100 }
        ]
    },
    { 'name' : 'Altitude', 'value' : 11010 },
    { 'name' : 'Electric Power Consumption', 'value' : 80 },
    { 'name' : 'speed', 'value' : 75 },
    { 'name' : 'Humidity', 'value' : 61 },
    { 'name' : 'Liquid Flow', 'value' : 19 },
    { 'name' : 'Light', 'value' : 2200 },
    { 'name' : 'Distance', 'value' : 110 },
    { 'name' : 'Fuel', 'value' : 29 },
    { 'name' : 'Motor Speed', 'value' : 7000 },
    { 'name' : 'Current', 'value' : 14 },
    { 'name' : 'Accelerometer', 'value' : null,
      'sub' : [
               { 'name' : 'x', 'value' : 5 },
               { 'name' : 'y', 'value' : 5 },
               { 'name' : 'z', 'value' : 5 }
        ]
    }
];

/**
 * @author : GK
 * Update Sensor Id based on Thing id, Rule id & Company id
 */
exports.sensorValueUpdateProcess = function(req, res, next) {
    notification_log_lib.all_notification_update(function(callback){
        res.json({
            status: 'success',
            data: null,
            message: 'Notification update process has been completed successfully'
        });
    });
}

/**
 * @author : GK
 * Add Parent & Child Company Rule
 */
exports.addParentChildRuleData = function(req, res, next) {

    var parent_company_id = req.body.parent_company_id;
    if(parent_company_id)
    {
        /* WaterFall Start */
        async.waterfall(
        [
            function(callback_wt)
            {
                 addCompanyRuleData(parent_company_id, function(company_rule_reg){
                        if(company_rule_reg.status == 'fail')
                        {
                            res.json(company_rule_reg)
                        }
                        else
                        {
                            callback_wt(null);
                        }
                 })
            },
            function(callback_wt)
            {
                 db.query('select * from company where parent_id = :company_id',
                    { replacements: { company_id: parent_company_id }, type: db.QueryTypes.SELECT }
                    ).then(function(child_company)
                    {
                        // Foreach(1)
                        async.forEachSeries(child_company, function(childComp, callback_f1) {
                             
                             var get_child_company_id = childComp.id; // Child Compnay ID
                             addCompanyRuleData(get_child_company_id, function(child_company_rule_reg){
                                    if(child_company_rule_reg.status == 'fail')
                                    {
                                        callback_wt(child_company_rule_reg.data);
                                    }
                                    else
                                    {
                                        callback_f1();
                                    }
                             })
                        }, function()
                        {
                            
                            // Foreach END
                            res.json({
                                status: 'success',
                                data: null,
                                message: 'Parent & Child company rule has been successfully registered'
                            });
                            
                        });
                }).catch(function(err){
                    res.json({
                        status: 'fail',
                        data: err,
                        message: 'Parent & Child company rule has not been successfully registered'
                    });
                });
            }
        ],
        function (err, data) { // WaterFall Final Process
            if(err != null)
            {
                res.json(err);
            }
            else
            {
                res.josn({
                        status: 'success',
                        data: err,
                        message: 'Parent & Child company rule has been successfully registered'
                    })
            }

        }
       );
    }
    else
    {
        res.json({
            status: 'fail',
            data: null,
            message: 'Company id has not been found'
        })
    }
}

/**
 * @author : GK
 * Add Rule for Template Attribute
 * @param : company_id : Company Id
 */
var addCompanyRuleData = function addCompanyRuleData(company_id, callback)
{    

    var dwelltimestring = ['minute', 'hour', 'day'];
    var dwelltime = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
    var severity = ['1','5','10'];
    var userGroup_ary = [];
    var command_ary = [];
    var boolenCondition = [true, false];

    async.waterfall(
    [
        // Get UserGroup Array
        function(callback_wt)
        {
           db.query('select id from company_group where company_id = :company_id',
            { replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
            ).then(function(usergroup_resp)
            {
                async.forEachSeries(usergroup_resp, function(userGroup, callback_f1) {
                        var userGroup_id = userGroup.id;
                        userGroup_ary.push(userGroup_id);
                        callback_f1();
                }, function()
                {
                    // Foreach END
                    callback_wt(null);
                });
            }).catch(function(err){
                callback({
                    status: 'fail',
                    data: err,
                    message: 'User group has not been successfully loaded'
                });
            });
        },
        // Get Command List
        function(callback_wt)
        {
           db.query('SELECT * FROM company_command where company_id = :company_id',
            { replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
            ).then(function(command_resp)
            {
                async.forEachSeries(command_resp, function(command, callback_f1) {
                        var command_id = command.id;
                        command_ary.push(command_id);
                        callback_f1();
                }, function()
                {
                    callback_wt(null);
                });
            }).catch(function(err){
                callback({
                    status: 'fail',
                    data: err,
                    message: 'Command has not been successfully loaded'
                });
            });
        },
        // Rule & Rule Subscription Process
        function(callback_wt)
        {
            db.query('select devg.id as deviceRegId, temp.id as temptable_reg_id, tempAttr.id as temp_attr_reg_id, tempAttr.name as attrName, (select count(*) from template_attr as subTempAttr where tempAttr.id = subTempAttr.parent_attr_id ) as childCount, (select name from template_attr as subTempAttr where subTempAttr.id = tempAttr.parent_attr_id) as parentAttrName, devg.* , temp.*, tempAttr.*  from device_group as devg left join template as temp on temp.device_group_id = devg.id left join template_attr as tempAttr on temp.id =tempAttr.template_id where devg.company_id = :company_id',
            { replacements: { company_id: company_id }, type: db.QueryTypes.SELECT }
                ).then(function(tempData_resp)
                {
                    // Foreach(1) Start
                    var foreach_loop_count = 0;
                    async.forEachSeries(tempData_resp, function(tempAttr, callback_f1) {

                                foreach_loop_count++;
                                var device_group_id = tempAttr.device_group_id; //  Device Group Id
                                var temp_attr_id = tempAttr.temp_attr_reg_id; // Template Attr Id
                                var temp_attr_name = tempAttr.attrName; // Template Attr Name
                                var childCount = tempAttr.childCount; // Child Template Attribute Count
                                var parent_attr_id = tempAttr.parent_attr_id; //  Parent Attr ID
                                if(parent_attr_id == 0) { parent_attr_id = temp_attr_id }
                                
                                var parent_attr_name = tempAttr.parentAttrName; // Template Parent Attr Name
                                var rule_name = 'rule_'+foreach_loop_count; // Rule Name

                                // Display Name
                                var displayName = temp_attr_name;
                                if(parent_attr_name != null ) { displayName = temp_attr_name+' of '+parent_attr_name }

                                // Email Condition
                                var email_group = [];
                                var email_sub_text = '';
                                var email_temp_text = '';
                                if(userGroup_ary.length > 0)
                                {
                                    var email_condition = boolenCondition[Math.floor(Math.random()*boolenCondition.length)];
                                    if(email_condition == true)
                                    {
                                        email_group.push(userGroup_ary[Math.floor(Math.random()*userGroup_ary.length)]);
                                        email_sub_text = displayName;
                                        email_temp_text = displayName+' is out of range';
                                    }
                                }
                                else
                                {
                                    email_condition = false;
                                }

                                // Push Condition
                                var push_group = [];
                                var push_temp_text = '';
                                if(userGroup_ary.length > 0)
                                {
                                    var push_condition = boolenCondition[Math.floor(Math.random()*boolenCondition.length)];
                                    if(push_condition == true)
                                    {
                                        push_group.push(userGroup_ary[Math.floor(Math.random()*userGroup_ary.length)]);
                                        push_temp_text = displayName+' is out of range';
                                    }
                                }
                                else
                                {
                                    push_condition = false;
                                }

                                // SMS Condition
                                var sms_group = [];
                                var sms_temp_text = '';
                                if(userGroup_ary.length > 0)
                                {
                                    var sms_condition = boolenCondition[Math.floor(Math.random()*boolenCondition.length)];
                                    if(sms_condition == true)
                                    {
                                        sms_group.push(userGroup_ary[Math.floor(Math.random()*userGroup_ary.length)]);
                                        sms_temp_text = displayName+' is out of range';
                                    }
                                }
                                else
                                {
                                    sms_condition = false;
                                }


                                if(childCount > 0)
                                {
                                    callback_f1();
                                }
                                else
                                {

                                    async.waterfall(
                                    [
                                        // Get Attribute define Value
                                        function(callback_wt_in)
                                        {
                                            var rule_details_val = getAttrbuteValue(temp_attr_name, parent_attr_name, function(getvalueRes){
                                                    var rule_details_val = getvalueRes.data;
                                                     callback_wt_in(null, rule_details_val);
                                            });
                                        
                                        },
                                        // Rule details Insert process
                                        function (ruleValue, callback_wt_in)
                                        {
                                            // ****** Insert Rule
                                            // Rule Registration
                                                var ruleDataObj = [];
                                                ruleDataObj = { 
                                                     //alltrue : req.body.allTrue,
                                                     company_id: company_id,
                                                     //condition: req.body.condition,
                                                     ctodtopic: 'ctod_',
                                                     description: '',
                                                     dwelltime: dwelltime[Math.floor(Math.random()*dwelltime.length)],
                                                     dwelltimestring: dwelltimestring[Math.floor(Math.random()*dwelltimestring.length)],
                                                     email_notification: email_condition,
                                                     push_notification: push_condition,
                                                     sms_notification: sms_condition,
                                                     execute_operation: false,
                                                     company_command_id: null,
                                                     name: rule_name,
                                                     //thing_id: req.body.thingId,
                                                     device_group_id: device_group_id,
                                                     rules_type: '1',
                                                     query_string: '',
                                                     email_template: email_temp_text,
                                                     email_subject_template: email_sub_text,
                                                     push_template: push_temp_text,
                                                     sms_template: sms_temp_text,
                                                     severity: severity[Math.floor(Math.random()*severity.length)]
                                                   };

                                                // Add New Rule   
                                                db.models.rule.create(ruleDataObj).then(function(rule) {
                                                    if(rule)
                                                    {
                                                        var getRuleData = rule.dataValues; 
                                                        var getRuleID = getRuleData.id; /* Latest register rule id */

                                                       // ****** Insert Rule Details
                                                        // Add Rule Details
                                                        var attrName = '';
                                                        if(parent_attr_name != null)
                                                        {
                                                            attrName = parent_attr_name+'.'+temp_attr_name;
                                                        }
                                                        else
                                                        {
                                                            attrName = temp_attr_name;
                                                        }

                                                        var ruleDetailsAttrDataObj = [];
                                                            ruleDetailsAttrDataObj = {
                                                                    key: attrName,
                                                                    rule_id: getRuleID,
                                                                    operator: '>',
                                                                    value: ruleValue.toString(),
                                                                    template_attr_id: temp_attr_id,
                                                                    template_attr_parent_id: parent_attr_id
                                                                }
                                                        // Query Rule Details
                                                        db.models.rule_detail.create(ruleDetailsAttrDataObj).then(function(ruleDetailSubAttr) {
                                                            if(ruleDetailSubAttr)
                                                            {
                                                                var insertRecordId = ruleDetailSubAttr.id; // Inserted Record Id
                                                                callback_wt_in(null, getRuleID);
                                                            }
                                                            else
                                                            {
                                                                callback_wt_in(null, getRuleID);
                                                            }
                                                        }).catch(function(err) {
                                                            var msg = ({
                                                                    status: 'fail',
                                                                    data: err,
                                                                    message: 'Rule attribute has not been inserted successfully'
                                                                });
                                                            callback(msg); // Cut WaterFlow
                                                        }); 

                                                    }
                                                    else
                                                    {
                                                        return callback({
                                                            status: 'fail',
                                                            data: null,
                                                            message: 'Rule details attribute has not been registered successfully'
                                                        });
                                                    }
                                                 }).catch(function(err) {
                                                        return callback({
                                                            status: 'fail',
                                                            data: err,
                                                            message: 'Rule has not been registered successfully'
                                                         });
                                                 });
                                        },
                                        // Rule User Email Subsciprion Subscription
                                        function (ruleId, callback_wt_in)
                                        {
                                            if(email_group.length > 0 && email_condition == true)
                                            {
                                                 async.forEachSeries(email_group, function(group, callback_f1_e) {
                                                        
                                                        var email_group = [];
                                                            email_group = {
                                                                    company_group_id : group,
                                                                    rule_id : ruleId,
                                                                    notification_type: '1',
                                                                    status: '2'
                                                            }
                                                        db.models.aws_group_subscription.create(email_group).then(function(emailSubAttr) {
                                                            if(emailSubAttr)
                                                            {
                                                                callback_f1_e();
                                                            }
                                                            else
                                                            {
                                                                callback_f1_e();
                                                            }
                                                        }).catch(function(err) {
                                                            var msg = ({
                                                                    status: 'fail',
                                                                    data: err,
                                                                    message: 'Email Subscription has not been inserted successfully'
                                                                });
                                                            callback(msg); // Cut WaterFlow
                                                        }); 
                                                },function()
                                                {
                                                    callback_wt_in(null, ruleId);
                                                });
                                            }
                                            else
                                            {
                                                callback_wt_in(null, ruleId);
                                            }
                                        },
                                        // Rule User Push Subsciprion Subscription
                                        function (ruleId, callback_wt_in)
                                        {
                                            if(push_group.length > 0 && push_condition == true)
                                            {
                                                 async.forEachSeries(push_group, function(group, callback_f1_p) {
                                                        
                                                        var push_group = [];
                                                            push_group = {
                                                                    company_group_id : group,
                                                                    rule_id : ruleId,
                                                                    notification_type: '2',
                                                                    status: '2'
                                                            }
                                                        db.models.aws_group_subscription.create(push_group).then(function(pushSubAttr) {
                                                            if(pushSubAttr)
                                                            {
                                                                callback_f1_p();
                                                            }
                                                            else
                                                            {
                                                                callback_f1_p();
                                                            }
                                                        }).catch(function(err) {
                                                            var msg = ({
                                                                    status: 'fail',
                                                                    data: err,
                                                                    message: 'Push Subscription has not been inserted successfully'
                                                                });
                                                            callback(msg); // Cut WaterFlow
                                                        }); 
                                                },function()
                                                {
                                                    callback_wt_in(null, ruleId);
                                                });
                                            }
                                            else
                                            {
                                                callback_wt_in(null, ruleId);
                                            }
                                        },
                                        // Rule User SMS Subsciprion Subscription
                                        function (ruleId, callback_wt_in)
                                        {
                                            if(sms_group.length > 0 && sms_condition == true)
                                            {
                                                 async.forEachSeries(sms_group, function(group, callback_f1_s) {
                                                        
                                                        var sms_group = [];
                                                            sms_group = {
                                                                    company_group_id : group,
                                                                    rule_id : ruleId,
                                                                    notification_type: '3',
                                                                    status: '2'
                                                            }
                                                        db.models.aws_group_subscription.create(sms_group).then(function(smsSubAttr) {
                                                            if(smsSubAttr)
                                                            {
                                                                callback_f1_s();
                                                            }
                                                            else
                                                            {
                                                                callback_f1_s();
                                                            }
                                                        }).catch(function(err) {
                                                            var msg = ({
                                                                    status: 'fail',
                                                                    data: err,
                                                                    message: 'SMS Subscription has not been inserted successfully'
                                                                });
                                                            callback(msg); // Cut WaterFlow
                                                        }); 
                                                },function()
                                                {
                                                    callback_wt_in(null);
                                                });
                                            }
                                            else
                                            {
                                                callback_wt_in(null);
                                            }
                                        }
                                    ],
                                     function (err, data) { // WaterFall Final Process
                                        callback_f1(); 
                                     }
                                    );
                                }
                    }, function() {
                            // Foreach END
                            callback({
                                status: 'success',
                                data: null,
                                message: 'Rule record insert process has been completed'
                            });
                    });

                }).catch(function(err){
                    callback({
                        status: 'fail',
                        data: err,
                        message: 'Rule record insert process has not been completed'
                    });
                });
        }

    ],
        function (err, data) { // WaterFall Final Process
              callback({
                status: 'success',
                data: null,
                message: 'Rule record insert process has been completed'
            });
        }
    );
}

/**
 * @author : GK
 * Get Define Sensor value
 * @param : attributeName : Attribute Name
 * @param : attributeParentName : Attribute's Parent attribute Name
 */

var getAttrbuteValue = function getAttrbuteValue(attributeName, attributeParentName, callback)
{
    var result_value = '10';
     async.forEachSeries(sensorValue, function(tempAttr, callback_f1) {
            
            if(attributeParentName != null)
            {
                if(tempAttr.name == attributeParentName)
                {
                    // Foreach(2) Start
                    async.forEachSeries(tempAttr.sub, function(tempchildAttr, callback_f2) {
                            if(tempchildAttr.name == attributeName)
                            {
                                result_value = tempchildAttr.value;
                                callback_f2();
                            }
                            else
                            {
                                callback_f2();
                            }

                    }, function() {
                        // Foreach(2) END
                        callback_f1();
                    });
                    
                }
                else
                {
                    callback_f1();
                }
            }
            else
            {
                if(tempAttr.name == attributeName)
                {
                   result_value = tempAttr.value;
                   callback_f1();
                }
                else
                {
                    callback_f1();
                }
            }

     }, function() {
        // Foreach END
        return callback({ data: result_value });
     });
}


exports.runPrediction = function(req, res) {
    var async = require('async');
    if (req.body != '')
    {
        req.checkBody('thingId', 'Thing required').notEmpty();
        req.checkBody('groups', 'Email Notification Group required').notEmpty();
        req.checkBody('emailtemplate', 'Email Template required').notEmpty();
        req.checkBody('emailtemplatesubject', 'Email Template Subject required').notEmpty();
        var mappedErrors = req.validationErrors(true);
    }

    if (mappedErrors == false)
    {
        //Get userinfo from request
        var userInfo = generalConfig.getUserInfo(req);
        if (!userInfo.companyId) {
            return res.json({
                status: 'fail',
                data: null,
                message: 'User information not found'
            });
        }

        var companyId = userInfo.companyId;
        var companyID = companyId;
        var value = 15;
        async.waterfall(
        [
            // Get Attribute define Value
            function(callback_wt_in)
            {
                var value = getAttrbuteValue('temperature', null, function(getvalueRes){
                        var value = getvalueRes.data;
                         callback_wt_in(null, value);
                });
            
            },
            //send notification
            function (value, callback_wt_in)
            {
                var nextValue = value - 15;
                var sensorname = 'temperature';
                var data = [];
                var dataInsertionArray = [];
                var predictionDataObj = {
                     company_id: companyId,
                     thing_id: req.body.thingId,
                     sensorname: sensorname,
                     sensorvalue:nextValue,
                     email_notification: req.body.emailnotification,
                     email_template: req.body.emailtemplate,
                     email_subject_template: req.body.emailtemplatesubject
                };
                data.push(predictionDataObj);
                for ( var i = 0; i < 9; i++){
                    nextValue = nextValue + parseInt(Math.random() * (4));

                    predictionDataObj = {
                             company_id: companyId,
                             thing_id: req.body.thingId,
                             sensorname: sensorname,
                             sensorvalue:nextValue,
                             email_notification: req.body.emailnotification,
                             email_template: req.body.emailtemplate,
                             email_subject_template: req.body.emailtemplatesubject
                           };
                    if(i < 9){
                        data.push(predictionDataObj);
                    }
                    dataInsertionArray.push(predictionDataObj);
                }

                db.models.prediction.bulkCreate(data).then(function(prediction) {
                    if(prediction)
                    {
                        var str = '';
                        data.forEach(function(v){
                             str += "<tr>";
                             str +="<td style='font-family:Arial, Helvetica, sans-serif; border-right:solid 1px #ccc; border-bottom:solid 1px #ccc;''>"+v.sensorname+"</td>";
                             str +="<td style='font-family:Arial, Helvetica, sans-serif; border-bottom:solid 1px #ccc;'>"+v.sensorvalue+"</td>";
                             str += "</tr>";
                        });
                        
                        db.models.company_group.hasMany(db.models.company_user_group,
                            {
                                'foreignKey':'company_group_id'
                            });
                        db.models.company_user_group.belongsTo(db.models.user, {
                            'foreignKey':'user_id'
                        });

                        db.models.company_group
                        .findAll({
                            include: [
                                        {
                                            model: db.models.company_user_group,
                                            include:[{
                                                model: db.models.user
                                            }]
                                        }
                                     ],
                            where: {
                                company_id:companyId,
                                id: {
                                    $in:req.body.groups
                                }
                            }
                        }).then(function(usergroup) {
                            var testing = false;
                            usergroup[0].dataValues.company_user_groups.forEach(function(val){
                                // && testing == false
                                if(val.user){
                                    testing = true;
                                    var email = val.user.email;
                                    //email = 'naresh.bohra@softwebsolutions.com';
                                    var fullusername = val.user.firstname;
                                    //new email body
                                    var emailmessage = '<table border=\'0\' cellpadding=\'0\' cellspacing=\'0\' width=\'100%\'>\n<tbody>\n<tr>\n<td class=\'container\' align=\'center\' valign=\'top\' width=\'100%\'><table class=\'container\' style=\'height:6px;background-color:#0282c3\' align=\'center\' border=\'0\' cellpadding=\'0\' cellspacing=\'0\' width=\'600\'>\n<tbody>\n<tr>\n<td class=\'\' style=\'background-color:#0282c3\' bgcolor=\'#aed7f8\' height=\'6\' valign=\'top\'></td>\n</tr>\n</tbody>\n</table></td>\n</tr>\n<tr>\n<td valign=\'top\'>\n<table class=\'container\' style=\'background-color:#fff;border:solid 1px #f1f1f1\' align=\'center\' bgcolor=\'#ffffff\' border=\'0\' cellpadding=\'0\' cellspacing=\'0\' width=\'600\'>\n<tbody>\n<tr>\n<td valign=\'top\'>\n<table class=\'full-width\' align=\'center\' border=\'0\' cellpadding=\'0\' cellspacing=\'0\' width=\'560\'>\n<tbody>\n<tr>\n<td class=\'\' valign=\'top\' height=\'10\'></td>\n</tr>\n<tr>\n<td valign=\'middle\'><table class=\'container2\' align=\'left\' border=\'0\' cellpadding=\'0\' cellspacing=\'0\'>\n<tbody>\n<tr>\n<td class=\'\' align=\'center\' valign=\'top\'>\n<a href=\'#\'><img src=\' data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXcAAAA6CAYAAABLcRn4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RTU2NkI3QzdDODNEMTFFNkE0Nzk4OUY1RTY3RkNGMTMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RTU2NkI3QzhDODNEMTFFNkE0Nzk4OUY1RTY3RkNGMTMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpFNTY2QjdDNUM4M0QxMUU2QTQ3OTg5RjVFNjdGQ0YxMyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpFNTY2QjdDNkM4M0QxMUU2QTQ3OTg5RjVFNjdGQ0YxMyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PmImqKIAABK9SURBVHja7F0L2FZT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\' alt=\'\' border=\'0\' width=\'230\'></a>\n</td>\n</tr>\n</tbody>\n</table>\n</td>\n</tr>\n<tr>\n<td class=\'\' valign=\'top\' height=\'15\'></td>\n</tr>\n</tbody>\n</table>\n</td>\n</tr>\n</tbody>\n</table>\n</td>\n</tr>\n<tr>\n<td align=\'center\' valign=\'top\'>\n<table border=\'0\' cellpadding=\'0\' cellspacing=\'0\' width=\'600\' bgcolor=\'#f1f1f1\' style=\'background:#f8f8f8 none repeat scroll 0 0;border:1px solid #e8e8e8\'>\n<tbody>\n<tr>\n<td height=\'20\'>&nbsp;</td>\n</tr>\n<tr>\n<td align=\'center\'>\n<table width=\'560\' cellspacing=\'0\' cellpadding=\'0\' border=\'0\'>\n<td style=\'font-family:Arial,Helvetica,sans-serif\'>%userinput%</td>\n</table>\n</td>\n</tr>\n<tr>\n<td height=\'20\'>&nbsp;</td>\n</tr>\n<tr>\n<td class=\'\' valign=\'top\' align=\'center\'>\n<table width=\'560\' cellspacing=\'0\' cellpadding=\'7\' border=\'0\' style=\'border:solid 1px #ccc;border-bottom:0\'>\n<thead>\n<tr>\n<th align="left" style="font-family:Arial,Helvetica,sans-serif;background:#ccc;border-right:solid 1px #ccc;border-bottom:solid 1px #ccc">Sensor Name</th>\n<th align="left" style="font-family:Arial,Helvetica,sans-serif;background:#ccc;border-bottom:solid 1px #ccc">Value</th>\n</tr>\n</thead>\n<tbody>\n%data%\n</tbody>\n</table>\n</td>\n</tr>\n<tr>\n<td height=\'20\'>&nbsp;</td>\n</tr>\n<tr>\n<td align=\'center\'>\n<table width=\'560\' cellspacing=\'0\' cellpadding=\'0\' border=\'0\'>\n<td style=\'font-family:Arial,Helvetica,sans-serif\'>Based on previous data, threshold value of the <strong>%sensorname%</strong> sensor will be crossed in couple of days.</td>\n</table>\n</td>\n</tr>\n<tr>\n<td height=\'20\'>&nbsp;</td>\n</tr>\n</tbody>\n</table>\n</td>\n</tr>\n<tr>\n<td class=\'\' valign=\'top\' height=\'10\'></td>\n</tr>\n<tr>\n<td class=\'container\' align=\'center\' valign=\'top\' width=\'100%\'>\n<table class=\'container\' style=\'height:6px\' align=\'center\' border=\'0\' cellpadding=\'0\' cellspacing=\'0\' width=\'600\'>\n<tbody>\n<tr>\n<td class=\'\' valign=\'top\' align=\'center\' style=\'font-family:Arial,Helvetica,sans-serif;font-size:13px\'>Copyright &copy; 2010-2016 Softweb Solutions</td>\n</tr>\n</tbody>\n</table>\n</td>\n</tr>\n</tbody>\n</table>';
                                    emailmessage = emailmessage.replace("%data%", str);
                                    emailmessage = emailmessage.replace("%sensorname%", sensorname);
                                    emailmessage = emailmessage.replace("%userinput%", req.body.emailtemplate);
                                    
                                    var message = {
                                       from:    "kaustubh.mishra@softwebsolutions.com", 
                                       to:      email,
                                       subject: req.body.emailtemplatesubject,
                                       attachment:
                                       [
                                          {data:emailmessage, alternative:true}
                                       ]
                                    };
                                   settings.emailserver.send(message, function(err, message) { });
                                }
                            });
                            callback_wt_in(null,data);
                        });
                    }
                    else
                    {
                        callback_wt_in(1);
                    }
                 });
            }
        ],
         function (err, data) { // WaterFall Final Process
            if(err){
               res.json({
                        status: 'fail',
                        data: null,
                        message: 'Prediction has not been run successfully'
                    });
            }else{
                res.json({
                    status: 'success',
                    data: data,
                    message: 'Prediction has been run successfully'
                });
            }
         }
        );
    }
    else
    {
        return res.json({
            status: 'fail',
            data: null,
            message: mappedErrors
        });
    }
}