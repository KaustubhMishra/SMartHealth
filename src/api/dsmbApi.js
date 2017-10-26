import delay from './delay';
import axios from 'axios';
import _ from 'lodash';
import * as types from '../actions/actionTypes';
import cookies from 'react-cookie';

let dsmbs = [];
let activeDSMB= [];

class dsmbApi {
  static getAllDsmbs() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/api/site/getdsmbs', config).then(response => {
          dsmbs = Object.assign([], response.data.data);
          resolve(dsmbs);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getAllActiveDsmbs() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/api/site/getActiveDSMB', config).then(response => {
          activeDSMB = Object.assign([], response.data.data);
          resolve(activeDSMB);
        }).catch(error => {
          throw(error);
        });
    });

  }

}

export default dsmbApi;
