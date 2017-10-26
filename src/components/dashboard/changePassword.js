import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as changePasswordActions from '../../actions/changePasswordActions';
import Header from '../common/Header';
import Footer from '../common/Footer';
import Leftmenu from '../common/Leftmenu';
import ChangePasswordForm from './changePasswordForm';
import validateInput from '../common/validations/changePasswordValidation';
import toastr from 'toastr';
import cookies from 'react-cookie';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router'


class ChangePassword extends React.Component {

	constructor(props, context) {
    super(props, context);
    this.state = {
      user: Object.assign({}, this.props.user),
      errors: {},
      saving: false
    };
    this.resetPassword = this.resetPassword.bind(this);
    this.updateUserPassword = this.updateUserPassword.bind(this);
  }

  isValid() {
    const { errors, isValid } = validateInput(this.state.user);

    if (!isValid) {
      this.setState({ errors });
    }

    return isValid;
  }

  updateUserPassword(event) {
    const field = event.target.name;
    let user = this.state.user;
    user[field] = event.target.value;
    return this.setState({user: user});
  }

  resetPassword(event) {
    event.preventDefault();
    if (this.isValid()) {
      this.setState({ errors: {} });
      this.props.actions.changeUserPassword(this.state.user)
      .then(() => this.redirect())
      .catch(error => {
        toastr.error(error);
        this.setState({saving: false});
      });
    }
  }

  redirect() {
    this.setState({saving: false});
    toastr.success('Password updated Successfully');
    browserHistory.push('/viewProfile');
  }

   
  render() {
    return (
      <div>
        <Header/>
        <section id="container" className="container-wrap">
          <Leftmenu/>
          <section className="container-fluid">
            <section className="page-title">
              <div className="pull-left">
                <h1>Profile</h1>
                <div className="breadcrumbs">
                  <span>Profile</span><a href="javascript:void(0)">Change Password</a>
                </div>
              </div> 
            </section>
            <div className="ma-box">
              <div className="head">
                <h2>Profile</h2>
              </div>
              <div className="account-box">
                <div className="row">
                  <div className="col s3">
                    <div className="user-avatar">
                      <img src={'/upload/profilepicture/' + this.props.userData.profile_image}/>
                    </div>
                  </div>
                  <div className="col s9">
                    <div className="profile-details">
                      <div className="profile-wrap">
                        <div className="profile-head">
                          <h2>{this.props.userData.firstname} {this.props.userData.lastname}</h2>
                        </div>
                        <ChangePasswordForm 
                          user={this.state.user}
                          onChange={this.updateUserPassword}
                          onSave={this.resetPassword}
                          errors={this.state.errors}
                          saving={this.state.saving}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <Footer/>
        </section>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return{
    userData: state.userData
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(changePasswordActions, dispatch)
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(ChangePassword);

