import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as userActions from '../../actions/userActions';
import UserForm from './usersForm';
import {browserHistory, Link} from 'react-router';
import toastr from 'toastr';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import validateInput from '../common/validations/userValidation';
import cookies from 'react-cookie';
import Footer from '../common/Footer';
import {userRoleFormattedForDropdown} from '../../selectors/selectors';
import {timezoneFormattedForDropdown} from '../../selectors/selectors';
import { Conditional } from 'react-conditional-render';

let userId = '';

export class ManageUserPage extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      user: Object.assign({}, this.props.user),
      errors: {},
      saving: false
    };
    this.id='';
    this.getUserById();
    this.saveUser = this.saveUser.bind(this);
    this.updateUserState = this.updateUserState.bind(this);
  }

  isValid() {
    const { errors, isValid } = validateInput(this.state.user);

    if (!isValid) {
      this.setState({ errors });
    }

    return isValid;
  }

  updateUserState(event) {
    const field = event.target.name;
    let user = this.state.user;
    user[field] = event.target.value;
    return this.setState({user: user});
  }

  saveUser(event) {
    event.preventDefault();
    if (this.isValid()) {
      this.setState({ errors: {} });
      this.props.actions.addUsers(this.state.user)
      .then(() => this.redirect())
      .catch(error => {
        toastr.error(error);
        this.setState({saving: false});
      });
    }
  }

  getUserById() {
    if(userId) {
      this.props.actions.loadUserById(userId).then(response =>{
        if(response.status == false){
          this.context.router.push('/users');
        }else{
          this.setState({user: response.data});
        }
      })
      .catch(error => {
        toastr.error(error);
      });
    } 
  }


  redirect() {
    this.setState({saving: false});
    if(this.props.params.id)
      toastr.success('User Updated.');
    else
      toastr.success('User Saved.');

    this.context.router.push('/users');
  }

  render() {
    return (
      <div>
        <Header/>
        <Leftmenu/>
        <section id="container" className="container-wrap">
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/users">User</Link></li>
            <Conditional condition={this.props.params.id == undefined}>
              <li className="active">Add User</li>
            </Conditional>
            <Conditional condition={this.props.params.id != undefined}>
              <li className="active">Update User</li>
            </Conditional>
          </ol>
          <section className="container-fluid">
            <div id="toolbar">
              <Conditional condition={this.props.params.id == undefined}>
                <div className="head">
                  <h3>Add User</h3>
                </div>
              </Conditional>
              <Conditional condition={this.props.params.id != undefined}>
                <div className="head">
                  <h3>Update User</h3>
                </div>
              </Conditional>
            </div>
            <div className="card">
              <div className="card-block">
                <div className="col s12">
                  <UserForm
                    user={this.state.user}
                    onChange={this.updateUserState}
                    onSave={this.saveUser}
                    errors={this.state.errors}
                    saving={this.state.saving}
                    allRole={this.props.role}
                    timezoneList={this.props.timezoneList}
                  />
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

ManageUserPage.propTypes = {
  user: PropTypes.object.isRequired,
  role: PropTypes.array.isRequired,
  actions: PropTypes.object.isRequired
};

//Pull in the React Router context so router is available on this.context.router.
ManageUserPage.contextTypes = {
  router: PropTypes.object
};

function mapStateToProps(state, ownProps) {
  userId = ownProps.params.id;
  
  let user = {
    firstname: '', 
    lastname: '', 
    email: '', 
    phone:'',
    timezone:'', 
    role_id: ''
  };

  return {
    user: user,
    role: userRoleFormattedForDropdown(state.UserRole),
    timezoneList: timezoneFormattedForDropdown(state.TimezoneList)
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(userActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageUserPage);
