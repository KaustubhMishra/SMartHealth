module.exports = function(sequelizeMasterConnection, DataTypes) {
    var company = sequelizeMasterConnection.define('company', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        sw_product_id: DataTypes.INTEGER,
        company_id: DataTypes.STRING,
        cpid: DataTypes.STRING,
        database_name: DataTypes.STRING
    }, {
        freezeTableName: true,
        tableName: 'company'
    });
    return company;
};