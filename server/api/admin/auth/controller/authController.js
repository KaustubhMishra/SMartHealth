'use strict';

var passport = require('passport');
var http = require('http');
var url = require('url');
var generalConfig = require('../../../../config/generalConfig');

var crypto = require('crypto');
var db = require('../../../../config/sequelize').db;
var commonLib = require('../../../../lib/common');

var country_lib = require('../../../../lib/country/country');


/*
   Module : Login
   Author : Naresh [SOFTWEB]
   Inputs : Email, Password
   Output : Login and Generate server side session
   Date   : 2016-06-10
*/
exports.signin = function(req, res, next) {
      console.log('--------------------------------333333')

    passport.authenticate('local', function(err, admin_user, info) {
      
        console.log('----------------------------11111')
        if (!admin_user)
        {
            if (err)
            {
                //console.log(err);
                res.json({
                    status: err
                });
            } else
            {
              //console.log(info);
              res.json({
                  status: 'fail',
                  info:info
              });
            }
        }
        else
        {
            console.log('----------------------------22222')
            if (admin_user.resetPassword == '1')
            {
                var curUserID = admin_user.id;
                //var curUserID = encrypt(curUserID.toString());
                res.json({
                    'resetPassword': 'YES',
                    'userMigrateID': curUserID
                });
            }
            else
            {
                //console.log("---------- Session Started -----------");
                var curUserID = admin_user.id;
                //var curUserID = encrypt(curUserID.toString());                
                req.session.user = admin_user;
                res.json({
                    id: curUserID
                });
            }
        }
    })(req, res, next);
};


exports.sitesignin = function(req, res, next) {
  console.log('sitesignin');
    passport.authenticate('local', function(err, user, info) {
        if (!user) {
            if (err) {
                //console.log(err);
                res.json({
                    status: err
                });
            } else {
                //console.log(info);
                res.json({
                    status: 'fail',
                    info:info
                });
            }
        } else {
            if (user.resetPassword == '1') {
                var curUserID = user.id;
                //var curUserID = encrypt(curUserID.toString());
                res.json({
                    'resetPassword': 'YES',
                    'userMigrateID': curUserID
                });
            } else {
                //console.log("---------- Session Started -----------");
                var curUserID = user.id;
                //var curUserID = encrypt(curUserID.toString());                
                req.session.user = admin_user;
                res.json({
                    id: curUserID
                });
            }
        }
    })(req, res, next);
};

/*
 * @author: Gunjan
 * Forgot Password Process
 */
exports.forgotpassword = function(req, res, next) {

    var email = req.body.params.email;
    db.models.admin_user.find({
        where:{
          email: email,
          active: true
        }
    }).then(function(user){
        
        if(!user)
        {
            res.json({
                status: 'fail',
                data: null,
                message: 'Email address has not been found Or User is not active'
            }); 
        }
        else
        {

            var userTokenGen = new Date().getTime() + user.email;
            var userToken = crypto.createHash('md5').update(userTokenGen).digest('hex');   

            // Update Token
            user.update({
                usertoken: userToken
              }).then(function(user) {

                // Send reset password link :Start

                var emailTemplate = settings.emailTemplate;
                var emailbody = emailTemplate.resetpasswordEmailBody;

                var linkurl = settings.siteUrl+"/admin/resetpassword/"+userToken;
                var linkhtml = "<a href='"+linkurl+"'>"+linkurl+"</a>";

                emailbody = emailbody.replace("%userfullname%", user.firstname+" "+user.lastname );     
                emailbody = emailbody.replace("%resetpasswordlink%", linkhtml);     

                var emailmessage = emailTemplate.emailContainerHeaderString;
                emailmessage += emailbody;
                emailmessage += emailTemplate.emailContainerFooterString;

                var message = {
                   from:    "kaustubh.mishra@softwebsolutions.com", 
                   to:      user.email,
                   subject: emailTemplate.resetpasswordSubject,
                   attachment: 
                   [
                      {data:emailmessage, alternative:true}
                   ]
                };

                settings.emailserver.send(message, function(err, message) { console.log(err || message); });

                // Send reset password link: End

                res.json({
                    status: 'success',
                    data: null,
                    message: 'Reset Password Link has been sent to your email address.'
                });

            }).catch(function(err) {

                res.json({
                    status: 'fail',
                    data: null,
                    message: 'Forgot password request has not been completed'
                });
            });
        }

    }).catch(function(err) {
        res.json({
            status: 'fail',
            data: null,
            message: 'Forgot password request has not been completed'
        });
    });
};

/*
 * @author: Gunjan
 * Reset Password Process
 */
