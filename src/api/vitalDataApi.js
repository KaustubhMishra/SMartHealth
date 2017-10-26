import delay from './delay';
import axios from 'axios';
import _ from 'lodash';
import * as types from '../actions/actionTypes';
import cookies from 'react-cookie';

let vitalDataList = [];

class vitalDataApi {
  static getvitalData(vitalReq) {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.post('/api/site/getdosagecalenderdataweb',vitalReq,config).then(response => {
          vitalDataList = Object.assign([], response.data.data);
          resolve(vitalDataList);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }
}

export default vitalDataApi;
