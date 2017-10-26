import * as types from '../actions/actionTypes';

export default function SponsorListDSMB(state = [], action) {
  switch (action.type) {
    case types.LOAD_SPONSORS_SELECT_LIST_DSMB_SUCCESS:
       return action.sponsorsSelectListDSMB;

    default:
      return state;
  }
}
