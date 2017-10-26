import * as types from '../actions/actionTypes';
import initialState from './initialState';
import {browserHistory} from 'react-router';

export default function sideEffects(state = initialState.sideEffects, action) {
  switch (action.type) {
    case types.LOAD_SIDE_EFFECTS_SUCCESS:
      return action.sideEffects;

    case types.CREATE_SIDE_EFFECT_SUCCESS:
      return [
        ...state,
        Object.assign({}, action.sideEffect)
      ];
    case types.DELETE_SIDE_EFFECT_SUCCESS:{
      const newState = Object.assign([], state);
      const indexOfProductionLineToDelete = state.rows.findIndex(sideEffect => {
          return sideEffect.id === action.sideEffect.id;
        });
        newState.rows.splice(indexOfProductionLineToDelete, 1);
        return newState;
    }

    case types.LOAD_STATE_LIST:
      return action.stateList;

    default:
      return state;
  }
}
