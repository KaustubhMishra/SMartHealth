import delay from './delay';
import axios from 'axios';
import _ from 'lodash';
import * as types from '../actions/actionTypes';
import cookies from 'react-cookie';


let trials = [];
let trialsSelectList = [];
let trialsStatus = [];
let trialsPieStatus = [];
let trialsMetricsStatus =[];
let trialMilestoneStatus =[];
let patient = [];

class TrialApi {

  static getAllTrials(trial) {
    return new Promise((resolve, reject) => {
        axios.post('/gettrial',trial).then(response => {
          trials = Object.assign([], response.data.data);
          resolve(trials);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }

  static getTrialsByUsersId(userId) {

    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };
    
    return new Promise((resolve, reject) => {
      axios.post('/getTrialsByDSMBId',userId,config).then(response => {
        trials = Object.assign([], response.data.data);
        resolve(trials);
      }).catch(error => {
        throw(error);
      });
    });
  }

  static getTrialsByCROCoordinatorId(userId) {

    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };
    
    return new Promise((resolve, reject) => {
      axios.post('/getActiveTrialCRO',userId,config).then(response => {
        trials = Object.assign([], response.data.data);
        resolve(trials);
      }).catch(error => {
        throw(error);
      });
    });
  }


  static gettrialsSelectList(trial) {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.post('/gettrialsSelectList',trial, config).then(response => {
          trialsSelectList = Object.assign([], response.data.data);
          resolve(trialsSelectList);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }

  static gettrialsSelectListDSMB(trial) {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.post('/gettrialsSelectListDSMB',trial, config).then(response => {
          trialsSelectList = Object.assign([], response.data.data);
          resolve(trialsSelectList);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }

  static gettrialsSelectListCRO(trial) {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.post('/gettrialsSelectListCRO',trial, config).then(response => {
          trialsSelectList = Object.assign([], response.data.data);
          resolve(trialsSelectList);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }
  

  

  static saveTrial(trial) {
  
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };
        let userCompanyID = cookies.load('usercompanyid');
        trial.trial["company_id"] = userCompanyID;

    
    return new Promise((resolve, reject) => {
        if (trial.trial.id) {
          axios.put(`/updatetrial/${trial.trial.id}`,trial, config).then(response => {
            resolve(Object.assign({}, trial));
          }).catch(error => {
            throw(error);
          });
        } else {
          axios.post('/api/site/addTrialData',trial, config).then(response => {            
            let responseData =  response.data.data;
            resolve(responseData);
          }).catch(error => {
            throw(error);
          });
        }
    });
  }

  static deleteTrialApi(trial) {
    return new Promise((resolve, reject) => {
            axios.delete(`/deletetrial/${trial.id}`).then(response => {
              resolve(Object.assign({}, trial));
            }).catch(error => {
              throw(error);
            });
    });
  }

  static compeleteTrialApi(trial) {
    return new Promise((resolve, reject) => {
            axios.put(`/compeletetrial/${trial.id}`,trial).then(response => {
            resolve(Object.assign({}, response.data.data));
          }).catch(error => {
            throw(error);
          });
    });
  }

  static fetchDataByIdApi(trialId) {
    return new Promise((resolve, reject) => {
        axios.get(`/gettrialbyid/${trialId}`).then(response => {
          resolve(response.data.data);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }

  static getAllTrialsStatus() {
    return new Promise((resolve, reject) => {
        axios.get('/gettrialStatus').then(response => {
          trialsStatus = Object.assign([], response.data.data);
          resolve(trialsStatus);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }

  static getAllTrialsStatusDSMB() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/getTrialsStatusDSMB',config).then(response => {
          trialsStatus = Object.assign([], response.data.data);
          resolve(trialsStatus);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getAllTrialsStatusCoordinator() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/getTrialsStatusCoordinator',config).then(response => {
          trialsStatus = Object.assign([], response.data.data);
          resolve(trialsStatus);
        }).catch(error => {
          throw(error);
        });
    });
  }
  
  

  static getAllTrialsPieChartStatus() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/gettrialpiechartStatus', config).then(response => {
          trialsPieStatus = Object.assign([], response.data.data);
          resolve(trialsPieStatus);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getAllTrialsPieChartStatusDSMB() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/getTrialpieChartStatusDSMB', config).then(response => {
          trialsPieStatus = Object.assign([], response.data.data);
          resolve(trialsPieStatus);
        }).catch(error => {
          throw(error);
        });
    });
  }
  
  static getAllTrialsPieChartStatusCoordinator() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/getTrialpieChartStatusCoordinator', config).then(response => {
          trialsPieStatus = Object.assign([], response.data.data);
          resolve(trialsPieStatus);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getAllTrialsMetrics() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/getTrialMetrics', config).then(response => {
          trialsMetricsStatus = Object.assign([], response.data.data);
          resolve(trialsMetricsStatus);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getAllTrialsMetricsDSMB() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/getTrialDSMBMetrics', config).then(response => {
          trialsMetricsStatus = Object.assign([], response.data.data);
          resolve(trialsMetricsStatus);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getAllTrialsMetricsCRO() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get('/getTrialCROMetrics', config).then(response => {
          trialsMetricsStatus = Object.assign([], response.data.data);
          resolve(trialsMetricsStatus);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getTrialsDetailMetrics(trialId) {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get(`/api/site/getTrialDetailMetrics/${trialId}`, config).then(response => {
          trialsMetricsStatus = Object.assign([], response.data.data);
          cookies.save('patientPhaseId',  trialsMetricsStatus.phaseId, {path: '/' });
          resolve(trialsMetricsStatus);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getTrialsMilestoneStatus(trialId) {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get(`/api/site/getTrialMilestonestatus/${trialId}`, config).then(response => {
          trialMilestoneStatus = Object.assign([], response.data.data);
          resolve(trialMilestoneStatus);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getAllActiveTrials(trial) {
    return new Promise((resolve, reject) => {
        axios.post('/getActiveTrial',trial).then(response => {
          trials = Object.assign([], response.data.data);
          resolve(trials);
        }).catch(error => {
          throw(error);
        });

      //}, delay);
    });
  }
  
  
}







export default TrialApi;
