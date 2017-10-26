var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var _ = require('lodash');
var config = require('./sequelizeConfig');
var db = {};
var master_db = {};

// Company Database: create your instance of sequelize
var sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    storage: config.db.storage,
    logging: false,
    timezone: 'Etc/GMT'
});

// Master Database: Create master database instance of sequelize
var sequelizeMasterConnection = new Sequelize(config.master_database.database, config.master_database.username, config.master_database.password, {
    host: config.master_database.host,
    port: config.master_database.port,
    dialect: 'mysql',
    storage: config.master_database.storage,
    //logging: false,
    timezone: 'Etc/GMT'
}); 

/*************** Company Database Reading Model Files: Start ************************/

//loop through all files in models directory ignoring hidden files and this file
fs.readdirSync(config.modelsDir.path)
    .filter(function(file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file !== 'data') && (file !== 'master_database');
    })
//import model files and save model names
.forEach(function(file) {

    //console.log('Loading model file ' + file);
    var model = sequelize.import(path.join(config.modelsDir.path, file));
    db[model.name] = model;

});
//invoke associations on each of the models
Object.keys(db).forEach(function(modelName) {
    if (db[modelName].options.hasOwnProperty('associate')) {
        db[modelName].options.associate(db)
    }

    //console.log('####################################################');
    //console.log('################     '+modelName+'     #############');
    //console.log('####################################################');    
});

/*console.log('####################################################');
console.log('################     DB ASSOCIATED     #############');
console.log('####################################################');
*/

/*************** Company Database Reading Model Files: End ************************/

/*************** Master Database Reading Model Files: Start ************************/

// Loop through all files in models (master_database) directory ignoring hidden files and this file
fs.readdirSync(config.modelsDir.master_database_path)
    .filter(function(file) {
        return (file.indexOf('.') !== 0);
    })
//import model files and save model names
.forEach(function(file) {

   var model = sequelizeMasterConnection.import(path.join(config.modelsDir.master_database_path, file));
   master_db[model.name] = model;
});
//invoke associations on each of the models
Object.keys(master_db).forEach(function(modelName) {
    if (master_db[modelName].options.hasOwnProperty('associate')) {
        master_db[modelName].options.associate(master_db)
    }
});
/*************** Master Database Reading Model Files: End ************************/

module.exports = {
    db: sequelize,
    master_db: sequelizeMasterConnection
};


//db.Sequelize = Sequelize;
//module.exports = db;