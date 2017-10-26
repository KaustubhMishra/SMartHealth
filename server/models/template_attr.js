module.exports = function(sequelize, DataType){
	var template_attr = sequelize.define('template_attr',{
		id:{
			type: DataType.STRING,
			primaryKey:true,
			defaultValue: DataType.UUIDV4
		},
		template_id: DataType.STRING,
		parent_attr_id: DataType.STRING,
		name: DataType.STRING,
		description: DataType.STRING,
		type: DataType.STRING,
		localId: DataType.STRING,
		status: DataType.STRING,
		unit: DataType.STRING,
		min: DataType.STRING,
		max: DataType.STRING
	},{ freezeTableName:true, tableName:'template_attr' }); 
	return template_attr;
};