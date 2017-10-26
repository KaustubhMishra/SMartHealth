import React, {PropTypes} from 'react';
import ReactDOM from "react-dom";
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {browserHistory, Link} from 'react-router';
import toastr from 'toastr';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import Footer from '../common/Footer';
import { MonthView } from 'react-date-picker';
import 'react-date-picker/index.css';
import * as sensorDataActions from '../../actions/sensorDataActions';
import * as vitalDataActions from '../../actions/vitalDataActions';
import * as trialActions from '../../actions/trialActions';
import * as patientActions from '../../actions/patientActions';
import * as notificationActions from '../../actions/notificationActions';
import moment from 'moment';
import _ from 'lodash';
import DatePicker from 'react-datepicker';
import async from 'async';
import cookies from 'react-cookie';
import * as UTCtoUser from '../common/generalFunctions';
import TextArea from '../common/TextArea';
import { Conditional } from 'react-conditional-render';
import * as roleActions from '../../actions/roleActions';

let events = [];
let patient_trial_id;
let patient_phase_id;
let patient_id;

class PatientDetail extends React.Component {
  constructor(props, context) {
    super(props, context);

    events = [];
    patient_trial_id = cookies.load('patient_trial_id');
    patient_phase_id = cookies.load('patient_phase_id');
    patient_id = cookies.load('patient_id');

    this.state = {
      patientDetail: {},
      trialDetail: {},
      phaseDetail: {},
      sensorDetail: Object.assign({}, this.props.sensorDetail),
      vitalData : Object.assign({}, this.props.vitalData),
      NotificationData : Object.assign({}, this.props.NotificationData),
      calendarData : Object.assign([], this.props.calendarData),
      sendPushMessage:{}
    };
    this.updatePatientMessage = this.updatePatientMessage.bind(this);
    this.sendPushNotification = this.sendPushNotification.bind(this);
    
    this.getpatientDetail();
  }


  componentWillMount() {
    this.props.roleActions.loadUsersRolesName();
    this.OnPageLoadBarChart();
    $(document).ready(function(){
      $('.scrollbar-inner').scrollbar();
    });
  }

  getpatientDetail()
  {
    
    let that = this;
    let props= this.props;
    let notificationList = [];

    async.series([
                    function(callback){
                       props.notificationActions.loadNotificationCRO();
                       callback();
                    },
                    function(callback) 
                    {  
                      if(patient_trial_id)
                         {
                          props.trialActions.fetchDataById(patient_trial_id).then(function(response){
                              that.state.trialDetail = response[0];
                              const phaseDetail = response[0].phases.filter(phaseList => phaseList.id == patient_phase_id); 
                              that.state.phaseDetail = phaseDetail[0];
                              callback();
                          });
                        }
                        
                    },
                    function(callback) 
                    {
                        props.patientActions.loadAllPatients().then(function(response)
                        {
                              const patient = response.filter(patient => patient.patients[0].id == patient_id);
                              if (patient) {
                                  that.state.patientDetail = patient[0];
                                  that.state.sendPushMessage.Message  = "Hi " + that.state.patientDetail.firstname+ "\n\n"+ that.props.userObject.firstname;
                              }
                              callback();
                          });
                    },
                    function(callback)
                    {
                            let reqParam = {
                              "trial_id" : patient_trial_id,
                              "phase_id" : patient_phase_id,
                              "company_id" : that.state.trialDetail.company_id,
                              "patient_id" : that.state.patientDetail.id
                            }

                            let vitalreqParam = {
                              "type" : 2,
                              "trial_id" : patient_trial_id,
                              "patient_user_id" : that.state.patientDetail.id,
                              "phase_id" : patient_phase_id,
                              "start_date": that.state.phaseDetail.start_date,
                              "end_date": that.state.phaseDetail.tentitive_end_date,
                              "patient_id" : that.state.patientDetail.id
                            }

                          props.vitalactions.loadvitalData(vitalreqParam).then((response) => 
                                     that.CalenderData()
                                 )
                            .catch(error => {
                              toastr.error(error);
                              //this.setState({saving: false});
                            });
                          callback();  
                    },
                    function(callback){
                         let reqParam = {
                              "trial_id" : patient_trial_id,
                              "phase_id" : patient_phase_id,
                              "company_id" : that.state.trialDetail.company_id,
                              "patient_id" : that.state.patientDetail.id
                            }

                        props.actions.loadCassndraData(reqParam).then(function(){
                                  props.actions.loadsensorData(that.state).then((response) => 
                                       that.OnPageLoadDyGraph()
                                   )
                              .catch(error => {
                                toastr.error(error)
                              });
                        });

                        callback();
                    }
                 ])

    this.state.trialDetail = that.state.trialDetail;
    this.state.phaseDetail = that.state.phaseDetail;
    this.state.patientDetail = that.state.patientDetail;
    this.state.sendPushMessage = that.state.sendPushMessage;

  } 
  
