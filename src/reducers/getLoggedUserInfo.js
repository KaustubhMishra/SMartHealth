import * as types from '../actions/actionTypes';

export default function userData(state = [], action) {
  switch (action.type) {
    case types.CREATE_GET_LOGUSER:
       return action.user;

    default:
      return state;
  }
}
