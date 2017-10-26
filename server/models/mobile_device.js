module.exports = function(sequelize, DataTypes) {

    var mobile_device = sequelize.define('mobile_device', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        os: DataTypes.STRING,
        os_version: DataTypes.STRING,
        type: DataTypes.ENUM('1','2','3'),
        uuid: DataTypes.STRING,
        push_token: DataTypes.STRING,
        user_id: DataTypes.STRING,
        aws_application_endpoint_arn: DataTypes.STRING
    },{freezeTableName: true,tableName: 'mobile_device', timestamps: false});
   return mobile_device;
}