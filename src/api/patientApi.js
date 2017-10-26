import axios from 'axios';
import cookies from 'react-cookie';

let patient = [];
let allpatients = [];
let phasePatients = [];
let enrolledPatientCRO = [];
let enrolledPatienTrialCRO = [];
let enrolledPatient1 = [];
let enrolledPatientDSMB = [];
let enrolledPatienTrialDSMB = [];

class PatientApi {
  
  static getPhasePatient(trialId) {
    return new Promise((resolve, reject) => {
      axios.get(`/api/site/getPhasePatientList/${trialId}`).then(function(response) {
        if(response.data.status == true)
          {
            //phasePatients = Object.assign([], response.data.data);
            resolve(response.data.data);
          }
          else
            {
              reject(response.data);
            }
      })
    });
  }

  static getPatient(search) {
    return new Promise((resolve, reject) => {
      axios.post("/api/site/getPatientList", search).then(function(response) {
        if(response.data.status == true)
          {
            patient = Object.assign([], response.data.data);
            resolve(patient);
          }
          else
            {
              reject(response.data);
            }
      })
    });
  }

  static getAllPatients(search) {
    return new Promise((resolve, reject) => {
      axios.get("/getAllPatientList", search).then(function(response) {
        if(response.data.status == true)
          {
            allpatients = Object.assign([], response.data.data);
            resolve(allpatients);
          }
          else
            {
              reject(response.data);
            }
      })
    });
  }

  static deletePatients(patient) {
    return new Promise((resolve, reject) => {
      axios.delete(`/deletePatient/${patient.id}`).then(response => {
        resolve(Object.assign({}, patient));
      })
      .catch(error => {
        throw(error);
      });
    });
  }

  static getTrialsPatient(trialId) {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
        axios.get(`/api/site/getTrialPatient/${trialId}`, config).then(response => {
          patient = Object.assign([], response.data.data);
          resolve(patient);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getFalloutPatients(trialId) {

    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
            'Content-Type': 'application/json',
            'Authorization': basicToken
          }
    };

    return new Promise((resolve, reject) => {
      axios.get(`/api/site/getFalloutPatientsList/${trialId}`,config).then(function(response) {
        if(response.data.status == true)
          {
            //phasePatients = Object.assign([], response.data.data);
            resolve(response.data);
          }
          else
            {
              reject(response.data);
            }
      })
    });
  };


  static getEnrolledPatientTrialCRO(search) {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
        'Authorization': basicToken
      }
    };

    return new Promise((resolve, reject) => {
        axios.post('/api/site/getEnrolledPhasePatientsTrialCRO', search, config).then(response => {
          enrolledPatientCRO = Object.assign([], response.data.data);
          resolve(enrolledPatientCRO);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getEnrolledTrialCRO() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
        'Authorization': basicToken
      }
    };

    return new Promise((resolve, reject) => {
        axios.get('/api/site/getEnrolledTrialsCRO', config).then(response => {
          enrolledPatienTrialCRO = Object.assign([], response.data.data);
          resolve(enrolledPatienTrialCRO);
        }).catch(error => {
          throw(error);
        });
    });
  }

  static getEnrolledPatientTrialDSMB(search) {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
        'Authorization': basicToken
      }
    };

    return new Promise((resolve, reject) => {
        axios.post('/api/site/getEnrolledPhasePatientsTrialDSMB', search, config).then(response => {
          enrolledPatientDSMB = Object.assign([], response.data.data);
          resolve(enrolledPatientDSMB);
        }).catch(error => {
          throw(error);
        });
    });
  }
  
  static getEnrolledTrialDSMB() {
    var basicToken = "Bearer "+ cookies.load('access_token');

    var config = {
      headers: {
        'Authorization': basicToken
      }
    };

    return new Promise((resolve, reject) => {
        axios.get('/api/site/getEnrolledTrialsDSMB', config).then(response => {
          enrolledPatienTrialDSMB = Object.assign([], response.data.data);
          resolve(enrolledPatienTrialDSMB);
        }).catch(error => {
          throw(error);
        });
    });
  }
}

export default PatientApi;
