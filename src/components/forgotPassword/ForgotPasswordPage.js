import React from 'react';
import ForgotPasswordForm from './ForgotPasswordForm';
import Footer from '../common/Footer';
import * as generalConfigClient from '../../generalConfig';

const path = generalConfigClient.siteUrlClient+"/demo.jpg";

class ForgotPasswordPage extends React.Component {
  render() {
    return (
      <div className="page-center loginbg" style ={{ background: "url("+path+") no-repeat center",  height: "100vh" }}>
        <div className="page-center-in">
          <div className="container-fluid">
            <ForgotPasswordForm/>
              <div className="softweblogo">
                <img src={require('../../assets/img/iot-logo.png')} alt=""/>
              </div>
          </div>
        </div>
      </div>
    );
  }
}
export default ForgotPasswordPage;
