import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as trialActions from '../../actions/trialActions';
import * as croCoordinatorActions from '../../actions/croCoordinatorActions';
import * as dsmbActions from '../../actions/dsmbActions';
import * as sponsorsActions from '../../actions/sponsorActions';
import Footer from '../common/Footer';
import * as drugTypeActions from '../../actions/drugTypeActions';
import * as dosagesActions from '../../actions/dosageActions';
import * as frequencyActions from '../../actions/frequencyActions';
import * as notificationActions from '../../actions/notificationActions';


import * as deviceActions from '../../actions/deviceActions';
import * as patientActions from '../../actions/patientActions';
import TrialForm from './TrialForm';
import {browserHistory, Link, Router} from 'react-router';
import toastr from 'toastr';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import trialvalidateInput from '../common/validations/Trial';
import phasevalidateInput from '../common/validations/Phase';
import milestonevalidateInput from '../common/validations/Milestone';
import cookies from 'react-cookie';
import { Conditional } from 'react-conditional-render';
import {sponsorsFormattedForDropdown} from '../../selectors/selectors';
import {dsmbsFormattedForDropdown} from '../../selectors/selectors';
import {drugTypesFormattedForDropdown} from '../../selectors/selectors';
import {dosagesFormattedForDropdown} from '../../selectors/selectors';
import {frequenciesFormattedForDropdown} from '../../selectors/selectors';
import {croCoordinatorFormattedForDropdown} from '../../selectors/selectors';
import moment from 'moment';
import _ from 'lodash';
import * as UTCtoUser from '../common/generalFunctions';
import async from 'async';
import * as getLoggedUserActions from '../../actions/getLoggedUserActions';
//import QueueAnim from 'rc-queue-anim';
//import '../assets/animating-class.less';

global.phaseCount = 4;
let allValidationSuccess= false;
let UsertimeZone = '';


export class ManageTrialPage extends React.Component {
  constructor(props, context) {
    super(props, context);

    let trialArray = {};
    let phaseArray = [];
    let filterdeviceArray = [];
    let deviceArray = [];

    this.state = {
      trial: Object.assign({}, trialArray),
      phase: phaseArray,
      singleMilestone:{"name" : "" , "description" : "","start_date" : "", "tentitive_end_date" : ""},
      singleUpdateMilestone:{"name" : "" , "description" : "","start_date" : "" , "tentitive_end_date" : ""},
      singleUpdateMilestoneIndex : "",
      singlePatients:[],
      deviceList : filterdeviceArray,
      device : deviceArray,
      singleDevice:[],
      trialerrors: {},
      trialDisplayErrors:[],
      //timeZone : this.props.timeZone,
      saving: false,
      dsmbs: [],
      drugTypes: [],
      dosages: [],
      frequencies: [],
      croCoordinator: [],
      sponsors: [],
      MedicationTimeList: []
    };
    
    this.getCroCoordinatorList();
    this.loadTab();
    this.getTrialData(trialArray,phaseArray,deviceArray,filterdeviceArray);

    this.saveTrial = this.saveTrial.bind(this);
    this.updateTrialState = this.updateTrialState.bind(this);
    this.updatePhaseState = this.updatePhaseState.bind(this);
    this.updateMilestoneState = this.updateMilestoneState.bind(this);
    this.updateMilestoneEditState = this.updateMilestoneEditState.bind(this);
    this.addMileStone = this.addMileStone.bind(this);
    this.onDeleteMilestone = this.onDeleteMilestone.bind(this);
    this.onEditMilestone = this.onEditMilestone.bind(this);
    this.updateMileStone = this.updateMileStone.bind(this);
    this.onPatientChanged = this.onPatientChanged.bind(this);
    this.onAddPatients = this.onAddPatients.bind(this);
    this.onCancelPatients = this.onCancelPatients.bind(this);
    this.onCancelDevices = this.onCancelDevices.bind(this);
    this.onDeletePatient = this.onDeletePatient.bind(this);
    this.getPatientDetail = this.getPatientDetail.bind(this);
    this.onDeviceChanged = this.onDeviceChanged.bind(this);
    this.onAddDevices = this.onAddDevices.bind(this);
    this.onDeleteDevice = this.onDeleteDevice.bind(this);
    this.clearMilestone = this.clearMilestone.bind(this);
    this.updateTrialDrugTypeState = this.updateTrialDrugTypeState.bind(this);
    this.onTab_Click = this.onTab_Click.bind(this);
    this.PreVitalChange = this.PreVitalChange.bind(this);
    this.onRowAdd = this.onRowAdd.bind(this);
    this.onRowDel = this.onRowDel.bind(this);
    this.onRowUpdate = this.onRowUpdate.bind(this);
    this.OpenModal = this.OpenModal.bind(this);
  }

  loadTab() {
    $(document).ready(function(){

      $(window).scrollTop(0);

      $('#manage-trial-tab').responsiveTabs({
        startCollapsed: 'accordion'
      });
     
      $('#phase-tab').responsiveTabs({
          //startCollapsed: 'accordion'
      });
    });
  }
  
  OpenModal(id,Phaseindex){

    this.setState({Phase: this.state.Phase});
    $('#'+id).modal();
    return this.setState({Phase: this.state.Phase});

  };

