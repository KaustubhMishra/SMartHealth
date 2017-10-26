import React from 'react';
import {connect} from 'react-redux';
import cookies from 'react-cookie';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'
import * as getLoggedUserActions from '../../actions/getLoggedUserActions';
import {bindActionCreators} from 'redux';
import { Conditional } from 'react-conditional-render';

class Header extends React.Component  { 

  constructor(props, context) {
    super(props, context);

    this.getLoggedInUser();
    this.Logout = this.onClickLogout.bind(this);
    this.OnPageLoad();
  }

  componentWillMount(){
      //this.OnPageLoad();
  }

  OnPageLoad() {
    $(document).ready(function(){
      
      let isOpen = false;
      $('.hamburger').click(function(){
        if(isOpen == false) {
          $('[data-toggle="tooltip"]').tooltip('hide');
          $(".side-menu").removeClass("nav-is-close");
          $(".side-menu").addClass("nav-is-open");
          isOpen = true;
        }
        else {
          $('[data-toggle="tooltip"]').tooltip();
          $(".side-menu").removeClass("nav-is-open");
          $(".side-menu").addClass("nav-is-close");
          isOpen = false;
        }
      });
    });
  }

  onClickLogout(event) {
    cookies.remove('access_token', { path: '/' });
    cookies.remove('refresh_token', { path: '/' });
    cookies.remove('keyName', { path: '/' });
    cookies.remove('basicToken', { path: '/' });
    cookies.remove('userData', { path: '/' });
    cookies.remove('usercompanyid', { path: '/' });

    browserHistory.push('/login');
  }

  getLoggedInUser() {
    this.props.actions.getUserInfo();
  } 

render() {
    return (
      <header className="site-header">
        <div className="container-fluid">
          <a href="#" className="site-logo">
            <img className="hidden-md-down" src={require('../../assets/img/logo-2.png')} />
          </a>
          <button className="hamburger hamburger--htla"> 
            <span>toggle menu</span> 
          </button>   
          <div className="site-header-content">
            <div className="site-header-content-in">
              <div className="site-header-shown">
                <div className="dropdown user-menu"> 
                  <span className="pull-left">{ this.props.user.firstname } { this.props.user.lastname }</span>
                  <button className="dropdown-toggle" id="dd-user-menu" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> 
                    <img src={'/upload/profilepicture/' + this.props.user.profile_image} alt="" style={{width: 30 + 'px', height: 30 + 'px'}}/> 
                  </button>
                  <div className="dropdown-menu dropdown-menu-right" aria-labelledby="dd-user-menu"> 
                    <Link className="dropdown-item profile" to="/viewProfile"><span className="font-icon"></span>Profile</Link> 
                    <a onClick={this.Logout} className="dropdown-item logout"><span className="font-icon"></span>Logout</a> 
                  </div>
                </div>
              </div>
              <div className="mobile-menu-right-overlay"></div>
              <div className="site-header-collapsed">
                <div className="site-header-collapsed-in">
                  <div className="dropdown">
                    <div className="dropdown-menu" aria-labelledby="dd-header-add"> 
                      <a className="dropdown-item" href="#">Quant and Verbal</a> 
                      <a className="dropdown-item" href="#">Real Gmat Test</a> 
                      <a className="dropdown-item" href="#">Prep Official App</a> 
                      <a className="dropdown-item" href="#">CATprer Test</a> 
                      <a className="dropdown-item" href="#">Third Party Test</a> 
                    </div>
                  </div>
                </div> 
              </div> 
            </div>
          </div>
        </div>
      </header>
    );
  };
  };

function mapStateToProps(state, ownProps) {
  return {
    user: state.userData,
    notificationData: state.NotificationData,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(getLoggedUserActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);