module.exports = function(sequelize, DataTypes) {
    var phase = sequelize.define('phase', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        trial_id: DataTypes.STRING,
        sr_no: DataTypes.INTEGER,
        description: DataTypes.STRING,
        start_date: DataTypes.DATE,
        tentitive_end_date : DataTypes.DATE,
        participant_count : DataTypes.INTEGER,
        active : DataTypes.BOOLEAN
    },{freezeTableName:true,tableName:'phase',
            classMethods: {
                associate: function(models) {
                    phase.hasMany(models.milestone, {
                        foreignKey: 'phase_id'
                    }),
                    phase.hasMany(models.phase_patient, {
                        foreignKey: 'phase_id'
                    }),
                    phase.belongsTo(models.trial, {
                        foreignKey: 'trial_id'                        
                    }),
                    phase.belongsToMany(models.patient, { 
                        as: 'phasePatients', 
                        through: models.phase_patient, 
                        foreignKey: 'phase_id', 
                        otherKey: 'patient_id'
                    }),
                    phase.hasMany(models.vital_dosage_status, {
                        foreignKey: 'phase_id'
                    }),
                    phase.hasMany(models.notification, {
                        foreignKey: 'phase_id'
                    })                      
                }
            }
        });
    return phase;
};
