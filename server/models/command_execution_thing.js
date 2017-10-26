module.exports = function(sequelize, DataTypes) {

    var command_execution_thing = sequelize.define('command_execution_thing', 
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            command_execution_id: DataTypes.STRING,
            did: DataTypes.STRING,
            dgid: DataTypes.STRING,
            status: DataTypes.ENUM('1','2')
        }, 
        {
            freezeTableName: true,
            tableName: 'command_execution_thing',
        }
    );

    return command_execution_thing;
};
