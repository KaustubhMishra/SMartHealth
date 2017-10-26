import React, {PropTypes} from 'react';
import { bindActionCreators } from 'redux';
import {connect} from 'react-redux';
import {browserHistory, Link} from 'react-router';
import toastr from 'toastr';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import { Conditional } from 'react-conditional-render';
import * as RolesandPermission from '../common/RolesandPermission';
import * as getLoggedUserActions from '../../actions/getLoggedUserActions';
import * as sponsorsActions from '../../actions/sponsorActions';
import * as roleActions from '../../actions/roleActions';
import cookies from 'react-cookie';
import TrialList from './TrialList';
import * as trialActions from '../../actions/trialActions';
import Footer from '../common/Footer';
import {sponsorsFormattedForDropdown} from '../../selectors/selectors';
import {trialsFormattedForDropdown} from '../../selectors/selectors';
import {phasesFormattedForDropdown} from '../../selectors/selectors';
import {statusesFormattedForDropdown} from '../../selectors/selectors';
import {sponsorDSMBFormattedForDropdown} from '../../selectors/selectors';
import SelectInput from '../common/SelectInput';
import Pagination from "react-js-pagination";
import * as patientActions from '../../actions/patientActions';

let search = 
    {params: {
            "pageNumber": 1,
            "pageSize": 12,
            "sortBy": "createdAt",
            "sortOrder": "desc"
        }
    };

let phasePatientTrialId = "";
let UsertimeZone = '';

class Analytics extends React.Component {
  constructor(props, context) {
    super(props, context);
    
    search.params = {
      "pageNumber": 1,
      "pageSize": 12,
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }

    this.state = { 
      trialData : '',
      sponsorId : '',
      trialId : '',
      phaseId : '',
      statusId : '',
      search: search
    }
    
    this.getLoggedInUserRoleName();
    
    this.handlePageChange = this.handlePageChange.bind(this);

    this.selectTrial = this.selectTrial.bind(this);
    this.ConfirmDelete = this.ConfirmDelete.bind(this);
    this.ConfirmCompelete = this.ConfirmCompelete.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onSponsorChange = this.onSponsorChange.bind(this);
    this.onsearchClick = this.onsearchClick.bind(this);
    this.ongetTrial = this.ongetTrial.bind(this);
    this.redirect = this.redirect.bind(this);
    /*this.props.patientActions.loadAllPatients();
    this.props.patientActions.loadPahsePatients(0);*/
  }

  getLoggedInUserRoleName() {
    $(document).ready(function(){
      let isOpen = false;

      $('.nav-icon').click(function(){
        if(isOpen == false) {
          $("#container").removeClass("nav-is-close");
          $("#container").addClass("nav-is-open");
          isOpen = true;
        }
        else {
          $("#container").removeClass("nav-is-open");
          $("#container").addClass("nav-is-close");
          isOpen = false;
        }
      });
      $(window).on('beforeunload', function() {
        $(window).scrollTop(0); 
      });
    });
    
    let trialStatusId = cookies.load('trial_statusId');
    let trialPhase = cookies.load('trial_phase');
    let trialSponsor = cookies.load('trial_sponsor');
    let trialId = cookies.load('trial_Id');

    if(trialStatusId && trialPhase && trialSponsor && trialId)
    {
      this.getTrialonDashboard();
    } else {
      this.props.roleActions.loadUsersRolesName().then(() =>  this.onPageLoad());  
    }
    
  }

  onPageLoad(){

    let statusparam = cookies.load('trial_status');
    let sponsorId = cookies.load('trial_sponsor');
    let trialId = cookies.load('trial_Id');
    let phaseId1 = cookies.load('trial_phase');
    let trialStatus =cookies.load('trial_statusId');
    if(statusparam)
    {
      if(this.props.userRoleName.name == 'DSMB') {
        this.state.statusId = statusparam;
        cookies.remove('trial_status', { path: '/' });
        this.getTrialForSelectedUser(this.state);
      } 
      else if(this.props.userRoleName.name == 'CRO Coordinator') {
        this.state.statusId = statusparam;
        cookies.remove('trial_status', { path: '/' });
        this.getTrialForSelectedUser(this.state);
      }
      else {
        this.state.statusId = statusparam;
        cookies.remove('trial_status', { path: '/' });
        this.getActiveTrial(this.state);  
      }
    }
    else if(phaseId1 || trialStatus || sponsorId || trialId) {
      if(this.props.userRoleName.name == 'DSMB') {
        this.state.phaseId = phaseId1;
        this.state.statusId = trialStatus;
        this.state.sponsorId = sponsorId;
        this.state.trialId = trialId;
        cookies.remove('trial_phase', { path: '/' });
        cookies.remove('trial_statusId', { path: '/' });
        cookies.remove('trial_sponsor', { path: '/' });
        cookies.remove('trial_Id', { path: '/' });
        this.props.actions.loadTrialByUserId(this.state);
        return this.setState(this.state);
      } else if(this.props.userRoleName.name == 'CRO Coordinator'){
        this.state.phaseId = phaseId1;
        this.state.statusId = trialStatus;
        this.state.sponsorId = sponsorId;
        this.state.trialId = trialId;
        cookies.remove('trial_phase', { path: '/' });
        cookies.remove('trial_statusId', { path: '/' });
        cookies.remove('trial_sponsor', { path: '/' });
        cookies.remove('trial_Id', { path: '/' });
        this.props.actions.loadTrialByCROId(this.state);
        return this.setState(this.state);
      } else if(this.props.userRoleName.name == 'CRO') {
        this.state.phaseId = phaseId1;
        this.state.statusId = trialStatus;
        this.state.sponsorId = sponsorId;
        this.state.trialId = trialId;
        cookies.remove('trial_phase', { path: '/' });
        cookies.remove('trial_statusId', { path: '/' });
        cookies.remove('trial_sponsor', { path: '/' });
        cookies.remove('trial_Id', { path: '/' });
        this.getAllTrialList(this.state);
      }
    }
    else {
      this.getTrialForSelectedUser();
    }   
  }

