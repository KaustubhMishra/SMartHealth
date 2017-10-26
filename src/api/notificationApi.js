import axios from 'axios';
import cookies from 'react-cookie';
import toastr from 'toastr';

class NotificationApi {
  
  static getNotificationListWeb() {
    var basicToken = "Bearer "+ cookies.load('access_token');
    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
      axios.get("/api/site/getnotificationsListWeb", config).then(function(response) {
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

  static getNotificationListWebCRO() {
    var basicToken = "Bearer "+ cookies.load('access_token');
    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
      axios.get("/api/site/getAllNotificationListForWebCRO", config).then(function(response) {
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

  static getTrialNotificationList(trialId) {
    var basicToken = "Bearer "+ cookies.load('access_token');
    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
      axios.get(`/api/site/getTrialNotificationLists/${trialId}`, config).then(function(response) {
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
  

  static setNotificationsAPI(trialId) {
      var basicToken = "Bearer "+ cookies.load('access_token');
      var config = {
        headers: {
              'Content-Type': 'application/json',
              'Authorization': basicToken
            }
      };

      return new Promise((resolve, reject) => {
        axios.get(`/setnotifications/${trialId}`, config).then(function(response) {
          resolve(response);
        })
      });
  }

  static sendNotificationsAPI(patientObject) {
      var basicToken = "Bearer "+ cookies.load('access_token');
      var config = {
        headers: {
              'Content-Type': 'application/json',
              'Authorization': basicToken
            }
      };

      return new Promise((resolve, reject) => {
        axios.post('/api/site/sendPushNotification', patientObject, config).then(function(response) {
          if(response.data.status == false) {
            toastr.error(response.data.message);
          } else {
            toastr.success(response.data.message);
            $('#myModal').modal('hide');
            resolve(response);
          }
        })
      });
  }
  

  
}

export default NotificationApi;
