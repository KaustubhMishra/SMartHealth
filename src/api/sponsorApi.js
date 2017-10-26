import delay from './delay';
import axios from 'axios';
import _ from 'lodash';
import * as types from '../actions/actionTypes';
import cookies from 'react-cookie';
import toastr from 'toastr';

const request = require('superagent-bluebird-promise');
var basicToken = "Basic "+ cookies.load('basicToken');

let sponsors = [];
let sponsorsSelectList = [];
let sponsorsSelectListDSMB = [];

class SponsorApi {
  static getAllSponsors(search) {
    return new Promise((resolve, reject) => {
        axios.post('/getsponsor', search).then(response => {
          sponsors = Object.assign([], response.data.data);
          resolve(sponsors);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getSponsorsById(id) {
    var data = {
      id: id
    };
    return new Promise((resolve, reject) => {
        axios.post('/getsponsorById', data).then(response => {
          resolve(response.data);
        }).catch(error => {
          throw(error);
        });
    });
  }
  
  static getAllSelectSponsors() {
    return new Promise((resolve, reject) => {
        axios.get('/getallsponsors').then(response => {
          sponsorsSelectList = Object.assign([], response.data.data);
          resolve(sponsorsSelectList);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static saveSponsor(sponsor, imageData) {
    return new Promise((resolve, reject) => {
      let userCompanyID = cookies.load('usercompanyid');
      sponsor.company_id = userCompanyID;
      if (sponsor.id) {
        let data = new FormData();
        data.append('file', imageData);
        data.append('sponsor', JSON.stringify(sponsor));
        request.put(`/updatesponsor/${sponsor.id}`)
        .send(data)
        .set({'Authorization': basicToken})
        .then(response => {
          resolve(Object.assign({}, response));
        }).catch(error => {
          throw(error);
        });
      } 
      else {
        let req = request.post('/addsponsor')
        .attach('file', imageData, imageData.name)
        .field(sponsor)
        .set({'Authorization': basicToken});
        req.then(response => {
          if(response.body.status != false)
            {
              resolve(response.body.data);
            }
            else {
              toastr.error(response.body.message);
            }
        }).catch(error => {
          
        });
      }
    });
  }

  static deleteSponsor(sponsor) {
    return new Promise((resolve, reject) => {
          axios.delete(`/deletesponsor/${sponsor.id}`).then(response => {
            if(response.data.status != false)
            {
              resolve(Object.assign({}, sponsor));
            }
            else {
              toastr.error(response.data.message);
            }
              
            }).catch(error => {
              throw(error);
          });
    });
  }

  static getStateList(id) {
    var data = {
      id: id
    };
    return new Promise((resolve, reject) => {
      axios.post("/getStateList", data).then(function(response) {
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

  static getDSMBSponsors() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/getSponsorsDSMB', config).then(response => {
          sponsorsSelectList = Object.assign([], response.data.data);
          resolve(sponsorsSelectList);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }

  static getCROSponsors() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/getSponsorsCRO', config).then(response => {
          sponsorsSelectList = Object.assign([], response.data.data);
          resolve(sponsorsSelectList);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }

  
  
}

export default SponsorApi;
