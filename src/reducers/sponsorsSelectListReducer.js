import * as types from '../actions/actionTypes';
import initialState from './initialState';
import {browserHistory} from 'react-router';
// IMPORTANT: Note that with Redux, state should NEVER be changed.
// State is considered immutable. Instead,
// create a copy of the state passed and set new values on the copy.
// Note that I'm using Object.assign to create a copy of current state
// and update values on the copy.
export default function sponsorsSelectList(state = initialState.sponsorsSelectList, action) {
  switch (action.type) {
    case types.LOAD_SPONSORS_SELECT_LIST_SUCCESS:
      return action.sponsorsSelectList;

    default:
      return state;
  }
}
