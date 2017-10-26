import React, {PropTypes} from 'react';
import SideEffectsListRow from './sideEffectsListRow';

const SideEffectsList = ({sideEffects,onDeletesideEffect}) => {
  return (
    <table id="example" className="display table table-bordered" cellspacing="0" width="100%">
      <thead>
      <tr>
        <th>Name</th>
        <th className="text-center" style={{width: 120 +'px'}}>Action</th>
      </tr>
      </thead>
      <tbody>
      {sideEffects.map(sideEffect =>
        <SideEffectsListRow key={sideEffect.id} sideEffect={sideEffect} onDeletesideEffect = {onDeletesideEffect}/>
      )}
      {sideEffects.length == 0 &&
        <tr><td className="valign-center" colSpan="6">Data not found</td> </tr>
      } 
      </tbody>
    </table>
  );
};

SideEffectsList.propTypes = {
  sideEffects: PropTypes.array.isRequired,
  onDeletesideEffect: PropTypes.func.isRequired
};

export default SideEffectsList;
