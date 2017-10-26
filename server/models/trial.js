module.exports = function(sequelize, DataTypes) {
    var trial = sequelize.define('trial', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        company_id: DataTypes.STRING,
        sponsor_id: DataTypes.STRING,
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        trial_type: DataTypes.ENUM('BLINDED','DOUBLE_BLINDED'),
        dsmb_id: DataTypes.STRING,
        croCoordinator_id: DataTypes.STRING,
        drug_name: DataTypes.STRING,
        drug_description: DataTypes.STRING,
        drug_type_id: DataTypes.STRING,
        dosage_id: DataTypes.STRING,
        frequency_id: DataTypes.INTEGER,
        start_date: DataTypes.DATE,
        end_date : DataTypes.DATE,
        user_id: DataTypes.STRING,
        active : DataTypes.INTEGER,
        pre_vital_type: DataTypes.BOOLEAN,
        post_vital_type: DataTypes.BOOLEAN

    },{freezeTableName:true,tableName:'trial',
        classMethods: {
            associate: function(models) {
                    trial.hasMany(models.phase, {
                            foreignKey: 'trial_id'                        
                        }),
                    trial.hasOne(models.phase, {as: 'activePhase', foreignKey: 'trial_id'}),
                    // trial.hasMany(models.trial_device, {
                    //         foreignKey: 'trial_id'                        
                    //     }),
                    trial.hasMany(models.thing,{
                        foreignKey: 'trial_id'                        
                    }),             
                    trial.belongsTo(models.drug_type, {
                        foreignKey: 'drug_type_id'                        
                    }),
                    trial.belongsTo(models.dosage, {
                        foreignKey: 'dosage_id'                        
                    }),
                    trial.belongsTo(models.frequency, {
                        foreignKey: 'frequency_id'                        
                    }),
                    trial.belongsTo(models.sponsor, {
                        foreignKey: 'sponsor_id'                        
                    }),
                    trial.hasMany(models.trial_dosage_frequency, {
                        foreignKey: 'trial_id'                        
                    }),
                    trial.belongsTo(models.user, {
                        as: 'croCoordinator', 
                        foreignKey: 'croCoordinator_id'
                    }),
                    trial.belongsToMany(models.device, {
                        as: 'trialDevices',
                        through: models.trial_device,
                        foreignKey: 'trial_id',
                        otherKey: 'device_id'
                    })  
//company_group.belongsToMany(models.user, { as: 'Groupusers', through: models.company_user_group, foreignKey: 'company_group_id', otherKey: 'user_id'})
                }
            }
    });
    return trial;
};