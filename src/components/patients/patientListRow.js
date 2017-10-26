import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import * as sponsorActions from '../../actions/sponsorActions';
import { Conditional } from 'react-conditional-render';

const PatientListRow = ({patient, DeletePatient, isHideDelete, getPatientDetailGraph, isShowPatientLink}) => {
  return (
    <tr className="grey">
      <Conditional condition={isShowPatientLink}>
        <td onClick={() => 
          getPatientDetailGraph(
              patient.patients[0].id ? patient.patients[0].id : '',
              patient.patients[0].vital_dosage_statuses ? patient.patients[0].vital_dosage_statuses[0].trial_id : '',
              patient.patients[0].vital_dosage_statuses ? patient.patients[0].vital_dosage_statuses[0].phase_id : ''
              )
          }><a >{patient.firstname} {patient.lastname}</a>
        </td>
      </Conditional>
      <Conditional condition={!isHideDelete}>
        <td>{patient.firstname} {patient.lastname}</td>
      </Conditional>
      <td>{patient.patients[0].age}</td>
      <td>{patient.patients[0].gender}</td>
      <td></td>
    </tr>
  );

};

PatientListRow.propTypes = {
  patient: PropTypes.object.isRequired
};

export default PatientListRow;
