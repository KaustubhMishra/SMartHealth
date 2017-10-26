import * as types from '../actions/actionTypes';
import initialState from './initialState';

export default function EnrolledTrialReducer(state =initialState.enrolledTrial, action) {
  
  switch (action.type) { 
    case types.LOAD_ALL_ENROLLED_PATIENT_TRIAL:
      return action.enrolledTrialPatient;  
    default:
      return state;
  }
}
