import React from 'react';
import ResetPasswordForm from './ResetPasswordForm';
import cookies from 'react-cookie';
import Footer from '../common/Footer';

class ResetPasswordPage extends React.Component {
  render() {
    return (
      <section className="login-content-wrap">
        <section className="login-box-wrap">
          <h1 className="login-brand">
            <img src={require('../../assets/images/brand.png')} alt=""/><span>Smart Clinical Trials</span>
          </h1>
          <div className="login-box">
            <div className="head">
              <h2>Reset Password</h2>
            </div>
            <div className="login-form">
              <ResetPasswordForm token={this.props.params.token}/>
            </div>
          </div>
        </section>
        <Footer/>
      </section>
    );
  }
}

export default ResetPasswordPage;
