import React from 'react';
import { Link , browserHistory} from 'react-router';
import {bindActionCreators} from 'redux';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import Footer from '../common/Footer';
import {connect} from 'react-redux';
import PatientEnrolledListPage from'./patientEnrolledListPage';
import Pagination from "react-js-pagination";
import * as patientActions from '../../actions/patientActions';
import * as roleActions from '../../actions/roleActions';
import toastr from 'toastr';
import { Conditional } from 'react-conditional-render';
import cookies from 'react-cookie';
import SelectInput from '../common/SelectInput';
import {genderFormattedForDropdown} from '../../selectors/selectors';
import {trialFormattedForDropdown} from '../../selectors/selectors';

let UsertimeZone = '';
let search = 
    {params: {
            "pageNumber": 1,
            "pageSize": 10,
            "sortBy": "createdAt",
            "sortOrder": "desc"
        }
    };

class PatientEnrolledTrialPage extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state ={
      trialName : '',
      gender : '',
      search:search
    };
    this.handlePageChange = this.handlePageChange.bind(this);
    this.onSponsorChange = this.onSponsorChange.bind(this);
    this.redirect = this.redirect.bind(this);
    this.onsearchClick = this.onsearchClick.bind(this);
    this.getLoggedInUserRoleName();
  }   
 
  handlePageChange(pageNumber) {
    this.setState({activePage: pageNumber});
    this.state.search.params.pageNumber = pageNumber;
    this.getEnrolledTrials(this.state);    
  }

  onSponsorChange(event){
    const field = event.target.name;
    let state = this.state;
    state[field] = event.target.value;
  return this.setState(state);
  }

  getLoggedInUserRoleName() {
    this.props.roleActions.loadUsersRolesName().then(()=>this.getEnrolledTrials());
  }

  onsearchClick(event){
    var selectedTrial = this.state.trialName;
    var selectedGender = this.state.gender;
    this.state.trialName = selectedTrial;
    this.state.gender = selectedGender;
    this.state.search.params.pageNumber = 1;
    this.getEnrolledTrials();
  return this.setState(this.state);
  }

  redirect() {
    this.state = {
      trialName : '',
      gender : '',
      search: {
        params: {
          "pageNumber": 1,
          "pageSize": 10
        }
      }
    };
    this.getEnrolledTrials();
  }

  getEnrolledTrials() {
    if(this.props.userRoleName.name =="DSMB") {
      this.props.actions.loadEnrolledTrialsDSMB();
      this.props.actions.loadEnrolledPatientTrialDSMB(this.state);
    } else if(this.props.userRoleName.name =='CRO') {  
      this.props.actions.loadEnrolledPatientTrialCRO(this.state);
      this.props.actions.loadEnrolledTrialsCRO();
    }
  }


  getPatientDetailedGraph(patientId1, trialId1, phaseId1) {
    cookies.save('patient_trial_id',  trialId1, {path: '/' });
    cookies.save('patient_phase_id',  phaseId1, {path: '/' });
    cookies.save('patient_id',  patientId1, {path: '/' });
    browserHistory.push('/patientDetail/')
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
                    <h1>Patient</h1>
                    <div className="breadcrumbs">
                     <span>Patient</span><a>Enrolled Patient List</a>
                    </div>
                  </div>
                </section>
                <div className="db-search-wrap">
                  <div className="db-search-form">
                    <ul className="at-list patient-list">
                      <li>
                        <SelectInput
                          name="trialName"
                          value={this.state.trialName}
                          defaultOption="Select Trial"
                          options={this.props.trialList}
                          onChange={this.onSponsorChange} 
                        />
                      </li>
                      <li>
                        <SelectInput
                          name="gender"
                          value={this.state.gender}
                          defaultOption="Select Gender"
                          options={this.props.genderList}
                          onChange={this.onSponsorChange} 
                        />
                      </li>
                      <li>
                        <input className="btn blue set-width pull-left" id="search" type="submit" value="Search" onClick={this.onsearchClick}/>
                        <input className="btn blue set-width" id="reset" type="submit" value="Reset" onClick={this.redirect}/>
                      </li>  
                    </ul>
                  </div>
                </div>
                <section className="box-trials">
                  <div className="head">
                    <h2>Enrolled Patient List</h2>
                  </div>
                  <div className="pt-data-table">
                    <PatientEnrolledListPage patientEnrolledList={this.props.patientEnrolledList} getPatientDetailedGraph={this.getPatientDetailedGraph} UsertimeZone={UsertimeZone}/>
                  </div>
                  <div className="pull-right">
                    <Conditional condition={this.props.patientCount > 10}>
                      <Pagination
                        activePage={this.state.search.params.pageNumber}
                        itemsCountPerPage={this.state.search.params.pageSize}
                        totalItemsCount={this.props.patientCount}
                        pageRangeDisplayed={5}
                        onChange={this.handlePageChange}
                      />
                    </Conditional>
                  </div>
                </section>
              </section>
            <Footer/>
          </section>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {

  let patientGender=['Male', 'Female'];
  UsertimeZone = state.userData.timezone;
  return {
    patientEnrolledList: !_.isUndefined(state.PatientEnrolledTrial.rows) ? state.PatientEnrolledTrial.rows : state.PatientEnrolledTrial,
    patientCount: !_.isUndefined(state.PatientEnrolledTrial.count) ? state.PatientEnrolledTrial.count : state.PatientEnrolledTrial.count,
    genderList: genderFormattedForDropdown(patientGender),
    trialList: trialFormattedForDropdown(state.EnrolledTrial),
    userRoleName: state.UserRoleName
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(patientActions, dispatch),
    roleActions: bindActionCreators(roleActions, dispatch)
  };
}

export default connect(mapStateToProps,mapDispatchToProps)(PatientEnrolledTrialPage);
