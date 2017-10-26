import * as types from '../actions/actionTypes';

export default function DeviceGroupList(state = [], action) {
  switch (action.type) {
    case types.LOAD_DEVICE_GROUP_LIST:
      return action.data;

    default:
      return state;
  }
}
