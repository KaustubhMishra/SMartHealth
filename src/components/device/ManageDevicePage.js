import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as deviceGroupActions from '../../actions/deviceGroupActions';
import * as deviceActions from '../../actions/deviceActions';
import DeviceForm from './DeviceForm';
import {browserHistory, Link} from 'react-router';
import toastr from 'toastr';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import vital from '../common/vitalData';
import validateInput from '../common/validations/deviceGroupValidation';
import cookies from 'react-cookie';
import Footer from '../common/Footer';
import { Conditional } from 'react-conditional-render';
import {deviceGroupFormattedForDropdown} from '../../selectors/selectors';

let vitalArray = {};
let showimagePreview = false;
let deviceId = '';
let hideSampleImage = true;
export class ManageDevicePage extends React.Component {
  constructor(props, context) {

    super(props, context);
    this.state = {
      device: Object.assign({}, this.props.device),
      file:'',
      imagePreviewUrl: '',
      errors: {},
      saving: false,
      document:[],
      documentPreview:[],
      vitalData:'',
    };

    this.getDeviceGroup();
    this.getDeviceById();
    this.saveDevice = this.saveDevice.bind(this);
    this.updateDeviceState = this.updateDeviceState.bind(this);
    this._handleImageChange = this._handleImageChange.bind(this);
    this.updateDeviceGroup = this.updateDeviceGroup.bind(this);
    this._handleDocumentChange = this._handleDocumentChange.bind(this);
    this.removeDocument = this.removeDocument.bind(this);
    showimagePreview = false;
    hideSampleImage = true;
  }

  isValid() {
    const { errors, isValid } = validateInput(this.state.device);

    if (!isValid) {
      this.setState({ errors });
    }

    return isValid;
  }

  updateDeviceState(event) {
    console.log(event.target.name);
    console.log(event.target.value);
    const field = event.target.name;
    let device = this.state.device;
    device[field] = event.target.value;
    return this.setState({device: device});
  }
    
  saveDevice(event) {
    event.preventDefault();
    if (this.isValid()) {
      this.setState({ errors: {} });
      this.props.deviceActions.addDevice(this.state.device, this.state.file, this.state.document)
      .then(() => this.redirect())
      .catch(error => {
        toastr.error(error);
        this.setState({saving: false});
      });
    }
  }


  updateDeviceGroup(event) {
    const field = event.target.name;
    let device = this.state.device;
    let vitalDevice = [];
    device[field] = event.target.value;
    this.props.deviceActions.loadDeviceVital(device[field]).then(response=>{
      if(response.length > 0 && response[0].template) {
        vitalDevice = _.map(response[0].template.template_attrs, function(num){ return num.name; });
        let Data = _.join(vitalDevice, ',');
        this.setState({vitalData : Data});  
      }
      else {
        this.setState({vitalData : ''}); 
      }
    });    
    return this.setState({device: device});
  }

