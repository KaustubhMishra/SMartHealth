import drugTypeApi from '../api/drugTypeApi';
import * as types from './actionTypes';
import {beginAjaxCall} from './ajaxStatusActions';

export function loadDrugTypeSuccess(drugTypes) {
  return {type: types.LOAD_DRUG_TYPES_SUCCESS, drugTypes};
}

export function loadDrugTypes() {
  return dispatch => {
    dispatch(beginAjaxCall());
    return drugTypeApi.getAllDrugTypes().then(drugTypes => {
      dispatch(loadDrugTypeSuccess(drugTypes));
      //return drugTypes;
    }).catch(error => {
      throw(error);
    });
  };
}
