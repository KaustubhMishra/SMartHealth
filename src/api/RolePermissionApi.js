import axios from 'axios';
import cookies from 'react-cookie';

class RolePermissionApi {
  static getLogUserPermission() {
    var basicToken = "Bearer "+cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
      cookies.save('userData',[]);
        axios.get("/api/site/getUserPermission",config).then(function(response){
            const user = response.data.data[0];
            let userData = [];
            var arr = Object.keys(user).map(function (key) { 
              userData = user[key];
              cookies.save('userData', userData);
              resolve(userData);
            });
          }).catch(function (error) {
            reject(error)
        });
    });
  }
}

export default RolePermissionApi;
