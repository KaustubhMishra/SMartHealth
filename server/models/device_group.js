module.exports = function(sequelize, DataTypes) {

    var device_group = sequelize.define('device_group', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        parent_id: DataTypes.STRING,
        name: DataTypes.STRING,
        company_id: DataTypes.STRING
    },{freezeTableName:true,tableName:'device_group',
        classMethods: {
            associate: function(models) {
                    device_group.hasMany(models.device, {
                        foreignKey: 'device_group_id'
                    }),
                    device_group.hasOne(models.template, {
                        foreignKey: 'device_group_id'
                    })                               
                }
            }
        });
    return device_group;
}