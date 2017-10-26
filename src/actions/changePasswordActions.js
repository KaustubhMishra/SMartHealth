import * as types from './actionTypes';
import ChangePasswordApi from '../api/changePasswordApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function createchangePassword(userPassword) {
  return {type:types.CREATE_CHANGE_PASSWORD, userPassword};
}

export function changeUserPassword(data) {
  return function (dispatch) {
    return ChangePasswordApi.changePassword(data).then(response => {
      dispatch(createchangePassword(response));
    }).catch(error => {
      throw(error);
    });
  };
}