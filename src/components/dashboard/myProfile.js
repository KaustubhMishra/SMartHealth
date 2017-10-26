import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as RolePermissionActions from '../../actions/RolePermissionActions';
import * as StateListActions from '../../actions/stateListActions';
import * as UserProfileActions from '../../actions/userProfileActions';
import * as changePasswordActions from '../../actions/changePasswordActions';
import toastr from 'toastr';
import validateInput from '../common/validations/userProfileValidation';
import Header from '../common/Header';
import Footer from '../common/Footer';
import Leftmenu from '../common/Leftmenu';
import { Conditional } from 'react-conditional-render';
import cookies from 'react-cookie';
import { Router, Route, Link, browserHistory, IndexRoute  } from 'react-router';
import MyProfileForm from './myProfileForm';
import {countryFormattedForDropdown} from '../../selectors/selectors';
import {stateFormattedForDropdown} from '../../selectors/selectors';
let showStateTextbox = false;
let hideStateSelectbox = true;
let userDataArray = {};


class MyProfile extends React.Component {

	constructor(props, context) {
    super(props, context);
    this.state = {
      user: Object.assign({}, userDataArray),
      file:'',
      imagePreviewUrl: '',
      errors: {},
      saving: false,
      disabled: true,
      disabledEmail:true
    };
    this.getUserProfile();
    hideStateSelectbox = true;
    showStateTextbox = false;
    this.updateUserState = this.updateUserState.bind(this);
    this.updateCountry = this.updateCountry.bind(this);
    this.saveUserProfile = this.saveUserProfile.bind(this);
    this._handleImageChange = this._handleImageChange.bind(this);
    this.enableProfileForm = this.enableProfileForm.bind(this);
  }

  isValid() {
    const { errors, isValid } = validateInput(this.state.user);
    if (!isValid) {
      this.setState({ errors });
    }
    return isValid;
  }

  enableProfileForm() {
    let disabled = this.state.disabled;
    disabled = false;
    return this.setState({disabled: disabled});
  }

  updateUserState(event) {
    const field = event.target.name;
    let user = this.state.user;
    user[field] = event.target.value;
    return this.setState({user: user});
  }


  updateCountry(event) {
    const field = event.target.name;
    let user = this.state.user;
    user[field] = event.target.value;
    if(user[field] == '1') {
      hideStateSelectbox = true;
      showStateTextbox= false;
      this.state.user.state= '';
      this.props.stateListActions.loadStateList(user[field]);
      return this.setState({user: user});
    } else{
      showStateTextbox= true;
      hideStateSelectbox = false;
      this.state.user.state= '';
      return this.setState({user: user});
    }
  }

  saveUserProfile(event) {
    event.preventDefault();
    if (this.isValid()) {
    this.setState({ errors: {} });
    this.props.userProfileActions.updateUserProfile(this.state.user, this.state.file)
      .then(() => this.redirect())
      .catch(error => {
        toastr.error(error);
        this.setState({saving: false});
      });
    }
  }

