module.exports = function(sequelize, DataTypes) {
    var frequency = sequelize.define('frequency', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.STRING,
        active : DataTypes.BOOLEAN
    },{freezeTableName:true,tableName:'frequency',
        classMethods: {
            associate: function(models) {
                frequency.hasMany(models.trial, {
                    foreignKey: 'frequency_id'                        
                })              
            }
        }    
    });
    return frequency;
};