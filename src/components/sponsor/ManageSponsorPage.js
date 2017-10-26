import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import * as sponsorActions from '../../actions/sponsorActions';
import * as StateListActions from '../../actions/stateListActions';
import SponsorForm from './SponsorForm';
import {browserHistory, Link} from 'react-router';
import toastr from 'toastr';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import validateInput from '../common/validations/Sponsor';
import cookies from 'react-cookie';
import { Conditional } from 'react-conditional-render';
import Footer from '../common/Footer';
import {countryFormattedForDropdown} from '../../selectors/selectors';
import {stateFormattedForDropdown} from '../../selectors/selectors';
import * as stateSelect from '../common/stateSelect';

let sponsorId = '';
let showStateTextbox = false;
let hideStateSelectbox = true;
let showimagePreview = false;
let hideSampleImage = true;
export class ManageSponsorPage extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      sponsor: Object.assign({}, this.props.sponsor),
      file:'',
      imagePreviewUrl: '',
      errors: {},
      saving: false
    };
    this.getSponsorById();
    this.updateCountry = this.updateCountry.bind(this);
    this.saveSponsor = this.saveSponsor.bind(this);
    this.updateSponsorState = this.updateSponsorState.bind(this);
    this._handleImageChange = this._handleImageChange.bind(this);
    this.props.stateListActions.loadStateList(0);
    hideStateSelectbox = true;
    showStateTextbox = false;
    showimagePreview = false;
    hideSampleImage = true;
  }

  isValid() {
    const { errors, isValid } = validateInput(this.state.sponsor);

    if (!isValid) {
      this.setState({ errors });
    }

    return isValid;
  }

  updateSponsorState(event) {
    const field = event.target.name;
    let sponsor = this.state.sponsor;
    sponsor[field] = event.target.value;
    
    return this.setState({sponsor: sponsor});
  }

  updateCountry(event) {
    const field = event.target.name;
    let sponsor = this.state.sponsor;
    sponsor[field] = event.target.value;
    if(sponsor[field] == '1') {
      hideStateSelectbox = true;
      showStateTextbox= false;
      this.state.sponsor.state= '';
      this.props.stateListActions.loadStateList(sponsor[field]);
      return this.setState({sponsor: sponsor});
    } else{
      showStateTextbox= true;
      hideStateSelectbox = false;
      this.state.sponsor.state= '';
      return this.setState({sponsor: sponsor});
    }
  }

  getSponsorById() {
    if(sponsorId) {
      this.props.actions.loadSponsorsById(sponsorId).then(response =>{
        if(response.status == false){
          this.context.router.push('/sponsors');
        }else{
          showimagePreview = true;
          hideSampleImage = false;
          this.setState({sponsor: response.data});
          if(response.data.country == '1') {
            this.props.stateListActions.loadStateList(response.data.country);
            this.setState({sponsor: response.data});
          } else if(response.data.country == '2'){
              hideStateSelectbox = false;
              showStateTextbox = true;
              this.setState({sponsor: response.data});
          }
        }
      })
      .catch(error => {
        toastr.error(error);
      });
    } 
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

  saveSponsor(event) {
    event.preventDefault();
    if (this.isValid()) {
    this.setState({ errors: {} });
    this.props.actions.saveSponsor(this.state.sponsor, this.state.file)
      .then(() => this.redirect())
      .catch(error => {
        toastr.error(error);
        this.setState({saving: false});
      });
    }
  }

  redirect() {
    this.setState({saving: false});
    if(this.props.params.id)
      toastr.success('Sponsor Updated.');
    else
      toastr.success('Sponsor Saved.');

      this.context.router.push('/sponsors');
  }

  render() {
    return (
      <div>
        <Header/>
        <section id="container" className="container-wrap">
          <Leftmenu/>
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/sponsors">Sponsor</Link></li>
            <Conditional condition={this.props.params.id == undefined}>
              <li className="active">Add Sponsor</li>
            </Conditional>
            <Conditional condition={this.props.params.id != undefined}>
              <li className="active">Update Sponsor</li>
            </Conditional>
          </ol>
          <section className="container-fluid">
            <div id="toolbar">
              <Conditional condition={this.props.params.id == undefined}>
                <div className="head">
                  <h3>Add Sponsor</h3>
                </div>
              </Conditional>
              <Conditional condition={this.props.params.id != undefined}>
                <div className="head">
                  <h3>Update Sponsor</h3>
                </div>
              </Conditional>
              <div className="card">
                <div className="card-block">
                  <div className="col s12">
                    <SponsorForm
                      sponsor={this.state.sponsor}
                      fileEvent={this._handleImageChange}
                      countryList={this.props.countryList}
                      stateList={this.props.stateList}
                      onChange={this.updateSponsorState}
                      updateCountry={this.updateCountry}
                      showStateTextbox={showStateTextbox}
                      hideStateSelectbox={hideStateSelectbox}
                      onSave={this.saveSponsor}
                      errors={this.state.errors}
                      saving={this.state.saving}
                      imagePreviewUrl={this.state.imagePreviewUrl}
                      showimagePreview= {showimagePreview}
                      hideSampleImage={hideSampleImage}
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

ManageSponsorPage.propTypes = {
  sponsor: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};

//Pull in the React Router context so router is available on this.context.router.
ManageSponsorPage.contextTypes = {
  router: PropTypes.object
};

function mapStateToProps(state, ownProps) {
  sponsorId = ownProps.params.id;
  let sponsor = {
    id: '', 
    company_id: '', 
    sponsor_company: '', 
    contact_name: '', 
    email_address: '',
    contact_number:'',
    contact_address_1:'',
    contact_address_2:'',
    state:'', 
    country:'',
    zip:''
  };
  
  return {
    sponsor: sponsor,
    countryList: countryFormattedForDropdown(state.CountryList),
    stateList: stateFormattedForDropdown(state.StateList)
  };
 
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(sponsorActions, dispatch),
    stateListActions: bindActionCreators(StateListActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageSponsorPage);
