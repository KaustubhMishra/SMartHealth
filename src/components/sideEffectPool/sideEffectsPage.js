import React, {PropTypes} from 'react';
import { bindActionCreators } from 'redux';
import {connect} from 'react-redux';
import {browserHistory, Link} from 'react-router';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import Footer from '../common/Footer';
import { Conditional } from 'react-conditional-render';
import * as RolesandPermission from '../common/RolesandPermission';
import SideEffectsList from './sideEffectsList';
import * as sideEffectsActions from '../../actions/sideEffectsActions';
import Pagination from "react-js-pagination";
import toastr from 'toastr';

let search = {
  params: {
    "pageNumber": 1,
    "pageSize": 10
  }
};

class sideEffectsPage extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state ={
      search:search
    };

    this.sideEffectData = '';
    this.getAllSideEffectsList(search);
    this.deleteSource = this.deleteSource.bind(this);
    this.ConfirmDelete = this.ConfirmDelete.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
  }
  
  handlePageChange(pageNumber) {
    this.setState({activePage: pageNumber});
    this.state.search.params.pageNumber = pageNumber;
    this.getAllSideEffectsList(this.state.search);
  } 
  
  getAllSideEffectsList(search) {
    this.props.actions.loadSideEffects(search);
  }

  ConfirmDelete(){
    if(this.sideEffectData)
    {
      this.props.actions.deleteSideEffect(this.sideEffectData)
      .then(() => 
        this.redirect(),
        toastr.success('Side Effect Deleted SuccessFully.')
      )
      .catch(error => {
        toastr.error(error);
        this.setState({saving: false});
      });
    }
    else {
      return false;
    }
  }

  redirect() {
    this.setState({saving: false});
    this.state.search.params = {
      "pageNumber": 1,
      "pageSize": 10,
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
    this.getAllSideEffectsList(this.state.search);
  }

  deleteSource(sideEffect) {
    this.sideEffectData = sideEffect; 
  }

  render() {
    return (
      <div className="main-wrap">
        <Header/>
        <Leftmenu/>
        <section id="container" className="container-wrap">
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li className="active">Side Effect Pool</li>
          </ol>  
          <section className="container-fluid">
            <div id="toolbar">
              <h3 className="pull-left">Side Effect Pool</h3>
              <div className="pull-right right-head">
               <Link to="/sideEffect" className="btn btn-border pull-left"> 
                <img src={require('../../assets/img/add-icon-white.png')} />Side Effect 
               </Link> 
              </div>
            </div>
            <section className="card">
              <div className="card-block">
                <SideEffectsList sideEffects={this.props.sideEffects} onDeletesideEffect={this.deleteSource}/>
              </div>
              <Conditional condition={this.props.sideEffectsCount > 10}>
                <div className="pagging-section">
                  <Pagination
                    activePage={this.state.search.params.pageNumber}
                    itemsCountPerPage={this.state.search.params.pageSize}
                    totalItemsCount={this.props.sideEffectsCount}
                    pageRangeDisplayed={5}
                    onChange={this.handlePageChange}
                    prevPageText={<i className="fa fa-chevron-left"></i>}
                    nextPageText={<i className="fa fa-chevron-right"></i>}
                  />
                </div>
              </Conditional>
            </section>
          </section>
        </section>
        <Footer/>
      </div>
    );
  }
}

sideEffectsPage.propTypes = {
  actions: PropTypes.object.isRequired,
  sideEffects: PropTypes.array.isRequired,
  onDeletesideEffect: PropTypes.func.isRequired
};

function mapStateToProps(state, ownProps) {
  return {
    sideEffects: !_.isUndefined(state.sideEffects.rows) ? state.sideEffects.rows : state.sideEffects,
    sideEffectsCount: !_.isUndefined(state.sideEffects.count) ? state.sideEffects.count : state.sideEffects.count
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(sideEffectsActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(sideEffectsPage);
