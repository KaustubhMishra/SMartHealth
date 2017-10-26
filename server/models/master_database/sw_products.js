module.exports = function(sequelizeMasterConnection, DataType){
	var sw_products = sequelizeMasterConnection.define('sw_products',{
		id:{
			type: DataType.INTEGER,
			primaryKey:true,
			autoIncrement: true
		},
		name: DataType.STRING,
		db_ip: DataType.STRING,
		db_port: DataType.STRING,
		db_name: DataType.STRING,
		db_user: DataType.STRING,
		db_pass: DataType.STRING
	},{ freezeTableName:true, tableName:'sw_products' }); 
	return sw_products;
};