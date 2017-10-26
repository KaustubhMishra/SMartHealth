import SponsorApi from '../api/sponsorApi';
import * as types from './actionTypes';
import {beginAjaxCall, ajaxCallError} from './ajaxStatusActions';
import {createStore} from 'redux';
import sponsors from '../reducers/sponsorReducer';
import sponsorsSelectList from '../reducers/sponsorsSelectListReducer';

export function loadSponsorsSuccess(sponsors) {
  return {type: types.LOAD_SPONSORS_SUCCESS, sponsors};
}

export function loadSponsorsListSuccess(sponsorsSelectList) {
  return {type: types.LOAD_SPONSORS_SELECT_LIST_SUCCESS, sponsorsSelectList};
}

export function loadSponsorsListDSMBSuccess(sponsorsSelectListDSMB) {
  return {type: types.LOAD_SPONSORS_SELECT_LIST_DSMB_SUCCESS, sponsorsSelectListDSMB};
}

export function createSponsorSuccess(sponsor) {
  return {type: types.CREATE_SPONSOR_SUCCESS, sponsor};
}

export function updateSponsorSuccess(sponsor) {
  return {type: types.UPDATE_SPONSOR_SUCCESS, sponsor};
}

export function deleteSponsorSuccess(sponsor) {
  return {type: types.DELETE_SPONSOR_SUCCESS, sponsor};
}

export function loadSponsors(search) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return SponsorApi.getAllSponsors(search).then(sponsors => {
      dispatch(loadSponsorsSuccess(sponsors));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadSponsorsById(id) {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return SponsorApi.getSponsorsById(id).then(sponsors => {
      return sponsors;
    }).catch(error => {
      throw(error);
    });
  };
}
export function loadSponsorsList() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return SponsorApi.getAllSelectSponsors().then(sponsorsSelectList => {
      dispatch(loadSponsorsListSuccess(sponsorsSelectList));
      //return sponsorsSelectList;
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadSponsorsListForDSMB() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return SponsorApi.getDSMBSponsors().then(sponsorsSelectList => {
      dispatch(loadSponsorsListSuccess(sponsorsSelectList));
    }).catch(error => {
      throw(error);
    });
  };
}

export function loadSponsorsListForCRO() {
  return function (dispatch) {
    dispatch(beginAjaxCall());
    return SponsorApi.getCROSponsors().then(sponsorsSelectList => {
      dispatch(loadSponsorsListSuccess(sponsorsSelectList));
    }).catch(error => {
      throw(error);
    });
  };
}


export function saveSponsor(sponsor, imageData) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return SponsorApi.saveSponsor(sponsor, imageData).then(response => {
      sponsor.id ? dispatch(updateSponsorSuccess(response)) : dispatch(createSponsorSuccess(response));
    }).catch(error => {
      dispatch(ajaxCallError(error));
      throw(error);
    });
  };
}

export function deleteSponsor(sponsor) {
  return function (dispatch, getState) {
    dispatch(beginAjaxCall());
    return SponsorApi.deleteSponsor(sponsor).then(() => {
      dispatch(deleteSponsorSuccess(sponsor));
      return;
    }).catch(error => {
      //dispatch(ajaxCallError(error));
      //throw(error);
    });
  }
}
