import ProfileApi from '../api/profileApi';
import * as types from './actionTypes';
import {beginAjaxCall} from './ajaxStatusActions';

export function updatedUserProfile(dsmbs) {
  return {type: types.UPDATE_USER_PROFILE_SUCCESS, dsmbs};
}


export function updateUserProfile(userData, imageData) {
  return dispatch => {
    dispatch(beginAjaxCall());
    return ProfileApi.editUserProfile(userData, imageData).then(data => {
      dispatch(updatedUserProfile(data));
    }).catch(error => {
      throw(error);
    });
  };
}

export function getUserUpdatedInfo() {
  return dispatch => {
    dispatch(beginAjaxCall());
    return ProfileApi.getUserUpdatedProfile().then(data => {
      return data;
    }).catch(error => {
      throw(error);
    });
  };
}

