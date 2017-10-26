module.exports = function(sequelize, DataTypes) {
    var side_effects = sequelize.define('side_effects', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.STRING,
        active : DataTypes.INTEGER      
    },
    {
        freezeTableName:true,
        tableName:'side_effects', 
        timestamps: true,
        classMethods: {
            associate: function(models) {
                
            }
        },
    });
    return side_effects;
};