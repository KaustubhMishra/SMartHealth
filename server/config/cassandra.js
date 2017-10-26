var fs = require('fs');
var cassandra = require('cassandra-driver');
var _ = require('lodash');
var config = require('./cassandraConfig.js');
var db = {};

var options = {
    contactPoints: config.db.contactPoint,
    keyspace: config.db.keyspace,
    authProvider: new cassandra.auth.PlainTextAuthProvider(config.db.username, config.db.username.password)
};
var client = new cassandra.Client(options);

client.connect(function(err, result) {
    //console.log('Cassandra Connected.');
});

//assign the cassandra instance to the db object and returning the db. 
module.exports = _.extend({
    client: client,
    Client: client
}, db);