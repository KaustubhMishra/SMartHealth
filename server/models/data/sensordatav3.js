module.exports = function(sequelize, DataTypes) {
    var sensordatav3 = sequelize.define('sensordatav3', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        receivedDate: DataTypes.DATE,
        companyId: DataTypes.STRING,
        connectionString:DataTypes.STRING,
        deviceId: DataTypes.STRING,
        data:DataTypes.TEXT
    }, {freezeTableName:true,tableName:'sensordatav3',timestamps:false});

    return sensordatav3;
};