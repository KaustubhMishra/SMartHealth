import * as types from '../actions/actionTypes';
import initialState from './initialState';
import {browserHistory} from 'react-router';
// IMPORTANT: Note that with Redux, state should NEVER be changed.
// State is considered immutable. Instead,
// create a copy of the state passed and set new values on the copy.
// Note that I'm using Object.assign to create a copy of current state
// and update values on the copy.
export default function sponsors(state = initialState.sponsors, action) {
  switch (action.type) {
    case types.LOAD_SPONSORS_SUCCESS:
      return action.sponsors;

    case types.CREATE_SPONSOR_SUCCESS:
      return [
        ...state,
        Object.assign({}, action.sponsor)
      ];

    /*case types.UPDATE_SPONSOR_SUCCESS:{
      const newState = Object.assign([], state);
      return [
        ...state.filter(sponsor => sponsor.id !== action.sponsor.id),
        Object.assign({}, action.sponsor)
      ];
    }*/
    case types.DELETE_SPONSOR_SUCCESS:{
      const newState = Object.assign([], state);
      const indexOfProductionLineToDelete = state.rows.findIndex(sponsor => {
          return sponsor.id === action.sponsor.id;
        });
        newState.rows.splice(indexOfProductionLineToDelete, 1);
        return newState;
    }
    /*case types.DELETE_SPONSOR_SUCCESS:{
      return state.filter(sponsor =>
        sponsor.id !== action.sponsor.id
      );
    }*/

    case types.LOAD_STATE_LIST:
      return action.stateList;

    default:
      return state;
  }
}
