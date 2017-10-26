var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var _ = require('lodash');
var crypto = require('crypto');
var generalConfig = require('./generalConfig');
//These are different types of authentication strategies that can be used with Passport.
var LocalStrategy = require('passport-local').Strategy;
var db = require('./cassandra');
var db = require('./sequelize').db;
var DataTypes = require("sequelize");
var localStorage = require('localStorage');
var commonLib = require('../lib/common');

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    var query = 'SELECT * FROM user WHERE  id = ?;';
    db.models.user.find({where:{email:email}}).then(function(user){
        done(null, user);
    }).catch(function(err) {
        done(err, null);
    });
});
//Use local strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
}, function(req, email, password, done) {
    //tmpflag will check is user is proxy login or actual login
    var tmpflag = req.body.tmpflag;

    var superadmin = req.body.superadmin;
    
    if(superadmin) // Super Admin Accesss
    {
        db.models.admin_user.find({where:{email:email}}).then(function(user){
            if (!user) {
                // User information not found
                done(null, false, {
                    message: 'Incorrect Email ID or Password'
                });
            } else if (!generalConfig.authenticate(password, tmpflag == 1?user.password:user.tmp_password)) {
                // Password not match
                done(null, false, {
                    message: 'Incorrect Email ID or Password',
                    status: false
                });
            } else if (user.active == false) {
                done(null, false, {
                    message: 'User is not active'
                });
            } else {
                user.superadmin = true; // Set Super Admin Status
                done(null, user);
            }
        }).catch(function(err) {
             done(err, null);
        });
    }
    else
    {
        db.models.user.find({
            include: [ { model: db.models.company } ],
            where:{email:email}
        }).then(function(user){
            console.log("Login Request Come");
            if (!user) {
                // User information not found
                done(null, false, {
                    message: 'Incorrect Email ID or Password'
                });
            } 
            else if (!user.company) {
                // Company Information not founs
                done(null, false, {
                    message: 'Incorrect Email ID or Password'
                });
            } else if (!user.company.active) {
                // User not Active
                done(null, false, {
                    message: 'User is not active'
                });
            } else {

                user.getGroupName(db.models, function(groupnames) {
                    
                    if ((req.body.ismobile) && (groupnames.indexOf('Admin') >= 0)) {
                        // Mobile user check
                        done(null, false, {
                            message: 'User have not access for mobile panel'
                        });
                    /*} else if ((!req.body.ismobile) && (groupnames.indexOf('Admin') === -1)) {
                         // Admin user check
                        done(null, false, {
                            message: 'User have not access for admin panel'
                        });*/
                    } else if (!generalConfig.authenticate(password, tmpflag == 1?user.password:user.tmp_password)) {
                        // Password Invalid
                        done(null, false, {
                            message: 'Incorrect Email ID or Password'
                        });
                    } else if ((user.active == false) || (user.active == null)) {
                        // User not active
                        done(null, false, {
                            message: 'User is not active'
                        });
                    } else {
                        localStorage.clear();
                        commonLib.postDeviceInfo(deviceType, deviceToken, user.id);
                        user.superadmin = false; // Set Super Admin Status
                        done(null, user);
                    }

                })
            }
        }).catch(function(err) {
            done(err, null);
        });
    }
}));

module.exports = passport;