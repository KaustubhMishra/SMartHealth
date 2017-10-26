import * as types from '../actions/actionTypes';

export default function UserRoleReducer(state = [], action) {
  switch (action.type) {
    case types.LOAD_USER_ROLE:
      return action.role;

    default:
      return state;
  }
}
