module.exports = function(sequelize, DataTypes) {
    var vital_dosage_status = sequelize.define('vital_dosage_status', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        trial_id: DataTypes.STRING,
        phase_id: DataTypes.STRING,
        patient_id: DataTypes.STRING,
        type: DataTypes.INTEGER,
        schedule_on: DataTypes.DATE,
        status : DataTypes.BOOLEAN,
        execution_date: DataTypes.DATE
    },{freezeTableName:true,tableName:'vital_dosage_status',
            classMethods: {
                associate: function(models) {
                    vital_dosage_status.belongsTo(models.phase, {
                        foreignKey: 'phase_id'
                    }),
                    vital_dosage_status.belongsTo(models.patient, {
                        foreignKey: 'patient_id'
                    }),                    
                    vital_dosage_status.belongsTo(models.trial, {
                        foreignKey: 'trial_id'                        
                    })
                }
            },                
            instanceMethods: {
                getPreviousDosage: function(models, callback) {                    
                    models.vital_dosage_status.findOne({               
                        include : [{
                            attributes: ['id', 'drug_name'],
                            model: models.trial,
                            required: true,
                            include : [{
                                model: models.dosage,
                                required: true
                            }]
                        }],                        
                        where: {
                            patient_id: this.patient_id,
                            schedule_on: {
                                $lt: this.schedule_on,
                            },
                            type: this.type,
                        },
                        order: [
                            ['schedule_on', 'DESC']
                        ]
                    }).then(function(dosagedetail) {
                        callback(dosagedetail);
                    }).catch(function(err) {
                        console.log(err);                        
                    })
                },
                getScheduleOnDateObj: function(models) {
                    return new Date(this.schedule_on.replace(' ', 'T').concat('.000Z'));
                }
            }
        });
    return vital_dosage_status;
};
