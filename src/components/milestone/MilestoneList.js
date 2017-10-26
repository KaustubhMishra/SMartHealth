import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import TextDate from '../common/TextDate';
import SelectInput from '../common/SelectInput';
import MilestoneListRow from '../milestone/MilestoneListRow';
import moment from 'moment';
import DateTimeField from 'react-bootstrap-datetimepicker';

const MilestoneList = ({
  Phaseindex,
  onMilestoneChange,
  singleMilestone,
  singleUpdateMilestone,
  phaseInfo,
  onEditMilestone,
  onDeleteMilestone,
  addMileStone,
  updateMileStone,
  onMilestoneEditChange,
  clearMilestone}) => {
  return (
    <div>
      <div className="row form-group">
        <a className="js-open-modal btn btn-border set-width mb-10 btn-sm" 
          data-toggle="modal" 
          data-target={ "#Addmilestone" + Phaseindex } 
          data-modal-id={ "Addmilestone" + Phaseindex }>
        <img src={require('../../assets/img/add-icon-white.png')} />Add Milestones
        </a>
      </div>
      <div className="modal fade" id={ "Addmilestone" + Phaseindex } role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">&times;</button>
              <h4 className="modal-title">Add Milestones</h4>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">    
                  <TextInput name="name"
                    label="Name" 
                    placeholder="Milestone Name"
                    onChange={ e=> onMilestoneChange(e, Phaseindex)}
                    error={phaseInfo.milestoneerrors.name} 
                    value={singleMilestone.name}
                  />
                  <div className="row">
                    <div className="date-field">
                      <label>Start Date:</label>
                      <div className="date-picker">
                        <div id="datetimeMilestoneStart" className={"input-group date milestone-startDate" + Phaseindex}>
                          <TextDate 
                            type="text" 
                            name="start_date"
                            value={singleMilestone.start_date} 
                            onBlur={e=> onMilestoneChange(e, Phaseindex)}
                            error={phaseInfo.milestoneerrors.start_date}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="date-field">
                      <label>End Date:</label>
                      <div className="date-picker">
                        <div id="datetimeMilestoneEnd" className={"input-group date milestone-endDate" + Phaseindex}>
                          <TextDate 
                            type="text" 
                            name="tentitive_end_date"
                            value={singleMilestone.tentitive_end_date} 
                            onBlur={e=> onMilestoneChange(e, Phaseindex)}
                            error={phaseInfo.milestoneerrors.tentitive_end_date}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 trial-Description">
                  <TextArea name="description"
                    label="Description"
                    placeholder="Milestone Description"
                    onChange={ e=> onMilestoneChange(e, Phaseindex)} 
                    error={phaseInfo.milestoneerrors.description}
                    value={singleMilestone.description}
                  />                  
                </div>
              </div>
            </div>
              <div className="modal-footer">
                <div className="row">
                  <div className="col-md-12">
                    <button 
                      className="btn btn-border"  
                      id="Save" 
                      type="submit"
                      onClick={() => addMileStone(Phaseindex)}>
                      <img src={require('../../assets/img/save-icon-white.png')} /> Save
                    </button>
                    <button 
                      className="btn btn-border js-modal-close" 
                      id="Cancel" 
                      data-dismiss="modal" 
                      type="submit"
                      onClick={() => clearMilestone(Phaseindex)}>
                      <img src={require('../../assets/img/close-icon-white.png')} /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      <div className="modal fade" id={ "Editmilestone" + Phaseindex } role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal">&times;</button>
              <h4 className="modal-title">Update Milestones</h4>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-12">
                  <TextInput 
                    name="name" 
                    label="Name"
                    placeholder="MileStone Name"
                    onChange={ e=> onMilestoneEditChange(e, Phaseindex)}
                    error={phaseInfo.milestoneerrors.name} 
                    value={singleUpdateMilestone.name}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <TextArea 
                    name="description"
                    label="Description"
                    placeholder="Milestone Description"
                    onChange={ e=> onMilestoneEditChange(e, Phaseindex)} 
                    error={phaseInfo.milestoneerrors.description}
                    value={singleUpdateMilestone.description}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <label>Start Date:</label>
                  <div className="date-field">
                    <TextDate 
                      id={"edit-milestone-start" + Phaseindex }
                      type="text"  
                      name="start_date"
                      value={ singleUpdateMilestone.start_date ? moment(singleUpdateMilestone.start_date).format("MM/DD/YYYY") : "" }
                      error={phaseInfo.milestoneerrors.start_date}
                      onSelect={ e=> onMilestoneEditChange(e, Phaseindex)} 
                    />      
                  </div>
                </div>
                <div className="col-md-6">
                  <label>End Date:</label>
                  <div className="date-field">
                    <TextDate 
                      id={"edit-milestone-end" + Phaseindex }
                      type="text"  
                      name="tentitive_end_date"
                      value={ singleUpdateMilestone.tentitive_end_date ? moment(singleUpdateMilestone.tentitive_end_date).format("MM/DD/YYYY") : "" }
                      error={phaseInfo.milestoneerrors.tentitive_end_date}
                      onSelect={ e=> onMilestoneEditChange(e, Phaseindex)} 
                    />  
                  </div>
                </div> 
              </div>  
            </div>
            <div className="modal-footer">
              <div className="btn-group">
                <input 
                  className="btn blue set-width"  
                  id="Save" 
                  value="Save" 
                  type="submit"
                  onClick={() => updateMileStone(Phaseindex)}
                />
                <input 
                  className="btn blue set-width js-modal-close" 
                  id="Cancel" 
                  data-dismiss="modal" 
                  value="Cancel" 
                  type="submit"
                  onClick={() => clearMilestone(Phaseindex)}
                />
              </div>
            </div>
          </div>
        </div>
    </div>
    <div className="pt-data-table form-group">
      <table id="grdMilestone" className="display table table-bordered" width="100%" cellspacing="0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th> 
            <th>Start Date</th> 
            <th>End Date</th>   
            <th className="text-center">Edit</th>
            <th className="text-center">Delete</th>
          </tr>
        </thead>
        <tbody>
          {
            phaseInfo.milestone.map((MilestoneData, Mindex) =>
              <MilestoneListRow 
                key={Mindex} 
                milestone={MilestoneData} 
                Mindex={Mindex}
                Pindex={Phaseindex} 
                onEditMilestone = {onEditMilestone} 
                onDeleteMilestone = {onDeleteMilestone} 
              />
            )
          }            
        </tbody>
      </table>
    </div>  
   </div>   
  );
};

MilestoneList.propTypes = {
  onDeleteMilestone: PropTypes.func.isRequired,
  onEditMilestone: PropTypes.func.isRequired,
};

export default MilestoneList;

