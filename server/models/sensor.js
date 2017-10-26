module.exports = function(sequelize, DataTypes) {
    var sensor = sequelize.define('sensor', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue:DataTypes.UUIDV4
        },
        company_id: DataTypes.STRING,
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        thing_id: DataTypes.STRING,
        // version: DataTypes.STRING,
        localid: DataTypes.STRING,
        pin: DataTypes.STRING,
        active: DataTypes.STRING,
        serial_number: DataTypes.STRING
    },{freezeTableName:true,tableName:'sensor',
                classMethods: {
                            associate: function(models) {
                                sensor.belongsTo(models.thing, {
                                        foreignKey: 'thing_id'                        
                                    })
                            }
                        }});
     
    return sensor;
};