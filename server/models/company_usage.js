module.exports = function(sequelize, DataType){
	var company_usage = sequelize.define('company_usage',{
		id:{
			type: DataType.STRING,
			primaryKey:true,
			defaultValue: DataType.UUIDV4
		},
		company_id: DataType.STRING,
		api_count: DataType.BIGINT,
		device_count: DataType.BIGINT,
		email_notification_count: DataType.BIGINT,
		push_notification_count: DataType.BIGINT,
		sms_notification_count: DataType.BIGINT,
		mysql_db_size: DataType.FLOAT,
		cassandra_db_size: DataType.FLOAT
	},{ freezeTableName: true, tableName:'company_usage' }); 
	return company_usage;
};