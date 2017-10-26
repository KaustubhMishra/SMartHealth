import React from 'react';
import { Link } from 'react-router';

class SignupPage extends React.Component {
    render() {
        return (
          <div className="page-center">
            <div className="page-center-in">
                <div className="container-fluid">
                    <form className="sign-box">
                        <header className="sign-title"><h1>Sign In</h1></header>
                        <div className="form-group">
                            <input type="text" className="form-control" placeholder="E-Mail or Phone" name="email" />
                        </div>
                        <div className="form-group">
                            <input type="password" className="form-control" placeholder="Password" name="password"/>
                        </div>

                        <button type="submit" className="btn btn-rounded">Sign in</button>
                        <p className="sign-note">New to our website? <Link to="/signup" activeClassName="active">SignUp</Link></p>
                    </form>
                </div>
            </div>
        </div>
        );
    }
}
export default SignupPage;
