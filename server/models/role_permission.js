module.exports = function(sequelize, DataTypes) {
    var role_permission = sequelize.define('role_permission', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        role_id: DataTypes.INTEGER,
        permission_id: DataTypes.INTEGER,
        permission: DataTypes.BOOLEAN
    },{freezeTableName:true,tableName:'role_permission'});
    return role_permission;
};