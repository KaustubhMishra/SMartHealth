import React, {PropTypes} from 'react';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import SelectInput from '../common/SelectInput';
import {browserHistory, Link} from 'react-router';
import { Conditional } from 'react-conditional-render';

const SponsorForm = ({sponsor, fileEvent, label, onSave, onChange, saving, errors, countryList, stateList, updateCountry, showStateTextbox, hideStateSelectbox, showimagePreview, imagePreviewUrl, hideSampleImage}) => {
    return (
        <div>
            <div className="row">
                <div className="col-md-4">    
                    <TextInput
                        name="sponsor_company"
                        label="Sponsor"
                        value={sponsor.sponsor_company}
                        onChange={onChange}
                        error={errors.sponsor_company}
                    />       
                </div>
                
            </div>
            <div className="row">
                 <div className="col-md-4"> 
                    <TextInput
                        name="contact_name"
                        label="Contact Name"
                        value={sponsor.contact_name}
                        onChange={onChange}
                        error={errors.contact_name}
                    />
                </div>
                <div className="col-md-4">
                    <TextInput
                        name="email_address"
                        label="Email"
                        value={sponsor.email_address}
                        onChange={onChange}
                        error={errors.email_address}
                    />
                </div>
                <div className="col-md-4">
                    <TextInput
                        name="contact_number"
                        label="Contact Number"
                        value={sponsor.contact_number}
                        onChange={onChange}
                        error={errors.contact_number}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col-md-4 sponsor-address">
                    <TextArea
                        name="contact_address_1"
                        label="Address 1"
                        value={sponsor.contact_address_1}
                        onChange={onChange}
                        error={errors.contact_address_1}
                    />
                </div>
                <div className="col-md-4 sponsor-address">
                    <TextArea
                        name="contact_address_2"
                        label="Address 2"
                        value={sponsor.contact_address_2}
                        onChange={onChange}
                        error={errors.contact_address_2}
                    />
                </div>
                <div className="col-md-4">
                    <TextInput
                        name="city"
                        label="City"
                        value={sponsor.city}
                        onChange={onChange}
                        error={errors.city}
                    />
                    <TextInput
                        name="zip"
                        label="Zip"
                        value={sponsor.zip}
                        onChange={onChange}
                        error={errors.zip}
                    />
                    
                </div>
            </div>
            <div className="row">
                <Conditional condition={hideStateSelectbox}>
                    <div className="col-md-4">
                        <SelectInput
                            name="state"
                            label="State"
                            defaultOption="Select State"
                            value={sponsor.state}
                            options={stateList}
                            onChange={onChange}
                            error={errors.state}
                        />
                    </div>
                </Conditional>
                <Conditional condition={showStateTextbox}>
                    <div className="col-md-4">
                        <TextInput
                            name="state"
                            label="State"
                            value={sponsor.state}
                            onChange={onChange}
                            error={errors.state}
                        />
                    </div>
                </Conditional>
                <div className="col-md-4">
                    <SelectInput
                        name="country"
                        label="Country"
                        defaultOption="Select Country"
                        value={sponsor.country}
                        options={countryList}
                        onChange={updateCountry}
                        error={errors.country}
                    />
                </div>
                <div className="col-md-4">
                    <fieldset className="form-group"> 
                        <label className="form-label">Upload Sponsor Image </label>
                        <div className="upload-image-field form-control form-control-wrapper  form-control-icon-right">
                            <input
                                type="file"
                                onChange={fileEvent}
                                className="upload-image"
                            />
                            <i className="glyphicon glyphicon-paperclip color-blue"></i>
                        </div>
                    </fieldset>
                    <div className="form-group image-section-up">
                        <div className="image-section clearfix">
                            <ul>
                                <li>
                                    <div className="imgbox2">
                                        <Conditional condition={hideSampleImage}>
                                                <img src={require('../../assets/img/dummy-image.png')}/>
                                        </Conditional>
                                        <Conditional condition={showimagePreview == true}>
                                            {imagePreviewUrl ? (
                                                <img src={imagePreviewUrl} style={{width: 100 + 'px', height: 100 + 'px'}}/>
                                            ) : (
                                                <img src={'/upload/profilepicture/' + sponsor.sponsor_image}
                                                style={{width: 100 + 'px', height: 100 + 'px'}}/>
                                            )}
                                        </Conditional>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md-4"> 
                    
                </div>
                <div className="col-md-4">
                    
                </div>
            </div>
            <div className="row">
                <button type="submit" 
                    disabled={saving} 
                    value={saving ? 'Saving...' : 'Save'}
                    className="btn btn-border"
                    onClick={onSave}>
                    <img src={require('../../assets/img/save-icon-white.png')} /> Save
                </button>
                <Link className="btn btn-border" to="/sponsors">
                    <img src={require('../../assets/img/close-icon-white.png')} /> Cancel
                </Link>
            </div>
        </div>
  );
};

SponsorForm.propTypes = {
  sponsor: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  errors: PropTypes.object
};

export default SponsorForm;