  _handleImageChange(e) {
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];
    reader.onloadend = () => {
      this.setState({
        file: file,
        errorFile: false,
        checkErrorFile: false,
        imagePreviewUrl: reader.result
      });
    };
    reader.readAsDataURL(file);
  }

  getUserProfile() {
    this.props.userProfileActions.getUserUpdatedInfo().then(response =>{
      if(response.status == false){
        this.context.router.push('/users');
      }else{
        
        if(response.data.user_contact_infos.length <= 0) {
          userDataArray = {
            firstname: response.data.firstname,
            lastname: response.data.lastname,
            profile_image: response.data.profile_image,
            email: response.data.email,
            contact_address: '',
            phone: response.data.phone,
            country: '',
            state: '',
            city: '',
            fax: ''
          };
        } else {
            userDataArray = {
            firstname: response.data.firstname,
            lastname: response.data.lastname,
            profile_image: response.data.profile_image,
            email: response.data.email,
            contact_address: response.data.user_contact_infos[0].contact_address1,
            phone: response.data.phone,
            country: response.data.user_contact_infos[0].country,
            state: response.data.user_contact_infos[0].state,
            city: response.data.user_contact_infos[0].city,
            fax: response.data.user_contact_infos[0].fax
          };
        }
        
        
        if(userDataArray.country == '1') {
          this.props.stateListActions.loadStateList(userDataArray.country);
          this.setState({user: userDataArray});
        } else if(userDataArray.country == '2'){
          hideStateSelectbox = false;
          showStateTextbox = true;
          this.setState({user: userDataArray});
        }
      }
    })
    .catch(error => {
      toastr.error(error);
    });
  }

  redirect() {
    this.setState({saving: false});
    toastr.success('User Profile Updated Successfully.');
    browserHistory.push('/dashboard');
  }
  
  redirectPassword() {
    this.setState({saving: false});
    toastr.success('Password updated Successfully');
    browserHistory.push('/viewProfile');
  }

  render() {
    return (
      <div className="main-wrap">
        <Header/>
        <Leftmenu/>
        <section id="container" className="container-wrap">
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li className="active">Profile</li>
          </ol>
          <section className="container-fluid">
            <div id="toolbar">
              <h3 className="pull-left">Profile</h3>
            </div>
            <section className="card">
              <div className="profile-section clearfix">
                <div className="profile-right">
                  <button 
                    type="button" 
                    className="btn upload_btn btn-border">
                    <input 
                      type="file" 
                      className="upload-image"
                      onChange={this._handleImageChange} 
                      name="profileImage" id="profileImage" 
                      placeholder=""/><i className="glyphicon glyphicon-paperclip"></i>Change Profile Picture
                  </button>
                  <button 
                    type="button"
                    onClick={this.enableProfileForm}
                    className="btn btn-border m-r-0">
                    <img src={require('../../assets/img/user-name-icon-white.png')} />
                    Edit My Profile
                  </button>
                </div>
                <div className="profile-left">
                  <div className="profileimg">
                    {this.state.imagePreviewUrl ? (
                      <img src={this.state.imagePreviewUrl}/>
                    ) : (
                      <img src={'/upload/profilepicture/' + this.state.user.profile_image}/>
                    )}
                  </div>
                  <div className="profile-details">
                    <div className="profilename">
                      <i><img src={require('../../assets/img/user-name-icon.png')} /></i>
                      {this.state.user.firstname} {this.state.user.lastname}
                    </div>
                    <div className="profilelocation">
                      <i><img src={require('../../assets/img/user-location-icon.png')} /></i>
                      {this.state.user.city}, {this.state.user.state}
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-block">
                <MyProfileForm
                  user={this.state.user}
                  countryList={this.props.countryList}
                  errors={this.state.errors}
                  stateList={this.props.stateList}
                  onChange={this.updateUserState}
                  updateCountry={this.updateCountry}
                  showStateTextbox={showStateTextbox}
                  hideStateSelectbox={hideStateSelectbox}
                  onSave={this.saveUserProfile}
                  disabled={this.state.disabled}
                  disabledEmail={this.state.disabledEmail}
                />
              </div>
            </section>
          </section>
        </section>
        <Footer/>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  let user= {
    firstname: '',
    lastname:'',
    email: '',
    contact_address: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    fax: ''
  }

  return {
    user: user,

    countryList: countryFormattedForDropdown(state.CountryList),
    stateList: stateFormattedForDropdown(state.StateList)
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(RolePermissionActions, dispatch),
    stateListActions: bindActionCreators(StateListActions, dispatch),
    userProfileActions: bindActionCreators(UserProfileActions, dispatch),
    changePasswordActions: bindActionCreators(changePasswordActions, dispatch)
  };
}


export default connect(mapStateToProps, mapDispatchToProps)(MyProfile);

