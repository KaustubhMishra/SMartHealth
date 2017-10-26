import * as types from './actionTypes';
import ProfileApi from '../api/profileApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function creategetLogUser(user) {
  return {type:types.CREATE_GET_LOGUSER , user};
}

export function getUserInfo() {
	return function (dispatch) {
      ProfileApi.getLogUser().then(function(response){
        dispatch(creategetLogUser(response.data.data));
    	}).catch(function(error) {
      });
  }
}