  getDeviceById() {
    if(deviceId) {
      this.props.deviceActions.loadDeviceById(deviceId).then(response =>{
        if(response.status == false){
          this.context.router.push('/deviceList');
        } else {
          this.props.deviceActions.loadDeviceVital(response.data.device_group_id).then(response=>{
            if(response.length > 0 && response[0].template){
              let vitalDevice = _.map(response[0].template.template_attrs, function(num){ return num.name; });
              let Data = _.join(vitalDevice, ',');
              this.setState({vitalData : Data});  
            }
            else {
              this.setState({vitalData : ''}); 
            }              
          });
          if(response.data.device_image == '') {
            hideSampleImage= true;
            showimagePreview = false;
          } else {
            hideSampleImage= false;
            showimagePreview = true;
          }
          this.setState({device: response.data});
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
      toastr.success('Device Updated.');
    
    else 
      toastr.success('Device Saved.');
    
      this.context.router.push('/deviceList');
    
    
  }

  _handleImageChange(e) {
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];
    hideSampleImage = false;
    showimagePreview = true;
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

  _handleDocumentChange(e) {
    let documenterror = {};
    e.preventDefault();
    let reader = new FileReader();
    let documentFile = e.target.files[0];
    if (1) {
      reader.onloadend = () => {
        this.state.document.push(documentFile);
        this.state.documentPreview.push({ 'name': documentFile.name, 'reader': reader.result });
        this.setState({
            document: this.state.document,
            documentPreview: this.state.documentPreview
        });
      };
      reader.readAsDataURL(documentFile);
      documenterror = this.state.errors;
      documenterror.document = '';
      this.setState({ errors: documenterror });
    } 
    else {
      e.target.value = '';
      documenterror = this.state.errors;
      documenterror.document = 'Please choose file only .doc, .docx, .pdf, .ppt,.pptx';
      this.setState({ errors: documenterror });
    }
  }

  removeDocument(index, isNew) {
    if (isNew) {
      this.state.document.splice(index, 1);
      this.state.documentPreview.splice(index, 1);
      return this.setState({ document: this.state.document, documentPreview: this.state.documentPreview });
    } 
    else {
      this.state.device.DeviceDocument.splice(index, 1);
      return this.setState({ device: this.state.device });
    }
  }

  getDeviceGroup() {
    $(document).ready(function(){
      $('[data-toggle="tooltip"]').tooltip();   
    });
    this.props.deviceGroupActions.loadDeviceGroupList();
  }

  render() {
    return (
      <div>
        <Header/>
        <section id="container" className="container-wrap">
          <Leftmenu/>
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/deviceList">Device</Link></li>
            <Conditional condition={this.props.params.id == undefined}>
              <li className="active">Add Device</li>
            </Conditional>
            <Conditional condition={this.props.params.id != undefined}>
              <li className="active">Update Device</li>
            </Conditional>
          </ol>
          <section className="container-fluid">
            <div id="toolbar">
              <Conditional condition={this.props.params.id == undefined}>
                <div className="head">
                  <h3>Add Device</h3>
                </div>
              </Conditional>
              <Conditional condition={this.props.params.id != undefined}>
                <div className="head">
                  <h3>Update Device</h3>
                </div>
              </Conditional>
              <div className="card">
                <div className="card-block">
                  <div className="col s12">
                    <DeviceForm
                      device={this.state.device}
                      onChange={this.updateDeviceState}
                      fileEvent={this._handleImageChange}
                      onSave={this.saveDevice}
                      errors={this.state.errors}
                      saving={this.state.saving}
                      deviceGroupData={this.props.deviceGroupData}
                      imagePreviewUrl={this.state.imagePreviewUrl}
                      showimagePreview= {showimagePreview}
                      hideSampleImage={hideSampleImage}
                      updateDeviceGroup={this.updateDeviceGroup}
                      documentFileEvent={this._handleDocumentChange}
                      document={this.state.document}
                      removeDocument={this.removeDocument}
                      vitalData={this.state.vitalData}
                    />
                  </div>
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

ManageDevicePage.propTypes = {
  device: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};


ManageDevicePage.contextTypes = {
  router: PropTypes.object
};

function mapStateToProps(state, ownProps) {
  deviceId = ownProps.params.id;
  let device = {
    name: '',
    manufacturer: '',
    model_number: '',
    firmware: '',
    Version: '',
    device_group_id: '',
    device_image: '',
    DeviceDocument: []
  };
  
  return {
    device: device,
    deviceGroupData: deviceGroupFormattedForDropdown(state.DeviceGroupList)
    //deviceGroupData: vitalGroupFormattedForDropdown(vital)
  }
}


function mapDispatchToProps(dispatch) {
  return {
    deviceActions: bindActionCreators(deviceActions, dispatch),
    deviceGroupActions: bindActionCreators(deviceGroupActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageDevicePage);
