module.exports = function(sequelize, DataTypes) {

    var aws_user_subscription = sequelize.define('aws_user_subscription', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        user_id: DataTypes.STRING,
        rule_id: DataTypes.STRING,
        company_group_id: DataTypes.STRING,
        notification_type: DataTypes.ENUM('1','2','3'), /* "1=>email, 2=>push, 3=>sms" */
        device_type: DataTypes.ENUM('1','2','3'), /* "1=>iOS, 2=>Android, 3=>windows" */
        topic_arn: DataTypes.STRING,
        subsciption_arn: DataTypes.STRING,
        application_endpoint_arn: DataTypes.STRING,
        application_arn: DataTypes.STRING,
        delete_request: DataTypes.ENUM('1','2') /* "1=> Not delete, 2=> Delete Request" */
    },{freezeTableName: true,tableName: 'aws_user_subscription'});
   return aws_user_subscription;
}