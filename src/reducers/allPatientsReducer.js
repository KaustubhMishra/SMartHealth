import * as types from '../actions/actionTypes';
import initialState from './initialState';

export default function allPatientsReducer(state =initialState.allpatients, action) {
  
  switch (action.type) {
    case types.LOAD_ALL_PATIENT_LIST:
      return action.allpatients;
      
    default:
      return state;
  }
}
