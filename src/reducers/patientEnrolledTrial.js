import * as types from '../actions/actionTypes';
import initialState from './initialState';

export default function EnrolledPatientTrialReducer(state =initialState.enrolledTrialPatientData, action) {
  
  switch (action.type) {
    case types.LOAD_ALL_ENROLLED_PATIENT_LIST:
      return action.enrolledTrialPatientData;
        
    default:
      return state;
  }
}