  onRowUpdate(value,index){
    const str = 'HH:mm:ss';
      if(value != null)
        this.state.MedicationTimeList[index].value = value.format(str);
      return this.setState({MedicationTimeList: this.state.MedicationTimeList});

  }

  onRowDel(index,id){
   
    var odds = _.reject(this.state.MedicationTimeList, function(num){ return num.id == id; });
    return this.setState({MedicationTimeList: odds});
  }

  onRowAdd(TimePeriod){
    let MedicationTimeList = [];
    if(TimePeriod > 0)
    {
      const str = 'HH:mm:ss';
      for(var t=0 ; t<TimePeriod ; t++)
      {
        var id = (+ new Date() + Math.floor(Math.random() * 999999)).toString(36);
        var newTime = {
          id: id,
          name: "time",
          value: moment().format(str)
        }
        MedicationTimeList.push(newTime);
      }
    }
    return this.setState({MedicationTimeList: MedicationTimeList});
  }
  OnPageLoad() {
    $(document).ready(function(){

      $(window).scrollTop(0);

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
      
        $("#phase-0").addClass('r-tabs-panel r-tabs-accordion-title r-tabs-state-active');
        $("#phase-1").addClass('r-tabs-panel r-tabs-accordion-title r-tabs-state-default');
        $("#phase-2").addClass('r-tabs-panel r-tabs-accordion-title r-tabs-state-default');
        $("#phase-3").addClass('r-tabs-panel r-tabs-accordion-title r-tabs-state-default');
        $('.trial-startDate').datetimepicker({
          format: 'MM/DD/YYYY'
        });
        
        $('.trial-endDate').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.phase-startDate0').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        
        $('.phase-endDate0').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.phase-startDate1').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.phase-endDate1').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.phase-startDate2').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.phase-endDate2').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.phase-startDate3').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.phase-endDate3').datetimepicker({
          format: 'MM/DD/YYYY'
        });
        