  CalenderData(){
    let timeZone = this.props.timeZone;
    if(this.props.calendarData.length > 0)
    {
      let calendarDataList = this.props.calendarData;
      
      
      for(var c=0;c<calendarDataList.length;c++)
      {
        let eventList = {
            "start" : UTCtoUser.UTCtoUserTimezone(calendarDataList[c].schedule_on,timeZone),
            "title" : '',
            className: calendarDataList[c].isUpcoming ? calendarDataList[c].status == true ? ["fc-event-green"] : ["fc-event-gray"] : calendarDataList[c].status == false ? ["fc-event-red"] : ["fc-event-green"] 
        }

        events.push(eventList);
        
      }
      
    }

    $(document).ready(function() {
            $('#calendar').fullCalendar({
              header: {
                left: 'prev,next',
                center: 'title',
                right: 'today'
                //right: 'month,agendaWeek,agendaDay,listWeek'
              },
              defaultDate:  UTCtoUser.UTCtoUserTimezone(moment(),timeZone),
              navLinks: false, // can click day/week names to navigate views
              editable: false,
              eventLimit: 2,
              events: events
            });
        
      });
  }


  OnPageLoadDyGraph(){
      if(this.props.vitalData.length > 0 && !_.isUndefined(this.props.sensorDetail))
      {
        let templateDetail = this.props.sensorDetail;
        let vitalData = _.sortBy(this.props.vitalData, 'receiveddate').reverse();
        let timeZone = this.props.timeZone;
        
        for(let t=0;t<templateDetail.length;t++)
        {
            let dataArray = [];
                dataArray[0] = ["", ""];
            let id = "dye_div" + t; 

            for(var v=0;v<vitalData.length;v++)
              { 

                var myObject = JSON.parse(vitalData[v].data);
                var date = UTCtoUser.UTCtoUserTimezoneWithUnixTime(myObject.date,timeZone)
                date = date.split(' ')[0];
                _.forOwn(myObject, function(num, key) {
                            key == templateDetail[t].name ?  dataArray.push([date,parseFloat(num)]) : 0;
                      });
                  
              }

          
          
            if(dataArray.length > 1)
                {
                  google.charts.setOnLoadCallback(drawChart);
                    

                      function drawChart() 
                        {
                          var data = google.visualization.arrayToDataTable(dataArray.splice(0,11));
                          var options = {
                                legend: {position: 'none'},
                                title: templateDetail[t].description,
                                hAxis: {
                                  slantedText:true,
                                  slantedTextAngle:30,
                                },
                                colors:['#4ABCBD'],
                                pointSize: 10,
                                pointShape: 'circle',
                                chartArea: {left: 90, top: 15, right: 10}
                              };

                            let chart = new google.visualization.AreaChart(document.getElementById(id));
                            chart.draw(data, options);   
                        
                      } 

                }
                else
                {
                    //document.getElementById(id).innerHTML = "<b>" + templateDetail[t] + "</b>";
                     google.charts.setOnLoadCallback(drawChart);

                      function drawChart() {
                          var data = google.visualization.arrayToDataTable([
                              [{
                                  f: 'Date',
                                  type: 'date'
                              }, {
                                  f: 'Line',
                                  type: 'number'
                              }], ]);

                          var options = {
                              title: templateDetail[t].name,
                              chartArea: {left: 30, top: 15, right: 10}
                          };

                          if (data.getNumberOfRows() == 0) {
                              data.addRow([new Date(), 0])
                              options.series = {
                                  0: {
                                      color: 'transparent'
                                  }
                              }
                          }


                          var chart = new google.visualization.AreaChart(document.getElementById(id));

                          chart.draw(data, options);
                      }
                }
        
           
        }

      }
      else if(!_.isUndefined(this.props.sensorDetail))
      {
        let templateDetail = this.props.sensorDetail;

            for(let t=0;t<templateDetail.length;t++)
            {
                let dataArray = [];
                    dataArray[0] = ["", ""];
                let id = "dye_div" + t; 

                 google.charts.setOnLoadCallback(drawChart);

                      function drawChart() {
                          var data = google.visualization.arrayToDataTable([
                              [{
                                  f: 'Date',
                                  type: 'date'
                              }, {
                                  f: 'Line',
                                  type: 'number'
                              }], ]);

                          var options = {
                              title: templateDetail[t].name
                          };

                          if (data.getNumberOfRows() == 0) {
                              data.addRow([new Date(), 0])
                              options.series = {
                                  0: {
                                      color: 'transparent'
                                  }
                              }
                          }


                          var chart = new google.visualization.AreaChart(document.getElementById(id));

                          chart.draw(data, options);
                      }

           }
      }
  }

