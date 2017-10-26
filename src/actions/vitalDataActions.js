import * as types from './actionTypes';
import VitalDataApi from '../api/vitalDataApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function loadvitalDataSuccess(vitalDataList) {
  return {type:types.LOAD_VITAL_DATA_SUCCESS, vitalDataList};
}

export function loadvitalData(vitalReq) {
  return function (dispatch) {
    return VitalDataApi.getvitalData(vitalReq).then(vitalDataList => {	
      dispatch(loadvitalDataSuccess(vitalDataList));
    }).catch(error => {
      throw(error);
    });
  };
}