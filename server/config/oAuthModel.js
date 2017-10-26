//var db = require('./cassandra');
var jwt = require('jwt-simple');
var passport = require('passport');
var generalConfig = require('./generalConfig');
var async = require('async');
var db = require('./sequelize').db;
var DataTypes = require("sequelize");
var base64 = require('base-64');
var utf8 = require('utf8');
var localStorage = require('localStorage');
var OAuth2Error = require('oauth2-server/lib/error');

var model = module.exports;

//tokens expiration time
model.accessTokenLifetime = 432000;
model.refreshTokenLifetime = null;

// JWT secret keys
var secretKey = settings.secretKey;
var clientKey = settings.clientKey;

/**
 * @author NB
 * allowJson() will convert content-type from json to x-www-form-urlencoded to allow this request
 * @param  {req}   req
 * @param  {res}   res
 * @param  {Function} next
 * @return {Function} next
 */
model.allowJson = function(req, res, next) {
    deviceType = req.body.device_type;
    deviceToken = req.body.device_token;
    console.log(deviceType);
    console.log(deviceToken);
    if (req.is('json'))
        req.headers['content-type'] = 'application/x-www-form-urlencoded';

    next();
};

/**
 * @author NB
 * getClient() will verify client
 * @param  {String}   clientId
 * @param  {String}   clientSecret
 * @param  {Function} callback
 * @return {Function} callback
 */
model.getClient = function(clientId, clientSecret, callback) {

    var decoded = '';
    var randNum = '';
    async.series([
        function(cb){   
            decoded = jwt.decode(clientSecret, secretKey);
            cb(null,null);
        },
        function(cb){   
            randNum = localStorage.getItem('randNum');
            console.log("IN CB",randNum);
            console.log("decoded.import",decoded.import);
            cb(null,null);
        }
    ],
    function(err, results) {
        if(err){
            return callback(err, null);
        }
        
        return callback(null, {
                "clientId": clientId,
                "clientSecret": clientSecret
            });
        /*if(decoded.import === randNum)
        {
            return callback(null, {
                "clientId": clientId,
                "clientSecret": clientSecret
            });
        }
        else
        {   
            console.log("Not matched token");
            // return callback(null, {
            //     "clientId": clientId,
            //     "clientSecret": clientSecret
            // });
            return callback({"error":"Token mismateched"}, null);
        }*/
    })
};

/**
 * grantTypeAllowed() will check for allowed grant type and allow user to authorized
 * @param  {String}   clientId
 * @param  {String}   grantType
 * @param  {Function} callback
 * @return {Function} callback
 */
model.grantTypeAllowed = function(clientId, grantType, callback) {
    callback(false, true);
};

/**
 * getUser() will verify user via grant type password
 * @param  {String}   username  email of user
 * @param  {String}   password
 * @param  {Function} callback
 * @return {Function} callback
 */
model.getUser = function(username, password, callback) {
    if(username.tmpflag == 2){

        var req = {
            body: {
                email: username.email,
                password: password,
                tmpflag:username.tmpflag,
                superadmin:username.superadmin,
                ismobile:username.ismobile
            }
        };

    }else{
        var req = {
            body: {
                email: username.email,
                password: password,
                tmpflag:username.tmpflag,
                superadmin:username.superadmin,
                ismobile:username.ismobile
            }
        };
    }

    var res = {};

    //verify user name and password with local strategy
    passport.authenticate('local', function(err, user, info) {

        if (!user) {
            if(err)
            {
                return callback(new OAuth2Error('invalid_grant', err));
            }
            else if(info.message)
            {
                return callback(new OAuth2Error('invalid_grant', info.message));
            }
            else
            {
                return callback(new OAuth2Error('invalid_grant', err));
            }

        } else {
            delete user['password'];
            callback(null, {
                id: user.id,
                companyId: user.company_id,
                superadmin: user.superadmin
            });
        }
    })(req, res);
};

/**
 * generateToken() will generate new token
 * @param  {String}   type token type
 * @param  {req}   req
 * @param  {Function} callback
 * @return {Function} callback
 */
