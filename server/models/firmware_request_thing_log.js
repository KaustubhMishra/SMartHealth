module.exports = function(sequelize, DataTypes) {

    var firmware_request_thing_log = sequelize.define('firmware_request_thing_log', 
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            firmware_request_log_id: DataTypes.STRING,
            did: DataTypes.STRING,
            dgid: DataTypes.STRING,
            status: DataTypes.ENUM('1','2')
        }, 
        {
            freezeTableName: true,
            tableName: 'firmware_request_thing_log',
        }
    );

    return firmware_request_thing_log;
};
