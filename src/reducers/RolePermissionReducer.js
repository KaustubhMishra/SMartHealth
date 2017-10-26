import * as types from '../actions/actionTypes';

export default function userRolePermission(state = [], action) {
  switch (action.type) {
    case types.CREATE_GET_PERMISSION:
       return action.user;

    default:
      return state;
  }
}
