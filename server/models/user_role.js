module.exports = function(sequelize, DataTypes) {
    var user_role = sequelize.define('user_role', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: DataTypes.STRING,
        role_id: DataTypes.INTEGER
    },{freezeTableName:true,tableName:'user_role'});
    return user_role;
};