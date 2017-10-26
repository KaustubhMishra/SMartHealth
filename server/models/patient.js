module.exports = function(sequelize, DataTypes) {
    var patient = sequelize.define('patient', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        user_id: DataTypes.STRING,
        age: DataTypes.STRING,
        gender: DataTypes.STRING
    },{
        freezeTableName:true,
        tableName:'patient',
        classMethods: {
                associate: function(models) {
                    patient.belongsTo(models.user, {
                            foreignKey: 'user_id'                        
                        }),
                    patient.hasMany(models.phase_patient, {
                        foreignKey: 'patient_id'
                    }),
                    patient.hasMany(models.notification, {
                        foreignKey: 'patient_id'
                    }),
                    patient.hasMany(models.vital_dosage_status, {
                        foreignKey: 'patient_id'
                    }),
                    patient.belongsToMany(models.phase, { 
                        as: 'patientPhase', 
                        through: models.phase_patient, 
                        foreignKey: 'patient_id', 
                        otherKey: 'phase_id'
                    })
                }
        },
        instanceMethods: {
            getNotificationUnreadCount: function(models, patient_id, callback) {
                models.notification.count({
                    where: {
                        patient_id: patient_id,
                        isread: 0
                    }
                }).then(function(data) {
                    callback(data);
                })
            }
        },

    });
    return patient;
};

