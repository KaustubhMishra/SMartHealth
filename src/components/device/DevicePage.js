import React from 'react';
import { Link, browserHistory } from 'react-router';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import Footer from '../common/Footer';
import DeviceListPage from './DeviceListPage';
import Pagination from "react-js-pagination";
import * as deviceActions from '../../actions/deviceActions';
import toastr from 'toastr';
import { Conditional } from 'react-conditional-render';

let search = {
  params: {
    "pageNumber": 1,
    "pageSize": 10
  }
};

class DevicePage extends React.Component {
    constructor(props, context) {
      super(props, context);
      this.state ={
        search:search
      };
      this.getAllDeviceList(search);
      this.deleteSelectedDevice = this.deleteSelectedDevice.bind(this);
    }

    handlePageChange(pageNumber) {
      this.setState({activePage: pageNumber});
      this.state.search.params.pageNumber = pageNumber;
      this.getAllDeviceList(this.state.search);  
    }

    getAllDeviceList(search) {
      this.props.deviceActions.loadDeviceData(search);
    }

    deleteSelectedDevice(device) {
      if(confirm("Are you sure you want to delete Device ?")){
        if(device)
        {
          this.props.deviceActions.deleteDevice(device)
          .then(() => this.redirect(),
         $ ('#myModal').modal("hide"))
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
      let data = {
        params: {
          "pageNumber": 1,
          "pageSize": 10
        }
      };
      this.getAllDeviceList(data);
      this.setState({saving: false});
      browserHistory.push('/deviceList');
      toastr.success('Device Deleted Successfully.');
    }


    render() {
        return (
          <div className="main-wrap">
            <Header/>
            <Leftmenu/>
            <section id="container" className="container-wrap">
              <ol className="breadcrumb breadcrumb-simple">
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li className="active">Device List</li>
              </ol>  
              <section className="container-fluid">
                <div id="toolbar">
                  <h3 className="pull-left">Device</h3>
                  <div className="pull-right right-head">
                    <Link to="/addDevice" className="btn btn-border pull-left"> 
                      <img src={require('../../assets/img/add-icon-white.png')} />Device 
                    </Link> 
                  </div>
                </div>  
                <section className="card">
                  <div className="card-block">
                    <DeviceListPage deviceListData={this.props.deviceListData} DeleteDevice={this.deleteSelectedDevice} />
                  </div>
                  <Conditional condition={this.props.deviceListDataCount > 10}>
                    <div className="pagging-section">
                      <Pagination
                        activePage={this.state.search.params.pageNumber}
                        itemsCountPerPage={this.state.search.params.pageSize}
                        totalItemsCount={this.props.deviceListDataCount}
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

function mapStateToProps(state, ownProps) {
  return {   
    deviceListData: !_.isUndefined(state.DeviceListData.rows) ? state.DeviceListData.rows : state.DeviceListData,
    deviceListDataCount: !_.isUndefined(state.DeviceListData.count) ? state.DeviceListData.count : state.DeviceListData       
  };
}


function mapDispatchToProps(dispatch) {
  return {
    deviceActions: bindActionCreators(deviceActions, dispatch)
    
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DevicePage);
