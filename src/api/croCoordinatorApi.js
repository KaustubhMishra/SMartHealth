import axios from 'axios';
import cookies from 'react-cookie';

let croCoordinator = [];

class CroCoordinatorApi {
  static getAllCroCoordinator() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {

        axios.get('/api/site/getCroCoordinator', config).then(response => {
          croCoordinator = Object.assign([], response.data.data);
          resolve(croCoordinator);
        }).catch(error => {
          throw(error);
        });
    });
  }
}

export default CroCoordinatorApi;
