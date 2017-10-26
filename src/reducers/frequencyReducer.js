import * as types from '../actions/actionTypes';
import initialState from './initialState';
import {browserHistory} from 'react-router';
// IMPORTANT: Note that with Redux, state should NEVER be changed.
// State is considered immutable. Instead,
// create a copy of the state passed and set new values on the copy.
// Note that I'm using Object.assign to create a copy of current state
// and update values on the copy.
export default function frequencies(state = initialState.frequencies, action) {	
  switch (action.type) {
    case types.LOAD_FREQUENCY_SUCCESS:
      return action.frequencies;

    default:
      return state;
  }
}
