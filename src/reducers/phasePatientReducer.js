import * as types from '../actions/actionTypes';
import initialState from './initialState';

export default function phasePatientReducer(state =initialState.phasePatients, action) {
  
  switch (action.type) {
    case types.LOAD_PHASE_PATIENT_LIST:
      return action.phasePatients;

    default:
      return state;
  }
}
