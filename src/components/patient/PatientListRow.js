import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import SelectInput from '../common/SelectInput';

const PatientListRow = ({patient,phaseId,index,Phaseindex,onDeletePatient,getPatientDetail}) => {
  return (
    <tr>
      <td>{patient.patients[0].id}</td>
      <td>{patient.email}</td>
      <td>{patient.patients[0].age}</td>
      <td>{patient.patients[0].gender}</td>
      <td className="text-center">
        <span className="icon"> 
          <img src={require('../../assets/img/delete-red.svg')} onClick={() => onDeletePatient(patient,Phaseindex,index)}/>
        </span>
      </td>
    </tr>
  );

};

PatientListRow.propTypes = {
  patient: PropTypes.object.isRequired,
  onDeletePatient: PropTypes.func.isRequired,
  getPatientDetail: PropTypes.func.isRequired,
};

export default PatientListRow;

