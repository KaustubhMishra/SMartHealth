module.exports = function(sequelize, DataTypes) {
    var trial_device = sequelize.define('trial_device', {
        id: {
             type: DataTypes.STRING,
             primaryKey: true,
             defaultValue: DataTypes.UUIDV4
        },
        trial_id: DataTypes.STRING,
        device_id: DataTypes.STRING,
        active: DataTypes.INTEGER
    },{
        freezeTableName:true,
        tableName:'trial_device',
        classMethods: {
                associate: function(models) {
                    trial_device.belongsTo(models.trial, {
                            foreignKey: 'trial_id'                        
                        }),
                    trial_device.belongsTo(models.device, {
                            foreignKey: 'device_id'                        
                        })
                }
            }
    });
    return trial_device;
};
