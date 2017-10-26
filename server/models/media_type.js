module.exports = function(sequelize, DataTypes) {
    var media_type = sequelize.define('media_type', {
        id: {
            type: DataTypes.STRING(50),
            allowNull: false,
            primaryKey: true
        },
        name: DataTypes.STRING(255)
    },{freezeTableName:true,tableName:'media_type'});
    return media_type;
};