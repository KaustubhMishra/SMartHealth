import React , { Component } from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Header from '../common/Header';
import Footer from '../common/Footer';
import Leftmenu from '../common/Leftmenu';
import * as trialActions from '../../actions/trialActions';
import * as notificationActions from '../../actions/notificationActions';
import * as roleActions from '../../actions/roleActions';
import * as sponsorsActions from '../../actions/sponsorActions';
import * as dsmbActions from '../../actions/dsmbActions';
import * as patientActions from '../../actions/patientActions';
import cookies from 'react-cookie';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router';
import SelectInput from '../common/SelectInput';
import {sponsorsFormattedForDropdown} from '../../selectors/selectors';
import {trialsFormattedForDropdown} from '../../selectors/selectors';
import {phasesFormattedForDropdown} from '../../selectors/selectors';
import {statusesFormattedForDropdown} from '../../selectors/selectors';
import { Conditional } from 'react-conditional-render';
import toastr from 'toastr';
import * as UTCtoUser from '../common/generalFunctions';

let search = {
  params: {
    "pageNumber": 1,
    "pageSize": 10,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
};
let UsertimeZone = '';

class Profile extends React.Component {

  constructor(props, context) {
    super(props, context);
    
    search.params = {
      "pageNumber": 1,
      "pageSize": 10,
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }

    
    this.participantCountResult = '';
    this.state = { 
      trialData : '',
      sponsorId : '',
      trialId : '',
      phaseId : '',
      statusId : '',
      search: search
    };

    this.onSponsorChange = this.onSponsorChange.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onsearchClick = this.onsearchClick.bind(this);
    this.redirect = this.redirect.bind(this);
    this.getfallOutPatient =  this.getfallOutPatient.bind(this);
    this.getPatientDetailGraph = this.getPatientDetailGraph.bind(this);
    this.getNotification();
    this.getLoggedInUserRoleName();
    this.loadMappingTrialGraph();
    this.loadPieChart();
    this.loadEnrolledTrialGraph();
  }  
  componentWillMount() {
    $(document).ready(function(){
      $('.scrollbar-inner').scrollbar();
      $('[data-toggle="tooltip"]').tooltip();
      $(window).on('beforeunload', function() {
        $(window).scrollTop(0); 
      });
    });
  }
  
  
  getPatientDetailGraph(patientId,trialId,PhaseId) {
    cookies.save('patient_trial_id',  trialId, {path: '/' });
    cookies.save('patient_phase_id',  PhaseId, {path: '/' });
    cookies.save('patient_id',  patientId, {path: '/' });
    browserHistory.push('/patientDetail/')
  }

  getLoggedInUserRoleName() {
    this.props.roleActions.loadUsersRolesName().then(()=>this.getTrial()).then(() =>  this.getTrialstatus());
  }

  getNotification() {
    if(this.props.userRoleName.name == 'DSMB' || this.props.userRoleName.name == 'CRO Coordinator') {
      this.props.notification.loadNotification();
    }
    else {
      this.props.notification.loadNotificationCRO();
    }
    
  }

  getfallOutPatient(){
     if(this.props.falloutPatientCount == 0) {

    } else {
      browserHistory.push('/falloutpatientList/0');    
    }
  }

  getTrialstatus() {
    
    this.props.patientActions.loadFalloutPatients(0);

    if(this.props.userRoleName.name == 'CRO') {
      this.props.actions.loadTrialsMetrics();
      this.props.dsmbActions.loadActiveDsmbs();
      this.props.actions.loadTrialsPieChartStatus().then(() => this.OnPageLoad())
      .catch(error => {
        //toastr.error(error);
        this.setState({saving: false});
      });  
    } else if(this.props.userRoleName.name == 'DSMB') {
      this.props.actions.loadTrialsMetricsDSMB();
      this.props.dsmbActions.loadActiveDsmbs();
      this.props.actions.loadTrialsPieChartStatusDSMB().then(() => this.OnPageLoad())
      .catch(error => {
        //toastr.error(error);
        this.setState({saving: false});
      });
    } else if(this.props.userRoleName.name == 'CRO Coordinator') {
      this.props.actions.loadTrialsMetricsCRO();
      this.props.actions.loadTrialsPieChartStatusCoordinator().then(() => this.OnPageLoad())
      .catch(error => {
        //toastr.error(error);
        this.setState({saving: false});
      });
    }
  }

  getTrial() {
    if(this.props.userRoleName.name == 'CRO') {
      this.props.actions.loadTrialsStatus().then(() =>  this.OnPageLoadBarChart())
      .catch(error => {
        //toastr.error(error);
        this.setState({saving: false});
      });
      this.props.sponsorsActions.loadSponsorsList();  
    } else if(this.props.userRoleName.name == 'DSMB') {
      this.props.actions.loadTrialsStatusDSMB().then(() =>  this.OnPageLoadBarChart())
      .catch(error => {
        //toastr.error(error);
        this.setState({saving: false});
      });
      this.props.sponsorsActions.loadSponsorsListForDSMB();
    } else if(this.props.userRoleName.name == 'CRO Coordinator') {
      this.props.actions.loadTrialsStatusCoordinator().then(() =>  this.OnPageLoadBarChart())
      .catch(error => {
        //toastr.error(error);
        this.setState({saving: false});
      });
      this.props.sponsorsActions.loadSponsorsListForCRO();
    }
    
  }

  /*OnPageLoad() {
    google.charts.setOnLoadCallback(drawChart);
    let onTime = this.props.piechartStatus.onTimeCount;
    let onDelayed = this.props.piechartStatus.onDelayedCount;
    
    function drawChart() {
      
      if(onTime || onDelayed ) {

        var total = parseInt(onTime) + parseInt(onDelayed);
        var onTimePercent = (onTime * 100) / total;
        var onDelayedPercent = (onDelayed * 100) / total;

        var datatableArray = [];
        datatableArray[0] = ['Trial', '','id'];

        if((onTimePercent - Math.floor(onTimePercent)) == 0.5) {
          datatableArray[1] = [onTime+' On Time', onTime,1];
          datatableArray[2] = [onDelayed+' Delayed', onDelayed,3];
          
        } else {
          onTimePercent = Math.round(onTimePercent);
          onDelayedPercent = Math.round(onDelayedPercent);
          
          datatableArray[1] = [onTime+' On Time', onTimePercent,1];
          datatableArray[2] = [onDelayed+' Delayed', onDelayedPercent,3];
        }
      

        var data = google.visualization.arrayToDataTable(datatableArray);


        var options = {
          pieHole: 0.4,
          colors: ['#83CE7E' , '#EAC945'],
          legend: {position: 'bottom'},
          tooltip: {text : 'percentage'}        
        };
        
          
        var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
        chart.draw(data, options);
        
        function selectHandler() {
          var selectedItem = chart.getSelection()[0];
          if (selectedItem) {
            var statusId = data.getValue(selectedItem.row, 2);
            
            cookies.save('trial_status',  statusId, {path: '/' });
            browserHistory.push('trials')
          }
        }
        google.visualization.events.addListener(chart, 'select', selectHandler);    
        chart.draw(data, options);

      } else {

        document.getElementById("donutchart").innerHTML = "No Data Found";

      }
      
    }
  }*/

  OnPageLoadBarChart() {
    
    google.charts.load('current', {
        callback: function () {
          setTimeout(function(){ 
            var chartWidth = $(".col-md-6").width();
            drawChart(chartWidth);
          }, 
          1000);
        },
        packages:['corechart']
      });

    $(window).resize(function(){
      drawChart(null);
    });       

    function drawChart(chartWidth) {
      var data = google.visualization.arrayToDataTable([
        ["", "Week", { role: "style" } ],
        ["Demo Trial", 8, "#2F7FD4"],
        ["Aiden Trial", 10, "#2F7FD4"],
        ["Test Trial", 19, "#2F7FD4"],
        ["Medicine Trial", 21, "#2F7FD4"]
      ]);

      var view = new google.visualization.DataView(data);

      var options = {
        width: chartWidth,
        height: 300,
        animation:{
          duration: 500,
          startup: true
        },
        isStacked: true,
        bar: {groupWidth: "25%"},
        legend: { position: "none" },
        hAxis: {
          ticks: [{v:0, f:'Week 0'}, {v:7, f:'Week 1'}, {v:15, f:'Week 2'}]
        },
        chartArea: {left: 100, top:10, bottom:30, right:50, width:'100%', height:'100%'}
      };
      var chart = new google.visualization.BarChart(document.getElementById("top_x_div"));
      chart.draw(view, options);
    }
  }

  loadMappingTrialGraph() {
    google.charts.load('current', {
      callback: function () {
        setTimeout(function(){ 
          var chartWidth = $(".col-md-7").width();
          drawChart(chartWidth);
        }, 
        1000);
      },
      packages:['corechart']
    });

    $(window).resize(function(){
      drawChart(null);
    });

    function drawChart(chartWidth) {
      var data = google.visualization.arrayToDataTable([
        ["Element", "", { role: "style" } ],
        ["Texas", 8, "#2F7FD4"],
        ["California", 11, "#2F7FD4"],
        ["Chicago", 19, "#2F7FD4"],
        ["New York", 21, "#2F7FD4"],
        ["Illinois", 24, "#2F7FD4"],
        ["Oregon", 22, "#2F7FD4"]
      ]);

      var view = new google.visualization.DataView(data);

      var options = {
        width:chartWidth,
        height:300,
        animation:{
          duration: 500,
          startup: true
        },
        bar: {groupWidth: "25%"},
        legend: { position: "none" },
        chartArea: {left: 30, top:10, bottom:30, width:'100%', height:'100%'}
      };
      var chart = new google.visualization.ColumnChart(document.getElementById("columnchart_values"));
      chart.draw(view, options);
    }
  }

  loadPieChart() {
    google.charts.load('current', {
      callback: function () {
        setTimeout(function(){ 
          var chartWidth = $(".col-md-5").width();
          drawChart(chartWidth);
        }, 
        1000);
      },
      packages:['corechart']
    });

    $(window).resize(function(){
      drawChart(null);
    });

    function drawChart(chartWidth) {
      
      var data = google.visualization.arrayToDataTable([
        ['Task', 'Hours per Day'],
        ['Texas', 10],
        ['California', 5],
        ['Chicago', 3],
        ['New York', 15],
        ['Illinois', 5],
        ['Oregon', 6]
      ]);

      var options = {
        colors:['#636BF8', '#A432B8', '#F8437A', '#78E34C', '#F9D43D'],
        chartArea: {left: 0, top:0, bottom:0, right:"10%"},
        animation:{
          duration: 1500,
          startup: true
        },
        legend:{alignment:'center',textStyle:{color: '#58637E',fontSize: 13}}
      };

      var chart = new google.visualization.PieChart(document.getElementById('piechart'));
      chart.draw(data, options);
    }
  }

  loadEnrolledTrialGraph() {
    google.charts.load('current', {
      callback: function () {
        setTimeout(function(){ 
          var chartWidth = $(".col-md-6").width();
          drawChart(chartWidth);
        }, 
        1000);
      },
      packages:['corechart']
    });

    $(window).resize(function(){
      drawChart(null);
    });


    function drawChart(chartWidth) {
      var data = google.visualization.arrayToDataTable([
        ["Element", "", { role: "style" } ],
        ["Texas", 8, "#2F7FD4"],
        ["California", 10, "#2F7FD4"],
        ["Chicago", 19, "#2F7FD4"],
        ["New York", 21, "#2F7FD4"],
        ["Illinois", 24, "#CB2F5E"],
        ["Oregon", 30, "#CB2F5E"]
      ]);

      var view = new google.visualization.DataView(data);

      var options = {
        width:chartWidth,
        height:300,
        bar: {groupWidth: "25%"},
        legend: { position: "none" },
        animation:{
          duration: 500,
          startup: true
        },
        chartArea: {left: 40, top:10, bottom:30, right:15, width:'100%', height:'100%'}
      };
      var chart = new google.visualization.ColumnChart(document.getElementById("enrolledTrialchart_values"));
      chart.draw(view, options);
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
      
  onsearchClick(event){

    var statusId = this.state.statusId;
    var phaseId = this.state.phaseId;
    var sponsorId = this.state.sponsorId;
    var trialId = this.state.trialId;
    cookies.save('trial_statusId',  statusId, {path: '/' });
    cookies.save('trial_phase',  phaseId, {path: '/' });
    cookies.save('trial_sponsor',  sponsorId, {path: '/' });
    cookies.save('trial_Id',  trialId, {path: '/' });
    browserHistory.push('/trials');
  }

  redirect() {
    this.state = { 
      trialData : '',
      sponsorId : '',
      trialId : '',
      phaseId : '',
      statusId : '',
      search: {
        params: {
          "pageNumber": 1,
          "pageSize": 10,
          "sortBy": "createdAt",
          "sortOrder": "desc"
        }
      }
    }
    this.props.actions.loadtrialsSelectList(this.state)
    this.getAllTrialList(this.state);
    this.setState({saving: false});
  }

  render() {
    return (
      <div className="main-wrap">
        <Header/>
        <Leftmenu/>
        <section className="container-wrap">
          <section className="container-fluid new-dashboard">
            <div className="pageTitle-newdashboard">
              <h2 className="pull-left">Dashboard</h2>
            </div>
            <div className="row custom-column">
              <div className="dashboard-section">
                <div className="block-col">
                  <div className="dashboard-block purpalblock">
                    <div className="blockcon">
                      <div className="counter">
                        <span>{this.props.trialMetrics.activeTrialCount ? this.props.trialMetrics.activeTrialCount : 0}</span>
                      </div>
                      <div className="blocktitle">
                        <span>Active Trials</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block-col">
                  <div className="dashboard-block cyanblock">
                    <div className="blockcon">
                      <div className="counter">
                        <span>{this.props.trialMetrics.participantCountResult ? this.props.trialMetrics.participantCountResult : 0}</span>
                      </div>
                      <div className="blocktitle">
                        <span>Patients Enrolled</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block-col">
                  <div className="dashboard-block cyan-dark-block">
                    <div className="blockcon">
                      <div className="counter">
                        <span>{this.props.dsmbCount ? this.props.dsmbCount : 0}</span>
                      </div>
                      <div className="blocktitle">
                        <span>DSMB</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block-col">
                  <div className="dashboard-block redblock">
                    <div className="blockcon">
                      <div className="counter">
                        <span>{this.props.falloutPatientCount ? this.props.falloutPatientCount : 0}</span>
                      </div>
                      <div className="blocktitle">
                        <span>Patient at Risk of Fallout</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block-col">
                  <div className="dashboard-block grayblock">
                    <div className="blockcon">
                      <div className="counter">
                        <span>85%</span>
                      </div>
                      <div className="blocktitle">
                        <span>Drug Adherence</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>        
            </div>
            <div className="row custom-column">
              <div className="col-md-12">
                <section className="box-typical box-typical-dashboard top-box">
                  <header className="box-typical-header">
                    <div className="tbl-row">
                      <div className="tbl-cell tbl-cell-title">
                        <h3>Mapping Trial</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body">
                    <div className="">
                      <div className="row">
                        <div className="col-md-7 text-center graph-block mapping-trial">
                          <div id="columnchart_values"></div>
                        </div>
                        <div className="col-md-5 pie-chart graph-block">
                          <div id="piechart"></div>
                        </div>
                     </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <section className="box-typical box-typical-dashboard top-box">
                  <header className="box-typical-header">
                    <div className="tbl-row">
                      <div className="tbl-cell tbl-cell-title">
                        <h3>Status of Active Trials</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body">
                    <div className="graph-block">
                      <div id="top_x_div"></div>
                    </div>
                  </div>
                </section>
              </div>
              <div className="col-md-6">
                <section className="box-typical box-typical-dashboard top-box">
                  <header className="box-typical-header">
                    <div className="tbl-row">
                      <div className="tbl-cell tbl-cell-title">
                        <h3>Trial Enrollment V/S Fallout</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body">
                    <div className="graph-block">
                      <div id="enrolledTrialchart_values"></div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <section className="box-typical box-typical-dashboard top-box">
                  <header className="box-typical-header">
                    <div className="tbl-row">
                      <div className="tbl-cell tbl-cell-title">
                         <h3>Top Trials By Condition</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body scrollbar-inner">
                    <div className="table-block">
                      <table width="100%" className="condition-table ">
                        <tbody>
                          <tr>
                            <td>Cardiology</td>
                            <td>41</td>
                          </tr>
                          <tr>
                            <td>Cancer</td>
                            <td>40</td>
                          </tr>
                          <tr>
                            <td>Lympoma</td>
                            <td>24</td>
                          </tr>
                          <tr>
                            <td>Gastroin Tentinal</td>
                            <td>14</td>
                          </tr>
                          <tr>
                            <td>Depression</td>
                            <td>02</td>
                          </tr>
                          <tr>
                            <td>Depression</td>
                            <td>02</td>
                          </tr>
                          <tr>
                            <td>Depression</td>
                            <td>02</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
              <div className="col-md-8">
                <section className="box-typical box-typical-dashboard top-box">
                  <header className="box-typical-header">
                    <div className="tbl-row">
                      <div className="tbl-cell tbl-cell-title">
                         <h3>Patients at Risk of Fallout</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body scrollbar-inner">
                    <div className="table-block">
                      <table width="100%" className="patients-table">
                        <thead>
                          <tr>
                            <th>Patient ID</th>
                            <th>Gender</th>
                            <th>Age</th>
                            <th>Trial</th>
                            <th>Phase</th>
                            <th>Severity</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>1</td>
                            <td>Female</td>
                            <td>46</td>
                            <td>Demo Trial</td>
                            <td>Phase 1</td>
                            <td><span className="text-pink">High</span></td>
                          </tr>
                          <tr>
                            <td>2</td>
                            <td>Female</td>
                            <td>25</td>
                            <td>Aiden Trial</td>
                            <td>Phase 2</td>
                            <td><span className="text-orange">Medium</span></td>
                          </tr>
                          <tr>
                            <td>3</td>
                            <td>Male</td>
                            <td>32</td>
                            <td>Test Trial</td>
                            <td>Phase 3</td>
                            <td><span className="text-green">Low</span></td>
                          </tr>
                          <tr>
                            <td>4</td>
                            <td>Male</td>
                            <td>35</td>
                            <td>Medicine Trial</td>
                            <td>Phase 3</td>
                            <td><span className="text-green">Low</span></td>
                          </tr>
                          <tr>
                            <td>4</td>
                            <td>Male</td>
                            <td>35</td>
                            <td>Medicine Trial</td>
                            <td>Phase 3</td>
                            <td><span className="text-green">Low</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </section>
        <Footer/>
      </div>
    );
  }
}


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
    trialStatus: state.TrialStatus,
    notificationData: state.NotificationData,
    piechartStatus: state.PiechartStatus,
    userRoleName: state.UserRoleName,
    trialMetrics: state.TrialMetrics,
    dsmbCount: state.ActiveDSMB.count,
    falloutPatientCount : state.falloutPatients.count,
    sponsors: sponsorsFormattedForDropdown(state.sponsorsSelectList),
    trialsSelectList: trialsFormattedForDropdown(state.trialsSelectList),
    phaseLists: phasesFormattedForDropdown(phaseList),
    statusLists: statusesFormattedForDropdown(statusList),
    timeZone : UsertimeZone,
    falloutPatient : !_.isUndefined(state.falloutPatients.data) ? state.falloutPatients.data : state.falloutPatients
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(trialActions, dispatch),
    notification: bindActionCreators(notificationActions, dispatch),
    roleActions: bindActionCreators(roleActions, dispatch),
    sponsorsActions: bindActionCreators(sponsorsActions, dispatch),
    dsmbActions: bindActionCreators(dsmbActions, dispatch),
    patientActions: bindActionCreators(patientActions, dispatch)
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(Profile);