        $('.milestone-startDate0').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.milestone-endDate0').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.milestone-startDate1').datetimepicker({
          format: 'MM/DD/YYYY'
        });
        
        $('.milestone-endDate1').datetimepicker({
          format: 'MM/DD/YYYY'
        });
        
        $('.milestone-startDate2').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.milestone-endDate2').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.milestone-startDate3').datetimepicker({
          format: 'MM/DD/YYYY'
        });

        $('.milestone-endDate3').datetimepicker({
          format: 'MM/DD/YYYY'
        });


        $('#Addmilestone0').click(function(){
          $('.bootstrap-datetimepicker-widget').removeClass("bottom");
          $('.bootstrap-datetimepicker-widget').addClass("top");
        });

        $('#Addmilestone1').click(function(){
          $('.bootstrap-datetimepicker-widget').removeClass("bottom");
          $('.bootstrap-datetimepicker-widget').addClass("top");
        });
        
        $('#Addmilestone2').click(function(){
          $('.bootstrap-datetimepicker-widget').removeClass("bottom");
          $('.bootstrap-datetimepicker-widget').addClass("top");
        });

        $('#Addmilestone3').click(function(){
          $('.bootstrap-datetimepicker-widget').removeClass("bottom");
          $('.bootstrap-datetimepicker-widget').addClass("top");
        });
        
      /*$('#add-trial-start').Zebra_DatePicker({show_clear_date : false});

      $('#add-trial-end').Zebra_DatePicker({show_clear_date : false});

      $('#add-phase-start0').Zebra_DatePicker({show_clear_date : false});

      $('#add-phase-end0').Zebra_DatePicker({show_clear_date : false});

       $('#add-phase-start1').Zebra_DatePicker({show_clear_date : false});

      $('#add-phase-end1').Zebra_DatePicker({show_clear_date : false});

      $('#add-phase-start2').Zebra_DatePicker({show_clear_date : false});

      $('#add-phase-end2').Zebra_DatePicker({show_clear_date : false});

      $('#add-phase-start3').Zebra_DatePicker({show_clear_date : false});

      $('#add-phase-end3').Zebra_DatePicker({show_clear_date : false});

      $('#add-milestone-start0').Zebra_DatePicker({show_clear_date : false});

      $('#add-milestone-end0').Zebra_DatePicker({show_clear_date : false});


       $('#add-milestone-start1').Zebra_DatePicker({show_clear_date : false});

      $('#add-milestone-end1').Zebra_DatePicker({show_clear_date : false});

       $('#add-milestone-start2').Zebra_DatePicker({show_clear_date : false});

      $('#add-milestone-end2').Zebra_DatePicker({show_clear_date : false});

       $('#add-milestone-start3').Zebra_DatePicker({show_clear_date : false});

      $('#add-milestone-end3').Zebra_DatePicker({show_clear_date : false});

      $('#edit-milestone-start0').Zebra_DatePicker({show_clear_date : false});

      $('#edit-milestone-end0').Zebra_DatePicker({show_clear_date : false});


       $('#edit-milestone-start1').Zebra_DatePicker({show_clear_date : false});

      $('#edit-milestone-end1').Zebra_DatePicker({show_clear_date : false});

       $('#edit-milestone-start2').Zebra_DatePicker({show_clear_date : false});

      $('#edit-milestone-end2').Zebra_DatePicker({show_clear_date : false});

       $('#edit-milestone-start3').Zebra_DatePicker({show_clear_date : false});

      $('#edit-milestone-end3').Zebra_DatePicker({show_clear_date : false});
*/
    });

  }

  onTab_Click(id) {
        $("#phase-0").removeClass('r-tabs-state-active');
        $("#phase-1").removeClass('r-tabs-state-active');
        $("#phase-2").removeClass('r-tabs-state-active');
        $("#phase-3").removeClass('r-tabs-state-active');
         $("#phase-0").attr('style','display:none');
         $("#phase-1").attr('style','display:none');
         $("#phase-2").attr('style','display:none');
         $("#phase-3").attr('style','display:none');

        if(id == 1) {
          //$("#phase-"+id).removeClass('r-tabs-state-default');
          $("#phase-"+id).addClass('r-tabs-state-active');
          $("#phase-"+id).attr('style','display:block');
        }
        else if(id == 2) {
          //$("#phase-"+id).removeClass('r-tabs-state-default');
          $("#phase-"+id).addClass('r-tabs-state-active');
          $("#phase-"+id).attr('style','display:block');
        }
        else if(id == 3) {
          //$("#phase-"+id).removeClass('r-tabs-state-default');
          $("#phase-"+id).addClass('r-tabs-state-active');
          $("#phase-"+id).attr('style','display:block');
        } 
        else
        {
          $("#phase-0").addClass('r-tabs-state-active');
          $("#phase-"+id).attr('style','display:block');
        }
  }

  getTrialData(trialArray,phaseArray,deviceArray,filterdeviceArray){
    
    let props= this.props;
    let that = this;
    let trialId = this.props.params.id;
    let phasePatients = [];
    let phaseRes = [];
    let patientArray = [];
    let milestoneArray = [];
    let vitalDosageData = [];

      async.series([
                      function(callback) {  
                        if(trialId){
                            props.patientActions.loadPahsePatients(trialId).then(function(response){
                               phasePatients = response;
                                callback();
                           })  
                        }
                        else
                        {
                           props.patientActions.loadPahsePatients(0).then(function(response){
                               phasePatients = response;
                                callback();
                           })  
                           
                        }
                        
                      },
                      function(callback) {

                         if(trialId)
                         {
                            props.actions.fetchDataById(trialId).then(function(response){

                            trialArray = {
                              id : response[0].id,
                              name : response[0].name,
                              active : response[0].active,
                              company_id : response[0].company_id,
                              croCoordinator_id : response[0].croCoordinator_id,
                              description : response[0].description,
                              dosage_id : response[0].dosage_id,
                              drug_description : response[0].drug_description,
                              drug_name : response[0].drug_name,
                              drug_type_id : response[0].drug_type_id,
                              frequency_id : response[0].frequency_id,
                              dsmb_id : response[0].dsmb_id,
                              sponsor_id : response[0].sponsor_id,
                              start_date : UTCtoUser.UTCtoUserTimezone(response[0].start_date,UsertimeZone),
                              end_date : UTCtoUser.UTCtoUserTimezone(response[0].end_date,UsertimeZone),
                              trial_type : response[0].trial_type,
                              pre_vital_type: response[0].pre_vital_type,
                              post_vital_type: response[0].post_vital_type
                            };
                            
                            if(moment().format("MM/DD/YYYY") >= trialArray.start_date) {
                              /*document.getElementById("PreVital").disabled = true;
                              document.getElementById("PostVital").disabled = true;
                              document.getElementById("btnAddDevice").disabled = true;*/
                            }
                            phaseRes = response[0].phases;
                            //deviceArray = response[0].trial_devices;
                            
                            if(response[0].trial_dosage_frequencies.length > 0)
                            {
                              const str = 'HH:mm:ss';
                              

                              for (var f = 0; f < response[0].trial_dosage_frequencies.length; f++) 
                              {
                                 var vitalDosageArray = {
                                                  id: response[0].trial_dosage_frequencies[f].id,
                                                  name: "time",
                                                  value: UTCtoUser.UTCtoUserTimezoneOnlyTime(moment(new Date()).format("YYYY-MM-DD " + response[0].trial_dosage_frequencies[f].frequency_time),UsertimeZone)
                                                }

                                 vitalDosageData.push(vitalDosageArray);               
                              }

                            }
                            if(response[0].trial_devices.length > 0)
                            {
                              for (var i = 0; i < response[0].trial_devices.length; i++) 
                              {
                                 let deviceListData = 
                                                {
                                                  "trial_id" : response[0].trial_devices[i].trial_id,
                                                  "active" : response[0].trial_devices[i].active,
                                                  "id" : response[0].trial_devices[i].device.id,
                                                  "device_group_id" : response[0].trial_devices[i].device.device_group_id,
                                                  "firmware" : response[0].trial_devices[i].device.firmware,
                                                  "manufacturer" : response[0].trial_devices[i].device.manufacturer,
                                                  "name" : response[0].trial_devices[i].device.name,
                                                  "version" : response[0].trial_devices[i].device.version,
                                                };

                                 deviceArray.push(deviceListData);               
                              }
                            }

                              for (let p = 0; p < phaseRes.length; p++) 
                              {
                                patientArray = [];
                                milestoneArray = [];
                                let phaseFilterPatient =  phasePatients;
                                
                                if(UTCtoUser.UTCtoUserTimezone(phaseRes[p].start_date,UsertimeZone) <= UTCtoUser.UTCtoUserTimezone(moment(),UsertimeZone))
                                {
                                    document.getElementById("add-trial-start").disabled = true;
                                    $(".date-picker trial-startDate").attr("disabled", "disabled").off('click');
                                    $(".date-picker span").css("pointer-events", "none");
                                   if(phaseRes[p].sr_no == 1)
                                   {
                                      $(document).ready(function(){
                                        $('#phase-0 *').attr("disabled", true);
                                        //$('#phase-0 textarea').attr("disabled", true);
                                        $("#phase-0 a").on("click", function (e) {
                                          e.stopPropagation();
                                        });
                                        $("#phase-0 button").on("click", function (e) {
                                          e.stopPropagation();
                                        });      
                                      });
                                   }
                                    
                                   if(phaseRes[p].sr_no == 2)
                                   {
                                        $(document).ready(function(){
                                            $('#phase-0 input[type=text]').attr("disabled", true);
                                            $('#phase-0 textarea').attr("disabled", true);
                                            $("#phase-0 a").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                            $("#phase-0 button").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                            $('#phase-1 input[type=text]').attr("disabled", true);
                                            $('#phase-1 textarea').attr("disabled", true);
                                            $("#phase-1 a").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                            $("#phase-1 button").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                        });
                                   }
                                   else if(phaseRes[p].sr_no == 3)
                                   {
                                        $(document).ready(function(){
                                          $('#phase-0 input[type=text]').attr("disabled", true);
                                          $('#phase-0 textarea').attr("disabled", true);
                                          $("#phase-0 a").on("click", function (e) {
                                            e.stopPropagation();
                                          });
                                          $("#phase-0 button").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                          $('#phase-1 input[type=text]').attr("disabled", true);
                                          $('#phase-1 textarea').attr("disabled", true);
                                          $("#phase-1 a").on("click", function (e) {
                                            e.stopPropagation();
                                          });
                                          $("#phase-1 button").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                           $('#phase-2 input[type=text]').attr("disabled", true);
                                            $('#phase-2 textarea').attr("disabled", true);
                                            $("#phase-2 a").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                            $("#phase-2 button").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                        });
                                   }
                                    else if(phaseRes[p].sr_no == 4)
                                   {
                                        $(document).ready(function(){
                                          $('#phase-0 input[type=text]').attr("disabled", true);
                                          $('#phase-0 textarea').attr("disabled", true);
                                          $("#phase-0 a").on("click", function (e) {
                                            e.stopPropagation();
                                          });
                                          $("#phase-0 button").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                          $('#phase-1 input[type=text]').attr("disabled", true);
                                          $('#phase-1 textarea').attr("disabled", true);
                                          $("#phase-1 a").on("click", function (e) {
                                            e.stopPropagation();
                                          });
                                          $("#phase-1 button").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                            $('#phase-2 input[type=text]').attr("disabled", true);
                                            $('#phase-2 textarea').attr("disabled", true);
                                            $("#phase-2 a").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                            $("#phase-2 button").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                            $('#phase-3 input[type=text]').attr("disabled", true);
                                            $('#phase-3 textarea').attr("disabled", true);
                                            $("#phase-3 a").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                            $("#phase-3 button").on("click", function (e) {
                                              e.stopPropagation();
                                            });
                                        });
                                   }
                                }

                                for(var j=0;j<phaseRes[p].phase_patients.length;j++)
                                {
                                  let patientList = 
                                    {
                                      "firstname" : phaseRes[p].phase_patients[j].patient.user.firstname,
                                      "lastname" : phaseRes[p].phase_patients[j].patient.user.lastname,
                                      "email" : phaseRes[p].phase_patients[j].patient.user.email,
                                      "patients" : [{
                                                      "id" : phaseRes[p].phase_patients[j].patient_id,
                                                      "age" : phaseRes[p].phase_patients[j].patient.age,
                                                      "gender" : phaseRes[p].phase_patients[j].patient.gender
                                                  }]
                                    };
                                     patientArray.push(patientList);

                                     var data = _.reject(phaseFilterPatient, function(num){ 
                                                  return num.patients[0].id == patientList.patients[0].id ; 
                                                });

                                     phaseFilterPatient = data;
                                }
                                
                                for(var k=0;k<phaseRes[p].milestones.length;k++)
                                {
                                 let milestoneList = 
                                    {
                                      "id" : phaseRes[p].milestones[k].id,
                                      "name" : phaseRes[p].milestones[k].name,
                                      "description" : phaseRes[p].milestones[k].description,
                                      "phase_id" : phaseRes[p].milestones[k].phase_id,
                                      "start_date" : phaseRes[p].milestones[k].start_date ? UTCtoUser.UTCtoUserTimezone(phaseRes[p].milestones[k].start_date,UsertimeZone) : null ,
                                      "tentitive_end_date" : phaseRes[p].milestones[k].tentitive_end_date ? UTCtoUser.UTCtoUserTimezone(phaseRes[p].milestones[k].tentitive_end_date,UsertimeZone) : null ,
                                      "updatedAt" : phaseRes[p].milestones[k].updatedAt,
                                      "createdAt" : phaseRes[p].milestones[k].createdAt,
                                      "active" : phaseRes[p].milestones[k].active,
                                    };
                                     milestoneArray.push(milestoneList);

                                     
                                }

                                phaseArray.push({
                                                 id : phaseRes[p].id,
                                                 sr_no: phaseRes[p].sr_no,
                                                 trial_id: phaseRes[p].trial_id, 
                                                 description:phaseRes[p].description, 
                                                 start_date: phaseRes[p].start_date ? UTCtoUser.UTCtoUserTimezone(phaseRes[p].start_date,UsertimeZone) : null , 
                                                 tentitive_end_date: phaseRes[p].tentitive_end_date ? UTCtoUser.UTCtoUserTimezone(phaseRes[p].tentitive_end_date,UsertimeZone) : null , 
                                                 participant_count:phaseRes[p].participant_count, 
                                                 active:phaseRes[p].active, 
                                                 milestone: milestoneArray, 
                                                 patient: patientArray,
                                                 allPhasePatient : phaseFilterPatient,
                                                 phaseerrors : {},
                                                 milestoneerrors : {},
                                              });

                            }

                            that.setState({ trial : trialArray,phase : phaseArray,device: deviceArray, MedicationTimeList : vitalDosageData });
                            props.dosagesActions.loadDosages(trialArray.drug_type_id);
                            callback();
                             })
                          
                         }
                         else
                           {
                                trialArray = {
                                                name : '',
                                                active : '',
                                                company_id : '',
                                                croCoordinator_id : '',
                                                description : '',
                                                dosage_id : '',
                                                drug_description : '',
                                                drug_name : '',
                                                drug_type_id : '',
                                                frequency_id : '',
                                                dsmb_id : '',
                                                sponsor_id : '',
                                                start_date : '',
                                                end_date : '',
                                                trial_type : '',
                                                pre_vital_type: '',
                                                post_vital_type: ''
                                            };

                                         for (var i = 1; i <= phaseCount; i++) 
                                            {
                                              phaseArray.push({sr_no: i, description:'', start_date:'', tentitive_end_date:'', participant_count:'', 
                                                              milestone: [], patient: [],allPhasePatient : phasePatients,phaseerrors : {},milestoneerrors : {}});
                                            }  
                                
                                that.setState({ trial : trialArray,phase : phaseArray,device: deviceArray });
                                callback();
                            }
                      },
                      function(callback) {

                          props.deviceActions.loadDeviceList().then(function(response){
                          filterdeviceArray = response;

                          if(that.state.device.length > 0)
                          {
                            for (var d = 0; d < that.state.device.length; d++) 
                            {
                                var data = _.reject(filterdeviceArray, function(num){ 
                                                return num.id == that.state.device[d].id ; 
                                              });

                                   filterdeviceArray = data;

                            }
                          }
                          that.setState({ deviceList : filterdeviceArray});
                          callback();
                        })
                      },
                      function(){
                        that.OnPageLoad();
                      }
                  ]);

    this.state = that.state;
  }
  

  getCroCoordinatorList() {
    this.props.getLoggedUserActions.getUserInfo();
    this.props.croCoordinatorActions.loadCroCoordinator();
    this.props.dsmbActions.loadDsmbs();
    this.props.sponsorsActions.loadSponsorsList();  
  } 

  isValid() {
    const { trialDisplayErrors, trialerrors, isTrialValid } = trialvalidateInput(this.state.trial);
    const { PhaseCount,isPhaseValid } = phasevalidateInput(this.state);
    let isValid = true;
 
    if (!isTrialValid || !isPhaseValid || (PhaseCount == 0)) {
      this.setState({ trialerrors });
      this.state.trialDisplayErrors = trialDisplayErrors ; 

      if(PhaseCount == 0)
        toastr.error("Atleast One Phase is Required.");

      isValid = false;
    }

    return isValid;
  }

  saveTrial(event) {
    event.preventDefault();
    if (this.isValid()) {
      this.setState({ trialerrors: {} });
      if(this.state.trial.pre_vital_type == true && this.state.device.length <= 0) {
        toastr.error("Please add the Device");
        allValidationSuccess = false;
      } else if(this.state.trial.post_vital_type == true && this.state.device.length <= 0) {
        toastr.error("Please add the Device");
        allValidationSuccess = false;
      } else if(this.state.trial.pre_vital_type == true && this.state.trial.post_vital_type == true && this.state.device.length <= 0) {
        toastr.error("Please add the Device");
        allValidationSuccess = false;
      } else if(this.state.trial.pre_vital_type == false && this.state.device.length >0) {
        toastr.error("Please select the Vital");
        allValidationSuccess = false;
      } 
      else {
        allValidationSuccess = true;
      }
      if(allValidationSuccess) {
        this.props.actions.saveTrial(this.state)
        .then(() => 
          this.redirect())
          /*.catch(error => {
            toastr.error(error);
            this.setState({saving: false});
          });*/
      }
    }
  }

  onEditMilestone (milestone,Mindex,Pindex) {
    
    let milestoneArray = {
      "name" : milestone.name,
      "description" : milestone.description,
      "start_date" : milestone.start_date,
      "tentitive_end_date" : milestone.tentitive_end_date,
    }
    this.state.singleUpdateMilestone = milestoneArray;
    milestoneArray = {"name" : "" , "description" : "","start_date" : "" , "tentitive_end_date" : ""};
    this.state.singleUpdateMilestoneIndex = Mindex;
    return this.setState({singleUpdateMilestone: this.state.singleUpdateMilestone});
  }

  updateMileStone(Phaseindex) {

    let Mindex = this.state.singleUpdateMilestoneIndex;
    let UpdatedMilestone = {};
     UpdatedMilestone = this.state.singleUpdateMilestone;

    const { isMilestoneValid,milestoneerrors } = milestonevalidateInput(UpdatedMilestone,this.state.phase[Phaseindex]);

    if(!isMilestoneValid)
    {
      this.state.phase[Phaseindex].milestoneerrors = milestoneerrors;
      return this.setState({phase: this.state.phase});
    }
    else
    {
      $('#Editmilestone' + Phaseindex).modal('hide');
      this.state.phase[Phaseindex].milestone[Mindex] = UpdatedMilestone;
      this.state.singleUpdateMilestone = {"name" : "" , "description" : "","start_date" : "" , "tentitive_end_date" : ""};
      return this.setState({phase: this.state.phase});
    }
  }

  checkDrugType() {
    
    if(this.props.trial.drug_type_id!= undefined) {
      this.props.dosagesActions.loadDosages(this.props.trial.drug_type_id);
    } else {
      this.props.dosagesActions.loadDosages(0);
    }
  }

  updateTrialState(event) {
    const field = event.target.name;
    let trial = this.state.trial;
    trial[field] = event.target.value;
    if(field == 'frequency_id')
    {
      this.onRowAdd(event.target.value);
    }
    return this.setState({trial: trial});
  }

  PreVitalChange(event){
    const field = event.target.name;
    if(field == 'pre_vital_type') {
      let trial = this.state.trial;
      trial[field] = event.target.checked;
      return this.setState({trial: trial});
    } else {
      let trial = this.state.trial;
      trial[field] = event.target.checked;
      return this.setState({trial: trial});
    }
  }

  updateTrialDrugTypeState(event) {
    const field = event.target.name;
    let trial = this.state.trial;
    trial[field] = event.target.value;
    this.props.dosagesActions.loadDosages(trial[field]);
    return this.setState({trial: trial});
  }

  updatePhaseState(event,index) {
    const field = event.target.name;

    if(field === 'description')
    {
      this.state.phase[index].description = event.target.value;
    }
    else if(field === 'start_date')
    {
      this.state.phase[index].start_date = event.target.value;
    }
    else if(field === 'tentitive_end_date')
    {
      this.state.phase[index].tentitive_end_date = event.target.value;
    }
    else if(field === 'participant_count')
    {
      this.state.phase[index].participant_count = event.target.value;
    }
    return this.setState({phase: this.state.phase});
  }

  updateMilestoneState(event,Phaseindex) {
    let newsingleMilestone = this.state.singleMilestone;

    const field = event.target.name;
    
    if(field === 'name')
    {
      newsingleMilestone.name = event.target.value;
    }
    if(field === 'description')
    {
      newsingleMilestone.description = event.target.value;
    }
    if(field === 'start_date')
    {
      newsingleMilestone.start_date = event.target.value;
    }
    if(field === 'tentitive_end_date')
    {
      newsingleMilestone.tentitive_end_date = event.target.value;
    }
  
     return this.setState({singleMilestone: newsingleMilestone});

  }

  updateMilestoneEditState(event,Phaseindex) {
    
    let newsingleUpdateMilestone = this.state.singleUpdateMilestone;


    const field = event.target.name;
    
    if(field === 'name')
    {
      newsingleUpdateMilestone.name = event.target.value;
    }
    if(field === 'description')
    {
      newsingleUpdateMilestone.description = event.target.value;
    }
    if(field === 'start_date')
    {
      newsingleUpdateMilestone.start_date = event.target.value;
    }
    if(field === 'tentitive_end_date')
    {
      newsingleUpdateMilestone.tentitive_end_date = event.target.value;
    }
    
     return this.setState({singleUpdateMilestone: newsingleUpdateMilestone});

  }


  addMileStone(Phaseindex){
    let addNewMilestone = {};

    addNewMilestone = this.state.singleMilestone;

    const { isMilestoneValid,milestoneerrors } = milestonevalidateInput(addNewMilestone,this.state.phase[Phaseindex]);

    if(!isMilestoneValid)
    {
      this.state.phase[Phaseindex].milestoneerrors = milestoneerrors;
      return this.setState({phase: this.state.phase});
    }
    else
    {
      $('#Addmilestone' + Phaseindex).modal('hide');
      this.state.phase[Phaseindex].milestone.push(addNewMilestone);
      this.state.singleMilestone = {"name" : "" , "description" : "","start_date" : "" , "tentitive_end_date" : ""};
      return this.setState({phase: this.state.phase});
    }
    
  }
  
  onDeleteMilestone(milestone,Mindex,Pindex){
    if(milestone)
    {
         
          this.state.phase[Pindex].milestone.splice(Mindex, 1);
          return this.setState({phase: this.state.phase});  
      
    }

  }
  
  clearMilestone(Phaseindex){
    this.state.phase[Phaseindex].milestoneerrors = {};
    this.state.singleMilestone = {"name" : "" , "description" : "","start_date" : "" , "tentitive_end_date" : ""};
    this.state.singleUpdateMilestone = {"name" : "" , "description" : "","start_date" : "" , "tentitive_end_date" : ""};
    return this.setState({phase: this.state.phase});  
  }

  onPatientChanged(event,index,Phaseindex,patient){

    let patientArray = {
        "PhaseIndex" : Phaseindex,
        "PatientIndex" : index,
        "id" : patient.patients[0].id,
        "firstname" : patient.firstname,
        "lastname" : patient.lastname,
        "email" : patient.email,
        "age" : patient.patients[0].age,
        "gender" : patient.patients[0].gender,
    } 

    if(event.target.checked)
    {
        this.state.singlePatients.push(patient);
    }
    else
    {
      var data = _.reject(this.state.singlePatients, function(num){ 
            return num.patients[0].id == patientArray.id ; 
          });
      this.state.singlePatients = data;
    }
  }

  onAddPatients(Phaseindex){
    let addPatients = this.state.singlePatients;

     if(addPatients.length > 0)
     { 
      for (var i = 0; i < addPatients.length; i++) {
        let phaseFilterPatient =  this.state.phase[Phaseindex].allPhasePatient;
         let newpatientArray = 
                {
                "firstname" : addPatients[i].firstname,
                "lastname" : addPatients[i].lastname,
                "email" : addPatients[i].email,
                "patients":[{
                  "id" : addPatients[i].patients[0].id,
                  "age" : addPatients[i].patients[0].age,
                  "gender" : addPatients[i].patients[0].gender
                  }
                ]
            } 
       var data = _.reject(phaseFilterPatient, function(num){ 
            return num.patients[0].id == newpatientArray.patients[0].id ; 
          });

        this.state.phase[Phaseindex].allPhasePatient = data;
        this.state.phase[Phaseindex].patient.push(newpatientArray);
     }


  }
    this.state.singlePatients = [];
     $("input[type=checkbox]").each(function () {
                $(this).prop("checked", false);
            });


    return this.setState({phase: this.state.phase});
  }

  onDeletePatient(patient,Phaseindex,index){
    if(patient)
    { 
         this.state.phase[Phaseindex].allPhasePatient.push(patient);
          this.state.phase[Phaseindex].patient.splice(index, 1);
          return this.setState({phase: this.state.phase});  
      
    }

  }

  getPatientDetail(phaseId,patientId){

    cookies.save('patient_trial_id',  this.state.trial.id, {path: '/' });
    cookies.save('patient_phase_id',  phaseId, {path: '/' });
    cookies.save('patient_id',  patientId, {path: '/' });

    browserHistory.push('/patientDetail/')
  }

  onCancelPatients(id,Phaseindex){

        $("input[type=checkbox]").each(function () {
                $(this).prop("checked", false);
        });

       this.state.singlePatients = [];

       return this.setState({phase: this.state.phase});  
  } 

  onDeviceChanged(event,index,device){
    if(event.target.checked)
    {
        this.state.singleDevice.push(device);
    }
    else
    {
      var data = _.reject(this.state.singleDevice, function(num){ 
            return num.id == device.id ; 
          });
      this.state.singleDevice = data;
    }
  }


   onAddDevices(){
    let addDevices = this.state.singleDevice;

    for(var i =0 ; i < addDevices.length ; i++)
    {
      let newdeviceArray = 
                {
                "name" : addDevices[i].name,
                "manufacturer" : addDevices[i].manufacturer,
                "firmware" : addDevices[i].firmware,
                "version":addDevices[i].version,
                "createdAt" : addDevices[i].createdAt,
                "device_group_id" : addDevices[i].device_group_id,
                "id" : addDevices[i].id,
                "updatedAt":addDevices[i].updatedAt
            } 

      this.state.device.push(newdeviceArray);


      let filterDevice = this.state.deviceList;
 
      var data = _.reject(filterDevice, function(num){ 
            return num.id == newdeviceArray.id ; 
          });

      $("#grdDevice input[type=checkbox]").each(function () {
                $(this).prop("checked", false);
            });
      this.state.deviceList = data;
    }

    this.state.singleDevice = [];
   return this.setState(this.state); 
  }


   onDeleteDevice(device,index){
    if(device)
    { 
         this.state.deviceList.push(device);
          this.state.device.splice(index, 1);
          return this.setState(this.state);  
      
    }

  }

  onCancelDevices(){
        $("#grdDevice input[type=checkbox]").each(function () {
                $(this).prop("checked", false);
            });
  }

  redirect() {
    this.setState({saving: false});

    if(this.props.params.id)
    {
      this.props.notificationActions.setNotificationsAction(this.props.params.id).then(function(){
      });
      toastr.success('Trial Updated.');
    }
    else
    {
      this.props.notificationActions.setNotificationsAction(this.state.trial.id).then(function(){
      });
      toastr.success('Trial Saved.');
    }


    this.context.router.push('/trials');
  }

  render() {
    return (
      <div>
        <Header/>
        <Leftmenu/>
        <section id="container" className="container-wrap">
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/trials">Trial</Link></li>
            <Conditional condition={this.props.params.id == undefined}>
              <li className="active">Add Trial</li>
            </Conditional>
            <Conditional condition={this.props.params.id != undefined}>
              <li className="active">Update Trial</li>
            </Conditional>
          </ol>  
          <section className="container-fluid">
            <div id="toolbar">
              <Conditional condition={this.props.params.id == undefined}>
                <div className="head">
                  <h3>Add Trial</h3>
                </div>
              </Conditional>
              <Conditional condition={this.props.params.id != undefined}>
                <div className="head">
                  <h3>Update Trial</h3>
                </div>
              </Conditional>
            </div>
            <div className="card">
              <TrialForm
                trial={this.state.trial}
                phase={this.state.phase}
                deviceList={this.state.deviceList}
                device = {this.state.device}
                singleMilestone = {this.state.singleMilestone}
                singleUpdateMilestone = {this.state.singleUpdateMilestone}
                milestone={this.state.milestone}
                onTrialChange={this.updateTrialState}
                PreVitalChange={this.PreVitalChange}
                onTrialDrugTypeChange={this.updateTrialDrugTypeState}
                onPhaseChange={this.updatePhaseState}
                onMilestoneChange={this.updateMilestoneState}
                onMilestoneEditChange={this.updateMilestoneEditState}
                addMileStone = {this.addMileStone}
                updateMileStone = {this.updateMileStone}
                onDeleteMilestone = {this.onDeleteMilestone}
                onEditMilestone = {this.onEditMilestone}
                clearMilestone = {this.clearMilestone}
                onPatientChanged = {this.onPatientChanged}
                onDeviceChanged = {this.onDeviceChanged}
                onAddDevices = {this.onAddDevices}
                onAddPatients = {this.onAddPatients}
                onCancelPatients = {this.onCancelPatients}
                onDeletePatient = {this.onDeletePatient}
                getPatientDetail = {this.getPatientDetail}
                onDeleteDevice = {this.onDeleteDevice}
                onCancelDevices = {this.onCancelDevices}
                trialerrors={this.state.trialerrors}
                UsertimeZone = {UsertimeZone}
                allSponsors={this.props.sponsors}
                allDsmbs={this.props.dsmbs}
                allCroCoordinator={this.props.croCoordinator}
                allDrugTypes={this.props.drugTypes}
                allDosages={this.props.dosages}
                allFrequencies={this.props.frequencies}
                onTab_Click = {this.onTab_Click}
                handlePatientPageChange = {this.handlePatientPageChange}
                MedicationTimeList = {this.state.MedicationTimeList}
                onRowAdd = {this.onRowAdd}
                onRowDel = {this.onRowDel}
                onRowUpdate = {this.onRowUpdate}
                OpenModal = {this.OpenModal}
              />
            </div>
            <div className="row">  
              <button 
                type="submit" 
                className="btn btn-border"
                onClick={this.saveTrial}>
                <img src={require('../../assets/img/save-icon-white.png')} />Save
              </button>
              <Link className="btn btn-border"  to="/trials">
                <img src={require('../../assets/img/close-icon-white.png')} /> Cancel
              </Link>
            </div> 
          </section> 
        </section>
        <Footer/>
      </div>
    );
  }
}


