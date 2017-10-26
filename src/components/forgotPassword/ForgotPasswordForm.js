import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import { Link } from 'react-router';
import { forgotPassword } from '../../actions/forgotPasswordActions';
import validateInput from '../common/validations/ForgotPassword';
import TextFieldGroup from '../common/TextFieldGroup';

class ForgotPasswordForm extends React.Component {

  constructor(props, context) {
    super(props, context);

     this.state = {
      email: '',
      errors: {}
    };

    this.onSubmit = this.onSubmit.bind(this);

    this.onChange = this.onChange.bind(this);
  }

  onChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  onSubmit(event) {
    event.preventDefault();
    if (this.isValid()) {
      this.setState({ errors: {}, isLoading: true });
      this.props.forgotPassword(this.state);
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
     const { errors, email } = this.state;
    return (
      <form onSubmit={this.onSubmit} className="sign-box">
        <div className="sign-logo">
          <img src={require('../../assets/img/login-logo.png')} alt=""/>
        </div>
        <div className="form-group m-r-0">
          <TextFieldGroup
            error={errors.email}
            placeholder="Username"
            label="Email"
            onChange={this.onChange}
            value={this.state.email}
            field="email"
          />
          <i className="font-icon"><img src={require('../../assets/img/login-user-icon.png')} alt=""/></i>
        </div>
        <div className="form-group">
          <div className="row">
            <div className="col-md-6">
              <button className="btn loginbtn" >Submit</button>
            </div>
            <div className="col-md-6">
              <Link to="login" className="btn loginbtn">Cancel</Link>
            </div>
          </div>
        </div>
      </form>
    );
  }
}

ForgotPasswordForm.propTypes = {
  forgotPassword: React.PropTypes.func.isRequired
}

export default connect(null, { forgotPassword })(ForgotPasswordForm);

