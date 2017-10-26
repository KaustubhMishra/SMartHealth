import axios from 'axios';
import cookies from 'react-cookie';

class DeviceGroupApi {
  
  static getDeviceGroup() {
  	var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get("/api/site/getDeviceGroupList", config).then(function(response) {
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

export default DeviceGroupApi;