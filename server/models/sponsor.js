module.exports = function(sequelize, DataTypes) {
    var sponsor = sequelize.define('sponsor', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        company_id: DataTypes.STRING,
        sponsor_company: DataTypes.STRING,
        sponsor_image: DataTypes.STRING,
        contact_name: DataTypes.STRING,
        email_address: DataTypes.STRING,
        contact_number: DataTypes.STRING,
        contact_address_1: DataTypes.STRING,
        contact_address_2: DataTypes.STRING,
        city: DataTypes.STRING,
        state: DataTypes.STRING,
        country: DataTypes.STRING,
        zip: DataTypes.STRING,
    },{
        freezeTableName:true,
        tableName:'sponsor',
        classMethods: {
            associate: function(models) {
                sponsor.hasMany(models.trial, {
                    foreignKey: 'sponsor_id'                        
                })    
            }
        }, 
        timestamps: false
    });
    return sponsor;
};