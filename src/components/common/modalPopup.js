import React, {PropTypes} from 'react';
import { Link, IndexLink } from 'react-router';

const modalPopup =() => {
  return (
                <div className="modal fade" id="myModal" role="dialog">
                    <div className="modal-dialog">
                      <div className="modal-content"> 
                        <div className="modal-header">
                          <button type="button" className="close" data-dismiss="modal">&times;</button>
                          <h4 className="modal-title">Delete</h4>
                        </div>
                        <div className="modal-body">
                          Are You Sure You Want To Delete Trial ?
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={this.ConfirmDelete} >Ok</button>
                            <button type="button" className="btn btn-primary-outline btn-inline" data-dismiss="modal">Close</button>
                        </div>
                      </div>
                    </div>
                </div>
  );
};

export default modalPopup;
