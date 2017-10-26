import React, {PropTypes} from 'react';
import { Link, browserHistory } from 'react-router';
import Header from '../common/Header';
import toastr from 'toastr';
import Leftmenu from '../common/Leftmenu';
import Footer from '../common/Footer';
import {bindActionCreators} from 'redux';
import UserList from'./userListPage';
import * as userActions from '../../actions/userActions';
import {connect} from 'react-redux';
import Pagination from "react-js-pagination";
import cookies from 'react-cookie';
import { Conditional } from 'react-conditional-render';

let search = {
  params: {
    "pageNumber": 1,
    "pageSize": 10
  }
};


class UserPage extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state ={
      search:search,
      disableUser: ''
    };
    this.userData = '';
    this.getAllUserList(search);
    this.deleteUser = this.deleteUser.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.ConfirmDelete = this.ConfirmDelete.bind(this);
  }

  componentwillMount(){
    this.onPageLoad();
  }

  handlePageChange(pageNumber) {
    this.setState({activePage: pageNumber});
    this.state.search.params.pageNumber = pageNumber;
    this.getAllUserList(this.state.search);
    
  }

  onPageLoad() {
    $(document).ready(function(){
      var appendthis =  ("<div class='modal-overlay js-modal-close'></div>");
        $('li[data-modal-id]').click(function(e) {
          e.preventDefault();
          $("body").append(appendthis);
          $(".modal-overlay").fadeTo(500, 0.7);
          var modalBox = $(this).attr('data-modal-id');
          $('#'+modalBox).fadeIn($(this).data());
        });  
        $(".js-modal-close, .modal-overlay").click(function() {
          $(".modal-box, .modal-overlay").fadeOut(500, function() {
            $(".modal-overlay").remove();
          });   
        });
        $(window).resize(function() {
          $(".modal-box").css({
            top: ($(window).height() - $(".modal-box").outerHeight()) / 2,
              left: ($(window).width() - $(".modal-box").outerWidth()) / 2
            });
        });   
      $(window).resize();
    });
  }

  handleChange(event , id) {
    const signIn = this.state;
    signIn.disableUser = event.target.checked;
    this.setState({ signIn });
    this.disableEnableUser(this.state.disableUser, id);
  }

  disableEnableUser(disableUser, id) {
    this.props.actions.userToggle(disableUser, id)
    .then(()=>this.getAllUserList(search));
  }



  ConfirmDelete() {
    if(user)
      {
        this.props.actions.deleteUserData(user)
        .then(() => this.redirect(),
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
    
  deleteUser(user) {
    if(confirm("Are you sure you want to delete User ?")){
      if(user)
      {
        this.props.actions.deleteUserData(user)
        .then(() => this.redirect(),
       $ ('#myModal').modal("hide"))
        .catch(error => {
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
    this.getAllUserList(data);
    this.setState({saving: false});
    browserHistory.push('/users');
    toastr.success('User Deleted.');
  }
    
  getAllUserList(search) {
    this.props.actions.loadUsers(search);
  }

  render() {
    return (
      <div className="main-wrap">
    		<Header/>
        <Leftmenu/>
        <section id="container" className="container-wrap">
          <ol className="breadcrumb breadcrumb-simple">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li className="active">User List</li>
          </ol>
        	<section className="container-fluid">
            <div id="toolbar">
              <h3 className="pull-left">User</h3>
              <div className="pull-right right-head">
               <Link to="/addUsers" className="btn btn-border pull-left"> 
                <img src={require('../../assets/img/add-icon-white.png')} />Users 
               </Link> 
              </div>
            </div>
    				<section className="card">
    					<div className="card-block">
                <UserList user={this.props.user} DeleteUser={this.deleteUser} HandleChange={this.handleChange} disableUser={this.state.disableUser}/>
    					</div>
              <Conditional condition={this.props.userCount > 10}>
                <div className="pagging-section">
                  <Pagination
                    activePage={this.state.search.params.pageNumber}
                    itemsCountPerPage={this.state.search.params.pageSize}
                    totalItemsCount={this.props.userCount}
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


UserPage.propTypes = {
  actions: PropTypes.object.isRequired,
  user: PropTypes.array.isRequired
};

function mapStateToProps(state, ownProps) {
  return {   
    user: !_.isUndefined(state.Users.rows) ? state.Users.rows : state.Users,
    userCount: !_.isUndefined(state.Users.count) ? state.Users.count : state.Users      
  };
 
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(userActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserPage);
