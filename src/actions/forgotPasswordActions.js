import * as types from './actionTypes';
import ForgotPasswordApi from '../api/forgotPasswordApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'

export function createForgotPassword(signIn) {
  return {type:types.CREATE_SIGNIN , signIn};
}

export function forgotPassword(user) {

	return function (dispatch) {
      return ForgotPasswordApi.getBasicToken().then(function(response){
		if(response.status == true) {
			ForgotPasswordApi.forgotApi(user).then(function(response){
				if(response.data.status == true)
				{
					toastr.success(response.data.message);
					browserHistory.push('/login');
				}
				else
				{
					toastr.error(response.data.message);
				}
			});	
		}        
    });
  }
}
