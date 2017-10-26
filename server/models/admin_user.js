module.exports = function(sequelize, DataTypes) {

    var admin_user = sequelize.define('admin_user', 
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            email: DataTypes.STRING,
            password: DataTypes.STRING,
            expireon: DataTypes.DATE,
            refreshtoken: DataTypes.STRING,
            firstname: DataTypes.STRING,
            lastname: DataTypes.STRING,
            contact_no_code: DataTypes.STRING,
            contact_no: DataTypes.STRING,
            active: DataTypes.BOOLEAN,
            profile_image: DataTypes.STRING,
            usertoken: DataTypes.STRING,
        }, 
        {
            freezeTableName: true,
            tableName: 'admin_user',
        }
    );

    return admin_user;
};
