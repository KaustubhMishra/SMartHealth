import deviceApi from '../api/deviceApi';
import * as types from './actionTypes';
import {beginAjaxCall} from './ajaxStatusActions';

export function loadDeviceListSuccess(deviceList) {
  return {type: types.LOAD_DEVICE_SUCCESS, deviceList};
}

export function loadAllDeviceListDataSuccess(deviceData) {
  return {type: types.LOAD_ALL_DEVICE_LIST_DATASUCCESS, deviceData};
}

export function createDevice(device) {
  return {type:types.CREATE_DEVICE, device};
}

export function deleteDeviceSuccess(device) {
  return {type: types.DELETE_DEVICE_SUCCESS, device};
}

export function updateDeviceSuccess(device) {
  return {type: types.UPDATE_DEVICE_SUCCESS, device};
}

export function loadDeviceList() {
  return dispatch => {
    dispatch(beginAjaxCall());
    return deviceApi.getAllDeviceList().then(deviceList => {
     return deviceList;
    }).catch(error => {
      throw(error);
    });
  };
}

export function addDevice(deviceData, imageData, documentData) {
  return dispatch => {
    dispatch(beginAjaxCall());
    return deviceApi.saveDeviceDataInfo(deviceData, imageData, documentData).then(deviceList => {
      deviceData.id ? dispatch(updateDeviceSuccess(deviceList)) : dispatch(createDevice(deviceList));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadDeviceById(id) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return deviceApi.getDeviceById(id).then(user => {
      return user;
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadDeviceData(search) {
  return dispatch => {
    dispatch(beginAjaxCall());
    return deviceApi.getAllDeviceData(search).then(response => {
      dispatch(loadAllDeviceListDataSuccess(response));
    }).catch(error => {
      throw(error);
    });
  };
}

export function deleteDevice(device) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return deviceApi.deleteDeviceData(device).then(() => {
      dispatch(deleteDeviceSuccess(device));
      return;
    }).catch(error => {
    });
  }
}

export function loadDeviceVital(id) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return deviceApi.getDeviceVital(id).then((response) => {
      return response;
    }).catch(error => {
    });
  }
}

