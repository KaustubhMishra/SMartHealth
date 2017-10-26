import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import SelectInput from '../common/SelectInput';
import PatientListRow from '../patient/PatientListRow';
import { DataTable } from 'react-data-components';
import 'react-data-components/css/table-twbs.css';

const PatientModal = ({Phaseindex,allPatients,onPatientChanged}) => {
  let renderMapUrl = (val, row) =>
    <div className="checkbox-field">
      <input 
        type="checkbox" 
        id={ "patient" + row['email'] + Phaseindex } 
        className="css-checkbox"
        onChange={ e=> onPatientChanged(e, row['email'],Phaseindex,row)} 
      />
      <label htmlFor={ "patient" + row['email'] + Phaseindex } className="css-label">&nbsp;</label>
    </div>
  let renderMapAgeField = (val,row) =>
    <label>{row.patients[0].age}</label>;
        
  let renderMapGenderField = (val,row) =>
    <label>{row.patients[0].gender}</label>;

  let renderMapIdField = (val,row) =>
    <label>{row.firstname} {row.lastname}</label>;

let tableColumns = [
    { title: '', render: renderMapUrl, className: 'text-center' },
    { title: 'Patient ID', render: renderMapIdField },
    { title: 'E-mail', prop: 'email' },
    { title: 'Age', render: renderMapAgeField},
    { title: 'Gender',render: renderMapGenderField},
  ];


  return (
    <div>
        <form id="patientForm" method="post">
          <div className="pagging-section">
            <DataTable
              className = "PatientDataTable"
              id="grdPatient" 
              className="display table table-bordered" width="100%"
              keys={[ 'email' ]}
              columns={tableColumns}
              initialPageLength={5}
              pageLengthOptions={[ 5, 20, 50 ]}
              initialData={allPatients}
            />
          </div>
       </form>           
   </div>   
  );
};

PatientModal.propTypes = {
};

export default PatientModal;