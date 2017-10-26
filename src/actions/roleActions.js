import * as types from './actionTypes';
import RoleApi from '../api/roleApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function loadUserList(role) {
  return {type:types.LOAD_USER_ROLE, role};
}

export function loadRoleList(roleName) {
  return {type:types.LOAD_USER_ROLE_NAME, roleName};
}

export function loadUsersRoles() {
  return function (dispatch) {
    return RoleApi.getUserRole().then(role => {
      dispatch(loadUserList(role));
    }).catch(error => {
      throw(error);
    });
  };
}



export function loadUsersRolesName() {
  return function (dispatch) {
    return RoleApi.getUserRoleName().then(role => {
      dispatch(loadRoleList(role));
    }).catch(error => {
      throw(error);
    });
  };
}