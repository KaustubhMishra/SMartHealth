import * as types from '../actions/actionTypes';
import initialState from './initialState';
import {browserHistory} from 'react-router';
// IMPORTANT: Note that with Redux, state should NEVER be changed.
// State is considered immutable. Instead,
// create a copy of the state passed and set new values on the copy.
// Note that I'm using Object.assign to create a copy of current state
// and update values on the copy.
export default function DeviceListData(state = initialState.deviceData, action) {	
  switch (action.type) {
    case types.LOAD_ALL_DEVICE_LIST_DATASUCCESS:
      return action.deviceData;

    /*case types.UPDATE_DEVICE_SUCCESS:{
      const newState = Object.assign([], state);
      return [
        ...state.filter(device => device.id !== action.device.id),
        Object.assign({}, action.device)
      ];
    }*/
      
    case types.DELETE_DEVICE_SUCCESS:{
      const newState = Object.assign([], state);
      const indexOfProductionLineToDelete = state.rows.findIndex(device => {
          return device.id === action.device.id;
        });
        newState.rows.splice(indexOfProductionLineToDelete, 1);
        return newState;
    }
    default:
      return state;
  }
}
