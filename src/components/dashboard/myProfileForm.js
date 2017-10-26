import React, {PropTypes} from 'react';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import SelectInput from '../common/SelectInput';
import {browserHistory, Link} from 'react-router';
import { Conditional } from 'react-conditional-render';

const MyProfileForm = ({user, label, onSave, onChange, saving, countryList, errors, updateCountry, stateList, showStateTextbox, hideStateSelectbox, disabled, disabledEmail}) => {
    return (
      <div className="profile-form">
        <div className="row">
          <div className="col-md-8">          
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="firstname"
                  type="text"
                  label="First Name"
                  value={user.firstname}
                  onChange={onChange}
                  error={errors.firstname}
                  disabled={disabled}
                />
                <TextInput
                  id="Email"
                  name="email"
                  type="email"
                  label="Email"
                  onChange={onChange}
                  value={user.email}
                  disabled={disabledEmail}
                />
                <div className="row">
                  <div className="col-md-6">
                    <TextInput
                      name="phone"
                      type="text"
                      label="Contact Number"
                      onChange={onChange}
                      value={user.phone}
                      error={errors.phone}
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-md-6">
                    <TextInput
                      name="fax"
                      label="Fax"
                      value={user.fax}
                      onChange={onChange}
                      error={errors.fax}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-6 contactAddress">
                <TextInput
                  name="lastname"
                  type="text"
                  label="Last Name"
                  value={user.lastname}
                  onChange={onChange}
                  error={errors.lastname}
                  disabled={disabled}
                />
                <TextArea
                  name="contact_address"
                  onChange={onChange}
                  label="Contact Address"
                  value={user.contact_address}
                  error={errors.contact_address}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <TextInput
                  name="city"
                  label="City"
                  value={user.city}
                  onChange={onChange}
                  error={errors.city}
                  disabled={disabled}
                />
              </div>
              <div className="col-md-6">
                <Conditional condition={hideStateSelectbox}>
                  <SelectInput
                    name="state"
                    defaultOption="Select State"
                    label="State"
                    value={user.state}
                    options={stateList}
                    onChange={onChange}
                    error={errors.state}
                    disabled={disabled}
                  />
                </Conditional>
                <Conditional condition={showStateTextbox}>
                  <TextInput
                    name="state"
                    label="State"
                    value={user.state}
                    onChange={onChange}
                    error={errors.state}
                    disabled={disabled}
                  />
                </Conditional>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <SelectInput
                  name="country"
                  label="Country"
                  defaultOption="Select Country"
                  value={user.country}
                  options={countryList}
                  onChange={updateCountry}
                  error={errors.country}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="change_password">
              <div className="row">
                <div className="col-md-12">
                  <TextInput
                    name="oldPassword"
                    type="password"
                    label="Old Password"
                    value={user.oldPassword}
                    onChange={onChange}
                    error={errors.oldPassword}
                  />
                </div>
                <div className="col-md-12">  
                  <TextInput
                    name="newPassword"
                    type="password"
                    label="New Password"
                    value={user.newPassword}
                    onChange={onChange}
                    error={errors.newPassword}
                  />
                  </div>
                <div className="col-md-12">
                  <TextInput
                    name="confirmNewPassword"
                    type="password"
                    label="Confirm New Password"
                    value={user.confirmNewPassword}
                    onChange={onChange}
                    error={errors.confirmNewPassword}
                  />
                </div>
             </div>     
            </div>
          </div>
        </div>
        <div className="row">
          <button 
            type="submit" 
            disabled={saving} 
            value={saving ? 'Saving...' : 'Save'}
            className="btn btn-border"
            onClick={onSave}>
            <img src={require('../../assets/img/save-icon-white.png')} /> Save
          </button>
          <Link className="btn btn-border" to="/dashboard">
            <img src={require('../../assets/img/close-icon-white.png')} /> Cancel
          </Link>
        </div>
      </div>
    );
  };

MyProfileForm.propTypes = {
  user: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  errors: PropTypes.object
};

export default MyProfileForm;
