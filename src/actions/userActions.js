import * as types from './actionTypes';
import UserApi from '../api/userApi';
import cookies from 'react-cookie';
import {createStore} from 'redux';
import {beginAjaxCall, ajaxCallError} from './ajaxStatusActions';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router';

export function createUsers(user) {
  return {type:types.CREATE_USERS, user};
}

export function loadUserList(users) {
  return {type:types.LOAD_USER_LIST, users};
}

export function deleteUserSuccess(user) {
  return {type: types.DELETE_USER_SUCCESS, user};
}

export function updateUserSuccess(user) {
  return {type: types.UPDATE_USER_SUCCESS, user};
}

export function disableUserSuccess(user) {
  return {type: types.DISABLE_USER_SUCCESS, user};
}

export function loadUsers(search) {
  return function (dispatch) {
    return UserApi.getUserList(search).then(users => {
      dispatch(loadUserList(users));
    }).catch(error => {
      throw(error);
    });
  };
}

export function addUsers(user) {
	return function (dispatch, getState) {
    return UserApi.saveUsersData(user).then(response => {
      user.id ? dispatch(updateUserSuccess(response)) : dispatch(createUsers(response));
    }).catch(error => {
      dispatch(ajaxCallError(error));
      throw(error);
    });
  };
}

export function loadUserById(id) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return UserApi.getUserById(id).then(user => {
      return user;
    }).catch(error => {
      throw(error);
    });
  };
}

export function deleteUserData(user) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return UserApi.deleteUser(user).then(() => {
      dispatch(deleteUserSuccess(user));
      return;
    }).catch(error => {
    });
  }
}

export function userToggle(user, id) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return UserApi.userEnableDisable(user, id).then((response) => {
      dispatch(disableUserSuccess(response));
      return;
    }).catch(error => {
      
    });
  }
}