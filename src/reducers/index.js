import { combineReducers } from 'redux';
import courses from './courseReducer';
import authors from './authorReducer';
import signup from './signupReducer';
import signIN from './signInReducer';
import userData from './getLoggedUserInfo';
import ajaxCallsInProgress from './ajaxStatusReducer';
import userRolePermission from './RolePermissionReducer';
import sponsors from './sponsorReducer';
import sponsorsSelectList from './sponsorsSelectListReducer';
import drugTypes from './drugTypeReducer';
import dsmbs from './dsmbReducer';
import dosages from './dosageReducer';
import deviceList from './deviceReducer';
import trials from './trialReducer';
import trial from './singletrialReducer';
import trialsSelectList from './trialsSelectListReducer';
//import trial from './trialReducer';
import frequencies from './frequencyReducer';
import Patients from './patientReducer';
import phasePatients from './phasePatientReducer';
import falloutPatients from './falloutPatientsReducer';
import Users from './userReducer';
import UserRole from './userRoleReducer';
import UserRoleName from './userRoleNameReducer';
import TimezoneList from './timezoneListReducer';
import CountryList from './countryReducer';
import StateList from './stateReducer';
import TrialStatus from './trialStatusReducer';
import NotificationData from './patientNotificationListReducer';
import PiechartStatus from './piechartStatusReducer';
import sensorData from './sensorDataReducer';
import cassandraData from './cassandraDataReducer';
import DeviceGroupList from './deviceGroupReducer';
import DeviceListData from './deviceListReducer';
import sponsorDSMB from './sponsorListDSMBReducer';
import CroCoordinator from './croCoordinatorReducer';
import sideEffects from './sideEffectsReducer';
import allpatients from './allPatientsReducer';
import TrialMetrics from './trialMetricsReducer';
import ActiveDSMB from './activeDSMBReducer';
import TrialMilestoneStatus from './trialMilestoneStatusReducer';
import vitalDataList from './vitalDataReducer';
import PatientEnrolledTrial from './patientEnrolledTrial';
import EnrolledTrial from './enrolledTrialReducer';

const rootReducer = combineReducers({
  courses,
  authors,
  signup,
  signIN,
  ajaxCallsInProgress,
  userData,
  userRolePermission,
  sponsors,
  sponsorsSelectList,
  drugTypes,
  dsmbs,
  dosages,
  trials,
  trial,
  trialsSelectList,
  frequencies,
  Patients,
  phasePatients,
  falloutPatients,
  Users,
  UserRole,
  TimezoneList,
  CountryList,
  StateList,
  TrialStatus,
  NotificationData,
  deviceList,
  PiechartStatus,
  sensorData,
  cassandraData,
  DeviceGroupList,
  DeviceListData,
  UserRoleName,
  sponsorDSMB,
  CroCoordinator,
  sideEffects,
  allpatients,
  TrialMetrics,
  ActiveDSMB,
  TrialMilestoneStatus,
  vitalDataList,
  PatientEnrolledTrial,
  EnrolledTrial
});

export default rootReducer;
