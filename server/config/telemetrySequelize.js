var telemetryDb = function(dbName,callback){
	if(dbName!=''){
		var fs = require('fs');
		var path = require('path');
		var Sequelize = require('sequelize');
		var config = require('./sequelizeConfig');
		var db = {};
		var sequelize = new Sequelize(dbName, config.db.username, config.db.password, {
			host: config.db.host,
			dilects: 'mysql'
		});
		fs.readdirSync(config.modelsDir.telemetryPath)
			.filter(function(file) {
				return (file.indexOf('.') !== 0) && (file != 'index.js');
			}).forEach(function(file) {
				var model = sequelize.import(path.join(config.modelsDir.telemetryPath, file));
				db[model.name] = model;
			});
		
		Object.keys(db).forEach(function(modelName) {
			if (db[modelName].options.hasOwnProperty('associate')) {
				db[modelName].options.associate(db);
			}
		});
		callback(false, sequelize);
	}else{
		callback(true);
	}
}

module.exports = {
	db: telemetryDb
};