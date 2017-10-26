import React, {PropTypes} from 'react';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import RadioInput from '../common/RadioInput';
import CheckBoxInput from '../common/CheckBoxInput';
import SelectInput from '../common/SelectInput';
import TextDate from '../common/TextDate';
import {browserHistory, Link} from 'react-router';
import {Tabs, Tab, LeftTabs} from 'pui-react-tabs';
import MilestoneList from '../milestone/MilestoneList';
import PatientList from '../patient/PatientList';

import DeviceList from '../device/DeviceList';
import moment from 'moment';
import _ from 'lodash';
import ProductTable from '../MedicationTime/ProductTable';
import { Conditional } from 'react-conditional-render';
import DateTimeField from 'react-bootstrap-datetimepicker';

const TrialForm = ({trial,phase,deviceList,singleMilestone,singleUpdateMilestone,
                    onTrialChange,onPhaseChange,onMilestoneChange,
                    addMileStone,onDeleteMilestone,onEditMilestone,updateMileStone,onMilestoneEditChange,clearMilestone,
                    onPatientChanged,onAddPatients,onCancelPatients,onDeletePatient,getPatientDetail,handlePatientPageChange,
                    onDeviceChanged,onAddDevices,onCancelDevices,device,onDeleteDevice,
                    trialerrors, index,
                    allSponsors,
                    allDsmbs,
                    allDrugTypes,
                    allDosages,
                    allFrequencies,
                    allCroCoordinator,
                    onTrialDrugTypeChange,
                    onTab_Click,
                    PreVitalChange,
                    MedicationTimeList,onRowAdd,onRowDel,onRowUpdate,
                    UsertimeZone,OpenModal
                  }) => {
  return (
    <div>      
      <div id="manage-trial-tab">
        <ul className="mt-tabs">
          <li><a href="#trial">Trial</a></li>
          <li><a href="#phase">Phase/Milestone</a></li>
          <li><a href="#medication">Medication</a></li>
          <li><a href="#device">Device</a></li>
        </ul>
        <div id="trial">
          <div className="row">
            <div className="col-md-6">
              <div className="select-field">
                <SelectInput
                  name="sponsor_id"
                  label="Sponsor Name"
                  value={trial.sponsor_id}
                  defaultOption="Select Sponsor"
                  options={allSponsors}
                  onChange={onTrialChange} 
                  error={trialerrors.sponsor_id}
                />
              </div>
              <TextInput
                name="name"
                label="Trial Name"
                placeholder="Trial Name"
                value={trial.name}
                error={trialerrors.name}
                onChange={onTrialChange}
              />
            </div>
            <div className="col-md-6 trial-Description">
              <TextArea
                name="description"
                label="Trial Description"
                placeholder="Trial Description"
                value={trial.description}
                error={trialerrors.description}
                onChange={onTrialChange}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label">Trial Type</label>
                <div className="radio-field">
                  <ul className="radio-field-list">
                    <li>
                      <RadioInput 
                        name="trial_type"
                        label= "Blinded" 
                        id="blinded" 
                        onChange={onTrialChange}
                        value="BLINDED"
                        error={trialerrors.trial_type}
                        checked = {trial.trial_type == "BLINDED" ? true : false}
                      />
                    </li>
                    <li>
                      <RadioInput 
                        name="trial_type"
                        label= "Double Blinded" 
                        id="doubleblinded" 
                        onChange={onTrialChange}
                        value="DOUBLE_BLINDED"
                        error={trialerrors.trial_type}
                        checked = {trial.trial_type == "DOUBLE_BLINDED" ? true : false}
                      />
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <SelectInput
                name="dsmb_id"
                label="DSMB Name"
                defaultOption="Select DSMB"
                value={trial.dsmb_id}
                options={allDsmbs}
                onChange={onTrialChange} 
                error={trialerrors.dsmb_id}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <SelectInput
                name="croCoordinator_id"
                label="CRO Coordinator"
                defaultOption="Select Cro Coordinator"
                value={trial.croCoordinator_id}
                options={allCroCoordinator}
                onChange={onTrialChange} 
                error={trialerrors.croCoordinator_id}
              />
            </div>
            <div className="col-md-6">
              <TextInput
                placeholder="Drug Name"
                label="Drug Name"
                name="drug_name"
                value={trial.drug_name}
                error={trialerrors.drug_name}
                onChange={onTrialChange}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 trial-Description">
              <TextArea
                name="drug_description"
                label="Drug Description"
                placeholder="Drug Description"
                value={trial.drug_description}
                error={trialerrors.drug_description}
                onChange={onTrialChange}
              />
            </div>
            <div className="col-md-6">
              <div className="row">
                <div className="date-field">
                  <label className="form-label">Start Date</label>
                  <div className="date-picker">
                    <div className="input-group no-label date trial-startDate">
                      <TextDate 
                        id="add-trial-start"
                        type="text" 
                        name="start_date"
                        value={ trial.start_date} 
                        onBlur={e => onTrialChange(e)}
                        error={trialerrors.start_date}
                      />
                    </div>
                  </div>
                </div>
                <div className="date-field">
                  <label className="form-label">End Date</label>
                  <div className="date-picker1">
                    <div className="input-group no-label date trial-endDate">
                      <TextDate 
                        type="text"
                        name="end_date"
                        value={ trial.end_date} 
                        onBlur={e => onTrialChange(e)}
                        error={trialerrors.end_date}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="phase">
          <div className="row">
            <div className="col-md-6 form-details">
              <label className="form-label">Trial</label>
              <span>{trial.name}</span>
            </div>
          </div>
          <div id="phase-tab">
            <ul className="phase-tabs">
              <li className="r-tabs-state-active" onClick={e => onTab_Click(0)}><a href="#phase-0">Phase I</a></li>
              <li><a href="#phase-1" onClick={e => onTab_Click(1)}>Phase II</a></li>
              <li><a href="#phase-2" onClick={e => onTab_Click(2)}>Phase III</a></li>
              <li><a href="#phase-3" onClick={e => onTab_Click(3)}>Phase IV</a></li>
            </ul>
            {
              phase.map((phaseInfo, index) =>
                <div id={ "phase-" + index } style={{display:""}}>
                  <div className="">
                    <div className="row">
                      <div className="col-md-6 trial-Description">  
                        <TextArea
                          name="description"
                          label="Phase Description"
                          placeholder="Phase Description"
                          error={phaseInfo.phaseerrors.description}
                          value={phaseInfo.description}
                          onChange={ e=> onPhaseChange(e, index)}
                        />
                      </div>
                      <div className="col-md-6">
                        <div className="row">
                          <div className="date-field">
                            <label className="form-label">Start Date</label>
                            <div className="date-picker">
                              <div id={"datetimePhaseStart" + index} className={"input-group no-label date phase-startDate" + index}>
                                <TextDate 
                                  type="text" 
                                  name="start_date"
                                  value={phaseInfo.start_date} 
                                  onBlur={e=> onPhaseChange(e, index)}
                                  error={phaseInfo.phaseerrors.start_date}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="date-field">
                            <label className="form-label">End Date</label>
                            <div className="date-picker1">
                              <div id={"datetimePhaseEnd" + index} className={"input-group no-label date phase-endDate" + index}>
                                <TextDate 
                                  type="text"
                                  name="tentitive_end_date"
                                  value={phaseInfo.tentitive_end_date} 
                                  onBlur={e=> onPhaseChange(e, index)}
                                  error={phaseInfo.phaseerrors.tentitive_end_date}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-12">
                            <TextInput
                              name="participant_count"
                              label="Participant Count"
                              placeholder="Participant Count"
                              value={phaseInfo.participant_count}
                              error={phaseInfo.phaseerrors.participant_count}
                              onChange={ e=> onPhaseChange(e, index)}
                            />
                          </div>
                        </div> 
                      </div>
                    </div>                          
                  </div>
                  <MilestoneList  
                    Phaseindex = {index}
                    onMilestoneChange = {onMilestoneChange}
                    singleMilestone = {singleMilestone}
                    singleUpdateMilestone = {singleUpdateMilestone}
                    phaseInfo = {phaseInfo}
                    onDeleteMilestone = {onDeleteMilestone}
                    onEditMilestone = {onEditMilestone}
                    addMileStone = {addMileStone}
                    updateMileStone = {updateMileStone} 
                    onMilestoneEditChange = {onMilestoneEditChange}
                    clearMilestone = {clearMilestone}
                  />
                  <PatientList 
                    Phaseindex = {index}
                    allPatients = {phaseInfo.allPhasePatient}
                    onPatientChanged = {onPatientChanged}
                    onAddPatients = {onAddPatients}
                    onCancelPatients = {onCancelPatients}
                    phaseInfo = {phaseInfo}
                    onDeletePatient = {onDeletePatient}
                    getPatientDetail = {getPatientDetail}
                    handlePatientPageChange = {handlePatientPageChange}
                    patientCount = {phaseInfo.patientCount}
                    OpenModal = {OpenModal}
                  />                 
                </div>
              )
            }
          </div>
        </div>
        <div id="medication" className="medication-details">
          <div className="row">
            <div className="col-md-6 form-details">
              <label className="form-label">Trial</label>
              <span>{trial.name}</span>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 form-details">
              <label className="form-label">Drug Name</label>
              <span>{trial.drug_name}</span>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 form-details">
              <label className="form-label">Drug Desc</label>
              <span>{trial.drug_description}</span>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <div className="select-field">
                <SelectInput
                  name="drug_type_id"
                  label="Drug Type"
                  value={trial.drug_type_id}
                  defaultOption="Select Drug"
                  options={allDrugTypes}
                  onChange={onTrialDrugTypeChange} 
                  error={trialerrors.drug_type_id}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="select-field">
                <SelectInput
                  name="dosage_id"
                  label="Dosage"
                  value={trial.dosage_id}
                  defaultOption="Select Dosage"
                  options={allDosages}
                  onChange={onTrialChange} 
                  error={trialerrors.dosage_id}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="select-field">
                <SelectInput
                  name="frequency_id"
                  label="Frequency"
                  value={trial.frequency_id}
                  defaultOption="Select Frequency"
                  options={allFrequencies}
                  onChange={onTrialChange} 
                  error={trialerrors.frequency_id}
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <ProductTable 
                MedicationTimeList={MedicationTimeList} 
                onRowAdd={onRowAdd} 
                onRowDel = {onRowDel} 
                onRowUpdate = {onRowUpdate}
              />
            </div>
          </div>
        </div>
        <div id="device">
          <div className="row">
            <div className="col-md-6 form-details">
              <label className="form-label">Trial</label>
              <span>{trial.name}</span>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label">Vitals Frequency</label>
                <div className="checkbox-field">
                  <ul className="checkbox-field-list">
                    <li>
                      <CheckBoxInput  
                        name="pre_vital_type"
                        onChange={PreVitalChange}
                        value={trial.pre_vital_type}
                        checked = {trial.pre_vital_type}
                        id="PreVital"
                        label="Pre-Medication"
                      />
                    </li>
                    <li>
                      <CheckBoxInput  
                        name="post_vital_type"
                        onChange={PreVitalChange}
                        value={trial.post_vital_type}
                        checked = {trial.post_vital_type}
                        id="PostVital"
                        label="Post-Medication"
                      />
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DeviceList  
            deviceList = {deviceList}
            onDeviceChanged = {onDeviceChanged}
            onAddDevices = {onAddDevices}
            onCancelDevices = {onCancelDevices}
            device = {device}
            onDeleteDevice = {onDeleteDevice}
            trial = {trial}
            UsertimeZone = {UsertimeZone}
          /> 
        </div>
      </div>
    </div>      
  );
};

TrialForm.propTypes = {
  trial: PropTypes.object.isRequired,
  phase: PropTypes.object.isRequired,
  allSponsors: PropTypes.array.isRequired,
  allDsmbs: PropTypes.array.isRequired,
  allDrugTypes: PropTypes.array.isRequired,
  allDosages: PropTypes.array.isRequired,
  allFrequencies: PropTypes.array.isRequired,
  onPhaseChange: PropTypes.func.isRequired,
  onMilestoneChange: PropTypes.func.isRequired,
  onTrialChange: PropTypes.func.isRequired,
  updateMilestone: PropTypes.func.isRequired,
  addMileStone: PropTypes.func.isRequired,
  onEditMilestone : PropTypes.func.isRequired,
  onCancelDevices : PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default TrialForm;
