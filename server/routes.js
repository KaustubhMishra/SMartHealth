'use strict';
var jwt = require('jwt-simple');
var crypto = require('crypto');
var base64 = require('base-64');
var utf8 = require('utf8');
var localStorage = require('localStorage');

module.exports = function(app) {
    var oauthserver = require('oauth2-server');
    var oAuthModel = require('./config/oAuthModel');

/******
 * ### Swagger Setting : Start
 */
    var swaggerJSDoc = require('swagger-jsdoc');

    // swagger definition
    var swaggerDefinition = {
      info: {
        title: 'Node Swagger API',
        version: '1.0.0',
        description: 'Demonstrating how to describe a RESTful API with Swagger',
      },
      host: '192.168.4.117:3009',
      basePath: '/',
    };

    // options for the swagger docs
    var options = {
      // import swaggerDefinitions
      swaggerDefinition: swaggerDefinition,
      // path to the API docs
      apis: [
        './server/*.js',
        './server/api/site/command/route/*.js',
        './server/*.js',
        './server/api/site/auth/route/*.js',
        './server/api/site/company/route/*.js',
        './server/api/site/user/route/*.js',
        './server/api/site/profile/route/*.js'
        ],
    };

    // initialize swagger-jsdoc
    var swaggerSpec = swaggerJSDoc(options);

/*****
 * ### Swagger Setting : Finish
 */


    /* Oauth server setup */
    app.oauth = oauthserver({
        model: oAuthModel,
        grants: ['password', 'refresh_token','client_credentials', 'authorization_code'],
        debug: false,
        accessTokenLifetime: oAuthModel.accessTokenLifetime,
        refreshTokenLifetime: oAuthModel.refreshTokenLifetime
    });

    var excludedPath = [
        '/api/site/*',
        '/oauth/token',
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
                        status: 'fail',
                        message: "Ooops!! there is something wrong with data connection."
                    });
                }
                next();
            });
        }
    }
    app.use(isCassandraConnected);

    var isMobile = function isMobile(req, res, next) {
        if (['/signin'].indexOf(req.originalUrl) != -1) {
            if(req.body.ismobile){
                app.oauth.refreshTokenLifetime = null;
                return next();
            } else {
                app.oauth.refreshTokenLifetime = 86400;
                if(req.body.refresh_token){
                    app.oauth.model.getRefreshToken(req.body.refresh_token, function (err, refreshToken) {
                        var OAuth2Error = require('oauth2-server/lib/error');
                        try{
                            var moment = require('moment');
                            if(refreshToken.expires && moment(refreshToken.expires).format() < moment().utc().format()){
                                res.status(400);
                                res.json({
                                    status: 'fail',
                                    data:null,
                                    message: "Refresh token has expired"
                                });
                            }else{
                               return next();
                            }
                        } catch(e){
                            console.log("token error",e);
                        }
                    });
                }else{
                  return next();
                }
            }
        } else {
            return next();
        }
    }

    app.use(isMobile);


    // Swagger boot JSON File 
    app.get('/swagger.json', function(req, res) {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    var siteAuthRoute = require('./api/site/auth/route/authRoute.js');
    new siteAuthRoute(app);

    var siteSignupRoute = require('./api/site/signup/route/signupRoute.js');
    new siteSignupRoute(app);
    
    var siteCreatepasswordRoute = require('./api/site/createpassword/route/createpasswordRoute.js');
    new siteCreatepasswordRoute(app);

    var sponsorRoute = require('./api/site/sponsor/route/sponsorRoute.js');
    new sponsorRoute(app);

    var frequencyRoute = require('./api/site/frequency/route/frequencyRoute.js');
    new frequencyRoute(app);

    var trialRoute = require('./api/site/trial/route/trialRoute.js');
    new trialRoute(app);

    var drugTypeRoute = require('./api/site/drugType/route/drugTypeRoute.js');
    new drugTypeRoute(app);

    var dsmbRoute = require('./api/site/dsmb/route/dsmbRoute.js');
    new dsmbRoute(app);

    var dosageRoute = require('./api/site/dosage/route/dosageRoute.js');
    new dosageRoute(app);

    var deviceRoute = require('./api/site/device/route/deviceRoute.js');
    new deviceRoute(app);

    var countryandstateRoute = require('./api/site/countryandstate/route/countryandstateRoute.js');
    new countryandstateRoute(app);

    var siteAuthRoute = require('./api/site/patient/route/patientRoute.js');
    new siteAuthRoute(app);

    var sideeffectsRoute = require('./api/site/sideeffects/route/sideeffectsRoute.js');
    new sideeffectsRoute(app);

    var vitalDataRoute = require('./api/site/vitalData/route/vitalDataRoute.js');
    new vitalDataRoute(app);
    
    //generate token
    app.get('/getaccesstoken', function(req,res,next){
        var secretKey = settings.secretKey;
        var randomnumber = Math.random().toString(36).slice(-10);
        
        var token = jwt.encode({
            'import': randomnumber
        }, secretKey);

    });

    /**
     * @swagger
     * /getToken:
     *   get:
     *     tags:
     *       - Authentication Related Processes
     *     description: Returns Basic token
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: Basic token
     */
    app.get('/getToken', function(req,res,next){
        localStorage.clear();
        var secretKey = settings.secretKey;
        var randomnumber = Math.random().toString(36).slice(-10);

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
            localStorage.setItem('randNum', randomnumber);
            var randNum = localStorage.getItem('randNum');
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


        //res.json(token);
    });

   // app.all('/getaccesstoken', oAuthModel.allowJson, app.oauth.grant());

    app.all('/signin', oAuthModel.allowJson, app.oauth.grant());

    app.all('/api/site/*', app.oauth.authorise(), function(req, res, next) {
        next();

        //  write api request log (start)   //
        //if(req.header('apprequest')) {
            // res.on('finish', function() {
            //     try {
            //         var userInfo = generalConfig.getUserInfo(req);
            //         var requesturl = req.method + " " + req.originalUrl;
            //         var responsesize = res.get('content-length');
            //         if(responsesize) {
            //             generalConfig.addtoapilog(userInfo.companyId, userInfo.id, requesturl, responsesize);                
            //         } else {
            //             console.log('Error in getting response size.');
            //         }
            //     } catch(err) {
            //         console.log(err);
            //     }
            // });        
        //}
        //  write api request log (end)   //  

    });


   app.use(function(err, req, res, next) {
        if(err)
        {
            if(err.status == 404 || err.status == "404")
            {
                //return res.sendfile(app.get('appPath') + '/site.html');
            }
            else
            {
                if(err.message=="Email or Password is invalid") {
                    err.code = 400;
                } 
                res.status(err.code);
                return res.json({
                    status: 'fail',
                    data:null,
                    message:( (err.message)? err.message : err.error)
                    //error_code : err.code,
                });
            }
        }
    });
    //app.use(app.oauth.errorHandler());

    var siteUserRoute = require('./api/site/user/route/userRoute.js');
    new siteUserRoute(app);

    var siteCompanyRoute = require('./api/site/company/route/companyRoute.js');
    new siteCompanyRoute(app);

    var siteNotificationRoute = require('./api/site/notification/route/notificationRoute.js');
    new siteNotificationRoute(app);
    
    var siteProfileRoute = require('./api/site/profile/route/profileRoute.js');
    new siteProfileRoute(app);

    var siteLocationRoute = require('./api/site/location/route/locationRoute.js');
    new siteLocationRoute(app);

    var siteSensorRoute = require('./api/site/sensor/route/sensorRoute.js');
    new siteSensorRoute(app);

    var siteRuleRoute = require('./api/site/rule/route/ruleRoute.js');
    new siteRuleRoute(app);

    var thingsRoute = require('./api/site/things/route/thingRoute.js');
    new thingsRoute(app);

    var settingRoute = require('./api/site/setting/route/settingroute.js');
    new settingRoute(app);

    var miscellaneousRoute = require('./api/site/miscellaneous/route/miscellaneousRoute.js');
    new miscellaneousRoute(app);

    var siteCommandRoute = require('./api/site/command/route/commandRoute.js');
    new siteCommandRoute(app);

    var siteGroupRoute = require('./api/site/group/route/groupRoute.js');
    new siteGroupRoute(app);

    var siteDashboardRoute = require('./api/site/dashboard/route/dashboardRoute.js');
    new siteDashboardRoute(app);

    var siteTemplateRoute = require('./api/site/template/route/templateRoute.js');
    new siteTemplateRoute(app);

    var dataPointRoute = require('./api/site/datapoint/route/datapointRoute.js');
    new dataPointRoute(app);

    var siteFirmwareRoute = require('./api/site/firmware/route/firmwareRoute.js');
    new siteFirmwareRoute(app);

    var feedBackRoute = require('./api/site/feedback/route/feedbackRoute.js');
    new feedBackRoute(app);

    var CroCoordinatorRoute = require('./api/site/crocoordinator/route/croCoordinatorRoute.js');
    new CroCoordinatorRoute(app);

    app.get('/createsequelizedb', function(req, res, next) {
        var generalConfig = require('./config/generalConfig');
        var sequelize = require('./lib/createsequelizedb/sequelizedb');
        var db = require('./config/sequelize').db;
        var dbUser = Math.random().toString(36).slice(-12);
        var dbPassword = Math.random().toString(36).slice(-12);

        if (req.query && !req.query.companyId) {
            return res.json({
                status: 'fail',
                error: "Please provide companyId"
            });
        }

        var companyId = req.query.companyId.trim();
        db.models.company.findOne({where:{id:companyId}}).then(function(findCompany){
            if(findCompany){
                var dbName = findCompany.database_name!=null?findCompany.database_name:"iot_"+companyId.replace(/-/g, '_');
                sequelize.createDatabse(dbName,dbUser,dbPassword, function(err,result){
                    if(err){
                        return res.json(err);
                    }

                    db.models.company.update({
                        database_name:dbName,
                        database_user:dbUser,
                        database_password:dbPassword
                    }, {where:{id:companyId}}).then(function(done){
                        if(done == 1){
                            return res.json({
                               status: 'success',
                               message:'Database has been created successfully.'
                            });
                        }else{
                            return res.json({
                               status: 'fail',
                               message: "Something went wrong.Please try again."
                            });
                        }

                    }).catch(function(err){
                        res.json({status:'fail',
                            error:err,
                            message: "Something went wrong.Please try again."
                        });
                    });
                });
            }else{
                return res.json({
                    status: 'fail',
                    error: "Company doesn't exists."
                });
            }
        }).catch(function(err){
            return res.json({
                status: 'fail',
                error:err,
                message: "Something went wrong.Please try again."
            });
        });
    });

    /*
     * Super Admin
     */

    // Admin Auth Module
    var adminAuthRoute = require('./api/admin/auth/route/authRoute.js');
    new adminAuthRoute(app);

    // Admin Dashboard
    var adminDashboardRoute = require('./api/admin/dashboard/route/dashboardRoute.js');
    new adminDashboardRoute(app);

    // Admin User
    var adminUserRoute = require('./api/admin/user/route/userRoute.js');
    new adminUserRoute(app);

    // Admin Company
    var adminCompanyRoute = require('./api/admin/company/route/companyRoute.js');
    new adminCompanyRoute(app);

    // Admin Company User
    var adminCompanyUserRoute = require('./api/admin/companyUser/route/companyUserRoute.js');
    new adminCompanyUserRoute(app);

    // Admin Product
    var adminProductRoute = require('./api/admin/product/route/productRoute.js');
    new adminProductRoute(app);

    // Token Authentication
    app.all('/admin/signin', oAuthModel.allowJson, app.oauth.grant());
    app.all('/api/admin/*', app.oauth.authorise(), function(req, res, next) {
        next();
    });

};
