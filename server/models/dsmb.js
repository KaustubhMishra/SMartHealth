module.exports = function(sequelize, DataTypes) {
    var dsmb = sequelize.define('dsmb', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        company_id: DataTypes.STRING,
        firstname: DataTypes.STRING,
        lastname: DataTypes.STRING,
        user_id: DataTypes.STRING,
        phone: DataTypes.STRING,
        fax: DataTypes.STRING,
        active : DataTypes.BOOLEAN
    }, {
        freezeTableName: true,
        tableName: 'dsmb'
        /*classMethods: {
            associate: function(models) {
                dsmb.hasMany(models.trial, {
                        foreignKey: 'dsmb_id'
                })                
            }
        } */
    });
    return dsmb;
};