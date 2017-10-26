import React from 'react';
import { Link , browserHistory} from 'react-router';
import {bindActionCreators} from 'redux';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import Footer from '../common/Footer';
import {connect} from 'react-redux';
import PatientList from'./patientListPage';
import Pagination from "react-js-pagination";
import * as patientActions from '../../actions/patientActions';
import toastr from 'toastr';
import { Conditional } from 'react-conditional-render';
import cookies from 'react-cookie';

let search = {
  params: {
    "pageNumber": 1,
    "pageSize": 10,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
};

let trialId ='';
let isHideDelete = false;
let isShowPatientLink = false;

class PatientPage extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state ={
      search:search
    }
    isHideDelete = false;
    isShowPatientLink = false;
    this.getAllUserList(search);
    this.deletePatient = this.deletePatient.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.getPatientDetailGraph = this.getPatientDetailGraph.bind(this);
  }

  handlePageChange(pageNumber) {
    this.setState({activePage: pageNumber});
    this.state.search.params.pageNumber = pageNumber;
    this.getAllUserList(this.state.search);
    
  }

  getAllUserList(search) {

    if((this.props.location.pathname).indexOf('falloutpatientList') !== -1){
      isHideDelete = true;
      isShowPatientLink=  true;
      this.props.actions.loadFalloutPatients(trialId);
    }
    else
    {
      if(trialId){
        isHideDelete = true;
        isShowPatientLink=  true;
        this.props.actions.loadTrialsPatient(trialId);
      } 
      else {
        this.props.actions.loadPatients(search);
      }
    }
  }

  deletePatient(patient) {
    if(confirm("Are you sure you want to delete Patient ?")){
      if(patient)
      {
        this.props.actions.deletePatientData(patient)
        .then(() => this.redirect())
        .catch(error => {
          toastr.error(error);
          this.setState({saving: false});
        });
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  }

  redirect() {
    let data = {
      params: {
        "pageNumber": 1,
        "pageSize": 10
      }
    };

    this.getAllUserList(data);
    this.setState({saving: false});
    browserHistory.push('/patientList');
    toastr.success('Patient Deleted.');
  }

  getPatientDetailGraph(patientId,newtrialId,newPhaseId) {
    let phaseId = cookies.load('patientPhaseId');
    if((this.props.location.pathname).indexOf('falloutpatientList') !== -1){
      cookies.save('patient_trial_id',  newtrialId, {path: '/' });
      cookies.save('patient_phase_id',  newPhaseId, {path: '/' });
    }
    else {
      cookies.save('patient_trial_id',  trialId, {path: '/' });
      cookies.save('patient_phase_id',  phaseId, {path: '/' });
    }
    cookies.save('patient_id',  patientId, {path: '/' });
    browserHistory.push('/patientDetail/')
  }


  render() {
    return (
      <div className="main-wrap">
        <Header/>
        <Leftmenu/>
        <section id="container" className="container-wrap">
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li className="active">Patient List</li>
          </ol>
          <section className="container-fluid">
            <div id="toolbar">
              <h3 className="pull-left">Patient</h3>
            </div>
            <section className="card">
              <div className="card-block">
                <PatientList patient={this.props.patient} DeletePatient={this.deletePatient} isHideDelete={isHideDelete} isShowPatientLink={isShowPatientLink} getPatientDetailGraph={this.getPatientDetailGraph}/>
              </div>
              <Conditional condition={this.props.patientCount > 10}>
                <div className="pagging-section">
                  <Pagination
                    activePage={this.state.search.params.pageNumber}
                    itemsCountPerPage={this.state.search.params.pageSize}
                    totalItemsCount={this.props.patientCount}
                    pageRangeDisplayed={5}
                    onChange={this.handlePageChange}
                    prevPageText={<i className="fa fa-chevron-left"></i>}
                    nextPageText={<i className="fa fa-chevron-right"></i>}
                  />
                </div>
              </Conditional>
            </section>
          </section>
        </section>
        <Footer/>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  trialId = ownProps.params.id;
  return {
    patient: (ownProps.location.pathname).indexOf('falloutpatientList') !== -1 ? !_.isUndefined(state.falloutPatients.data) ? state.falloutPatients.data : state.falloutPatients : !_.isUndefined(state.Patients.rows) ? state.Patients.rows : state.Patients,
    patientCount: !_.isUndefined(state.Patients.count) ? state.Patients.count : state.Patients.count        
  };
 
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(patientActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PatientPage);
