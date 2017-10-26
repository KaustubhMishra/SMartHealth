import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {browserHistory, Link} from 'react-router';
import toastr from 'toastr';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import cookies from 'react-cookie';
import { Conditional } from 'react-conditional-render';
import Footer from '../common/Footer';
import * as sideEffectsActions from '../../actions/sideEffectsActions';
import SideEffectForm from './sideEffectForm';
import validateInput from '../common/validations/SideEffect';
let sideEffectId = '';

export class ManageSideEffectPage extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      sideEffect: Object.assign({}, this.props.sideEffect),
      errors: {},
      saving: false
    };
    
    this.savesideEffect = this.savesideEffect.bind(this);
    this.updatesideEffectState = this.updatesideEffectState.bind(this);
    this.getSideEffectById();
  }

   componentWillReceiveProps(nextProps) {
    if (this.props.sideEffect.id != nextProps.sideEffect.id) {
      this.setState({sideEffect: Object.assign({}, nextProps.sideEffect)});
    }
  }

   updatesideEffectState(event) {
    const field = event.target.name;
    let sideEffect = this.state.sideEffect;
    sideEffect[field] = event.target.value;
    
    return this.setState({sideEffect: sideEffect});
  }

  isValid() {
    const { errors, isValid } = validateInput(this.state.sideEffect);

    if (!isValid) {
      this.setState({ errors });
    }

    return isValid;
  }

  getSideEffectById() {
    if(sideEffectId) {
      this.props.sideEffectsActions.loadSideEffectById(sideEffectId).then(response =>{
        if(response.status == false){
          this.context.router.push('/sideEffect');
        }else{
          this.setState({sideEffect: response.data});
        }
      })
      .catch(error => {
        toastr.error(error);
      });
    } 
  }


  savesideEffect(event) {
    event.preventDefault();
    if (this.isValid()) {
    this.setState({ errors: {} });
    this.props.sideEffectsActions.saveSideEffect(this.state.sideEffect)
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
      toastr.success('Side Effect Updated.');
    
    else 
      toastr.success('Side Effect Saved.');
      
      this.context.router.push('/sideeffects');
    
  }


  render() {
    return (
      <div>
        <Header/>
        <Leftmenu/>
        <section id="container" className="container-wrap">
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/sideEffects">Side Effects</Link></li>
            <Conditional condition={this.props.params.id == undefined}>
              <li className="active">Add Side Effects</li>
            </Conditional>
            <Conditional condition={this.props.params.id != undefined}>
              <li className="active">Update Side Effects</li>
            </Conditional>
          </ol>
          <section className="container-fluid">
            <div id="toolbar">
              <Conditional condition={this.props.params.id == undefined}>
                <div className="head">
                  <h3>Add Side Effects</h3>
                </div>
              </Conditional>
              <Conditional condition={this.props.params.id != undefined}>
                <div className="head">
                  <h3>Update Side Effects</h3>
                </div>
              </Conditional>
            </div>
            <div className="card">
              <div className="card-block">
                <div className="col s12">
                  <SideEffectForm
                    sideEffect={this.state.sideEffect}
                    onChange={this.updatesideEffectState}
                    onSave={this.savesideEffect}
                    errors={this.state.errors}
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



ManageSideEffectPage.propTypes = {
  sideEffect: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired
};

//Pull in the React Router context so router is available on this.context.router.
ManageSideEffectPage.contextTypes = {
  router: PropTypes.object
};



function mapStateToProps(state, ownProps) {
  sideEffectId = ownProps.params.id; 
  let sideEffect = {id: '', name: ''};
  return {
    sideEffect: sideEffect
  };
 
}

function mapDispatchToProps(dispatch) {
  return {
    sideEffectsActions: bindActionCreators(sideEffectsActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ManageSideEffectPage);
