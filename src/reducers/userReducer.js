import * as types from '../actions/actionTypes';
import initialState from './initialState';
import {browserHistory} from 'react-router';

export default function UserReducer(state = initialState.users, action) {
  switch (action.type) {
    case types.LOAD_USER_LIST:
      return action.users;
    case types.DISABLE_USER_SUCCESS:
    
      return action.user;

    case types.DELETE_USER_SUCCESS:{
      const newState = Object.assign([], state);
      const indexOfProductionLineToDelete = state.rows.findIndex(user => {
          return user.id === action.user.id;
        });
        newState.rows.splice(indexOfProductionLineToDelete, 1);
        return newState;
    }
    default:
      return state;
  }
}
