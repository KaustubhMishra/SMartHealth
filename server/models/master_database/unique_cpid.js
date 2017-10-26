module.exports = function(sequelizeMasterConnection, DataType){
	var unique_cpid = sequelizeMasterConnection.define('unique_cpid',{
		id:{
			type: DataType.INTEGER,
			primaryKey:true,
			autoIncrement: true
		},
		cpid: {
			type: DataType.STRING,
			unique: true
		} 
	},{ freezeTableName:true, tableName:'unique_cpid' }); 
	return unique_cpid;
};