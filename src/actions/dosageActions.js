import dosageApi from '../api/dosageApi';
import * as types from './actionTypes';
import {beginAjaxCall} from './ajaxStatusActions';

export function loadDosageSuccess(dosages) {
  return {type: types.LOAD_DOSAGE_SUCCESS, dosages};
}

export function loadDosages(id) {
  return dispatch => {
    dispatch(beginAjaxCall());
    return dosageApi.getAllDosages(id).then(dosages => {
      dispatch(loadDosageSuccess(dosages));
      //return dosages;
    }).catch(error => {
      throw(error);
    });
  };
}