model.generateToken = function(type, req, callback) {

    var super_admin_status = req.user.superadmin; // Super Admin Status

    //Use the default implementation for refresh tokens
    if (type === 'refreshToken') {
        callback(null, null);
        return;
    }
    var expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + model.accessTokenLifetime * 1000);

    //on refresh token will carry old user information
    var userInfo = {};
    
    if(super_admin_status) // Super Admin 
    {
        if (req.cookies && req.cookies.adminUserSession)
        {
            var oldToken = (JSON.parse(req.cookies.adminUserSession)).access_token;
            if (oldToken) {
                var decoded = jwt.decode(oldToken, secretKey);
                userInfo = decoded.user;
            } else {
                userInfo = req.user;
            }
        }
        else
        {
            userInfo = req.user;
        }
    }
    else // Client Admin
    {
        if (req.cookies && req.cookies.userSession)
        {
            console.log('----req.cookies.userSession---');
            console.log(req.cookies.userSession);
            console.log('----req.cookies.userSession---');

            var oldToken = (JSON.parse(JSON.stringify(req.cookies.userSession))).access_token;
            if (oldToken) {
                var decoded = jwt.decode(oldToken, secretKey);
                userInfo = decoded.user;
            } else {
                userInfo = req.user;
            }
        }
        else
        {
            userInfo = req.user;
        }
    }

    var token = jwt.encode({
        user: userInfo,
        subject: req.client.clientId,
        exp: expireDate
    }, secretKey);

    callback(null, token);
};

/**
 * saveAccessToken() will save access token
 * @param  {String}   token
 * @param  {String}   clientId
 * @param  {Timestamp}   expires
 * @param  {Object}   user
 * @param  {Function} callback
 * @return {Function} callback
 */
model.saveAccessToken = function(token, clientId, expires, user, callback) {
    //No need to store JWT tokens.
    callback(null);
};

/**
 * getAccessToken() will get bearer token
 * @param  {String}   bearerToken
 * @param  {Function} callback
 * @return {Function} callback
 */
model.getAccessToken = function(bearerToken, callback) {
 
    try {
        var decoded = jwt.decode(bearerToken, secretKey);
        callback(null, {
            accessToken: bearerToken,
            clientId: decoded.sub,
            userId: decoded.user,
            expires: new Date(decoded.exp)
        });
    } catch (e) {
        callback(e);
    }
};

/**
 * getRefreshToken() get refresh token from database
 * @param  {String}   refreshToken
 * @param  {Function} callback
 * @return {Function} callback
 */
model.getRefreshToken = function(refreshToken, callback) {
   db.models.user_token.findOne({ where: { refresh_token: refreshToken} })
      .then(function(user) {
        if(user){

            var userInfo = {
                id: user.user_id,
                companyId: user.company_id
            };

            callback(null, {
                    refreshToken: user.refresh_token,
                    clientId: 'screteKEY',
                    user: userInfo,
                    expires: user.expireon
                });
        }else{
            callback(null,{
                    refreshToken: '',
                    clientId: '',
                    userId: '',
                    expires: ''
                });
        }
    }).catch(function(error) {
        callback(error);
    });
};

/**
 * saveRefreshToken will save refresh token in database
 * @param  {String}   token
 * @param  {String}   clientId
 * @param  {Timestamp}  expires
 * @param  {Object}   user
 * @param  {Function} callback
 * @return {Function} callback
 */
model.saveRefreshToken = function(token, clientId, expires, user, callback) {

    var refreshToken = {
        refreshToken: token,
        clientId: clientId,
        userId: user.id,
        expires: expires
    };

    var updatefields = {};
    updatefields['refresh_token'] = token;
    updatefields['expireon'] = expires;
    updatefields['user_id'] = user.id;

    if(user.companyId)
    {
        updatefields['company_id'] = user.companyId;
        db.models.user_token.create(updatefields, { where: { id: user.id} })
          .then(function(UserSchemaUpdate) {
            if(UserSchemaUpdate){
                callback(null, UserSchemaUpdate);
            } else {
                callback(UserSchemaUpdate);
            }
          });
    }
    else
    {
        db.models.user_token.create(updatefields, { where: { id: user.id} })
          .then(function(UserSchemaUpdate) {
            if(UserSchemaUpdate){
                callback(null, UserSchemaUpdate);
            } else {
                callback(UserSchemaUpdate);
            }
          });
    }
      
};