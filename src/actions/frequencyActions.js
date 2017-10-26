import frequencyApi from '../api/frequencyApi';
import * as types from './actionTypes';
import {beginAjaxCall} from './ajaxStatusActions';

export function loadfrequencySuccess(frequencies) {
  return {type: types.LOAD_FREQUENCY_SUCCESS, frequencies};
}

export function loadFrequencies() {
  return dispatch => {
    dispatch(beginAjaxCall());
    return frequencyApi.getAllfrequencies().then(frequencies => {
      dispatch(loadfrequencySuccess(frequencies));
      //return frequencies;
    }).catch(error => {
      throw(error);
    });
  };
}
