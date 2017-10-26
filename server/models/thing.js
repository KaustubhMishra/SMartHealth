module.exports = function(sequelize, DataTypes) {
    var thing = sequelize.define('thing', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        serial_number: DataTypes.STRING,
        name: DataTypes.STRING,
        user: {type:DataTypes.STRING,defaultValue:generateUUIDUser},
        password: {type:DataTypes.STRING,defaultValue:generateUUIDPass},
        device_key : {type:DataTypes.STRING,defaultValue:DataTypes.UUIDV4},
        device_master_id: DataTypes.STRING,
        additional_info: DataTypes.STRING,
        company_id: DataTypes.STRING,
        model:DataTypes.STRING,
        revision:DataTypes.STRING,
        firmware: DataTypes.STRING,
        description:DataTypes.STRING,
        active: {type:DataTypes.BOOLEAN,defaultValue:false},
        status: DataTypes.ENUM('1','2','3'), /* "1=>hanshake, 2=>data sending, 3=>not sending" */
        device_group_id: DataTypes.STRING,
        trial_id: DataTypes.STRING,
        patient_id: DataTypes.STRING,        
        lat: DataTypes.FLOAT(10,6),
        lng: DataTypes.FLOAT(10,6),
        is_dummy: DataTypes.BOOLEAN
    }, {
        freezeTableName:true, 
        tableName:'thing',
        timestamps: true,     
        paranoid: true,   
        classMethods: {
            associate: function(models) {
                thing.belongsTo(models.trial, {
                        foreignKey: 'trial_id'
                    }),
                thing.belongsTo(models.patient, {
                        foreignKey: 'patient_id'
                    }),
                thing.hasMany(models.sensor, {
                        foreignKey: 'thing_id'
                    }),
                thing.belongsTo(models.device, {
                        foreignKey: 'device_master_id'
                    })/*,
                thing.belongsTo(models.device, {
                    foreignKey: 'device_group_id'
                })*/                                
            }
        }
    });

    return thing;
};

function generateUUIDUser() {
    var d = new Date().getTime();
    var r = Math.random() * d * Math.random();
    var uuid = r.toString(36).slice(0,6);
    return uuid;
};

function generateUUIDPass() {
    var d = new Date().getTime();
    var r = Math.random() * d * Math.random();
    var uuid = r.toString(16).slice(0,6);
    return uuid;
};