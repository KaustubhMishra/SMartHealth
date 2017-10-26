var mainConfig = require('./mainConfig');

module.exports = {
    //This is your MYSQL Database configuration    
    modelsDir : {
        path : __dirname + '/../models',
        master_database_path : __dirname + '/../models/master_database',
        telemetryPath: __dirname + '/../models/data'
    },
   "db": {
        "username": mainConfig.databaseConfig.username,
        "password": mainConfig.databaseConfig.password,
        "database": mainConfig.databaseConfig.database,
        "host": mainConfig.databaseConfig.host,
        "dialect": mainConfig.databaseConfig.dialect,
        "port": mainConfig.databaseConfig.port
    },
    "master_database": {
        "username": "root",
        "password": "root",
        "database": "iotconnect_master_db",
        "host": "localhost",
        "dialect": "mysql",
        "port": "3306"
    },
    "db_qa": {
        "username": "root",
        "password": "root",
        "database": "iotconnect",
        "host": "192.168.4.178",
        "dialect": "mysql",
        "port": "3306"
    },
    "db_live": {
        "username": "root",
        "password": "softweb#123",
        "database": "iotconnect",
        "host": "34.193.114.182",
        "dialect": "mysql",
        "port": "3306"
    },
    "production": {
        "username": "softwebo_iotcu",
        "password": "61gzCQ98Vq1W25QrON",
        "database": "softwebo_iotconnect",
        "host": "localhost",
        "dialect": "mysql",
        "port": "3306"  
    }
};
