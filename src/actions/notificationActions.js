import * as types from './actionTypes';
import NotificationApi from '../api/notificationApi';
import cookies from 'react-cookie';
import toastr from 'toastr';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


export function loadPatientNotificationList(data) {
  return {type:types.LOAD_PATIENT_NOTIFICATION_LIST, data};
}

export function loadNotification() {
  return function (dispatch) {
    return NotificationApi.getNotificationListWeb().then(data => {
      dispatch(loadPatientNotificationList(data));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadNotificationCRO() {
  return function (dispatch) {
    return NotificationApi.getNotificationListWebCRO().then(data => {
      dispatch(loadPatientNotificationList(data));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadTrialsNotification(trialId) {
  return function (dispatch) {
    return NotificationApi.getTrialNotificationList(trialId).then(data => {
      return data;
    }).catch(error => {
      throw(error);
    });
  };
}

export function setNotificationsAction(trialId) {
  return function (dispatch) {
    return NotificationApi.setNotificationsAPI(trialId).then(data => {
      return data;
    }).catch(error => {
      throw(error);
    });
  };
}

export function sendNotification(patientObject) {
  return function (dispatch) {
    return NotificationApi.sendNotificationsAPI(patientObject).then(data => {
      return data;
    }).catch(error => {
      throw(error);
    });
  };
}


