import axios from 'axios';
import cookies from 'react-cookie';
import toastr from 'toastr';

const request = require('superagent-bluebird-promise');

class ProfileApi {
  static getLogUser() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };
    return new Promise((resolve, reject) => {
        axios.get('/api/site/getProfileWeb', config).then(function(response){
          let userCompanyId = response.data.data.company_id;
          cookies.save('usercompanyid', userCompanyId, { path: '/' });
          resolve(response);
        }).catch(function (error) {
            reject(error)
        });
    });
  }

  static editUserProfile(data, imageData) {
    var basicToken = "Bearer "+ cookies.load('access_token');
    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
      let req = request.post('/api/site/editProfile')
      .attach('file', imageData, imageData.name)
      .field(data)
      .set({'Authorization': basicToken});
       req.then(response => {
          if(response.body.status == true) {
            resolve(response.body.data);
          } else {
            toastr.error(response.body.message);
          }
          
        }).catch(error => {
        });
    });
  }

  static getUserUpdatedProfile() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/api/site/getProfileWeb',config).then(function(response){
          resolve(response.data);
        }).catch(function (error) {
            reject(error)
        });
    });
  }

}

export default ProfileApi;
