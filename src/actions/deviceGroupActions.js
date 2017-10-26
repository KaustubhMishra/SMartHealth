import * as types from './actionTypes';
import DeviceGroupApi from '../api/deviceGroupApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function loadTimezone(data) {
  return {type:types.LOAD_DEVICE_GROUP_LIST, data};
}

export function loadDeviceGroupList() {
	return function (dispatch) {
	    return DeviceGroupApi.getDeviceGroup().then(response => {
	      dispatch(loadTimezone(response));
	    }).catch(error => {
	      throw(error);
	    });
  	};
}