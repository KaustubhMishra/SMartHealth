import * as types from './actionTypes';
import resetPasswordApi from '../api/resetPasswordApi';
import cookies from 'react-cookie';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'
import toastr from 'toastr';


export function resetPassword(signIn) {

	return function (dispatch) {
      return resetPasswordApi.getBasicToken().then(function(response){
		if(response.status == true) {
			resetPasswordApi.resetApi(signIn).then(function(response){
			 if(response.data.status == 'success')
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
    }).catch(function(error) {
            //dispatch(createSignIn(error));
                });
  }
}
