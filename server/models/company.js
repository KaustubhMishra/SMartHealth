module.exports = function(sequelize, DataTypes) {
    var company = sequelize.define('company', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        parent_id: DataTypes.STRING, 
        name: DataTypes.STRING,
        cpid: DataTypes.STRING,
        database_name: DataTypes.STRING,
        database_user: DataTypes.CHAR,
        database_password: DataTypes.CHAR,
        address1: DataTypes.STRING,
        address2: DataTypes.STRING,
        city: DataTypes.STRING,
        state: DataTypes.STRING,
        country: DataTypes.STRING,
        phonecodeCom: DataTypes.STRING,
        phone: DataTypes.STRING,
        fax: DataTypes.STRING,
        active: DataTypes.BOOLEAN
    }, {
        freezeTableName: true,
        tableName: 'company',
        classMethods: {
            associate: function(models) {
                company.hasMany(models.user, {
                        foreignKey: 'company_id'                        
                    }),
                company.hasMany(models.company_group, {
                        foreignKey: 'company_id'
                })                
            }
        }        
    });
    return company;
};