exports.resetpassword = function(req, res, next) {

  if (req.body != '')
  {
    req.checkBody('token', 'Reset token is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    var mappedErrors = req.validationErrors(true);
  }

  if(mappedErrors == false)
  {
    var token = req.body.token;
    
    // Check token
    db.models.admin_user.find({
        where:{
          usertoken: token, 
          active: true
        }
    }).then(function(user){
        if(!user)
        {
            res.json({
                status: 'fail',
                data: null,
                message: 'Token is invalid Or user is not active'
            });            
        }
        else
        {
            var newpassword = generalConfig.encryptPassword(req.body.password);

            // Password update
            user.update({
                password: newpassword,
                usertoken : null
            }).then(function() {

                res.json({
                    status: 'success',
                    data: null,
                    message: 'Password has been updated successfully'
                });

            }).catch(function(err) {

                res.json({
                    status: 'fail',
                    data: null,
                    message: 'Reset password request has not been completed'
                });
            });
        }
    }).catch(function(err) {
        res.json({
            status: 'fail',
            data: null,
            message: 'Reset password request has not been completed'
        });
    });
  }
  else
  {
      res.json({
        status: 'fail',
        data: null,
        message: mappedErrors
      });
  }
};

/*
 * @author: Gunjan
 * Create Password Process for new user registration
 */
exports.createPassword = function(req, res, next) {
  
  if (req.body != '')
  {
    req.checkBody('token', 'token is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    var mappedErrors = req.validationErrors(true);
  }

  if (mappedErrors == false)
  {
      var token = req.body.token;
      db.models.admin_user.find({
            attributes: ['id'],
            where:{
                usertoken: token, 
            }
      }).then(function(user){
          if (!user)
          {
              res.json({
                  status: 'fail',
                  data: null,
                  message: 'Token is invalid'
              });            
          }
          else
          {
              var newpassword = generalConfig.encryptPassword(req.body.password);
             
              user.update({
                  password: newpassword,
                  usertoken : null,
                  active: true
              }).then(function() {

                  res.json({
                      status: 'success',
                      data: null,
                      message: 'Password has been created successfully.'
                  });

              }).catch(function(err) {

                  res.json({
                      status: 'fail',
                      data: null,
                      message: 'Set password request has not been completed'
                  });
              });
          }
    }).catch(function(err) {
        res.json({
            status: 'fail',
            data: null,
            message: 'Set password request has not been completed'
        });
    });
  }
  else
  {
    res.json({
       status: 'fail',
       data: null,
       message: mappedErrors
    });
  }
};

/*
 * @author: Gunjan
 * Destroy server side session
 */
exports.signout = function(req, res) {
    delete req.session.user;
    res.json({
        status: 'success',
        data: null,
        message: 'Signout process has been completed successfully'
    });
};

/*
   Module : Session data
   Author : Mayank [SOFTWEB]
   Inputs : 
   Output : Session data
   Date   : 2015-10-15
*/
exports.getSession = function(req, res) {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.json({
            status: 'fail'
        });
    }
};


/*
 * @author: Gunjan
 * Encrypt input Email and Password
 */
exports.encryptCookies = function(req, res) {
    var encryptedPassword = encrypt(req.body.rememberPass);
    var encryptedEmail = encrypt(req.body.rememberEmail);
    res.json({
        encEmail: encryptedEmail,
        encPass: encryptedPassword
    });
};

/*
   Module : Login Cookie Decryption
   Author : Mayank [SOFTWEB]
   Inputs : Encrypted format of Email, Password
   Output : Decrypt posted Email and Password
   Date   : 2015-12-03
*/
exports.decryptCookies = function(req, res) {
    var decryptedEmail = decrypt(req.body.cookieEmail);
    var decryptedPassword = decrypt(req.body.cookiePassword);
    res.json({
        decEmail: decryptedEmail,
        decPass: decryptedPassword
    });
};



/*
   Module : Encryption function
   Author : Mayank [SOFTWEB]
   Inputs : text
   Output : Encrypt text
   Date   : 2015-12-03
*/
function encrypt(text) {
    var cipher = settings.cryptoAuthentication.crypto.createCipher(settings.cryptoAuthentication.algorithm, settings.cryptoAuthentication.password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

/*
   Module : Decryption function
   Author : Mayank [SOFTWEB]
   Inputs : Encrypted text
   Output : Simple text
   Date   : 2015-12-03
*/
function decrypt(text) {
    var decipher = settings.cryptoAuthentication.crypto.createDecipher(settings.cryptoAuthentication.algorithm, settings.cryptoAuthentication.password);
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

/*
 * @author: Gunjan
 * Get country list
 */
exports.getCountryList = function(req, res, next) {

  country_lib.getCountry(function(callback){
      res.json({
        status: 'success',
        data: callback.data,
        message: 'country has been loaded successfully'
      })
  })
  
}

/*
 * @author: Gunjan
 * Get state list
 */
exports.getStateList = function(req, res, next) {
  var country_name = req.body.country_name;
  country_lib.getStateByCountry(country_name, function(callback){
      res.json(callback)
  })
}
