import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import { Link } from 'react-router';
import { resetPassword } from '../../actions/resetPasswordActions';
import validateInput from '../common/validations/ResetPassword';
import TextFieldGroup from '../common/TextFieldGroup';

class ResetPasswordForm extends React.Component {

  constructor(props, context,token) {
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

OnPageLoad() {
   const PageLoad = this.state;
    PageLoad.token = this.props.token;
    this.setState({ PageLoad });
}
componentWillMount(){
      this.OnPageLoad();
}
  onSubmit(event) {
    event.preventDefault();
    if (this.isValid()) {
      this.setState({ errors: {}, isLoading: true });
      this.props.resetPassword(this.state);  
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
        <form onSubmit={this.onSubmit}>
          <TextFieldGroup
          error={errors.password}
          label="Password"
          onChange={this.onPasswordChange}
          value={this.state.password}
          field="password"
          type="password"
        />
        <TextFieldGroup
          error={errors.confirmpassword}
          label="Confirm Password"
          onChange={this.onConfirmPasswordChange}
          value={this.state.confirmpassword}
          field="confirmpassword"
          type="password"
        />
        <div className="forgot-action-field">
          <button className="btn blue" >Submit</button>
          <Link to="login" className="btn btn-border">Cancel</Link>
        </div>
        </form>
    );
  }
}

ResetPasswordForm.propTypes = {
  resetPassword: React.PropTypes.func.isRequired
}

export default connect(null, { resetPassword })(ResetPasswordForm);

