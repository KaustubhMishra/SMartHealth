module.exports = function(sequelize, DataTypes) {

    var firmware_request_log = sequelize.define('firmware_request_log', 
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            company_id: DataTypes.STRING,
            apply_on: DataTypes.ENUM('1','2'),
            firmware_file_data: DataTypes.BLOB,
            firmware_file_name: DataTypes.STRING
        }, 
        {
            freezeTableName: true,
            tableName: 'firmware_request_log',
        }
    );

    return firmware_request_log;
};
