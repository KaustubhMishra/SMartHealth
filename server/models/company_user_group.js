module.exports = function(sequelize, DataTypes) {
    var company_user_group = sequelize.define('company_user_group', 
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            user_id: DataTypes.STRING,
            company_group_id: DataTypes.STRING
        }, 
        {
            freezeTableName:true, 
            tableName:'company_user_group', 
            timestamps: false,
            classMethods: {
                associate: function(models) {
                    company_user_group.belongsTo(models.company_group, {
                            foreignKey: 'company_group_id'                            
                    }),
                    company_user_group.belongsTo(models.user, {
                            foreignKey: 'user_id'                            
                    })
                }
            },
             hooks:
            {
                afterCreate: function(userGroupData, next) {

                    // ###### company_user_group : afterCreate Hook

                    var db = require('../config/sequelize').db;
                    var awsIotConnect = require('../lib/aws/awsiotconnect');

                    var user_id = userGroupData.user_id; // User Id
                    
                    // Get Company Details
                    db.models.user.findOne({
                              attributes: ['company_id'],
                              where: { id : user_id }
                            }) .then(function(user_details)
                            {
                                if(user_details)
                                {
                                    var company_id = user_details.company_id; // Company ID

                                    // AWS User Subscription/unSubscription Process
                                    awsIotConnect.awsUserSubscriptionAndUnSubscriptionByUserId(user_id, company_id, function(awsUserNotification_callback){
                                        //console.log(awsUserNotification_callback);
                                    })

                                }
                                else
                                {
                                    // company_user_group : afterCreate Hook : User details not found
                                }
                            }).catch(function(err){
                                //console.log(err);
                            }); 
                }
            }           
        }
    );

    return company_user_group;
};