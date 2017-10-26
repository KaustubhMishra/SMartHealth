import React, {PropTypes} from 'react';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import SelectInput from '../common/SelectInput';
import SelectMultipleInput from '../common/SelectMultipleInput';
import {browserHistory, Link} from 'react-router';
import { Conditional } from 'react-conditional-render';
import SelectAutoDropDownInput from '../common/SelectAutoDropDownInput';

const DeviceForm = ({device, label, onSave, onChange, imagePreviewUrl, showimagePreview,fileEvent, saving, deviceGroupData, errors, hideSampleImage, updateDeviceGroup,documentFileEvent, document, removeDocument,vitalData}) => {
    return (
        <div>
            <div className="row">
                <div className="col-md-4">    
                    <TextInput
                        name="name"
                        label="Name"
                        value={device.name}
                        onChange={onChange}
                        error={errors.name}
                    />       
                </div>
                <div className="col-md-4"> 
                    <TextInput
                        name="manufacturer"
                        label="Manufacturer"
                        value={device.manufacturer}
                        onChange={onChange}
                        error={errors.manufacturer}
                    />
                </div>
                <div className="col-md-4"> 
                    <TextInput
                        name="model_number"
                        label="Model Number"
                        value={device.model_number}
                        onChange={onChange}
                        error={errors.model_number}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col-md-4"> 
                    <TextInput
                        name="firmware"
                        label="Firmware"
                        value={device.firmware}
                        onChange={onChange}
                        error={errors.firmware}
                    />
                </div>
                <div className="col-md-4">    
                    <TextInput
                        name="version"
                        label="Version"
                        value={device.version}
                        onChange={onChange}
                        error={errors.version}
                    />       
                </div>
                <div className="col-md-4"> 
                    <div className="select-field">
                        <SelectInput
                            disabled= {device.id ? true : false}
                            name="device_group_id"
                            label="Device Group"
                            value={device.device_group_id}
                            defaultOption="Select Device Group"
                            options={deviceGroupData}
                            onChange={updateDeviceGroup} 
                            error={errors.device_group_id}
                        />
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-md-4">
                    <fieldset className="form-group"> 
                        <label className="form-label">Upload Device Image </label>
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
                                                    <img src={imagePreviewUrl} style={{width: 100 + 'px'}}/>
                                                ) : (
                                                    <img src={'/upload/profilepicture/' + device.device_image}
                                                    style={{width: 100 + 'px'}}/>
                                                )}
                                            </Conditional>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="select-field"> 
                        <TextArea
                            disabled
                            name="vitalDevice"
                            label="Vital Device"
                            value={vitalData}
                        />
                    </div>
                </div>
                <div className="col-md-4">
                    <fieldset className="form-group"> 
                        <label className="form-label">Upload Documents </label>
                        <div className="upload-image-field form-control form-control-wrapper  form-control-icon-right">
                            <input
                                type="file"
                                onChange={documentFileEvent}
                                className="upload-image"
                            />
                            <i className="glyphicon glyphicon-paperclip color-blue"></i>
                        </div>

                    </fieldset>
                    <div className="form-group image-section-up">
                        <div className="image-section clearfix">
                            <ul>
                                {
                                    device.DeviceDocument.map((deviceDocument, index) =>
                                    <li key={index}>
                                        <div className="imgbox">
                                            <div className="remove-icon"><a href="javascript:void(0)" onClick={() => removeDocument(index)}><img src={require('../../assets/img/remove-black-icon.png')} /></a></div>
                                            {deviceDocument.name ? (<a href={'/upload/document/' + deviceDocument.name} target="_blank"><img src={'../../assets/img/dummy-pdf.png'} ></img></a>) :
                                                (<img className="display-upload-image" src={deviceDocument} />)}
                                        </div>
                                        <div className="imgtitle hideText" title={_.split(deviceDocument.name, '_')[1]}>{_.split(deviceDocument.name, '_')[1]}</div>
                                    </li>
                                )}

                                {
                                    document.map((doc, index) =>
                                    <li key={index}>
                                        <div className="imgbox">
                                            <div className="remove-icon"><a href="javascript:void(0)" onClick={() => removeDocument(index, true)}><img src={require('../../assets/img/remove-black-icon.png')} /></a></div>
                                            <img src={require('../../assets/img/dummy-pdf.png')} ></img>
                                        </div>
                                        <div className="imgtitle hideText" title={doc.name}>{doc.name}</div>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

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
                <Link className="btn btn-border" to="/deviceList">
                    <img src={require('../../assets/img/close-icon-white.png')} /> Cancel
                </Link>
            </div>
        </div>
  );
};

DeviceForm.propTypes = {
  device: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  errors: PropTypes.object
};

export default DeviceForm;
