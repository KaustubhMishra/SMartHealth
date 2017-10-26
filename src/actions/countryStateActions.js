import * as types from './actionTypes';
import CountryListApi from '../api/countryListApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function loadCountryData(countryList) {
  return {type:types.LOAD_COUNTRY_LIST, countryList};
}

export function loadCountryList() {
  return function (dispatch) {
    return CountryListApi.getCountryList().then(data => {
      dispatch(loadCountryData(data));
    }).catch(error => {
      throw(error);
    });
  };
}