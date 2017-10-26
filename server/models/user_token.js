module.exports = function(sequelize, DataTypes) {

    var user_token = sequelize.define('user_token', 
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            user_id: DataTypes.STRING,
            company_id: DataTypes.STRING,            
            expireon: DataTypes.DATE,
            refresh_token: DataTypes.STRING,
            type: DataTypes.BOOLEAN
        }, 
        {
            freezeTableName: true,
            tableName: 'user_token',
            timestamps: false
        }
    );

    return user_token;
};
