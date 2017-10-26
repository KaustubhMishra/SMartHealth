module.exports = function(sequelize, DataTypes) {
    var trial_dosage_frequency = sequelize.define('trial_dosage_frequency', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        trial_id: DataTypes.STRING,
        frequency_time: DataTypes.TIME
    },{freezeTableName:true,tableName:'trial_dosage_frequency',
            classMethods: {
                associate: function(models) {
                    trial_dosage_frequency.belongsTo(models.trial, {
                        foreignKey: 'trial_id'                        
                    })                      
                }
            }
        });
    return trial_dosage_frequency;
};
