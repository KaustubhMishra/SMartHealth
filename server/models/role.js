module.exports = function(sequelize, DataTypes) {
    var role = sequelize.define('role', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: DataTypes.STRING(255),
        company_id: DataTypes.STRING
    },{freezeTableName:true,tableName:'role'});
    return role;
};