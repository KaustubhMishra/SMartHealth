import React, {PropTypes} from 'react';
import TextInput from '../common/TextInput';
import {browserHistory, Link} from 'react-router';
import { Conditional } from 'react-conditional-render';

const SideEffectForm = ({sideEffect, onSave, onChange, errors}) => {
    
    return (
        <div>
            <div className="row">
                <div className="col-md-4">
                    <TextInput
                        name="name"
                        label="Name"
                        value={sideEffect.name}
                        onChange={onChange}
                        error={errors.name}
                    />
                </div>    
            </div>
            <div className="row">
                <button 
                    type="submit" 
                    value="Save"
                    className="btn btn-border"
                    onClick={onSave}>
                    <img src={require('../../assets/img/save-icon-white.png')} /> Save
                </button>
                <Link className="btn btn-border" to="/sideEffects"> 
                    <img src={require('../../assets/img/close-icon-white.png')} />Cancel
                </Link>
            </div>
        </div>
    );
};

SideEffectForm.propTypes = {
  sideEffect: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  errors: PropTypes.object
};

export default SideEffectForm;
