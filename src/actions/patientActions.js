import * as types from './actionTypes';
import PatientApi from '../api/patientApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import {beginAjaxCall, ajaxCallError} from './ajaxStatusActions';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function loadPatientList(patients) {
  return {type:types.LOAD_Patient_LIST, patients};
}
export function loadphasePatientList(phasePatients) {
  return {type:types.LOAD_PHASE_PATIENT_LIST, phasePatients};
}
export function deletePatientSuccess(patient) {
  return {type: types.DELETE_PATIENT_SUCCESS, patient};
}

export function loadAllPatientListSuccess(allpatients) {
  return {type: types.LOAD_ALL_PATIENT_LIST, allpatients};
}

export function LOADFALLOUTPATIENTLISTSUCCES(falloutPatients) {
  return {type: types.LOAD_FALLOUT_PATIENT_LIST, falloutPatients};
}

export function loadEnrolledPatientList(enrolledTrialPatientData) {
  return {type: types.LOAD_ALL_ENROLLED_PATIENT_LIST, enrolledTrialPatientData};
}

export function loadEnrolledPatientTrials(enrolledTrialPatient) {
  return {type: types.LOAD_ALL_ENROLLED_PATIENT_TRIAL, enrolledTrialPatient};
}

export function loadPahsePatients(trialId) {
  return function (dispatch) {
    return PatientApi.getPhasePatient(trialId).then(phasePatients => {
      //dispatch(loadphasePatientList(phasePatients));
      return phasePatients;
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadPatients(search) {
  return function (dispatch) {
    return PatientApi.getPatient(search).then(patients => {
      dispatch(loadPatientList(patients));
      //return patients;
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadAllPatients() {
  return function (dispatch) {
    return PatientApi.getAllPatients().then(allpatients => {
      //dispatch(loadAllPatientListSuccess(allpatients));
      return allpatients;
    }).catch(error => {
      throw(error);
    });
  };
}

export function deletePatientData(patient) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return PatientApi.deletePatients(patient).then(() => {
      dispatch(deletePatientSuccess(patient));
      return;
    }).catch(error => {
      //ispatch(ajaxCallError(error));
      //throw(error);
    });
  }
}

export function loadTrialsPatient(trialId) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return PatientApi.getTrialsPatient(trialId).then(trialPatientData => {
      dispatch(loadPatientList(trialPatientData));
    }).catch(error => {
      throw(error);
    });
  };
}


export function loadFalloutPatients(trialId) {
  return function (dispatch) {
    return PatientApi.getFalloutPatients(trialId).then(falloutPatients => {
      dispatch(LOADFALLOUTPATIENTLISTSUCCES(falloutPatients));
      //return falloutPatients;
      }).catch(error => {
      throw(error);
    });
  }
};

export function loadFalloutPatientById(trialId) {
  return function (dispatch) {
    return PatientApi.getFalloutPatients(trialId).then(falloutPatients => {
      //dispatch(LOADFALLOUTPATIENTLISTSUCCES(falloutPatients));
      return falloutPatients;
      }).catch(error => {
      throw(error);
    });
  }
};

export function loadEnrolledPatientTrialCRO(search) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return PatientApi.getEnrolledPatientTrialCRO(search).then(enrolledTrialPatientData => {
      dispatch(loadEnrolledPatientList(enrolledTrialPatientData));
    }).catch(error => {
      throw(error);
    });
  }
};


export function loadEnrolledTrialsCRO() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return PatientApi.getEnrolledTrialCRO().then(enrolledTrialPatientCRO => {
      dispatch(loadEnrolledPatientTrials(enrolledTrialPatientCRO));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadEnrolledPatientTrialDSMB(search) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return PatientApi.getEnrolledPatientTrialDSMB(search).then(enrolledTrialPatientDataDSMB => {
      dispatch(loadEnrolledPatientList(enrolledTrialPatientDataDSMB));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadEnrolledTrialsDSMB() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return PatientApi.getEnrolledTrialDSMB().then(enrolledTrialPatientDSMB => {
      dispatch(loadEnrolledPatientTrials(enrolledTrialPatientDSMB));
    }).catch(error => {
      throw(error);
    });
  };
}

