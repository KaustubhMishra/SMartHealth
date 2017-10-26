import React from 'react';
import Footer from '../common/Footer';
import { Link } from 'react-router';

class PageNotFound extends React.Component {
  render() {
    return (
    	<section className="login-content-wrap">
			<section className="login-box-wrap">
				<h1 className="login-brand">
					<img src={require('../../assets/images/brand.png')} alt=""/><span>Smart Clinical Trials</span>
				</h1>
				<div className="login-box">
					<div className="head">
						<h2><Link to="login" className="forgot">Login</Link></h2>
					</div>
					<div className="login-form">
						<img src={require('../../assets/img/404.png')} alt=""/>
					</div>
				</div>
			</section>
			<Footer/>
		</section>
    );
  }
}

export default PageNotFound;
