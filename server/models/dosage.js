module.exports = function(sequelize, DataTypes) {
    var dosage = sequelize.define('dosage', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.STRING,
        qty: DataTypes.FLOAT,
        dosage_unit: DataTypes.STRING,
        drug_type_id: DataTypes.STRING
    },{freezeTableName:true,tableName:'dosage',
        classMethods: {
            associate: function(models) {
                    dosage.hasMany(models.trial, {
                        foreignKey: 'dosage_id'                        
                    }),
                    dosage.belongsTo(models.drug_type, {
                        foreignKey: 'drug_type_id'                        
                    })              
                }
            }
    });
    return dosage;
};