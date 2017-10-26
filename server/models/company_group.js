module.exports = function(sequelize, DataTypes) {

var company_group = sequelize.define('company_group', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: DataTypes.STRING,
        company_id: DataTypes.STRING
    },	{
    		freezeTableName: true,
    		tableName: 'company_group',
            timestamps: true,
            paranoid: true,
            classMethods: {
                associate: function(models) {
                    company_group.hasMany(models.company_user_group, {
                            foreignKey: 'company_group_id'                            
                    }),
                    company_group.belongsToMany(models.user, { as: 'Groupusers', through: models.company_user_group, foreignKey: 'company_group_id', otherKey: 'user_id'})
                }
            } 
   		}
     );
    return company_group;
};
		