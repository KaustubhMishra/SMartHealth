import axios from 'axios';
import cookies from 'react-cookie';
import toastr from 'toastr';

    var now = new Date();
    var exp = new Date(now.getTime() + 432000000);
    var exp1 = new Date(now.getTime() - 432000000);

 class LoginApi {
  static userAuthenicate(user) {
    
            var rememberMe = user.rememberMe;
            var rememberEmail = user.username;
            var rememberPass = user.password;
    
    cookies.save('access_token',  "", {expires: exp1, path: '/' });
    cookies.save('refresh_token', "", {expires: exp1, path: '/' });
    cookies.save('rememberMe', rememberMe, { expires: exp1, path: '/'  });

    var basicToken = "Basic "+ cookies.load('basicToken');
    return new Promise((resolve, reject) => {
        axios.post("/signin", user, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
        }).then(function(response){
          var bearerToken = "Bearer "+ response.data.access_token;
          var config = {
            headers: {
                  'Content-Type': 'application/json',
                  'Authorization': bearerToken
                }
          };

          //return new Promise((resolve, reject) => {
          axios.get("/api/site/getUserPermission",config).then(function(permissions){
            if(permissions.data.data && permissions.data.data.length > 0)
            {
            const user = permissions.data.data[0];
            let userData = [];
            var arr = Object.keys(user).map(function (key) { 
              userData = user[key];
              cookies.save('userData', userData, { path: '/' });
            });

            if (rememberMe == true) {
              cookies.save('access_token', response.data.access_token, {
                                              expires: exp, path: '/' 
                                          });
              cookies.save('refresh_token', response.data.refresh_token, {
                                              expires: exp, path: '/' 
                                          });
              var obj = {
                  'rememberMe': rememberMe,
                  'rememberEmail': rememberEmail,
                  'rememberPass': rememberPass
              };

              axios.post('/api/site/auth/enc', obj).then(function(response) {
                  cookies.save('rememberMe', rememberMe, {
                      expires: exp, path: '/'
                  });
                  cookies.save('cookieEmail', response.data.encEmail, {
                      expires: exp, path: '/'
                  });
                  cookies.save('cookiePassword', response.data.encPass, {
                      expires: exp, path: '/'
                  });

              }).catch(function(err) {
                 reject(err)
              });
            } 
            else {
                cookies.save('access_token', response.data.access_token, { path: '/' });
                cookies.save('refresh_token', response.data.refresh_token, { path: '/' });
                cookies.remove('rememberMe', { path: '/' });
                cookies.remove('cookieEmail', { path: '/' });
                cookies.remove('cookiePassword', { path: '/' });
            }
          }
          else
          {
            cookies.remove('userData', { path: '/' });
            toastr.error("UnAuthorised User");
            reject(response)
          }
            resolve(response);
          
          }).catch(function (error) {
            reject(error)
          });
      }).catch(function (error) {
          if(rememberMe == false)
          {
              cookies.remove('rememberMe', { path: '/' });
              cookies.remove('cookieEmail', { path: '/' });
              cookies.remove('cookiePassword', { path: '/' });
          }
          reject(error)
        });
    });
  }

  static getBasicToken() {
    cookies.remove('basicToken', { path: '/' });
    return new Promise((resolve, reject) => {
      axios.get("/getToken").then(function(response) {
        if(response.data.status == true)
          {
            cookies.save('basicToken', response.data.data, { path: '/' });
            resolve(response.data);
          }
          else
            {
              reject(response.data);
            }
      })
    });
  }
}

export default LoginApi;
