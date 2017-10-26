import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import { Link } from 'react-router';
import * as resetPasswordActions from '../../actions/resetPasswordActions';
import validateInput from '../common/validations/ResetPassword';
import TextFieldGroup from '../common/TextFieldGroup';

class resetPassword extends React.Component {

  constructor(props, context) {
    super(props, context);

    this.state = {
      password:"",confirmpassword:"",token:"",errors: {} 
    };

    this.onSubmit = this.onSubmit.bind(this);

    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.onConfirmPasswordChange = this.onConfirmPasswordChange.bind(this);
    this.OnPageLoad = this.OnPageLoad.bind(this);
  }

  onConfirmPasswordChange(event) {
    const ConfirmPassword = this.state;
    ConfirmPassword.confirmpassword = event.target.value;
    this.setState({ ConfirmPassword });
  }

  onPasswordChange(event) {
    const PasswordChange = this.state;
    PasswordChange.password = event.target.value;
    this.setState({ PasswordChange });
  }

  OnPageLoad(event) {
    const PageLoad = this.state;
    PageLoad.token = this.props.params.token;
    this.setState({ PageLoad });
  }
  
  componentWillMount(){
    this.OnPageLoad();
  }
  
  onSubmit(event) {
    event.preventDefault();
    if (this.isValid()) {
      this.setState({ errors: {}, isLoading: true });
      this.props.actions.resetPassword(this.state);  
    } 
  }

  isValid() {
    const { errors, isValid } = validateInput(this.state);

    if (!isValid) {
      this.setState({ errors });
    }

    return isValid;
  }

  render() {
    const { confirmpassword, password, errors, token  } = this.state;
    return (
      <form onSubmit={this.onSubmit} className="page-center bodyfullheight">
        <div className="login-logo">
          <img src={require('../../assets/img/logo.png')}/>
        </div>
        <header className="sign-title">Reset Password</header>
        <TextFieldGroup
          error={errors.password}
          label="Password"
          onChange={this.onPasswordChange}
          value={this.state.password}
          field="password"
        />
        <TextFieldGroup
          error={errors.confirmpassword}
          label="Confirm Password"
          onChange={this.onPasswordChange}
          value={this.state.confirmpassword}
          field="confirmpassword"
        />
        <div className="form-group">
          <button className="btn btn-primary btn-lg" >Reset</button>
          <Link to="login" className="btn btn-rounded btn-default">Cancel</Link>
        </div>
      </form>
    );
  }
}

resetPassword.propTypes = {
  resetPassword: React.PropTypes.func.isRequired
}

export default connect(null, { resetPassword })(resetPassword);

