module.exports = function(sequelize, DataTypes) {

    var rule = sequelize.define('rule', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        //alltrue: DataTypes.BOOLEAN,
        company_id: DataTypes.STRING,
        //condition: DataTypes.BOOLEAN,
        ctodmessage: DataTypes.STRING,
        ctodtopic: DataTypes.STRING,
        description: DataTypes.STRING,
        dwelltime: DataTypes.INTEGER,
        dwelltimestring: DataTypes.STRING,
        email_notification: DataTypes.BOOLEAN,
        sms_notification: DataTypes.BOOLEAN,
        push_notification: DataTypes.BOOLEAN,
        execute_operation: DataTypes.BOOLEAN,
        company_command_id: DataTypes.STRING,
        last_notification_sent: DataTypes.DATE,
        name: DataTypes.STRING,
        //thing_id: DataTypes.STRING,
        device_group_id: DataTypes.STRING,
        topic_arn: DataTypes.STRING,
        rules_type: DataTypes.ENUM('1','2'),
        query_string: DataTypes.STRING,
        email_template: DataTypes.STRING,
        email_subject_template: DataTypes.STRING,
        push_template: DataTypes.STRING,
        sms_template: DataTypes.STRING,
        severity: DataTypes.ENUM('1','5','10'), // 10 = Critical , 5 = Moderate , 1 = Minor
        active: DataTypes.BOOLEAN
    },{
        freezeTableName: true,
        tableName: 'rule',
        timestamps: true,
        paranoid: true,
        classMethods: {
            associate: function(models) {
                rule.hasMany(models.notification_log, {
                        foreignKey: 'rule_id'                        
                    }),
                rule.belongsTo(models.device_group, {
                        foreignKey: 'device_group_id'                        
                    })
            }
        }        
    });
    return rule;
}