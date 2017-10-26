module.exports = function(sequelize, DataTypes) {
    var phase_patient = sequelize.define('phase_patient', {
        id: {
             type: DataTypes.STRING,
             primaryKey: true,
             defaultValue: DataTypes.UUIDV4
        },
        phase_id: DataTypes.STRING,
        patient_id: DataTypes.STRING,
        age: DataTypes.STRING
    },{
        freezeTableName:true,
        tableName:'phase_patient',
        classMethods: {
                associate: function(models) {
                    phase_patient.belongsTo(models.phase, {
                        foreignKey: 'phase_id'
                }),
                    phase_patient.belongsTo(models.patient, {
                        foreignKey: 'patient_id'
                })
                }
            }
    });
    return phase_patient;
};
