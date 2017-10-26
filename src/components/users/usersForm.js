import React, {PropTypes} from 'react';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import SelectInput from '../common/SelectInput';
import {browserHistory, Link} from 'react-router';

const UserForm = ({user, label, allRole, timezoneList, onSave, onChange, saving, errors}) => {
    return (
        <div>
            <div className="row">
                <div className="col-md-4">
                    <TextInput
                        name="firstname"
                        label="First Name"
                        value={user.firstname}
                        onChange={onChange}
                        error={errors.firstname}
                    /> 
                </div>
                <div className="col-md-4">
                    <TextInput
                        name="lastname"
                        label="Last Name"
                        value={user.lastname}
                        onChange={onChange}
                        error={errors.lastname}
                    />
                </div>
                <div className="col-md-4">
                    <TextInput
                        name="email"
                        label="Email"
                        value={user.email}
                        onChange={onChange}
                        error={errors.email}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col-md-4">
                    <TextInput
                        name="phone"
                        label="Contact Number"
                        value={user.phone}
                        onChange={onChange}
                        error={errors.phone}
                    />
                </div>
                <div className="col-md-4">
                    <div className="select-field">
                       <SelectInput
                            name="timezone"
                            label="Timezone"
                            value={user.timezone}
                            defaultOption="Select Timezone"
                            options={timezoneList}
                            onChange={onChange} 
                            error={errors.timezone}
                        />
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="select-field ">
                        <SelectInput
                            name="role_id"
                            label="Role"
                            value={user.role_id}
                            defaultOption="Select Role"
                            options={allRole}
                            onChange={onChange} 
                            error={errors.role_id}
                        />
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
                <Link className="btn btn-border" to="/users">
                    <img src={require('../../assets/img/close-icon-white.png')} /> Cancel
                </Link>
            </div>
        </div>
  );
};

UserForm.propTypes = {
  user: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  errors: PropTypes.object
};

export default UserForm;
