module.exports = function(sequelize, DataTypes) {
    var user_contact_info = sequelize.define('user_contact_info', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: DataTypes.STRING,
        contact_address1: DataTypes.STRING,
        contact_address2: DataTypes.STRING,
        city: DataTypes.STRING,
        state: DataTypes.STRING,
        country: DataTypes.STRING,
        fax: DataTypes.STRING
    },{
        freezeTableName:true,
        timestamps: true,
        classMethods: {
            associate: function(models) {
                user.belongsTo(models.user, {
                    foreignKey: 'user_id'                        
                })
            }
        },
        tableName:'user_contact_info'});
    return user_contact_info;
};