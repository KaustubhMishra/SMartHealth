module.exports = function(sequelize, DataTypes) {
    var theshold_type = sequelize.define('theshold_type', {
        id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            primaryKey: true
        },
        name: DataTypes.STRING,
        description:DataTypes.STRING,        
    },{freezeTableName:true,tableName:'theshold_type'});
    return theshold_type;
};