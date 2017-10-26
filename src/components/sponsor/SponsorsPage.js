import React, {PropTypes} from 'react';
import { bindActionCreators } from 'redux';
import {connect} from 'react-redux';
import {browserHistory, Link} from 'react-router';
import * as sponsorActions from '../../actions/sponsorActions';
import SponsorList from './SponsorList';
import toastr from 'toastr';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import { Conditional } from 'react-conditional-render';
import * as RolesandPermission from '../common/RolesandPermission';
import cookies from 'react-cookie';
import Footer from '../common/Footer';
import Pagination from "react-js-pagination";

let search = {
  params: {
    "pageNumber": 1,
    "pageSize": 10
  }
};

class SponsorsPage extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state ={
      search:search
    };
    this.sponsorData = '';
    this.getAllSponsorList(search);
    //this.deleteSource = this.deleteSource.bind(this);
    this.ConfirmDelete = this.ConfirmDelete.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    
  }

  handlePageChange(pageNumber) {
    this.setState({activePage: pageNumber});
    this.state.search.params.pageNumber = pageNumber;
    this.getAllSponsorList(this.state.search);
  }
 
  getAllSponsorList(search) {
    this.props.actions.loadSponsors(search);
  }

  ConfirmDelete(sponsor){
    if(confirm("Are you sure you want to delete Sponsor ?")){
      if(sponsor)
      {
        this.props.actions.deleteSponsor(sponsor)
        .then(() => 
          this.redirect(),
        $('#myModal').modal("hide"))
        .catch(error => {
          toastr.error(error);
          this.setState({saving: false});
        });
      }
      else {
        return false;
      }
    }
  }

  redirect() {
    this.setState({saving: false});
    browserHistory.push('/sponsors');
    toastr.success('Sponsor Deleted.');
  }

  render() {
    return (
      <div className="main-wrap">
        <Header/>
        <Leftmenu/>
        <section id="container" className="container-wrap">
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li className="active">Sponsor List</li>
          </ol>
          <section className="container-fluid">
            <div id="toolbar">
              <h3 className="pull-left">Sponsor</h3>
              <div className="pull-right right-head">
               <Link to="/sponsor" className="btn btn-border pull-left"> 
                <img src={require('../../assets/img/add-icon-white.png')} />Sponsors 
               </Link> 
              </div>
            </div>
            <section className="card">
              <div className="card-block">
                <SponsorList sponsors={this.props.sponsors} onDeletSponsor={this.ConfirmDelete}/>
              </div>
              <Conditional condition={this.props.sponsorsCount > 10}>
                <div className="pagging-section">
                  <Pagination
                    activePage={this.state.search.params.pageNumber}
                    itemsCountPerPage={this.state.search.params.pageSize}
                    totalItemsCount={this.props.sponsorsCount}
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

SponsorsPage.propTypes = {
  actions: PropTypes.object.isRequired,
  sponsors: PropTypes.array.isRequired,
  onDeletSponsor: PropTypes.func.isRequired
};

function mapStateToProps(state, ownProps) {
  return {
    sponsors: !_.isUndefined(state.sponsors.rows) ? state.sponsors.rows : state.sponsors,
    sponsorsCount: !_.isUndefined(state.sponsors.count) ? state.sponsors.count : state.sponsors,
    onDeletSponsor: state.sponsor
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(sponsorActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SponsorsPage);
