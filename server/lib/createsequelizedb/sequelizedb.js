var createDatabse = function createDatabse(dbname, username, password, callback) {
    if (dbname && username && password) {
        var mysql = require('mysql');
        var config = require('../../config/sequelizeConfig');
        var mysqlConfig = {
            host: config.db.host,
            port: config.db.port,
            user: config.db.username,
            password: config.db.password
        };

        var conn = mysql.createConnection(mysqlConfig);

        conn.connect(function(err) {
            if (err) {
                return callback({
                    status: 'fail',
                    error: err
                }, null);
            }
        });

        var userCreateQuery = 'CREATE USER "' + username + '"@"' + mysqlConfig.host + '" IDENTIFIED BY "' + password + '";';
        var dbCreateQuery = 'CREATE DATABASE IF NOT EXISTS ' + dbname + ';';
        var tableCreateQuery = 'CREATE TABLE ' + dbname + '.sensordatav3 (' +
            '`id`  CHAR( 36 ) NOT NULL,`companyId` CHAR ( 36 ) NOT NULL, `receivedDate` datetime DEFAULT NULL, `sensorReceivedDate` datetime DEFAULT NULL,' +
            '`connectionString` varchar(100) DEFAULT NULL, `deviceId` varchar(100) DEFAULT NULL,' +
            '`data` varchar(8000) DEFAULT NULL, PRIMARY KEY (`id`))';

        var assignPermissionUserQuery = 'GRANT ALL PRIVILEGES ON ' + dbname + '.* TO "' + username + '"@"' + mysqlConfig.host + '";'
        conn.query(dbCreateQuery, function(errCreatingDB, resp) {
            if (errCreatingDB) {
                return callback({
                    status: 'fail',
                    error: errCreatingDB
                },null);
            }

            conn.query(tableCreateQuery, function(errCreatingTable, resp) {
                if (errCreatingTable) {
                    if (errCreatingTable.code == 'ER_TABLE_EXISTS_ERROR') {
                        return callback({
                            status: 'fail',
                            error: "Database already exists."
                        },null);
                    } else {

                        return callback({
                            status: 'fail',
                            error: errCreatingTable
                        }, null);
                    }
                }

                conn.query(userCreateQuery, function(errCreatingUser, resp) {
                    if (errCreatingUser) {
                        return callback({
                            status: 'fail',
                            error: userCreateQuery
                        }, null);
                    }

                    return callback(null, true);
                    //conn.query(assignPermissionUserQuery, function(err, resp) {
                        // if (err) {
                        //     return callback({
                        //         status: 'fail',
                        //         error: err
                        //     }, null);
                        // }

                    //});
                });
            });
        });
    }
};

module.exports = {
    createDatabse: createDatabse
};