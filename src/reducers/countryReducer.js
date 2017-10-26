import * as types from '../actions/actionTypes';

export default function CountryList(state = [], action) {
  switch (action.type) {
    case types.LOAD_COUNTRY_LIST:
       return action.countryList;

    default:
      return state;
  }
}
