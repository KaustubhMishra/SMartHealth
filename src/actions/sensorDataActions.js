import sensorDataApi from '../api/sensorDataApi';
import * as types from './actionTypes';
import {beginAjaxCall} from './ajaxStatusActions';

export function loadSensorDataSuccess(sensorData) {
  return {type: types.LOAD_SENSOR_DATA_SUCCESS, sensorData};
}

export function loadCassandraDataSuccess(cassandraData) {
  return {type: types.LOAD_CASSANDRA_DATA_SUCCESS, cassandraData};
}

export function loadsensorData(trial) {
  return dispatch => {
    dispatch(beginAjaxCall());
    return sensorDataApi.getsensorDataApi(trial).then(response => {
      dispatch(loadSensorDataSuccess(response));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadCassndraData(req) {
  return dispatch => {
    dispatch(beginAjaxCall());
    return sensorDataApi.getcassandraDataApi(req).then(response => {
      dispatch(loadCassandraDataSuccess(response));
    }).catch(error => {
      throw(error);
    });
  };
}
