'use strict';
var jwt = require('jwt-simple');
var crypto = require('crypto');
var base64 = require('base-64');
var utf8 = require('utf8');
var localStorage = require('localStorage');
var generalConfig = require('./config/generalConfig');

module.exports = function(app) {
    var oauthserver = require('oauth2-server');
    var oAuthAdminModel = require('./config/oAuthModel');

    /* Oauth server setup */
    app.oauthadmin = oauthserver({
        model: oAuthAdminModel,
        grants: ['password', 'refresh_token','client_credentials', 'authorization_code'],
        debug: false,
        accessTokenLifetime: oAuthAdminModel.accessTokenLifetime,
        refreshTokenLifetime: oAuthAdminModel.refreshTokenLifetime
    });

    var excludedPath = [
        '/api/admin/*',
        '/admin/oauth/token',
        '/createsequelizedb'
    ];

    var isCassandraConnected = function isCassandraConnected(req, res, next) {
        if (excludedPath.indexOf(req.originalUrl) == -1) {
            return next();
        } else {
            var db = require('./config/cassandra');
            db.client.connect(function(err, result) {
                if (err) {
                    return res.json({
                        code: 400,
                        status: 'fail',
                        error_description: "Ooops!! there is somthing wrong with data connection."
                    });
                }
                next();
            });
        }
    }
    

    app.use(isCassandraConnected);

    var adminAuthRoute = require('./api/admin/auth/route/authRoute.js');
    new adminAuthRoute(app);


//    var adminSignupRoute = require('./api/admin/signup/route/signupRoute.js');
//    new adminSignupRoute(app);
    
//    var siteCreatepasswordRoute = require('./api/site/createpassword/route/createpasswordRoute.js');
//    new siteCreatepasswordRoute(app);
//
//    var countryandstateRoute = require('./api/site/countryandstate/route/countryandstateRoute.js');
//    new countryandstateRoute(app);

    app.get('/admin/getaccesstoken', function(req,res,next){
        var secretKey = settings.secretKey;
        var randomnumber = Math.random().toString(36).slice(-10);
        
        var token = jwt.encode({
            'import': randomnumber
        }, secretKey);

    });

    app.get('/admin/getToken', function(req,res,next){
        localStorage.clear();
        var secretKey = settings.secretKey;
        var randomnumber = Math.random().toString(36).slice(-10);
        localStorage.setItem('randNum', randomnumber);
        var randNum = localStorage.getItem('randNum');
       
        var token = jwt.encode({
            'import': randomnumber
        }, secretKey);
        //var text = 'clientID:screteKey';
        var text = 'screteKEY:'+token;
        var bytes = utf8.encode(text);
       
        var encoded = base64.encode(bytes);
        var token = encoded;

        if(token)
        {
            res.json({
                status: true,
                data: token,
                message: 'Token get successfully.'
            });
        }
        else
        {  
            res.json({
                status: false,
                data: null,
                message: 'Failed to get token.'
            });
        }


        res.json(token);
    });
     app.get('/getToken', function(req,res,next){
        localStorage.clear();
        var secretKey = settings.secretKey;
        var randomnumber = Math.random().toString(36).slice(-10);
        localStorage.setItem('randNum', randomnumber);
        var randNum = localStorage.getItem('randNum');
        console.log("---- RANDOM NUMBER ----");
        console.log(randNum);
        console.log("---- RANDOM NUMBER ----");
        var token = jwt.encode({
            'import': randomnumber
        }, secretKey);

        console.log("----Token----");
        console.log(token);
        console.log("----Token----");

        //var text = 'clientID:screteKey';
        var text = 'screteKEY:'+token;
        var bytes = utf8.encode(text);
        console.log("----before Encoded text----");
        console.log(text);
        console.log("----before Encoded text----");
        var encoded = base64.encode(bytes);
        var token = encoded;

        if(token)
        {console.log("---- RANDOM NUMBER1 ----");
        console.log(randNum);
        console.log("---- RANDOM NUMBER1 ----");
            res.json({
                status: true,
                data: token,
                message: 'Token get successfully.'
            });
        }
        else
        {
            console.log("---- RANDOM NUMBER2 ----");
        console.log(randNum);
        console.log("---- RANDOM NUMBER2 ----");
            res.json({
                status: false,
                data: null,
                message: 'Failed to get token.'
            });
        }


        res.json(token);
    });
    
    //generate token
    app.all('/admin/signin', oAuthAdminModel.allowJson, app.oauthadmin.grant());
    
    
    app.all('/api/admin/*', app.oauthadmin.authorise(), function(req, res, next) {
        next();
    });

    //app.use(app.oauthadmin.errorHandler());
    
    app.use(function(err, req, res, next) {
        console.error(err);
        return res.json({
            status: 'failed',
            message:((err.message)?err.message : err.error_description),
        });  
    });

    var adminUserRoute = require('./api/admin/user/route/userRoute.js');
    new adminUserRoute(app);

    var adminpanelUserRoute = require('./api/admin/adminuser/route/adminnewuserRoute.js');
    new adminpanelUserRoute(app);

    var adminCompanyRoute = require('./api/admin/company/route/companyRoute.js');
    new adminCompanyRoute(app);

    var adminNotificationRoute = require('./api/admin/notification/route/notificationRoute.js');
    new adminNotificationRoute(app);

    var adminProfileRoute = require('./api/admin/profile/route/profileRoute.js');
    new adminProfileRoute(app);
    
    var adminRuleRoute = require('./api/admin/rule/route/ruleRoute.js');
    new adminRuleRoute(app);

    var adminthingsRoute = require('./api/admin/things/route/thingRoute.js');
    new adminthingsRoute(app);

    var adminmiscellaneousRoute = require('./api/admin/miscellaneous/route/miscellaneousRoute.js');
    new adminmiscellaneousRoute(app);

    var adminGroupRoute = require('./api/admin/group/route/groupRoute.js');
    new adminGroupRoute(app);

    var adminTemplateRoute = require('./api/admin/template/route/templateRoute.js');
    new adminTemplateRoute(app);

//    app.get('/createsequelizedb', function(req, res, next) {
//        var generalConfig = require('./config/generalConfig');
//        var sequelize = require('./lib/createsequelizedb/sequelizedb');
//        var db = require('./config/sequelize').db;
//        var dbUser = Math.random().toString(36).slice(-12);
//        var dbPassword = Math.random().toString(36).slice(-12);
//
//        if (req.query && !req.query.companyId) {
//            return res.json({
//                status: 'fail',
//                error: "Please provide companyId"
//            });
//        }
//
//        var companyId = req.query.companyId.trim();
//        db.models.company.findOne({where:{id:companyId}}).then(function(findCompany){
//            if(findCompany){
//                var dbName = findCompany.database_name!=null?findCompany.database_name:"iot_"+companyId.replace(/-/g, '_');
//                sequelize.createDatabse(dbName,dbUser,dbPassword, function(err,result){
//                    if(err){
//                        return res.json(err);
//                    }
//
//                    db.models.company.update({
//                        database_name:dbName,
//                        database_user:dbUser,
//                        database_password:dbPassword
//                    }, {where:{id:companyId}}).then(function(done){
//                        if(done == 1){
//                            return res.json({
//                               status: 'success',
//                               message:'Database has been created successfully.'
//                            });
//                        }else{
//                            return res.json({
//                               status: 'fail',
//                               message: "Something went wrong.Please try again."
//                            });
//                        }
//
//                    }).catch(function(err){
//                        res.json({status:'fail',
//                            error:err,
//                            message: "Something went wrong.Please try again."
//                        });
//                    });
//                });
//            }else{
//                return res.json({
//                    status: 'fail',
//                    error: "Company doesn't exists."
//                });
//            }
//        }).catch(function(err){
//            return res.json({
//                status: 'fail',
//                error:err,
//                message: "Something went wrong.Please try again."
//            });
//        });
//    });

//    app.all('/admin*', function(req, res, next) {
//        res.sendfile(app.get('appPath') + '/admin.html');
//    });
//
//    //exculde theme get call
//    app.get('/favicon*', function(req, res, next) {
//        return res.sendfile([]);
//    });
//    app.get('/theme/*', function(req, res, next) {
//        return res.sendfile([]);
//    });
//    app.all('/*', function(req, res, next) {
//        res.sendfile(app.get('appPath') + '/site.html');
//    });
};