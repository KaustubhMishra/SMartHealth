module.exports = function(sequelize, DataTypes) {

    var prediction = sequelize.define('prediction', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },        
        company_id: DataTypes.STRING,
        thing_id: DataTypes.STRING,
        sensorname: DataTypes.STRING,
        sensorvalue: DataTypes.STRING,
        email_notification: DataTypes.BOOLEAN,
        group_id: DataTypes.STRING,
        email_template: DataTypes.STRING,
        email_subject_template: DataTypes.STRING        
    },{
        freezeTableName: true,
        tableName: 'prediction'
        // ,
        // classMethods: {
        //     associate: function(models) {
        //         rule.hasMany(models.notification_log, {
        //                 foreignKey: 'rule_id'                        
        //             }),
        //         rule.belongsTo(models.device_group, {
        //                 foreignKey: 'device_group_id'                        
        //             })
        //     }
        // }        
    });
    return prediction;
}