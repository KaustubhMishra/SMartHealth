/*eslint-disable import/default*/
import 'babel-polyfill';
import React from 'react';
import {render} from 'react-dom';
import {Router, browserHistory} from 'react-router';
import routes from './routes';
import configureStore from './store/configureStore';
import {Provider} from 'react-redux';
import {loadSponsorsList} from './actions/sponsorActions';
import {loadDrugTypes} from './actions/drugTypeActions';
import {loadDsmbs} from './actions/dsmbActions';
import {loadDosages} from './actions/dosageActions';
import {loadFrequencies} from './actions/frequencyActions';
import {loadAllPatients} from './actions/patientActions';
import {loadUsersRoles} from './actions/roleActions';
import {loadTimezoneList} from './actions/timezoneActions';
import {loadCountryList} from './actions/countryStateActions';
import {loadNotification} from './actions/notificationActions'
import {loadDeviceList} from './actions/deviceActions';
import {loadTrialsStatus} from './actions/trialActions';
import {loadTrialsPieChartStatus} from './actions/trialActions';
import {loadDeviceGroupList} from './actions/deviceGroupActions';

import './assets/css/tabs.css';
import '../node_modules/toastr/build/toastr.min.css';
import './assets/fullcalendar/fullcalendar.min.css';
import './assets/fullcalendar/fullcalendar.print.css';
import './assets/css/reset.css';
import './assets/css/jktCuteDropdown.css';
import '../src/assets/css/master.css';
import './assets/css/simple-scrollbar.css';
import './assets/js/jktCuteDropdown.min.js';

const store = configureStore();

store.dispatch(loadDrugTypes());
store.dispatch(loadFrequencies());
store.dispatch(loadUsersRoles());
store.dispatch(loadTimezoneList());
store.dispatch(loadCountryList());

render(
  <Provider store={store}>
    <Router history={browserHistory} routes={routes}/>
  </Provider>,
  document.getElementById('app')
);