  getTrialonDashboard(){
    let trialStatusId = cookies.load('trial_statusId');
    let trialPhase = cookies.load('trial_phase');
    let trialSponsor = cookies.load('trial_sponsor');
    let trialId = cookies.load('trial_Id');

    /*if(trialStatusId && trialPhase && trialSponsor && trialId)
    {*/
      this.state.statusId = trialStatusId;
      this.state.sponsorId = trialSponsor;
      this.state.phaseId = trialPhase;
      this.state.trialId = trialId;

      cookies.remove('trial_statusId', { path: '/' });
      cookies.remove('trial_phase', { path: '/' });
      cookies.remove('trial_sponsor', { path: '/' });
      cookies.remove('trial_Id', { path: '/' });
      this.getAllTrialList(this.state);
    //}
    /*else if(this.props.userRoleName.name == 'CRO') {
      this.getAllTrialList(this.state);
    }*/
    //this.getTrialForSelectedUser();  
  };


  handlePageChange(pageNumber) {
    this.setState({activePage: pageNumber});
    this.state.search.params.pageNumber = pageNumber;
    this.getAllTrialList(this.state);    
  }

  getAllTrialList(search) {
    this.props.actions.loadTrials(search);
  }

  getAllTrialListCRO(search) {
    this.props.actions.loadTrials(search);
  }

  getActiveTrial(search) {
    this.props.actions.loadActiveTrials(search);
  }

  
  ongetTrial(trialId){

    if(trialId)
      {
        /*this.props.patientActions.loadPahsePatients(trialId);
        this.props.actions.fetchDataById(trialId)
        .then(() => */
          browserHistory.push('/trial/' + trialId)
       /* )
        .catch(error => {
          toastr.error(error);
          this.setState({saving: false});
        });*/
      }
      else {
        return false;
      }

  }

  onsearchClick(event){
    var sponsorId = this.state.sponsorId;
    var trialId = this.state.trialId;
    var phaseId1 = this.state.phaseId;
    var trialStatus = this.state.statusId;
    this.state.search.params.pageNumber = 1;
    if(phaseId1 || trialStatus || sponsorId || trialId) {
      if(this.props.userRoleName.name == 'DSMB') {
        this.props.actions.loadTrialByUserId(this.state);
        return this.setState(this.state);
      } else if(this.props.userRoleName.name == 'CRO Coordinator'){
        this.state.phaseId = phaseId1;
        this.state.statusId = trialStatus;
        this.state.sponsorId = sponsorId;
        this.state.trialId = trialId;
        cookies.remove('trial_phase', { path: '/' });
        cookies.remove('trial_statusId', { path: '/' });
        cookies.remove('trial_sponsor', { path: '/' });
        cookies.remove('trial_Id', { path: '/' });
        this.props.actions.loadTrialByCROId(this.state);
        return this.setState(this.state);
      } else if(this.props.userRoleName.name == 'CRO') {
        this.state.phaseId = phaseId1;
        this.state.statusId = trialStatus;
        this.state.sponsorId = sponsorId;
        this.state.trialId = trialId;
        cookies.remove('trial_phase', { path: '/' });
        cookies.remove('trial_statusId', { path: '/' });
        cookies.remove('trial_sponsor', { path: '/' });
        cookies.remove('trial_Id', { path: '/' });
        this.getAllTrialList(this.state);
        return this.setState(this.state);
      }
    }
  }

  onSponsorChange(event){
    this.state.sponsorId = event.target.value;
    this.state.trialId ='';
    
    if(this.props.userRoleName.name == 'DSMB') {
      this.props.actions.loadtrialsSelectListDSMB(this.state);
      return this.setState(this.state);
    } else if(this.props.userRoleName.name == 'CRO Coordinator'){
      this.props.actions.loadtrialsSelectListCRO(this.state);
      return this.setState(this.state);
    } else {
      this.props.actions.loadtrialsSelectList(this.state);
      return this.setState(this.state);
    }
  }

  onChange(event){
    const field = event.target.name;
    let state = this.state;
    state[field] = event.target.value;
    return this.setState(state);
  }

