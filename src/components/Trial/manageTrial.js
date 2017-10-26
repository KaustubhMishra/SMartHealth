import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as RolePermissionActions from '../../actions/RolePermissionActions';
import Header from '../common/Header';
import Footer from '../common/Footer';
import Leftmenu from '../common/Leftmenu';

import cookies from 'react-cookie';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


class ManageTrial extends React.Component {

	constructor(props, context) {
    super(props, context);
  }

  componentWillMount() {
    //this.getLoggedUserPermission();
    this.OnPageLoad();
  }
  
  OnPageLoad() {
    $(document).ready(function(){
      $('#manage-trial-tab, #manage-trial-tab2').responsiveTabs({
        startCollapsed: 'accordion'
      });
      $('#add-trial1-start, #add-trial2-start, #add-trial3-start, #add-trial4-start').Zebra_DatePicker({
        direction: true,
        pair: $('#add-trial1-end, #add-trial2-end, #add-trial3-end, #add-trial4-end')
      });

      $('#add-trial1-end, #add-trial2-end, #add-trial3-end, #add-trial4-end').Zebra_DatePicker({
        direction: 1
      });
    });
  }

  render() {
    return (
      <div>
        <Header/>
        <section id="container" className="container-wrap">
          <Leftmenu/>
          <section className="container-fluid">
            <section className="page-title">
              <div className="pull-left">
                <h1>Home</h1>
                <div className="breadcrumbs">
                  <span>Home</span><a >Manage Trial</a>
                </div>
              </div>
              <div className="pull-right right-head">
                <a className="btn btn-border pull-left" >Create New</a>
                <a className="btn btn-border pull-left" >End Trial</a>
              </div>
            </section>
            <div className="mt-box">
              <div id="manage-trial-tab">
                <ul className="mt-tabs">
                  <li><a href="#trial">Add Trial</a></li>
                  <li><a href="#phase">Add Phase/Milestone</a></li>
                  <li><a href="#medication">Add Medication</a></li>
                </ul>
                <div id="trial" style={{display:"block"}}>
                  <div className="phase-form-wrap">
                    <div className="phase-form-row overflow">
                      <label>Sponsor Name:</label>
                      <div className="select-field pull-left">
                        <select>
                          <option>Select Sponsor</option>
                          <option>Cadila</option>
                          <option>Biocon</option>
                        </select>
                      </div>
                    </div>
                    <div className="phase-form-row">
                      <label>Participant Count:</label>
                      <div className="input-field">
                        <input type="text" />
                      </div>
                    </div>
                    <div className="phase-form-row">
                      <label>Phase Description:</label>
                      <div className="textarea-field pull-left">
                        <textarea placeholder="Description"></textarea>
                      </div>                
                    </div>
                    <div className="phase-form-row">
                      <label>Trial Type:</label>
                      <div class="redio-field pull-left">
                        Redio
                      </div>                
                    </div>
                    <div className="phase-form-row overflow">
                      <label>DSMB Name:</label>
                      <div className="select-field pull-left">
                        <select>
                          <option>Select DSMB</option>
                        </select>
                      </div>
                    </div>
                    <div className="phase-form-row">
                      <label>Drug Name:</label>
                      <div className="input-field">
                        <input type="text" />
                      </div>
                    </div>
                    <div className="phase-form-row">
                      <label>Drug Description:</label>
                      <div className="textarea-field pull-left">
                        <textarea placeholder="Description"></textarea>
                      </div>                
                    </div>
                    <div className="overflow">
                      <div className="phase-form-row pull-left">
                        <label>Start Date:</label>
                        <div className="date-field">
                          <input id="add-trial1-start" type="text" />
                        </div>
                      </div>
                      <div className="phase-form-row pull-left">
                        <label>End Date:</label>
                        <div className="date-field">
                          <input id="add-trial1-end" type="text" />
                        </div>
                      </div>
                    </div>
                    <div className="phase-form-row">
                      <div className="">
                        <input onclick="location.href='javascript:void(0)'" className="btn blue" type="button" value="Save" />
                      </div>
                    </div>
                  </div>
                </div>
                <div id="phase">
                  <div className="trial-field-row">
                    <label>Select Trial<b>*</b>:</label>
                    <div className="select-field">
                      <select>
                        <option>Select Trial</option>
                        <option>Trial 14</option>
                        <option>Trial 15</option>
                      </select>
                    </div>
                  </div>
                  <div id="manage-trial-tab2">
                    <ul className="phase-tabs">
                      <li><a href="#phase-00">Phase 0</a></li>
                      <li className="r-tabs-state-active"><a href="#phase-01">Phase I</a></li>
                      <li><a href="#phase-02">Phase II</a></li>
                      <li><a href="#phase-03">Phase III</a></li>
                      <li><a href="#phase-04">Phase IV</a></li>
                    </ul>
                    <div id="phase-00">
                      Phase I                
                    </div>
                    <div id="phase-01" style={{display:"block"}}>
                      <div className="phase-form-wrap">
                        <div className="phase-form-row">
                          <label>Phase Description:</label>
                          <div className="textarea-field">
                            <textarea placeholder="Description"></textarea>
                          </div>
                        </div>
                        <div className="overflow">
                          <div className="phase-form-row pull-left">
                            <label>Start Date:</label>
                            <div className="date-field">
                              <input id="add-trial2-start" type="text" />
                            </div>
                          </div>
                          <div className="phase-form-row pull-left">
                            <label>End Date:</label>
                            <div className="date-field">
                              <input id="add-trial2-end" type="text" />
                            </div>
                          </div>
                        </div>
                        <div className="phase-form-row">
                          <label>Participant Count:</label>
                          <div className="input-field">
                            <input type="text" />
                          </div>
                        </div>
                        <hr className="hairline-hr" />
                        <div className="phase-form-row">
                          <label>Phase Description:</label>
                          <div className="textarea-field pull-left">
                            <textarea placeholder="Description"></textarea>
                          </div>
                          <a className="add-more-milestones-btn" href="javascript:void(0)"><i></i>Add More Milestones</a>
                        </div>
                        <div className="overflow">
                          <div className="phase-form-row pull-left">
                            <label>Start Date:</label>
                            <div className="date-field">
                              <input id="add-trial3-start" type="text" />
                            </div>
                          </div>
                          <div className="phase-form-row pull-left">
                            <label>End Date:</label>
                            <div className="date-field">
                              <input id="add-trial3-end" type="text" />
                            </div>
                          </div>
                        </div>
                        <div className="phase-form-row">
                          <div class="">
                            <input onclick="location.href='javascript:void(0)'" className="btn blue" type="button" value="Submit" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div id="phase-02">Phase II</div>
                    <div id="phase-03">Phase III</div>
                    <div id="phase-04">Phase IV</div>
                  </div>
                </div>
                <div id="medication">
                  <div className="trial-field-row">
                    <label>Trial:</label>
                    <div className="span-text-field">
                      <span>Trial 14</span>
                    </div>
                  </div>
                  <div className="trial-field-row">
                    <label>Drug Name :</label>
                    <div className="span-text-field">
                      <span>Biseptol</span>
                    </div>
                  </div>
                  <div className="trial-field-row">
                    <label>Drug Desc :</label>
                    <div className="span-text-field">
                      <span>Biseptol is the Medical Drug</span>
                    </div>
                  </div>
                  <div className="trial-field-row">
                    <label>Drug Type:</label>
                    <div className="select-field">
                      <select>
                        <option>Select Drug</option>
                        <option>Stimulants </option>
                        <option>Depressants</option>
                        <option>Hallucinogens</option>
                      </select>
                    </div>
                  </div>
                  <div className="trial-field-row">
                    <label>Dosage:</label>
                    <div className="select-field">
                      <select>
                        <option>Select Dosage</option>
                        <option>1 Tablet </option>
                        <option>2 Tablet</option>
                        <option>3 Tablet</option>
                        <option>5 ml </option>
                        <option>10 ml </option>
                        <option>15 ml </option>
                        <option>20 ml </option>
                      </select>
                    </div>
                  </div>
                  <div className="trial-field-row">
                    <label>Frequency:</label>
                    <div className="select-field">
                      <select>
                        <option>Select Frequency</option>
                        <option>Once's a Day</option>
                        <option>Twice a Day</option>
                        <option>Thrice a Day</option>
                      </select>
                    </div>
                  </div>
                  <div className="phase-form-row">
                    <div className="">
                      <input onclick="location.href='javascript:void(0)'" className="btn blue" type="button" value="Submit" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <Footer/>
        </section>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  console.log(state);
  return {
    user: state.userRolePermission
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(RolePermissionActions, dispatch)
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(ManageTrial);

