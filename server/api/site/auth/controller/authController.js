'use strict';

var passport = require('passport');
var http = require('http');
var url = require('url');
var generalConfig = require('../../../../config/generalConfig');
var localStorage = require('localStorage');
var crypto = require('crypto');
var db = require('../../../../config/sequelize').db;
var commonLib = require('../../../../lib/common');

db.models.user.associate(db.models);
db.models.company_user_group.associate(db.models);

/*
   Module : Login
   Author : Naresh [SOFTWEB]
   Inputs : Email, Password
   Output : Login and Generate server side session
   Date   : 2016-06-10
*/
// exports.signin = function(req, res, next) {
//     passport.authenticate('local', function(err, user, info) {
//         if (!user) {
//             if (err) {
//                 res.json({
//                     status: err
//                 });
//             } else {
//                 res.json({
//                     status: 'fail',
//                     info:info
//                 });
//             }
//         } else {
//             if (user.resetPassword == '1') {
//                 var curUserID = user.id;
//                 //var curUserID = encrypt(curUserID.toString());
//                 res.json({
//                     'resetPassword': 'YES',
//                     'userMigrateID': curUserID
//                 });
//             } else {
//                 var curUserID = user.id;
//                 //var curUserID = encrypt(curUserID.toString());                
//                 req.session.user = user;
//                 res.json({
//                     id: curUserID
//                 });
//             }
//         }
//     })(req, res, next);
// };

/*
   Module : Forgot Password
   Author : Harish [SOFTWEB]
   Change : Gunjan (2016-11-10)
   Inputs : Email
   Output : Send Reset Password link in email Login.
   Date   : 2016-10-03
*/
exports.forgotpassword = function(req, res, next) {

  commonLib.checkAuthentication(req.headers.authorization, function(result) {
    if(result.status === true){
      var email = req.body.email;
      db.models.user.find({
          where: [ "email = ?", email ],
      }).then(function(user){
          console.log(user);
          if (!user) {
              res.json({
                  status: false,
                  data : null,
                  message: 'Email ID is not registered'
              });            
          } else {

              /*if ((req.body.params.ismobile) && (user.company_user_groups[0].company_group.name == "Admin")) {

                  res.json({
                      status: 'fail',
                      data : null,
                      message: 'Email record has not been found'
                  });

              } else if ((!req.body.params.ismobile) && (user.company_user_groups[0].company_group.name != "Admin")) {

                  res.json({
                      status: 'fail',
                      data : null,
                      message: 'Email record has not been found'
                  });

              } else {
*/
                  var userTokenGen = new Date().getTime()+user.email;
                  var userToken = crypto.createHash('md5').update(userTokenGen).digest('hex');   

                  user.update({
                    usertoken: userToken
                  }).then(function(user) {

                      //*/  send reset password link (start)   /*//

                      var emailTemplate = settings.emailTemplate;
                      var emailbody = emailTemplate.resetpasswordEmailBody;
                      
                      var linkurl = settings.siteUrl+"/resetpassword/"+userToken;
                      var linkhtml = "<a href='"+linkurl+"'>"+linkurl+"</a>";
                      console.log(linkurl); 
                      console.log(linkhtml); 
                      emailbody = emailbody.replace("%userfullname%", user.firstname+" "+user.lastname );     
                      emailbody = emailbody.replace("%resetpasswordlink%", linkhtml);     

                      var emailmessage = emailTemplate.emailContainerHeaderString;
                      emailmessage += emailbody;
                      emailmessage += emailTemplate.emailContainerFooterString;

                      var message = {
                         from:    settings.adminEmailID,
                         to:      user.email,
                         subject: emailTemplate.resetpasswordSubject,
                         attachment: 
                         [
                            {data:emailmessage, alternative:true}
                         ]
                      };

                      settings.emailserver.send(message, function(err, message) {  });

                      //*/  send reset password link (end)   /*//

                      res.json({
                          status: true,
                          data: null,
                          message: 'Reset Password link sent successfully'
                      });

                  }).catch(function(err) {
                      res.json({
                          status: false,
                          data: null,
                          message: 'Reset password request has not been processed successfully'
                      });
                  });
              //}              
          }

      }).catch(function(err) {
          res.json({
              status: false,
              data: null,
              message: 'Reset password request has not been processed successfully'
          });
      });
    }
    else
    {
      res.status(400).json({
          'status': false,
          'message': result.message
      });
    }
  });
};


