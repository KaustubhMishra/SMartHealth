import React from 'react';
import {connect} from 'react-redux';
import cookies from 'react-cookie';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'
import { Conditional } from 'react-conditional-render';
import * as RolesandPermission from './RolesandPermission';

const user= ['/users', '/addUsers', '/user'];
const trial= ['/trials', '/trial', '/trialDetail', 'trials'];
const sponsor= ['/sponsors', '/sponsor'];
const device= ['/deviceList', '/deviceListData', '/addDevice'];
const patient= ['/patientList', '/patientTrialList', '/falloutpatientList'];
const sideEffect= ['/sideEffects', '/sideEffect'];
const analytic= ['/analytics'];
const notification= ['/notificationList'];


class Leftmenu extends React.Component {

  constructor(props, context) {
    super(props, context);
  }

  /*componentWillMount() {
    $(document).ready(function(){
      $('.scrollbar-inner').scrollbar();
    });
  }*/

  render() {
    return (
      <nav className="side-menu nav-is-close">
        <ul className="side-menu-list">
          <li style={{background : cookies.load('active') == '/dashboard' ? '#ecf2f5' : '', color : cookies.load('active') == '/dashboard' ? '#000000' : ''}}>
            <Link to="/dashboard">
              <img src={require('../../assets/img/menu-icon/dashboard-icon.png')}/>
              <span className="lbl">Dashboard</span>
            </Link>
          </li>
          <Conditional condition={RolesandPermission.permissionCheck("USER_VIEW") ==true}>
            <li style={{background : user.indexOf(cookies.load('active')) >= 0 ? '#ecf2f5' : '' , color : user.indexOf(cookies.load('active')) >= 0 ? '#000000' : ''}}>              
              <Link to="/users">
                <img src={require('../../assets/img/menu-icon/user-icon.png')}/>
                <span className="lbl">Users</span>
              </Link>
            </li>
          </Conditional>
          <Conditional condition={RolesandPermission.permissionCheck("TRAIL_VIEW") ==true}>
            <li style={{background : trial.indexOf(cookies.load('active')) >= 0 ? '#ecf2f5' : '' , color : trial.indexOf(cookies.load('active')) >= 0 ? '#000000' : ''}}>
              <Link to="/trials" className="demoTest">
                <img src={require('../../assets/img/menu-icon/manage-trials-icon.png')}/>
                <span className="lbl">Manage Trials</span>
              </Link>
            </li>
          </Conditional>
          <Conditional condition={RolesandPermission.permissionCheck("SPONSOR_VIEW") ==true}>
            <li style={{background : sponsor.indexOf(cookies.load('active')) >= 0 ? '#ecf2f5' : '', color : sponsor.indexOf(cookies.load('active')) >= 0 ? '#000000' : ''}}>
              <Link to="/sponsors" className="demoTest">
                <img src={require('../../assets/img/menu-icon/sponsors-icon.png')}/>
                <span className="lbl">Sponsors</span>
              </Link>
            </li>
          </Conditional>
          <Conditional condition={RolesandPermission.permissionCheck("DEVICE_VIEW") ==true}>
            <li style={{background : device.indexOf(cookies.load('active')) >= 0 ? '#ecf2f5' : '', color : device.indexOf(cookies.load('active')) >= 0 ? '#000000' : ''}}>
              <Link to="/deviceList" className="demoTest">
                <img src={require('../../assets/img/menu-icon/device-icon.png')}/>
                <span className="lbl">Devices</span>
              </Link>
            </li>
          </Conditional>
          <Conditional condition={RolesandPermission.permissionCheck("IMPORT_PATIENT") ==true}>
            <li style={{background : patient.indexOf(cookies.load('active')) >= 0 ? '#ecf2f5' : '' , color : patient.indexOf(cookies.load('active')) >= 0 ? '#000000' : ''}}>
              <Link to="/patientList" className="demoTest">
                <img src={require('../../assets/img/menu-icon/patients-icon.png')}/>
                <span className="lbl">Patients</span>
              </Link>
            </li>
          </Conditional>
          
          <Conditional condition={RolesandPermission.permissionCheck("SIDE_EFFECT_VIEW") ==true}>
            <li style={{background : sideEffect.indexOf(cookies.load('active')) >= 0 ? '#ecf2f5' : '', color : sideEffect.indexOf(cookies.load('active')) >= 0 ? '#000000' : ''}}>
              <Link to="/sideEffects" className="demoTest">
                <img src={require('../../assets/img/menu-icon/side-effects-pool-icon.png')}/>
                <span className="lbl">Side Effects Pool</span>
              </Link>
            </li>  
          </Conditional>
          <Conditional condition={RolesandPermission.permissionCheck("REPORT_VIEW") ==true}>
            <li style={{background : analytic.indexOf(cookies.load('active')) >= 0 ? '#ecf2f5' : '', color : analytic.indexOf(cookies.load('active')) >= 0 ? '#000000' : ''}}>
              <Link to="/analytics" className="demoTest">
                <img src={require('../../assets/img/menu-icon/report-icon.png')}/>
                <span className="lbl">Analytics</span>
              </Link>
            </li>  
          </Conditional>
          <Conditional condition={RolesandPermission.permissionCheck("NOTIFICATION_VIEW") ==true}>
            <li style={{background : notification.indexOf(cookies.load('active')) >= 0 ? '#ecf2f5' : '', color : notification.indexOf(cookies.load('active')) >= 0 ? '#000000' : ''}}>
              <Link to="/notificationList" className="demoTest">
                <img src={require('../../assets/img/menu-icon/notifications-icon.png')}/>
                <span className="lbl">Notifications</span>
              </Link>
            </li>
          </Conditional>
        </ul>
      </nav>
    );
  }
}

export default Leftmenu;

