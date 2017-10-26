import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import * as trialActions from '../../actions/trialActions';
import moment from 'moment';
import { Conditional } from 'react-conditional-render';
import * as UTCtoUser from '../common/generalFunctions';

const TrialListRow = ({trial,onDeleteTrial, userRoleName, onCompeletedTrial,ongetTrial,timeZone}) => {
  return (
    <div className="at-panel">
      <div className="head"><h2>{trial.name} </h2>
        <ul className="panel-action"> 
          <li> 
            <Link to={'/trialDetail/' + trial.id}>                                   
              <img src={require('../../assets/img/icon-view.png')}/>
            </Link>
          </li>
        </ul>
      </div>
      <div className="at-panel-body">
        <p>{trial.description}</p>
          <Conditional condition={trial.description.length > 130 }>
            <div className="tooltip1">View More
              <span className="tooltiptext">
                {trial.description}
              </span>
            </div>
          </Conditional>
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
