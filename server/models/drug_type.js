module.exports = function(sequelize, DataTypes) {
    var drug_type = sequelize.define('drug_type', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.STRING,
        active : DataTypes.INTEGER
    },{freezeTableName:true,tableName:'drug_type', 
        classMethods: {
            associate: function(models) {
                    drug_type.hasMany(models.trial, {
                        foreignKey: 'drug_type_id'                        
                    }),
                    drug_type.hasMany(models.dosage, {
                        foreignKey: 'drug_type_id'                        
                    })              
                }
            }});
    return drug_type;
};