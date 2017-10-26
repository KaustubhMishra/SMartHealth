module.exports = function(sequelize, DataTypes){
	var notificationLog = sequelize.define('notification_log',{
		id:{
			type:DataTypes.STRING,
			primaryKey:true,
			defaultValue:DataTypes.UUIDV4
		},
		sent_date:DataTypes.DATE,
		company_id:DataTypes.STRING,
		rule_id: DataTypes.STRING,
		thing_id:DataTypes.STRING,
		sensor_id:DataTypes.STRING,

		severity:DataTypes.INTEGER, //New added field start here
		email_notification:DataTypes.BOOLEAN,
		sms_notification:DataTypes.BOOLEAN,
		push_notification:DataTypes.BOOLEAN,
		command:DataTypes.BOOLEAN,
		email_subject:DataTypes.STRING,
		email_text:DataTypes.TEXT,
		sms_text:DataTypes.TEXT,
		push_text:DataTypes.TEXT,
		command_text:DataTypes.TEXT

	}, {
		freezeTableName:true,
		tableName:'notification_log', 
		timestamps:false,
        classMethods: {
            associate: function(models) {
                notificationLog.belongsTo(models.rule, {
                        foreignKey: 'rule_id'                            
                })
                
            }
        }   
  	});

	return notificationLog;

}
