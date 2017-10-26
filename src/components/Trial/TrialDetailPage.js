import React from 'react';
import { Link, browserHistory } from 'react-router';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import Footer from '../common/Footer';
import * as dsmbActions from '../../actions/dsmbActions';
import * as trialActions from '../../actions/trialActions';
import * as patientActions from '../../actions/patientActions';

let drugGraphWidth='';
let trialId = '';

class TrialDetailPage extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.props.dsmbActions.loadActiveDsmbs();
    this.getTrial();
    this.getMilestoneStatus();
    this.loadFalloutTrendGraph();
    this.loadSitesTrialGraph();
    this.loadDrugAdherenceGraph();
    this.getTrialPatient =  this.getTrialPatient.bind(this);
    
  }

  getTrial() {
    this.props.actions.loadTrialsDetailMetrics(trialId);  
  }

  getMilestoneStatus() {
    this.props.actions.loadTrialsMilestoneStatus(trialId).then(()=> this.loadCurrentMilestonesGraph());
  }

  loadFalloutTrendGraph() {
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
        ["Illinois", 24, "#2F7FD4"],
        ["Oregon", 22, "#2F7FD4"]
      ]);

      var view = new google.visualization.DataView(data);

      var options = {
        width:chartWidth,
        height:300,
        bar: {groupWidth: "25%"},
        legend: { position: "none" },
        animation:{
          duration: 1500,
          startup: true
        },
        chartArea: {left: 40, top:10, bottom:30, right:15, width:'100%', height:'100%'}
      };
      var chart = new google.visualization.ColumnChart(document.getElementById("columnchart_values"));
      chart.draw(view, options);
    }
  }

  loadCurrentMilestonesGraph() {
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
        bar: {groupWidth: "25%"},
        legend: { position: "none" },
        hAxis: {
          ticks: [{v:0, f:'Week 0'}, {v:7, f:'Week 1'}, {v:15, f:'Week 2'}]
        },
        animation:{
          duration: 1500,
          startup: true
        },
        chartArea: {left: 100, top:10, bottom:30, right:50, width:'100%', height:'100%'}
      };
      var chart = new google.visualization.BarChart(document.getElementById("barchart_values"));
      chart.draw(view, options);
    }
  }

  loadSitesTrialGraph() {
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
        ["Texas", 8.94, "#2F7FD4"],
        ["California", 10.49, "#2F7FD4"],
        ["Chicago", 19.30, "#2F7FD4"],
        ["New York", 21.45, "#2F7FD4"],
        ["Illinois", 24.45, "#2F7FD4"],
        ["Oregon", 22.45, "#2F7FD4"]
      ]);

      var view = new google.visualization.DataView(data);

      var options = {
        width: chartWidth,
        height: 300,
        bar: {groupWidth: "25%"},
        legend: { position: "none" },
        animation:{
          duration: 1500,
          startup: true
        },
        chartArea: {left: 50, top:10, bottom:30, right:15, width:'100%', height:'100%'}
      };
      var chart = new google.visualization.ColumnChart(document.getElementById("siteschart_values"));
      chart.draw(view, options);
    }
  }

  loadDrugAdherenceGraph() {

    google.charts.load('current', {
      callback: function () {
        setTimeout(function(){ 
          var chartWidth = $(".col-md-12").width();
          drawChart(chartWidth);
        }, 
        1000);
      },
      packages:['line']
    });

    $(window).resize(function(){
      drawChart(null);
    });

    function drawChart(chartWidth) {
      var newWidth= chartWidth-30;
      var data = new google.visualization.DataTable();
      data.addColumn('number', 'Day');
      data.addColumn('number', 'Week 0');
      data.addColumn('number', 'Week 1');
      data.addColumn('number', 'Week 2');

      data.addRows([
        [1,  37.8, 80.8, 41.8],
        [2,  30.9, 69.5, 32.4],
        [3,  25.4,   57, 25.7],
        [4,  11.7, 18.8, 10.5],
        [5,  11.9, 17.6, 10.4],
        [6,   8.8, 13.6,  7.7],
        [7,   7.6, 12.3,  9.6],
        [8,  12.3, 29.2, 10.6],
        [9,  16.9, 42.9, 14.8],
        [10, 12.8, 30.9, 11.6],
        [11,  5.3,  7.9,  4.7],
        [12,  6.6,  8.4,  5.2],
        [13,  4.8,  6.3,  3.6],
        [14,  4.2,  6.2,  3.4]
      ]);

      var options = {
        width:newWidth,
        height:300,
        bar: {groupWidth: "25%"},
        animation:{
          duration: 2000,
          startup: true
        },
        chartArea: {left: 30, top:10, bottom:30, right:15, width:'100%', height:'100%'}
      };

      var chart = new google.charts.Line(document.getElementById('linechart_material'));

      chart.draw(data, google.charts.Line.convertOptions(options));
    }
  }

  getTrialPatient() {
    this.props.patientActions.loadTrialsPatient(trialId).then(()=>this.redirect());
  }

  redirect() {
    if(this.props.trialMetrics.participantCountResult == 0) {

    } else {
      browserHistory.push('/patientList/'+ trialId);  
    }
    
  }


  render() {
    return (
      <div className="main-wrap">
        <Header/>
        <Leftmenu/>
        <section className="container-wrap">
          <div className="breadcrumb breadcrumb-simple">
            <div className="report-title">{this.props.trialMetrics.trialName}</div>
            <div className="tbl">
                <div className="tbl-row">
                  <div className="tbl-cell tbl-cell-title">
                    <h4>Phase : {this.props.trialMetrics.activeTrialPhase}</h4>
                  </div>
                  <div className="tbl-cell text-right">
                    <span>Start Date: {this.props.trialMetrics.trialStartDate}</span> |
                    <span>Tentative End Date: {this.props.trialMetrics.trialEndDate}</span>
                  </div>
                </div>
            </div>
          </div>
          <section className="container-fluid new-dashboard">
            <div className="pageTitle-newdashboard">
              <h2 className="pull-left">Statistics</h2>
            </div>
            <div className="row custom-column">
              <div className="dashboard-section">
                <div className="block-col-reports">
                  <div className="dashboard-block purpalblock">
                    <div className="blockcon">
                      <div className="counter">
                        <span>{this.props.dsmbCount ? this.props.dsmbCount : 0}</span>
                      </div>
                      <div className="blocktitle">
                        <span>Total DSMB</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block-col-reports">
                  <div className="dashboard-block cyanblock">
                    <div className="blockcon">
                      <div className="counter">
                        <a href="javascript:void(0)"><span onClick={this.getTrialPatient}>{this.props.trialMetrics.participantCountResult ? this.props.trialMetrics.participantCountResult : 0}</span></a>
                      </div>
                      <div className="blocktitle">
                        <span>Patients Enrolled</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block-col-reports">
                  <div className="dashboard-block cyan-dark-block">
                    <div className="blockcon">
                      <div className="counter">
                        <span>0</span>
                      </div>
                      <div className="blocktitle">
                        <span>Total Sites</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block-col-reports">
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
            <div className="row">
              <div className="col-md-6">
                <section className="box-typical box-typical-dashboard top-box">
                  <header className="box-typical-header">
                    <div className="tbl-row">
                      <div className="tbl-cell tbl-cell-title">
                        <h3>Fallout Trend</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body">
                    <div className="graph-block">
                      <div id="columnchart_values"></div>
                    </div>
                  </div>
                </section>
              </div>
              <div className="col-md-6">
                <section className="box-typical box-typical-dashboard top-box">
                  <header className="box-typical-header">
                    <div className="tbl-row">
                      <div className="tbl-cell tbl-cell-title">
                        <h3>Current Milestones</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body">
                    <div className="graph-block">
                      <div id="barchart_values"></div>
                    </div>
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
                        <h3>Sites</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body">
                    <div className="graph-block">
                      <div className="row">
                        <div className="col-md-7 text-center">
                          <div id="siteschart_values"></div>
                        </div>
                        <div className="col-md-5">
                          <div className="location-table-data">
                            <table width="100%" className="location-table">
                              <thead>
                                <tr>
                                  <th>Location</th>
                                  <th>Total Coordinators</th>
                                </tr>
                              </thead>
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
                              </tbody>
                            </table>
                          </div>
                        </div>
                     </div>
                    </div>
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
                        <h3>Drug Adherence</h3>
                      </div>
                    </div>
                  </header>
                  <div className="box-typical-body drug-Adherence">
                    <div className="graph-block">
                      <div id="linechart_material"></div>  
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
  trialId = ownProps.params.id;
  return {
    dsmbCount: state.ActiveDSMB.count,
    trialMetrics: state.TrialMetrics,
    trialMilestoneStatus: state.TrialMilestoneStatus,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dsmbActions: bindActionCreators(dsmbActions, dispatch),
    actions: bindActionCreators(trialActions, dispatch),
    patientActions: bindActionCreators(patientActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TrialDetailPage);
