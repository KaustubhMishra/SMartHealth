import React from 'react';
import { Link } from 'react-router';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import { Conditional } from 'react-conditional-render';
import * as RolesandPermission from '../common/RolesandPermission';

class TrailPage extends React.Component {
    render() {
        return (
            <div className="page-center bodyfullheight">
				<Header />
				<Leftmenu/>
				<div className="page-content" >
					<div className="container-fluid">
						<header className="section-header">
							<div className="tbl">
								<div className="tbl-row">
									<div className="tbl-cell">
										<h3>Trail</h3>
										<Conditional condition={RolesandPermission.permissionCheck("TRAIL_ADD_UPDATE") ==true}>
											<Link className="btn float-right" to="dashboard"  >Add Trail &nbsp;<i className="fa fa-plus-circle"></i> 
											</Link>
										</Conditional>
									</div>
								</div>
							</div>
						</header>
						<section className="card">
							<div className="card-block">
								<div className="SearchBox row">
									<div className="SearchElementBox col-md-3 m-b-md">
										<div className="SearchBoxNextRow">
											<div className="searchboxelement">
												<div className="row">
													<label className="col-lg-3 col-xs-4 form-control-label">Search:</label>
													<div className="col-lg-9 col-xs-8">
														<input type="text" placeholder="Any Keyword" className="textbox form-control input-sm" />
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="SearchAction  col-md-4">
										<div className="searchClrbtnDiv">
											<input type="submit" name="" value="Search" className="btn btn-inline commonLink" />
											<input type="submit" name="" value="Clear" className="btn btn-inline commonLink btn-primary-outline" />
										</div>
									</div>
								</div>
								<table className="display table table-bordered hover-table" width="100%" >
									<thead>
										<tr>
											<th>#</th>
											<th>Name</th>
											<th>Country</th>
											<th>Action</th>
										</tr>
									</thead>
									<tbody>
										<tr className="grey">
											<td title="id">1</td>
											<td title="Name" >John Doe</td>
											<td title="Country" >USA</td>
											<td title="'Created Date'" sortable="'createdAt'" >
												<a  className="textdanger uppercase float-right delectlink">Edit <i className="fa fa-times-circle"></i></a>
				                        		<a  className="textdanger uppercase float-right delectlink">Delete <i className="fa fa-times-circle"></i></a>
				                      		</td>
				                  		</tr>
										<tr className="grey">
											<td title="id">2</td>
											<td title="Name" >Harry Pac</td>
											<td title="Country" >USA</td>
											<td title="'Created Date'" sortable="'createdAt'" >
												<a  className="textdanger uppercase float-right delectlink">Edit <i className="fa fa-times-circle"></i></a>
												<a  className="textdanger uppercase float-right delectlink">Delete <i className="fa fa-times-circle"></i></a>
											</td>
										</tr>
				                    <tr className="grey">
				                        <td title="id">3</td>
				                        <td title="Name" >Mac Carther</td>
				                        <td title="Country" >USA</td>
				                        <td title="'Created Date'" sortable="'createdAt'" >
				                             <a  className="textdanger uppercase float-right delectlink">Edit <i className="fa fa-times-circle"></i></a>
				                             <a  className="textdanger uppercase float-right delectlink">Delete <i className="fa fa-times-circle"></i></a>
				                        </td>
				                    </tr>
				                    <tr className="grey">
				                        <td title="id">4</td>
				                        <td title="Name" >Marry Ton</td>
				                        <td title="Country" >USA</td>
				                        <td title="'Created Date'" sortable="'createdAt'" >
				                             <a  className="textdanger uppercase float-right delectlink">Edit <i className="fa fa-times-circle"></i></a>
				                             <a  className="textdanger uppercase float-right delectlink">Delete <i className="fa fa-times-circle"></i></a>
				                        </td>
				                    </tr>
				                    <tr className="grey">
				                        <td title="id">5</td>
				                        <td title="Name" >John Williamson</td>
				                        <td title="Country" >USA</td>
				                        <td title="'Created Date'" sortable="'createdAt'" >
				                             <a  className="textdanger uppercase float-right delectlink">Edit <i className="fa fa-times-circle"></i></a>
				                             <a  className="textdanger uppercase float-right delectlink">Delete <i className="fa fa-times-circle"></i></a>
				                        </td>
				                    </tr>
				                    </tbody>
				                </table>
				            </div>
				        </section>
				    </div>
				</div>
		     </div>
        );
    }
}

export default TrailPage;
