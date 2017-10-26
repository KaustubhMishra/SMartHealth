import delay from './delay';
import axios from 'axios';
import _ from 'lodash';
import * as types from '../actions/actionTypes';
import cookies from 'react-cookie';

let drugtypes = [];

class drugTypeApi {
  static getAllDrugTypes() {
    return new Promise((resolve, reject) => {
        axios.get('/getdrugTypes').then(response => {
          drugtypes = Object.assign([], response.data);
          resolve(drugtypes);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }
}

export default drugTypeApi;
