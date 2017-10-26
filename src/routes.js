import React from 'react';
import {Route, Router, IndexRoute, browserHistory} from 'react-router';
import App from './components/App';
import Profile from './components/dashboard/profile';
import MyProfile from './components/dashboard/myProfile';
import ChangePassword from './components/dashboard/changePassword';
import SponsorsPage from './components/sponsor/SponsorsPage';
import ManageSponsorPage from './components/sponsor/ManageSponsorPage';
import TrialsPage from './components/trial/TrialsPage';
import ManageTrialPage from './components/trial/ManageTrialPage';
import LoginPage from './components/login/LoginPage';
import UsersPage from './components/users/users';
import ManageUserPage from './components/users/ManageUserPage';
import ForgotPasswordPage from './components/forgotPassword/ForgotPasswordPage';
import ResetPasswordPage from './components/resetPassword/ResetPasswordPage';
import PatientDetailPage from './components/patients/patientDetail';
import PatientPage from './components/patients/patientsPage';
import Analytics from './components/analytics/Analytics';
import NotificationList from './components/notifications/notificationList';
import sideEffectsPage from './components/sideEffectPool/sideEffectsPage';
import ManageSideEffectPage from './components/sideEffectPool/ManageSideEffectPage';
import DevicePage from './components/device/DevicePage';
import ManageDevicePage from './components/device/ManageDevicePage';
import TrialDetailPage from './components/trial/TrialDetailPage';
import { createStore, combineReducers } from 'redux';
import cookies from 'react-cookie';
import * as reducers from './reducers';
import { routerReducer, syncHistoryWithStore } from 'react-router-redux';
import { Provider } from 'react-redux';
import pageNotFound from './components/common/PageNotFound';
import PatientEnrolledTrialPage from './components/patients/patientEnrolledTrialPage';

global.loginAuthStatus = false;

const baseHistory = browserHistory
const reducer = combineReducers(Object.assign({}, reducers, {
  routing: routerReducer
}));

const store = createStore(reducer)
const history = syncHistoryWithStore(baseHistory, store)

function isLoggedIn(nextState, replace) {
    if(nextState.location.pathname.indexOf('/',1) > 0)
    {
        cookies.save('active', nextState.location.pathname.substring(0, nextState.location.pathname.indexOf('/',1)), { path: '/' });
    }else{
        cookies.save('active', nextState.location.pathname, { path: '/' });
    }
    
  if(cookies.load('access_token') && cookies.load('refresh_token'))
  {
    return true;
  }
  else {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname },
      query: ''
    })
  }
}


export default (
     <Provider store={store}>
        <div>
            <Router history={history}>
                <Route path="/" component={App}>
                    <IndexRoute component={LoginPage}/>
                    <Route path="sponsors" component={SponsorsPage} onEnter={isLoggedIn}/>
                    <Route path="sponsor/:id" component={ManageSponsorPage} onEnter={isLoggedIn}/>
                    <Route path="sponsor" component={ManageSponsorPage} onEnter={isLoggedIn}/>
                    <Route path="trials" component={TrialsPage} onEnter={isLoggedIn}/>
                    <Route path="trial" component={ManageTrialPage} onEnter={isLoggedIn} />
                    <Route path="trial/:id" component={ManageTrialPage} onEnter={isLoggedIn} />
                    <Route path="login" component={LoginPage}/>
                    <Route path="dashboard" component={Profile} onEnter={isLoggedIn}/>
                    <Route path="viewProfile" component={MyProfile} onEnter={isLoggedIn} />
                    <Route path="changePassword" component={ChangePassword} onEnter={isLoggedIn} />
                    <Route path="users" component={UsersPage} onEnter={isLoggedIn}/>
                    <Route path="user/:id" component={ManageUserPage} onEnter={isLoggedIn}/>
                    <Route path="addUsers" component={ManageUserPage} onEnter={isLoggedIn}/>
                    <Route path="forgotPassword" component={ForgotPasswordPage}/>
                    <Route path="resetpassword/:token" component={ResetPasswordPage}/>
                    <Route path="patientDetail" component={PatientDetailPage}/>
                    <Route path="patientList" component={PatientPage} onEnter={isLoggedIn}/>
                    <Route path="analytics" component={Analytics} onEnter={isLoggedIn}/>
                    <Route path="notificationList" component={NotificationList} onEnter={isLoggedIn}/>
                    <Route path="sideEffects" component={sideEffectsPage} onEnter={isLoggedIn}/>
                    <Route path="sideEffect/:id" component={ManageSideEffectPage} onEnter={isLoggedIn}/>
                    <Route path="sideEffect" component={ManageSideEffectPage} onEnter={isLoggedIn}/>
                    <Route path="deviceList" component={DevicePage} onEnter={isLoggedIn}/>
                    <Route path="deviceListData/:id" component={ManageDevicePage} onEnter={isLoggedIn}/>
                    <Route path="addDevice" component={ManageDevicePage} onEnter={isLoggedIn}/>
                    <Route path="trialDetail/:id" component={TrialDetailPage} onEnter={isLoggedIn}/>
                    <Route path="patientList/:id" component={PatientPage} onEnter={isLoggedIn}/>
                    <Route path="falloutpatientList/:id" component={PatientPage} onEnter={isLoggedIn}/>
                    <Route path="patientTrialList" component={PatientEnrolledTrialPage} onEnter={isLoggedIn}/>
                </Route>      
            </Router>
        </div>
    </Provider>
);
