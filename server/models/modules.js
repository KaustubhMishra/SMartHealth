module.exports = function(sequelize, DataTypes) {
    var modules = sequelize.define('modules', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: DataTypes.STRING(255),
        modules_code: DataTypes.STRING(45),
        status: DataTypes.BOOLEAN
    },{freezeTableName:true,tableName:'modules'});
    return modules;
};