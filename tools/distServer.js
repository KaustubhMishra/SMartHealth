import express from 'express';
import path from 'path';
import open from 'open';
import compression from 'compression';

require('../server/config/commonModule');
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';

const passport = require('../server/config/passport');

import session from 'express-session';
import expressValidator from 'express-validator';

/*eslint-disable no-console */

// const port = 3100;
const app = express();

app.use(session({
    'secret': 'secret key',
    'name': 'sessionId',
    'unset': 'destroy',
    'resave': true,
    'saveUninitialized': true
}));

app.use(compression());
app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser('secretkey'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(expressValidator({
 customValidators: {
    notEquals: function(param, num) {
        return param != num;
    }
 }
}));

app.set('appPath', 'public');
app.use(express.static('dist'));

app.use(express.static(__dirname + '/../'));
app.use(express.static(__dirname + '/../public'));

const router = require('../server/routes');
router(app);

/**
 * Cluster setup
 */
const cluster = require('../server/config/cluster');
cluster.setup(app);

// app.get('*', function(req, res) {
//   res.sendFile(path.join(__dirname, '../dist/index.html'));
// });

app.all('/*', function(req, res) {
  res.sendFile(path.join( __dirname, '../dist/index.html'));
});

global.setInterval_references = {};

// app.listen(port, function(err) {
//   if (err) {
//     console.log(err);
//   } else {
//     open(`http://localhost:${port}`);
//   }
// });