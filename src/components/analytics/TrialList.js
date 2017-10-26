import React, {PropTypes} from 'react';
import TrialListRow from './TrialListRow';

const TrialList = ({trials,timeZone, onDeleteTrial, userRoleName, onCompeletedTrial, ongetTrial}) => {
  return (
    <div className ="at-panel-list">
      { trials.length > 0 && trials.map(trial =>
        <TrialListRow 
          key={trial.id} 
          trial={trial}
          userRoleName={userRoleName}
          onDeleteTrial={onDeleteTrial} 
          timeZone = {timeZone}
          onCompeletedTrial={onCompeletedTrial}
          ongetTrial={ongetTrial}
        />
      )}
      { 
      trials.length == 0 &&
        <div className="trial-head">
          <h2> Active Trials Not Found. </h2>
        </div>
      }
    </div>
  
  );
};

TrialList.propTypes = {
  trials: PropTypes.array.isRequired,
  onDeleteTrial: PropTypes.func.isRequired,
  ongetTrial: PropTypes.func.isRequired,
};

export default TrialList;
