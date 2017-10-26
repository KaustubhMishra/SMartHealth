import * as types from '../actions/actionTypes';

export default function UserRoleNameReducer(state = [], action) {
  switch (action.type) { 
    case types.LOAD_USER_ROLE_NAME:
      return action.roleName;
    default:
      return state;
  }
}
