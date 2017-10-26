import * as types from './actionTypes';
import RolePermissionApi from '../api/RolePermissionApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function creategetPermission(user) {
  return {type:types.CREATE_GET_PERMISSION , user};
}

export function getPermission() {
	return function (dispatch) {
      RolePermissionApi.getLogUserPermission().then(function(response){
        dispatch(creategetPermission(response));
    	}).catch(function(error) {
      	});
  	}
}
