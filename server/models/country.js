module.exports = function(sequelize, DataTypes) {
    var country = sequelize.define('country', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        name: DataTypes.STRING
    },{
        freezeTableName:true,
        timestamps: false,
        tableName:'country'
    });
    return country;
};