  ConfirmDelete(){
     if(this.state.trialData)
      {
        this.props.actions.deleteTrial(this.state.trialData)
        .then(() => 
          this.redirect(),
          toastr.success('Trial Deleted Successfully.')
        )
        .catch(error => {
          toastr.error(error);
          this.setState({saving: false});
        });
      }
      else {
        return false;
      }

  }

  getTrialForSelectedUser() {
    if(this.props.userRoleName.name == 'DSMB') {
      this.props.actions.loadTrialByUserId(this.state);
      this.props.sponsorsActions.loadSponsorsListForDSMB();
    } else if(this.props.userRoleName.name == 'CRO Coordinator') {
      this.props.actions.loadTrialByCROId(this.state);
      this.props.sponsorsActions.loadSponsorsListForCRO();
    }
    else if(this.props.userRoleName.name == 'CRO') {
      this.getAllTrialList(this.state);
      this.props.sponsorsActions.loadSponsorsList();
    }
  }

  ConfirmCompelete(){
     if(this.state.trialData)
      {
        this.props.actions.compeleteTrial(this.state.trialData)
        .then(() => 
          this.redirect(),
          toastr.success('Trial Completed Successfully.')
        )
        .catch(error => {
          toastr.error(error);
          this.setState({saving: false});
        });
      }
      else {
        return false;
      }

  }

  redirect() {
    
    this.state = { 
      trialData : '',
      sponsorId : '',
      trialId : '',
      phaseId : '',
      statusId : '',
      search: {params: {
            "pageNumber": 1,
            "pageSize": 12,
            "sortBy": "createdAt",
            "sortOrder": "desc"
        }
      }
    }
    if(this.props.userRoleName.name == 'CRO Coordinator') {
      this.props.actions.loadTrialByCROId(this.state);
      this.setState({saving: false});
    } else if(this.props.userRoleName.name == 'DSMB') {
      this.props.actions.loadTrialByUserId(this.state);
      this.setState({saving: false});
    }
    else {
      this.props.actions.loadtrialsSelectList(this.state)
      this.getAllTrialList(this.state);
      this.setState({saving: false});
    }    
  }

  selectTrial(trial) {
    this.state.trialData = trial;
  }

  render() {
     return (
      <div className="main-wrap">
        <Header/>
        <Leftmenu/>
        <section id="container" className="container-wrap">
          <ul className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li className="active">Analytics</li>
          </ul>
          <section className="container-fluid">
            <div id="toolbar">
              <h3 className="pull-left">Analytics</h3>
            </div>
            <section className="card active-trials">
            <div className="card-header"><h3>Active Trials</h3></div>
              <div className="card-block">
                <TrialList 
                  trials={this.props.trials}
                  userRoleName={this.props.userRoleName} 
                  timeZone = {UsertimeZone}
                  onDeleteTrial={this.selectTrial} 
                  onCompeletedTrial={this.selectTrial}
                  ongetTrial = { this.ongetTrial }
                />
              </div>
              <Conditional condition={this.props.trialCount > 10}>
                <div className="pagging-section">
                  <Pagination
                    activePage={this.state.search.params.pageNumber}
                    itemsCountPerPage={this.state.search.params.pageSize}
                    totalItemsCount={this.props.trialCount}
                    pageRangeDisplayed={3}
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


Analytics.propTypes = {
  actions: PropTypes.object.isRequired,
  trials: PropTypes.array.isRequired,
  trialsSelectList: PropTypes.array.isRequired,
  sponsors: PropTypes.array.isRequired,
  phaseLists: PropTypes.array.isRequired,
  statusLists: PropTypes.array.isRequired
};


function mapStateToProps(state, ownProps) {
  UsertimeZone = state.userData.timezone;
  
  let phaseList = [
    {"id" : 1,
     "name": 'First Phase'
    },
     {"id" : 2,
     "name": 'Second Phase'
    }, {"id" : 3,
     "name": 'Third Phase'
    }, {"id" : 4,
     "name": 'Fourth Phase'
    },
  ]

  let statusList = [
    {"id" : 1,
     "name": 'On Time'
    },
    {"id" : 2,
     "name": 'Completed'
    },
    {"id" : 3,
     "name": 'Delayed'
    }
  ]

  
  return {
    userRoleName: state.UserRoleName,
    trials: state.trials,
    trialCount: !_.isUndefined(state.trials[0]) ? state.trials[0].count : state.trials, 
    sponsors: sponsorsFormattedForDropdown(state.sponsorsSelectList),
    trialsSelectList: trialsFormattedForDropdown(state.trialsSelectList),
    phaseLists: phasesFormattedForDropdown(phaseList),
    statusLists: statusesFormattedForDropdown(statusList),
    timeZone : UsertimeZone
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(trialActions, dispatch),
    getLoggedUseractions: bindActionCreators(getLoggedUserActions, dispatch),
    sponsorsActions: bindActionCreators(sponsorsActions, dispatch),
    roleActions: bindActionCreators(roleActions, dispatch),
    patientActions: bindActionCreators(patientActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Analytics);
