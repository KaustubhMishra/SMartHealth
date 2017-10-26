import * as types from '../actions/actionTypes';

export default function TimezoneListReducer(state = [], action) {
  switch (action.type) {
    case types.LOAD_TIMEZONE_LIST:
      return action.timezoneList;

    default:
      return state;
  }
}
