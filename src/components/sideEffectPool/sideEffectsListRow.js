import React, {PropTypes} from 'react';
import {Link} from 'react-router';

const SideEffectsListRow = ({sideEffect,onDeletesideEffect}) => {
  return (
    <tr className="grey">
      <td>{sideEffect.name}</td>
       <td>
        <Link to={'/sideEffect/' + sideEffect.id} className="icon">
          <img src={require('../../assets/img/edit-green.svg')} />
        </Link>
        <span className="icon">
          <img src={require('../../assets/img/delete-red.svg')} onClick={() => onDeletesideEffect(sideEffect)}/>
        </span>  
      </td>
    </tr>
  );
};

SideEffectsListRow.propTypes = {
  sideEffect: PropTypes.object.isRequired,
  onDeletesideEffect: PropTypes.func.isRequired
};

export default SideEffectsListRow;
