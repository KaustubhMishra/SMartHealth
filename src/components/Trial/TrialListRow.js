import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import * as trialActions from '../../actions/trialActions';
import moment from 'moment';
import { Conditional } from 'react-conditional-render';
import * as UTCtoUser from '../common/generalFunctions';
import _ from 'lodash';

const TrialListRow = ({trial,onDeleteTrial, userRoleName, onCompeletedTrial,ongetTrial,timeZone}) => {
  return (
    <div className="at-panel">
      <div className="head"><h2>{trial.name} </h2>
        <ul className="panel-action">
            <Conditional condition={ trial.status != 100 }>
              <li onClick={() => onCompeletedTrial(trial)}>
                <Conditional condition={ userRoleName.name != 'DSMB' && userRoleName.name != 'CRO Coordinator'}>
                  <a  className="add-more-milestones-btn js-open-modal" href="javascript:void(0)" 
                    data-toggle="modal" data-target="#compeleteModal" data-modal-id="compeleteModal"> 
                    <img src={require('../../assets/img/icon-logout.png')}/>
                  </a>
                </Conditional>
              </li>
            </Conditional>  
            <Conditional condition={ trial.status != 100 }>
              <Conditional condition={ userRoleName.name != 'DSMB' && userRoleName.name != 'CRO Coordinator'}>
                <li>
                  <Link to={'/trial/' + trial.id}>
                    <img src={require('../../assets/img/icon-edit-green.png')}/>
                  </Link>
                </li>
              </Conditional>
            </Conditional> 
            <li> 
              <Link to={'/trialDetail/' + trial.id}>                                   
                <img src={require('../../assets/img/icon-view.png')}/>
              </Link>
            </li>
          <Conditional condition={ UTCtoUser.UTCtoUserTimezone(new Date(),timeZone) < UTCtoUser.UTCtoUserTimezone(trial.start_date,timeZone) }>                  
            <li onClick={() => onDeleteTrial(trial)}>
              <Conditional condition={ userRoleName.name != 'DSMB' && userRoleName.name != 'CRO Coordinator'}>
                <a  className="add-more-milestones-btn js-open-modal" href="javascript:void(0)" 
                  data-toggle="modal" data-target="#deleteModal" data-modal-id="deleteModal"> 
                    <i className="fa fa-trash fa-lg" aria-hidden="true"></i>
                </a>
              </Conditional>   
            </li>
          </Conditional>
        </ul>
      </div>
      <div className="at-panel-body">
        <p>{trial.description}</p>
        
          {!_.isUndefined(trial.description) && (
            trial.description.length > 80 && (
          <div className="tooltip1">View More
                          <span className="tooltiptext">
                            {trial.description}
                          </span>
                        </div>
                        )
            )}
              
            
        <div className="ending-on">
          <label>Ending On:</label> 
          <span>{ UTCtoUser.UTCtoUserTimezone(trial.end_date,timeZone) }</span>
        </div>
        <ul className="trial-status">
          <li>Status</li>
          <li><div className="status"><b style={{ width: trial.status + '%' }} className="green"></b></div></li>
          <li><span>{trial.status}%</span> Completed</li>
        </ul>
      </div>
    </div>          
  );
};

TrialListRow.propTypes = {
  trial: PropTypes.object.isRequired,
  onDeleteTrial: PropTypes.func.isRequired,
  onCompeletedTrial: PropTypes.func.isRequired,
  ongetTrial: PropTypes.func.isRequired
};

export default TrialListRow;
