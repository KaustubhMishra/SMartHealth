import * as types from './actionTypes';
import loginApi from '../api/loginApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function createSignIn(signIn) {
  return {type:types.CREATE_SIGNIN , signIn};
}

export function signIN(signIn) {
	return function (dispatch) {
      loginApi.getBasicToken().then(function(response){
        if(response.status == true) {
          loginApi.userAuthenicate(
            {
              username: {email:signIn.email,tmpflag:1},
              password: signIn.password,
              rememberMe:signIn.rememberMe,
              grant_type: 'password'
            }
        ).then(function (response) {
            loginAuthStatus = true;
            browserHistory.push('/dashboard');
            dispatch(createSignIn(response));
          }).catch(function(error) {
              toastr.error(error.response.data.message);
            });
        }
        else {
        }
    });
  }
}