  OnPageLoadBarChart() {
    
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
        ["Fatigue", 8, "#2F7FD4"],
        ["Diarrhea", 10, "#4ABCBD"],
        ["Headache", 19, "#2F7FD4"],
        ["Shortness of breath", 21, "#F1AE2D"],
        ["Upset stomach", 24, "#9DC025"],
        ["Constipation", 22, "#85AECC"]
      ]);

      var view = new google.visualization.DataView(data);

      var options = {
        width: chartWidth,
        height: 300,
        bar: {groupWidth: "25%"},
        legend: { position: "none" },
        chartArea: {left: 30, top:10, bottom:30, width:'90%', height:'100%'}
      };
      var chart = new google.visualization.ColumnChart(document.getElementById("chart_div"));
      chart.draw(view, options);
    }      
    
  }

  updatePatientMessage(event) {
    const field = event.target.name;
    let patientMessage = this.state.sendPushMessage;
    patientMessage[field] = event.target.value;
    return this.setState({sendPushMessage: patientMessage});
  }
  
  sendPushNotification() {
    var patientObject = {
      userId: this.state.patientDetail.id,
      trialId: this.state.phaseDetail.trial_id,
      phaseId: this.state.phaseDetail.id,
      companyId: this.state.trialDetail.company_id,
      patientId: this.state.patientDetail.patients[0].id,
      Message: this.state.sendPushMessage.Message
    };
    this.props.notificationActions.sendNotification(patientObject);
  }

  

  render() {      
    return (
      <div className="main-wrap">
        <Header/>
        <Leftmenu/>
        <section id="container" className="container-wrap">
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li className="active">Patient Details</li>
          </ol>
          <section className="container-fluid">
            <div className="patient-head">
              <div className="patient-title">
                Patient ID:<span>{this.state.patientDetail.patients ? this.state.patientDetail.firstname  : ""} {this.state.patientDetail.patients ? this.state.patientDetail.lastname  : ""}</span>
              </div>
              <div className="patient-details">
                <div className="details">
                  DOB: <span></span>
                </div>
                <div className="details">
                  Gender: <span>{this.state.patientDetail.patients ? this.state.patientDetail.patients[0].gender : "" }</span>
                </div>
                <div className="details">
                  Trial: <span>{this.state.trialDetail.name}</span>
                </div>
              </div>   
            </div>
            <section className="row">             
              <div className="col-md-5">
                <div className="calendar-part">
                  <div className="calendar-title">Day wise Medication Details</div>
                  <div id='calendar'></div>
                 </div>
              </div>
              <div className="col-md-7">
                <div className="box-typical box-typical-dashboard top-box">
                  <header className="box-typical-header">
                    <div className="tbl-row">
                      <div className="tbl-cell tbl-cell-title">
                        <h3>Side Effects</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body">
                    <div className="graph-block2">
                      <div id="chart_div"></div>
                    </div>
                  </div>
                </div>
              </div>               
            </section> 
            <div className="row custom-column">
              <div className="col-md-12">
                <section className="box-typical box-typical-dashboard top-box">
                  <header className="box-typical-header">
                    <div className="tbl-row">
                      <div className="tbl-cell tbl-cell-title">
                        <h3>Vital Chart</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body">
                    {(
                      !_.isUndefined(this.props.sensorDetail)) && ( 
                      <div className="">
                        <div className="row">
                          {              
                            this.props.sensorDetail.map((Data, index) =>
                              <div className="col-md-6 text-center">
                                <div className="graph-block" id={"dye_div" + index}  style={{width: 100 +'%', height: 300+'px', color: 'black'}}>
                                </div>
                              </div>
                            )
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
            <div className="row custom-column">
              <div className="col-md-12">
                <section className="box-typical box-typical-dashboard top-box">
                  <header className="box-typical-header">
                    <div className="tbl-row">
                      <div className="tbl-cell tbl-cell-title">
                        <h3>Feedback</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body scrollbar-inner">
                    <div className="table-block">
                      <table width="100%" className="patients-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Feedback</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <span className="text-date"> 09/29/2017 </span>
                            </td>
                            <td>Suffering from nausea from last 2 days.</td>
                          </tr>
                          <tr>
                            <td>
                              <span className="text-date">09/30/2017</span>
                            </td>
                            <td>Severe headache after taking medicine.</td>
                          </tr>
                          <tr>
                            <td> 
                              <span className="text-date">10/01/2017</span>
                            </td>
                            <td>Feeling better from last two days as there is no upset stomach and headache.</td>
                          </tr>
                          <tr>
                            <td>
                              <span className="text-date">10/02/2017</span>
                            </td>
                            <td>Suffering from mild headache with joint pains.</td>
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

function getNotification(AllNotificationData,patientId,trialId,phaseId){
   const notification = AllNotificationData.filter(notification => notification.patient.id == patientId && notification.trial.id == trialId && notification.phase.id == phaseId);
  if (notification) {
    return notification;
  }
  return null;
}

function mapStateToProps(state, ownProps) {
  let sendPushMessage= {
    Message: ''
  };

  return {
          NotificationData : getNotification(state.NotificationData,patient_id,patient_trial_id,patient_phase_id),
          sensorDetail: state.sensorData,
          vitalData : state.cassandraData,
          calendarData : state.vitalDataList,
          timeZone : state.userData.timezone,
          sendPushMessage: sendPushMessage,
          userObject: state.userData,
          userRole: state.UserRoleName
    };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(sensorDataActions, dispatch),
    vitalactions: bindActionCreators(vitalDataActions, dispatch),
    trialActions: bindActionCreators(trialActions, dispatch),
    patientActions: bindActionCreators(patientActions, dispatch),
    notificationActions: bindActionCreators(notificationActions, dispatch),
    roleActions: bindActionCreators(roleActions, dispatch)
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(PatientDetail);

