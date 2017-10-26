module.exports = function(sequelize, DataTypes) {

    var aws_group_subscription = sequelize.define('aws_group_subscription', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        company_group_id: DataTypes.STRING,
        rule_id: DataTypes.STRING,
        notification_type: DataTypes.ENUM('1','2','3'),
        status: DataTypes.ENUM('1','2','3')
    },{freezeTableName: true,tableName: 'aws_group_subscription', timestamps: false});
   return aws_group_subscription;
}