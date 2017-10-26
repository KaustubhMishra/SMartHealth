import * as types from '../actions/actionTypes';
import initialState from './initialState';


export default function croCoordinator(state = initialState.croCoordinator, action) {	
  switch (action.type) {
    case types.LOAD_CRO_COORDINATOR_SUCCESS:
      return action.croCoordinator;

    default:
      return state;
  }
}