ManageTrialPage.contextTypes = {
  router: PropTypes.object
};


 function mapStateToProps(state, ownProps) {
  UsertimeZone = state.userData.timezone;
  return {
    sponsors: sponsorsFormattedForDropdown(state.sponsorsSelectList),
    dsmbs: dsmbsFormattedForDropdown(state.dsmbs),
    drugTypes: drugTypesFormattedForDropdown(state.drugTypes),
    dosages: dosagesFormattedForDropdown(state.dosages),
    frequencies: frequenciesFormattedForDropdown(state.frequencies),
    croCoordinator: croCoordinatorFormattedForDropdown(state.CroCoordinator),
    timeZone : UsertimeZone
  };
}

 
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(trialActions, dispatch),
    deviceActions: bindActionCreators(deviceActions, dispatch),
    patientActions: bindActionCreators(patientActions, dispatch),
    drugTypeActions: bindActionCreators(drugTypeActions, dispatch),
    dosagesActions: bindActionCreators(dosagesActions, dispatch),
    frequencyActions: bindActionCreators(frequencyActions, dispatch),
    notificationActions: bindActionCreators(notificationActions, dispatch),
    croCoordinatorActions: bindActionCreators(croCoordinatorActions, dispatch),
    dsmbActions: bindActionCreators(dsmbActions, dispatch),
    sponsorsActions: bindActionCreators(sponsorsActions, dispatch),
    getLoggedUserActions: bindActionCreators(getLoggedUserActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageTrialPage);
