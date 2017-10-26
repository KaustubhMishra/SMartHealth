import * as types from '../actions/actionTypes';
import initialState from './initialState';

export default function falloutPatientsReducer(state =initialState.falloutPatients, action) {
  
  switch (action.type) {
    case types.LOAD_FALLOUT_PATIENT_LIST:
      return action.falloutPatients;

    default:
      return state;
  }
}
