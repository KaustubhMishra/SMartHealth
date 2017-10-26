module.exports = function(sequelize, DataType){
	var template = sequelize.define('template',{
		id:{
			type: DataType.STRING,
			primaryKey:true,
			defaultValue: DataType.UUIDV4
		},
		name: DataType.STRING,
		device_group_id: DataType.STRING,
		company_id:DataType.STRING
	},{ 
		freezeTableName:true,
		tableName:'template',
		timestamps: true,
		paranoid: true,
        classMethods: {
            associate: function(models) {
                    template.belongsTo(models.device_group, {
                        foreignKey: 'device_group_id'
                    }),
                    template.hasMany(models.template_attr, {
                        foreignKey: 'template_id'
                    })                               
                }
            }	
	}); 
	return template;
};