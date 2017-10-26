import React, {PropTypes} from 'react';
import { Link } from 'react-router';
import * as signupActions from '../../actions/signupActions';
import {connect} from 'react-redux';

class SignupPage extends React.Component {

  constructor(props, context) {
    super(props, context);

    this.state = {
      signup: { email:"", companyName:"", password:"", repassword:"" }
    };

    this.onEmailChange = this.onEmailChange.bind(this);
    this.onCompanyNameChange = this.onCompanyNameChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.onRePasswordChange = this.onRePasswordChange.bind(this);
    this.onClickSave = this.onClickSave.bind(this);

  }

  onEmailChange(event) {
    const signup = this.state.signup;
    signup.email = event.target.value;
    this.setState({signup: signup});
  }

  onCompanyNameChange(event) {
    const signup = this.state.signup;
    signup.companyName = event.target.value;
    this.setState({signup: signup});
  }

  onPasswordChange(event) {
    const signup = this.state.signup;
    signup.password = event.target.value;
    this.setState({signup: signup});
  }

  onRePasswordChange(event) {
    const signup = this.state.signup;
    signup.repassword = event.target.value;
    this.setState({signup: signup});
  }

  onClickSave(event) {
    //const a = JSON.stringify(this.state.signup);
    //alert(`saving ${a}`);
    this.props.dispatch(signupActions.createSignupCompany(this.state.signup));
  }

  signupRow(signup, index) {
    return <div key={index}>{signup.email}</div>;
  }
    render() {
        return (
          <div className="page-center">
              <div className="page-center-in">
                  <div className="container-fluid">
                      {this.props.signup.map(this.signupRow)}
                      <form className="sign-box">

                          <header className="sign-title"><h1>Sign Up</h1></header>
                          <div className="form-group">
                              <input
                                type="text"
                                onChange={this.onEmailChange}
                                value={this.state.signup.email}
                                placeholder="Email" />
                          </div>
                          <div className="form-group">
                              <input
                                type="text"
                                onChange={this.onCompanyNameChange}
                                value={this.state.signup.companyName}
                                placeholder="Company Name" />
                          </div>
                          <div className="form-group">
                              <input
                                type="password"
                                onChange={this.onPasswordChange}
                                value={this.state.signup.password}
                                placeholder="Password" />
                          </div>
                          <div className="form-group">
                              <input
                                type="password"
                                onChange={this.onRePasswordChange}
                                value={this.state.signup.repassword}
                                placeholder="Repeat Password" />
                          </div>

                          <div className="form-group">
                              <input
                                type="submit"
                                onClick={this.onClickSave}
                                value="Save"
                                className="btn btn-rounded btn-success sign-up" />
                          </div>
                          <p className="sign-note">Already have an account? <Link to="/signin" activeClassName="active">SignIn</Link></p>
                      </form>
                  </div>
              </div>
          </div>
        );
    }
}

SignupPage.propTypes = {
  dispatch: PropTypes.func.isRequired,
  signup: PropTypes.array.isRequired
};

function mapStateToProps(state, ownProps) {
  return {
    signup: state.signup
  };
}

export default connect(mapStateToProps)(SignupPage);
