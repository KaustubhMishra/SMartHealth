module.exports = function(sequelize, DataTypes) {
    var feedback = sequelize.define('feedback', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        category: DataTypes.STRING,
        description: DataTypes.STRING
    },{freezeTableName:true,tableName:'feedback', timestamps: true,});
    return feedback;
};