import * as types from '../actions/actionTypes';
import initialState from './initialState';
import {browserHistory} from 'react-router';
// IMPORTANT: Note that with Redux, state should NEVER be changed.
// State is considered immutable. Instead,
// create a copy of the state passed and set new values on the copy.
// Note that I'm using Object.assign to create a copy of current state
// and update values on the copy.
export default function trials(state = initialState.trials, action) {
  switch (action.type) {
    case types.LOAD_TRIALS_SUCCESS:
      return action.trials;

    case types.CREATE_TRIAL_SUCCESS:
      return [
        ...state,
        Object.assign({}, action.trial)
      ];

    case types.UPDATE_TRIAL_SUCCESS:{
      const newState = Object.assign([], state);
      return [
        ...state.filter(trial => trial.id !== action.trial.id),
        Object.assign({}, action.trial)
      ];
    }

    case types.DELETE_TRIAL_SUCCESS:{
      const newState = Object.assign([], state);
      const indexOfFactoryToDelete = state.findIndex(trial => {
        return trial.id === action.trials.id;
      });
      newState.splice(indexOfFactoryToDelete, 1);
      return newState;
    }

    case types.COMPELETE_TRIAL_SUCCESS:{
      const newState = Object.assign([], state);
      return [
        ...state.filter(trial => trial.id !== action.trials.id),
        Object.assign({}, action.trial)
      ];
    }

    case types.GET_TRIAL_BY_ID_SUCCESS:{
      return action.trial;
    }

    default:
      return state;
  }
}
