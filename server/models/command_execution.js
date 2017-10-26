module.exports = function(sequelize, DataTypes) {

    var command_execution = sequelize.define('command_execution', 
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            company_id: DataTypes.STRING,
            apply_on: DataTypes.ENUM('1','2'),
            command_id: DataTypes.STRING
        }, 
        {
            freezeTableName: true,
            tableName: 'command_execution',
        }
    );

    return command_execution;
};
