import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import SelectInput from '../common/SelectInput';
import PatientListRow from '../patient/PatientListRow';
import PatientModal from '../patient/PatientModal';



const PatientList = ({Phaseindex,allPatients,onPatientChanged,onAddPatients,onCancelPatients,phaseInfo,onDeletePatient,
                        getPatientDetail,handlePatientPageChange,patientCount,OpenModal}) => {
  return (
    <div>
      <div className="row form-group">
        <a  className="js-open-modal btn btn-border set-width mb-10 btn-sm" 
          onClick={() => OpenModal('AddPatient' + Phaseindex ,Phaseindex)}>
          <img src={require('../../assets/img/add-icon-white.png')} />Add Patients
        </a>  
      </div>
      <div className="modal fade" id={ "AddPatient" + Phaseindex } role="dialog" data-cache="false">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">&times;</button>
              <h4 className="modal-title">Add Patients</h4>
            </div>
            <div className="modal-body PatientListPopUp">
              <PatientModal 
                allPatients = {allPatients}
                Phaseindex = {Phaseindex}
                onPatientChanged = {onPatientChanged}
              />
            </div>
            <div className="modal-footer">
              <div className="row">
                <div className="col-md-12">
                  <button 
                    className="btn btn-border"  
                    data-dismiss="modal" 
                    id="Save" 
                    type="submit"
                    onClick={() => onAddPatients(Phaseindex)}>
                    <img src={require('../../assets/img/save-icon-white.png')} /> Save
                  </button>
                  <button 
                    className="btn btn-border" 
                    id="Cancel" 
                    data-dismiss="modal" 
                    type="submit"
                    onClick={() => onCancelPatients('AddPatient' + Phaseindex ,Phaseindex)}>
                    <img src={require('../../assets/img/close-icon-white.png')} /> Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
      <table id="grdPatient" className="display table table-bordered" width="100%" cellspacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>E-mail</th> 
            <th>Age</th> 
            <th>Gender</th>
            <th className="text-center">Delete</th>
          </tr>
        </thead>
        <tbody>
          {
            phaseInfo.patient.map((PatientData, index) =>
              <PatientListRow 
                key={index} 
                patient={PatientData} 
                Phaseindex={Phaseindex}
                index={index} 
                phaseId = {phaseInfo.id}
                onDeletePatient = {onDeletePatient}
                getPatientDetail = {getPatientDetail}
              />
            )
          }      
        </tbody>
      </table> 
    </div>   
  );
};

PatientList.propTypes = {
    onPatientChanged: PropTypes.func.isRequired,
    onAddPatients: PropTypes.func.isRequired,
    onCancelPatients: PropTypes.func.isRequired,
};

export default PatientList;