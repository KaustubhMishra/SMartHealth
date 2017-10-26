module.exports = {
   //This is your cassandra Database configuration
   db: {
      keyspace: "softwebkeyspace",
      password: "cassandra",
      username: "cassandra",
      //contactPoint: ["122.182.14.124"]
      contactPoint: [settings.cassandraContactPoint]
   },
   modelsDir: {
      path: __dirname + '/../models'
   }
};
