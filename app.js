require('./server/config/commonModule');
var express = require('express');
//var favicon = require('serve-favicon');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');

var passport = require('./server/config/passport');

var session = require('express-session');
var expressValidator = require('express-validator');

var app = express();

app.use(session({
    'secret': "secret key",
    'name': 'sessionId',
    'unset': 'destroy',
    'resave': true,
    'saveUninitialized': true
}));

app.use(compression());
app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser("secretkey"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
//app.use(expressValidator());
app.use(expressValidator({
 customValidators: {
    notEquals: function(param, num) {
        return param != num;
    }
 }
}));


app.set('appPath', 'public');
app.use(express.static(__dirname + '/public'));

//var adminrouter = require('./server/adminRoutes');
//adminrouter(app);

var router = require('./server/routes');
router(app);

/**
 * Cluster setup 
 */
var cluster = require('./server/config/cluster');
cluster.setup(app);

// Super Admin
app.all('/admin*', function(req, res, next) {
    res.sendfile(__dirname + "/public/admin.html");
});

// Site
app.all('/*', function(req, res, next) {
	res.sendfile(__dirname + "/public/site.html");
});



/**
 * Cron
 */
var nodeCron = require('./server/lib/cron');

/*Store device id for manual simulator [START]*/
var PropertiesReader = require('properties-reader');
var thingSPath = './thingSimulated.properties';
var fs = require('fs-extra');
fs.exists('thingSPath', (exists) => {
    if(exists)
    {
        var fd = fs.openSync(thingSPath, 'r+');
        fs.ftruncate(fd, (err) => {
          //console.log("Property file empty..!");
        });
    }
    else
    {
        fs.writeFile(thingSPath, "", function(err) {
            if(err) {
                return console.log(err);
            }
            var fd = fs.openSync(thingSPath, 'r+');
            fs.ftruncate(fd, (err) => {
              //console.log("Property file empty..!");
            });
        });
    }
});
/*Store device id for manual simulator [END]*/

global.setInterval_references = {};