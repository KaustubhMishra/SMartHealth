module.exports = function(sequelize, DataTypes) {
    var permission = sequelize.define('permission', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: DataTypes.STRING(255),
        module_id: DataTypes.STRING, 
        status: DataTypes.BOOLEAN,
        permission_code: DataTypes.STRING, 
        detail: DataTypes.TEXT,
    },{freezeTableName:true,tableName:'permission'});
    return permission;
};