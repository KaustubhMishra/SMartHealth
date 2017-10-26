import TrialApi from '../api/trialApi';
import * as types from './actionTypes';
import {beginAjaxCall, ajaxCallError} from './ajaxStatusActions';
import {createStore} from 'redux';
import trials from '../reducers/trialReducer';
import trial from '../reducers/singletrialReducer';
import trialsSelectList from '../reducers/trialsSelectListReducer';


const store =  createStore(trials);

export function loadTrialsSuccess(trials) {
  return {type: types.LOAD_TRIALS_SUCCESS, trials};
}

export function loadTrialsStatusSuccess(trialsStatus) {
  return {type: types.LOAD_TRIALS_STATUS_SUCCESS, trialsStatus};
}

export function loadtrialsSelectListSuccess(trialsSelectList) {
  return {type: types.LOAD_TRIALS_SELECT_LIST_SUCCESS, trialsSelectList};
}

export function createTrialSuccess(trial) {
  return {type: types.CREATE_TRIAL_SUCCESS, trial};
}

export function updateTrialSuccess(trial) {
  return {type: types.UPDATE_TRIAL_SUCCESS, trial};
}

export function deleteTrialSuccess(trials) {
  return store.dispatch({type: types.DELETE_TRIAL_SUCCESS, trials});
}

export function compeleteTrialSuccess(trials) {
  return store.dispatch({type: types.COMPELETE_TRIAL_SUCCESS, trials});
}

export function getTrialByIdSuccess(trial) {
  return {type: types.GET_TRIAL_BY_ID_SUCCESS, trial};
}

export function loadPieChartTrialsStatusSuccess(data){
  return {type: types.GET_PIE_CHART_STATUS_SUCCESS, data};
}

export function loadTrialsMetricsSuccess(data){
  return {type: types.GET_METRICS_STATUS_SUCCESS, data};
}

export function loadTrialMilestoneStatus(trialMilestoneStatus){
  return {type: types.LOAD_TRIAL_MILESTONE_STATUS_SUCCESS, trialMilestoneStatus};
}



export function loadTrials(trial) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllTrials(trial).then(trials => {
      dispatch(loadTrialsSuccess(trials));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialByUserId(userID) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getTrialsByUsersId(userID).then(trials => {
      dispatch(loadTrialsSuccess(trials));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialByCROId(userID) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getTrialsByCROCoordinatorId(userID).then(trials => {
      dispatch(loadTrialsSuccess(trials));
    }).catch(error => {
      throw(error);
    });
  };
}


export function loadtrialsSelectList(trial) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.gettrialsSelectList(trial).then(trialsSelectList => {
      dispatch(loadtrialsSelectListSuccess(trialsSelectList));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadtrialsSelectListDSMB(trial) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.gettrialsSelectListDSMB(trial).then(trialsSelectList => {
      dispatch(loadtrialsSelectListSuccess(trialsSelectList));
      //dispatch(loadTrialsSuccess(trialsSelectList));
      
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadtrialsSelectListCRO(trial) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.gettrialsSelectListCRO(trial).then(trialsSelectList => {
      dispatch(loadtrialsSelectListSuccess(trialsSelectList));
    }).catch(error => {
      throw(error);
    });
  };
}



export function saveTrial(trial) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return TrialApi.saveTrial(trial).then(response => {
      trial.trial.id ? dispatch(updateTrialSuccess(response)) : dispatch(createTrialSuccess(response));
    }).catch(error => {
      dispatch(ajaxCallError(error));
      throw(error);
    });
  };
}

export function deleteTrial(trial) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return TrialApi.deleteTrialApi(trial).then((trials) => {
      dispatch(deleteTrialSuccess(trial));
      return;
    }).catch(error => {
      dispatch(ajaxCallError(error));
      throw(error);
    });
  }
}

export function compeleteTrial(trial) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return TrialApi.compeleteTrialApi(trial).then((response) => {
      dispatch(compeleteTrialSuccess(response));
      return;
    }).catch(error => {
      dispatch(ajaxCallError(error));
      throw(error);
    });
  }
}

export function fetchDataById(trialId) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return TrialApi.fetchDataByIdApi(trialId).then(response => {
      //dispatch(getTrialByIdSuccess(response));
      return response;
    }).catch(error => {
      dispatch(ajaxCallError(error));
      throw(error);
    });
  }
}

export function loadTrialsStatus() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllTrialsStatus().then(trialsStatus => {
      dispatch(loadTrialsStatusSuccess(trialsStatus));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialsStatusDSMB() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllTrialsStatusDSMB().then(trialsStatus => {
      dispatch(loadTrialsStatusSuccess(trialsStatus));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialsStatusCoordinator() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllTrialsStatusCoordinator().then(trialsStatus => {
      dispatch(loadTrialsStatusSuccess(trialsStatus));
    }).catch(error => {
      throw(error);
    });
  };
}



export function loadTrialsPieChartStatus() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllTrialsPieChartStatus().then(trialsStatus => {
      dispatch(loadPieChartTrialsStatusSuccess(trialsStatus));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialsPieChartStatusDSMB() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllTrialsPieChartStatusDSMB().then(trialsStatus => {
      dispatch(loadPieChartTrialsStatusSuccess(trialsStatus));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialsPieChartStatusCoordinator() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllTrialsPieChartStatusCoordinator().then(trialsStatus => {
      dispatch(loadPieChartTrialsStatusSuccess(trialsStatus));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialsMetrics() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllTrialsMetrics().then(trialsStatus => {
      dispatch(loadTrialsMetricsSuccess(trialsStatus));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialsMetricsDSMB() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllTrialsMetricsDSMB().then(trialsStatus => {
      dispatch(loadTrialsMetricsSuccess(trialsStatus));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialsMetricsCRO() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllTrialsMetricsCRO().then(trialsStatus => {
      dispatch(loadTrialsMetricsSuccess(trialsStatus));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialsDetailMetrics(trialId) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getTrialsDetailMetrics(trialId).then(trialsStatus => {
      dispatch(loadTrialsMetricsSuccess(trialsStatus));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialsMilestoneStatus(trialId) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getTrialsMilestoneStatus(trialId).then(trialMilestoneStatus => {
      dispatch(loadTrialMilestoneStatus(trialMilestoneStatus));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadActiveTrials(trial) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return TrialApi.getAllActiveTrials(trial).then(trials => {
      dispatch(loadTrialsSuccess(trials));
    }).catch(error => {
      throw(error);
    });
  };
}









