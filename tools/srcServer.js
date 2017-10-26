import express from 'express';
import webpack from 'webpack';
import path from 'path';
import config from '../webpack.config.dev';
import open from 'open';


require('../server/config/commonModule');
//var express = require('express');
//var favicon = require('serve-favicon');
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';

const passport = require('../server/config/passport');

import session from 'express-session';
import expressValidator from 'express-validator';

/*eslint-disable no-console */

const port = 3100;
const app = express();
const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use(require('webpack-hot-middleware')(compiler));

// app.get('*', function(req, res) {
//   res.sendFile(path.join( __dirname, '../src/index.html'));
// });

// app.listen(port, function(err) {
//   if (err) {
//     console.log(err);
//   } else {
//     open(`http://localhost:${port}`);
//   }
// });

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
app.use(express.static(__dirname + '/../'));
app.use(express.static(__dirname + '/../public'));
//var adminrouter = require('./server/adminRoutes');
//adminrouter(app);

const router = require('../server/routes');
router(app);

/**
 * Cluster setup
 */
const cluster = require('../server/config/cluster');
cluster.setup(app);

// Super Admin
// app.all('/admin*', function(req, res, next) {
//     res.sendfile(__dirname + "/public/admin.html");
// });
//
// // Site
// app.all('/*', function(req, res, next) {
// 	res.sendfile(__dirname + "/public/site.html");
// });

// app.get('/my', function(req, res) {
//   console.log("***************");
//   console.log("***************");
//   res.json({"hi":"123"});
// });

app.all('/*', function(req, res) {
  res.sendFile(path.join( __dirname, '../src/index.html'));
});



global.setInterval_references = {};
