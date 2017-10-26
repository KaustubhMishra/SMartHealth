import React, {PropTypes} from 'react';
import PatientListRow from './patientListRow';
import { Conditional } from 'react-conditional-render';

const PatientList = ({patient, DeletePatient, isHideDelete, getPatientDetailGraph, isShowPatientLink}) => {
  return (
    <table id="example" className="display table table-bordered" cellspacing="0" width="100%">
      <thead>
      <tr>
        <th>Patient Id</th>
        <th>Age</th>
        <th>Gender</th>
        <th>Location</th>
      </tr>
      </thead>
      <tbody>
      {patient.map(patient =>
        <PatientListRow key={patient.id} patient={patient} DeletePatient={DeletePatient} isHideDelete={isHideDelete} getPatientDetailGraph={getPatientDetailGraph} isShowPatientLink ={isShowPatientLink} />
      )}
      {patient.length == 0 &&
          <tr><td className="valign-center" colSpan="6">Data not found</td> </tr>} 
      </tbody>
    </table>
  );
};

PatientList.propTypes = {
  patient: PropTypes.array.isRequired
};

export default PatientList;
