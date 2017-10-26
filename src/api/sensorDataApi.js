import delay from './delay';
import axios from 'axios';
import _ from 'lodash';
import * as types from '../actions/actionTypes';
import cookies from 'react-cookie';

let sensorData = [];
let cassandraData = [];


class sensorDataApi {
  static getsensorDataApi(trial) {
    return new Promise((resolve, reject) => {
        axios.post('/getsensorDatabyTrialId',trial).then(response => {
          sensorData = Object.assign([], response.data.data);
          resolve(sensorData);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getcassandraDataApi(req) {
    return new Promise((resolve, reject) => {
        axios.post('/getHistoricalDataCompanyWise',req).then(response => {
          cassandraData = Object.assign([], response.data.data.data);
          resolve(cassandraData);
        }).catch(error => {
          throw(error);
        });
    });
  }

}

export default sensorDataApi;
