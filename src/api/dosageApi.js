import delay from './delay';
import axios from 'axios';
import _ from 'lodash';
import * as types from '../actions/actionTypes';
import cookies from 'react-cookie';

let dosages = [];

class dosageApi {
  static getAllDosages(id) {
    var id = {
      drugType: id
    };
    
    return new Promise((resolve, reject) => {
      axios.post('/getdosages', id).then(response => {
        dosages = Object.assign([], response.data.data);
        resolve(dosages);
      }).catch(error => {
        throw(error);
      });
    });
  }
}

export default dosageApi;
