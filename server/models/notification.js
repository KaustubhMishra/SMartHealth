module.exports = function(sequelize, DataTypes) {
    var notification = sequelize.define('notification', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },        
        Description: DataTypes.STRING,
        company_id: DataTypes.STRING,
        trial_id: DataTypes.STRING,
        phase_id: DataTypes.STRING,
        patient_id: DataTypes.STRING,
        vitaldosagestatus_id: DataTypes.STRING,
        isread: DataTypes.INTEGER
    },
    {
        freezeTableName:true,
        tableName:'notification', 
        timestamps: true,
        paranoid: false,        
        classMethods: {
            associate: function(models) {
                notification.belongsTo(models.trial, {
                    foreignKey: 'trial_id'                        
                }),
                notification.belongsTo(models.patient, {
                    foreignKey: 'patient_id'                        
                }),
                notification.belongsTo(models.phase, {
                    foreignKey: 'phase_id'                        
                })
            }
        },
    });
    return notification;
};