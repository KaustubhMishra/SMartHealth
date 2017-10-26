import dsmbApi from '../api/dsmbApi';
import * as types from './actionTypes';
import {beginAjaxCall} from './ajaxStatusActions';

export function loadDsmbSuccess(dsmbs) {
  return {type: types.LOAD_DSMBS_SUCCESS, dsmbs};
}

export function loadActiveDsmbSuccess(data) {
  return {type: types.LOAD_ACTIVE_DSMBS_SUCCESS, data};
}



export function loadDsmbs() {
  return dispatch => {
    dispatch(beginAjaxCall());
    return dsmbApi.getAllDsmbs().then(dsmbs => {
      dispatch(loadDsmbSuccess(dsmbs));
      //return dsmbs;
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadActiveDsmbs() {
  return dispatch => {
    dispatch(beginAjaxCall());
    return dsmbApi.getAllActiveDsmbs().then(data => {
      dispatch(loadActiveDsmbSuccess(data));
    }).catch(error => {
      throw(error);
    });
  };
}