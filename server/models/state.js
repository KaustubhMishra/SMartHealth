module.exports = function(sequelize, DataTypes) {
    var state = sequelize.define('state', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        name: DataTypes.STRING,
        country_id: DataTypes.INTEGER
    },{
        freezeTableName:true,
        timestamps: false,
        tableName:'state',
        classMethods: {
            associate: function(models) {
                rule.belongsTo(models.country, {
                        foreignKey: 'country_id'                        
                    })
            }
        }
        
    });
    return state;
};

