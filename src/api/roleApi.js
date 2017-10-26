import axios from 'axios';
import cookies from 'react-cookie';

class RoleApi {
  
  static getUserRole() {
    return new Promise((resolve, reject) => {
      axios.get("/getUserRoles").then(function(response) {
        if(response.data.status == true)
          {
            resolve(response.data.data);
          }
          else
            {
              reject(response.data);
            }
      })
    });
  }

  static getUserRoleName() {

    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
      axios.get("/getUserRolesName", config).then(function(response) {
        if(response.data.status == true)
          {    
            resolve(response.data.data);
          }
          else
            {
              reject(response.data);
            }
      })
    });
  }
  

}

export default RoleApi;
