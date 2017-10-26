module.exports = function(sequelize, DataTypes) {
    var setting = sequelize.define('setting', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        company_id: DataTypes.STRING,
        android_aws_app_data: DataTypes.STRING,
        ios_aws_app_data: DataTypes.STRING,
        connection_timeout: DataTypes.INTEGER,
        log_threshold: DataTypes.INTEGER,
    }, {
        freezeTableName: true,
        tableName: 'setting'
    });
    return setting;
};