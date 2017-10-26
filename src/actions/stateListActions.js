import SponsorApi from '../api/sponsorApi';
import * as types from './actionTypes';

export function loadStateData(stateList) {
  return {type:types.LOAD_STATE_LIST, stateList};
}

export function loadStateList(id) {
  return function (dispatch) {
    return SponsorApi.getStateList(id).then(data => {
      dispatch(loadStateData(data));
    }).catch(error => {
      throw(error);
    });
  };
}