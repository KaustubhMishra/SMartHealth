module.exports = function(sequelize, DataTypes) {
    var device_document = sequelize.define('device_document', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        deviceId: DataTypes.STRING,
        name: DataTypes.STRING
    },
    {
        freezeTableName:true,
        tableName:'device_document',
        classMethods: {
            associate: function(models) {
                device_document.belongsTo(models.device, {
                    foreignKey: 'deviceId'                        
                })
            }
        }
    });
    return device_document;
};
