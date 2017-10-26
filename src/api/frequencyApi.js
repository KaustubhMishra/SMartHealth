import delay from './delay';
import axios from 'axios';
import _ from 'lodash';
import * as types from '../actions/actionTypes';
import cookies from 'react-cookie';

let frequencies = [];

class frequencyApi {
  static getAllfrequencies() {
    return new Promise((resolve, reject) => {
        axios.get('/getfrequencies').then(response => {
          frequencies = Object.assign([], response.data);
          resolve(frequencies);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }
}

export default frequencyApi;
