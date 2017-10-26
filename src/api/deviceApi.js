import delay from './delay';
import axios from 'axios';
import _ from 'lodash';
import * as types from '../actions/actionTypes';
import cookies from 'react-cookie';

const request = require('superagent-bluebird-promise');
var basicToken = "Bearer "+ cookies.load('access_token');

let deviceList = [];
let deviceListData =[];
let vitalData =[];

class deviceApi {
  static getAllDeviceList() {
    return new Promise((resolve, reject) => {
        axios.get('/getdevicelist').then(response => {
          deviceList = Object.assign([], response.data.data);
          resolve(deviceList);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static saveDeviceDataInfo(deviceData, imageData, documentData) {
    return new Promise((resolve, reject) => {
      if (deviceData.id) {
        let data = new FormData();
        data.append('deviceData', JSON.stringify(deviceData));

        data.append('file', imageData);

        let docindex = 1;
        documentData.forEach((file) => {
          data.append('document' + docindex, file);
          docindex++;
        });

        let config = {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': basicToken
          }
        };
        axios.put(`/api/site/updateDevice/${deviceData.id}`, data, config).then(response => {
          if (response.data.status == false) {
            resolve(response.data);
          } else {
            resolve(response.data);
          }
        }).catch(error => {
          throw (error);
        });
      } 
      else {
        let data = new FormData();
        data.append('deviceData', JSON.stringify(deviceData));

        data.append('file', imageData);

        let docindex = 1;
        documentData.forEach((file) => {
          data.append('document' + docindex, file);
          docindex++;
        });

        let config = {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': basicToken
          }
        };

        axios.post('/api/site/saveDeviceData', data, config).then(response => {
          if (response.data.status == false) {
            resolve(response.data);
          } else {
            resolve(response.data);
          }
        }).catch(error => {
          throw (error);
        });
      }
    });
  }

  static getAllDeviceData(search) {
    return new Promise((resolve, reject) => {
        axios.post('/api/site/getDeviceList', search).then(response => {
          deviceListData = Object.assign([], response.data.data);
          resolve(deviceListData);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getDeviceById(id) {
    var data = {
      id: id
    };
    return new Promise((resolve, reject) => {
      axios.post('/getdeviceById', data).then(response => {
        resolve(response.data);
      }).catch(error => {
        throw(error);
      });
    });
  }

  static deleteDeviceData(device) {
    return new Promise((resolve, reject) => {
      let config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': basicToken
        }
      };

      axios.delete(`/api/site/deleteDevice/${device.id}`, config).then(response => {
        resolve(Object.assign({}, device));
      })
      .catch(error => {
        throw(error);
      });
    });
  }

  static getDeviceVital(id) {
    var data = {
      id: id
    };
    return new Promise((resolve, reject) => {
      axios.post('/getdeviceVital', data).then(response => {
        vitalData = Object.assign([], response.data.data);
        resolve(vitalData);
      })
      .catch(error => {
        throw(error);
      });
    });
  }

  
}

export default deviceApi;
