module.exports = function(sequelize, DataTypes) {
    var notification_backup = sequelize.define('notification_backup', {
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
        isread: DataTypes.INTEGER,
        pushdata: DataTypes.STRING
    },
    {
        freezeTableName:true,
        tableName:'notification_backup', 
        timestamps: true,
        paranoid: true,        
        classMethods: {
            associate: function(models) {
                notification_backup.belongsTo(models.trial, {
                    foreignKey: 'trial_id'                        
                }),
                notification_backup.belongsTo(models.patient, {
                    foreignKey: 'patient_id'                        
                }),
                notification_backup.belongsTo(models.phase, {
                    foreignKey: 'phase_id'                        
                })
            }
        },
    });
    return notification_backup;
};