import React, {PropTypes} from 'react';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import SelectInput from '../common/SelectInput';
import {browserHistory, Link} from 'react-router';

const ChangePasswordForm = ({user, label, onSave, onChange, saving, errors}) => {

    return (
        <div className="">
            <div className="profile-form-row">
              <div className="input-field">
                <TextInput
                  name="oldPassword"
                  type="password"
                  label="Old Password"
                  value={user.oldPassword}
                  onChange={onChange}
                  error={errors.oldPassword}
                />
              </div>
            </div>
            <div className="profile-form-row">
              <div className="input-field">
                <TextInput
                  name="newPassword"
                  type="password"
                  label="New Password"
                  value={user.newPassword}
                  onChange={onChange}
                  error={errors.newPassword}
                />
              </div>
            </div>
            <div className="profile-form-row">    
              <div className="input-field">
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
            <div className="profile-form-row">
              <div className="profile-form-action">
                  <input type="submit" 
                      disabled={saving} 
                      value={saving ? 'Saving...' : 'Save'}
                      className="btn blue"
                      onClick={onSave}
                  />
                  <Link className="btn btn-border" to="/viewProfile"> Cancel</Link>
              </div>
            </div>
        </div>
  );
};

ChangePasswordForm.propTypes = {
  user: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  errors: PropTypes.object
};

export default ChangePasswordForm;
