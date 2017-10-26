import CroCoordinatorApi from '../api/croCoordinatorApi';
import * as types from './actionTypes';
import {beginAjaxCall} from './ajaxStatusActions';

export function loadCROCoordinatorSuccess(croCoordinator) {
  return {type: types.LOAD_CRO_COORDINATOR_SUCCESS, croCoordinator};
}

export function loadCroCoordinator() {
  return dispatch => {
    dispatch(beginAjaxCall());
    return CroCoordinatorApi.getAllCroCoordinator().then(croCoordinator => {
      dispatch(loadCROCoordinatorSuccess(croCoordinator));
      //return croCoordinator;
      
    }).catch(error => {
      throw(error);
    });
  };
}
