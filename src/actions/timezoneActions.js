import * as types from './actionTypes';
import TimezoneApi from '../api/timezoneApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function loadTimezone(timezoneList) {
  return {type:types.LOAD_TIMEZONE_LIST, timezoneList};
}

export function loadTimezoneList() {
  return function (dispatch) {
    return TimezoneApi.getTimezone().then(timezoneList => {
      dispatch(loadTimezone(timezoneList));
    }).catch(error => {
      throw(error);
    });
  };
}