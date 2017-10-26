import * as types from '../actions/actionTypes';
import initialState from './initialState';

export default function PatientReducer(state =initialState.patients, action) {
  
  switch (action.type) {
    case types.LOAD_Patient_LIST:
      return action.patients;

    case types.DELETE_PATIENT_SUCCESS:{
      const newState = Object.assign([], state);
      const indexOfPatientLineToDelete = state.rows.findIndex(patient => {
          return patient.id === action.patient.id;
        });
        newState.rows.splice(indexOfPatientLineToDelete, 1);
        return newState;
    }

    default:
      return state;
  }
}