exports.checkEmailRegistered = function(req, res, next) {
  console.log("Request Come");
  console.log(req.body);
  commonLib.checkAuthentication(req.headers.authorization, function(result) {
    if(result.status === true) {
      if (req.body != '')
      {
        req.checkBody('email', 'Email is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
      }
      if (mappedErrors == false) {
        var email = req.body.email;
        db.models.user.find({
          where: [ "email = ?", email ],
        }).then(function(user){
            if (!user) {
              res.json({
                status: false,
                data : {
                  isUserExist: false 
                },
                message: 'Email ID is not registered'
              });            
            } else {
              res.json({
                status: true,
                data : {
                  isUserExist: true 
                },
                message: 'Email record has been found',
              });
            }
          }).catch(function(err) {
            res.json({
              status: false,
              data: null,
              message: 'Reset password request has not been processed successfully'
          });
        });
      } else {
        res.json({
          status: false,
          message: mappedErrors
        });
      }
    } else {
        res.json({
        status: false,
        message: result.message
      });
    }
  });
};

exports.createPassword = function(req, res, next) {

  console.log("Request Come");
  console.log(req.body);

  commonLib.checkAuthentication(req.headers.authorization, function(result) {
    if(result.status === true){

      if (req.body != '')
      {
        req.checkBody('email', 'Email is required').notEmpty();
        req.checkBody('password', 'Password is required').notEmpty();

        var mappedErrors = req.validationErrors(true);
      }
      if (mappedErrors == false) {
        var email = req.body.email;
        db.models.user.find({
            where: [ "email = ?", email ],
        }).then(function(user){
          if (!user)
          {
            res.json({
              status: false,
              data: null,
              message: 'Invalid Email'
            });            
          } else {
            var newpassword = generalConfig.encryptPassword(req.body.password);
             console.log("newpassword");
             console.log(newpassword);
              user.update({
                  password: newpassword,
                  device_type: req.body.device_type,
                  device_token: req.body.device_token,
                  is_mobile: req.body.is_mobile
              }).then(function(user) {
                  console.log(user.email);
                  if(user) {
                    res.json({
                      status: true,
                      data: null,
                      message: 'Set password request has been completed'
                    });
                  }

              }).catch(function(err) {
                  res.json({
                      status: false,
                      data: null,
                      message: 'Set password request has not been completed'
                  });
              });
          }

        }).catch(function(err) {
          res.json({
            status: false,
            data: null,
            message: 'Set password request has not been completed'
          });
        });
      } else {
        res.json({
          status: false,
          message: mappedErrors
        });
      }
    } 
    else {
      res.json({
        status: false,
        message: result.message
      });
    }
  });
};



/*
   Module : Reset Password
   Author : Harish [SOFTWEB]
   Output : Reset Password using reset password token.
   Date   : 2016-10-03
*/
exports.resetpassword = function(req, res, next) {

  commonLib.checkAuthentication(req.headers.authorization, function(result) {
    if(result.status === true){

      if (req.body != '')
      {
        req.checkBody('token', 'Reset token is required').notEmpty();
        req.checkBody('password', 'Password is required').notEmpty();
        var mappedErrors = req.validationErrors(true);
      }

      if (mappedErrors == false)
      {
        console.log("Request Come");
        var token = req.body.token;
        db.models.user.find({
            where:{
              usertoken: token, 
              //active:true
            }
        }).then(function(user){
            if (!user) {
                res.json({
                    'status': true,
                    'message': 'Invalid token.'
                });            
            } else {

                var newpassword = generalConfig.encryptPassword(req.body.password);

                user.update({
                  password: newpassword,
                  usertoken : null
                }).then(function() {

                    res.json({
                        'status': 'success',
                        'message': 'Password updated successfully.'
                    });

                }).catch(function(err) {

                    res.json({
                        'status': false,
                        'message': err
                    });
                });
            }

        }).catch(function(err) {
            res.json({
                'status': false,
                'message': err
            });
        });
      } else {
        res.json({
          status: false,
          message: mappedErrors
        });
      }
    }
    else
    {
        res.json({
            status: false,
            message: result.message
        });
    }
  });
};



/*
   Module : Login
   Author : Naresh [SOFTWEB]
   Inputs : NA
   Output : Destroy server side session
   Date   : 2016-06-10
*/
exports.signout = function(req, res) {
    //delete req.session.user;

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: false,
            message: 'Unknown user'
        });
    }

    commonLib.removeDeviceInfo(userInfo.id, function(err, result) {
        if (err) {
            res.json({
                status: false,
                data: null,
                message: err.responseMessage
            });
        } else {
            res.json({
                status: true,
                data: null,
                message: 'Logout done successfully'
            });
        }
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
   Module : Login Cookie Encryption
   Author : Mayank [SOFTWEB]
   Inputs : PLain format of Email, Password
   Output : Encrypt inputed Email and Password
   Date   : 2015-12-03
*/
exports.encryptCookies = function(req, res) {
    var encryptedPassword = encrypt(req.body.rememberPass);
    var encryptedEmail = encrypt(req.body.rememberEmail.email);
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
 * @author: Gunjan
 * Get login user information
 * TimeZone
 */
exports.getLoginUserSetting = function(req, res, next) {

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId || !userInfo.id) {
        return res.json({
            status: 'fail',
            data: null,
            message: 'Unknown user information'
        });
    }
    else
    {
        db.models.user.findOne({
              attributes: ['timezone'],
              where: {
                id: userInfo.id,
                company_id: userInfo.companyId
              }
        }).then(function(user_response) {                    
            return res.json({
                status: 'success',
                data: user_response,
                message: 'user information has been loaded successfully'
            });
        })
        .catch(function(err) {
            return res.json({
                status: 'fail',
                data: null,
                message: 'user information has not been loaded successfully'
            });
        });  

    }
}

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
