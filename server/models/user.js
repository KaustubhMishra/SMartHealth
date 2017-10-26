var async = require('async');
module.exports = function(sequelize, DataTypes) {

    var user = sequelize.define('user', 
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            email: DataTypes.STRING,
            password: DataTypes.STRING,
            expireon: DataTypes.DATE,
            refreshtoken: DataTypes.STRING,
            usertoken: DataTypes.STRING, 
            company_id: DataTypes.STRING,
            firstname: DataTypes.STRING,
            lastname: DataTypes.STRING,
            phonecode: DataTypes.STRING,
            phone: DataTypes.STRING,
            active: DataTypes.BOOLEAN,
            role_id: DataTypes.INTEGER,
            profile_image: DataTypes.STRING,            
            usertoken: DataTypes.STRING,
            tmp_password: DataTypes.STRING,
            customer_number: DataTypes.STRING,
            timezone:DataTypes.STRING,
            is_mobile: DataTypes.INTEGER,
            device_type: DataTypes.STRING,
            device_token: DataTypes.STRING,
            aws_target_arn: DataTypes.STRING
        }, 
        {
            freezeTableName: true,
            tableName: 'user',
            timestamps: true,     
            paranoid: true,
            classMethods: {
                associate: function(models) {
                    user.hasMany(models.company_user_group, {
                            foreignKey: 'user_id'                        
                        }),
                    user.belongsTo(models.role, {
                            foreignKey: 'role_id'                        
                        }),
                    user.belongsTo(models.company, {
                            foreignKey: 'company_id'                        
                        }),
                    user.hasMany(models.patient, {
                            foreignKey: 'user_id'                        
                        }),
                    user.hasMany(models.user_contact_info, {
                            foreignKey: 'user_id'                        
                        })
                }
            },
            instanceMethods: {
                getGroupName: function(models, callback) {
                    models.company_user_group
                    .findAll({
                        include: [{
                            model: models.company_group
                        }],                 
                        where: {
                            user_id: this.id
                        }
                    })
                    .then(function(company_user_groups) {
                        var groups = [];
                        async.forEachSeries(company_user_groups, function(company_user_group, callback2) {
                            if(company_user_group.company_group) {
                                groups.push(company_user_group.company_group.name);
                                callback2();
                            }
                        }, function() {
                            callback(groups);                            
                        });
                    })
                }
            },
        
            hooks:
            {
                afterUpdate: function(userData, next) {

                    // ###### User : afterUpdate Hook 
                    var awsIotConnect = require('../lib/aws/awsiotconnect');
                    var async = require('async');
                    var db = require('../config/sequelize').db;

                    var user_id = userData.id; // User Id
                    var company_id = userData.company_id; // Company Id

                    if(
                        user_id != '' && user_id != null && typeof user_id !== undefined &&
                        company_id != '' && company_id != null && typeof company_id !== undefined
                      )
                    {
                        // AWS User Subscription/unSubscription Process
                        awsIotConnect.awsUserSubscriptionAndUnSubscriptionByUserId(user_id, company_id, function(awsUserNotification_callback){
                            //console.log(awsUserNotification_callback);
                        })
                    }

                },
                afterBulkUpdate: function(userData, next) {
                        
                        // ###### User : afterBulkUpdate Hook
                        var awsIotConnect = require('../lib/aws/awsiotconnect');
                        var async = require('async');
                        var db = require('../config/sequelize').db;

                        var updatedAt_val = userData.attributes.updatedAt; // Update time

                        // Get User Details
                        db.models.user.findAll({
                            where: {updatedAt: updatedAt_val},
                            attributes: ['id', 'company_id']
                        }).then(function(user_value) {
                                if(user_value)
                                {
                                    // ForEach(1) Start
                                    async.forEachSeries(user_value, function(user_data, callback_f1) {
                                                
                                            var user_id = user_data.id; // User Id
                                            var company_id = user_data.company_id; // Company ID

                                            // AWS User Call                                            
                                            awsIotConnect.awsUserSubscriptionAndUnSubscriptionByUserId(user_id, company_id, function(awsUserNotification_callback){
                                                //console.log(awsUserNotification_callback);
                                                callback_f1();
                                            });

                                    }, function() {
                                         // ForEach(1) Finish
                                         next(); 
                                    });
                                }
                                else
                                {
                                    // User : afterBulkUpdate Hook : User details not found
                                    next();
                                }
                        }).catch(function(err) {
                            // console.log(err);
                            // User : afterBulkUpdate Hook : User details not found
                            next();
                        })
                }
            }
        }
    );

    return user;
};
