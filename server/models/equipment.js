module.exports = function(sequelize, DataTypes) {
    var equipment = sequelize.define('equipment', {
        id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            primaryKey: true
        },
        name: DataTypes.STRING(255)
    },{freezeTableName:true,tableName:'equipment'});
    return equipment;
};