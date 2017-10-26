import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import TextInput from '../common/TextInput';
import TextArea from '../common/TextArea';
import SelectInput from '../common/SelectInput';
import { Conditional } from 'react-conditional-render';
import * as UTCtoUser from '../common/generalFunctions';

const DeviceListRow = ({device,index,onDeleteDevice,trial,UsertimeZone}) => {
  
  return (
    <tr>
      <td>{device.name}</td>
      <td>{device.manufacturer}</td>
      <td>{device.firmware}</td>
      <td>{device.version}</td>
      <td className="text-center">
        <Conditional condition={ (trial.id == undefined) }>
          <button 
            type="button" 
            id="btnDeleteDevice" 
            className="icon" 
            onClick={() => onDeleteDevice(device,index)}>
          <img src={require('../../assets/img/delete-red.svg')}/>
          </button>
        </Conditional> 
        <Conditional condition={ (trial.id != undefined) && (UTCtoUser.UTCtoUserTimezone(new Date(),UsertimeZone) >= trial.start_date) }>
          <button 
            type="button" 
            id="btnDeleteDevice" 
            className="icon" 
            disabled>
            <img src={require('../../assets/img/delete-red.svg')}/>
          </button>
        </Conditional> 
        <Conditional condition={ (trial.id != undefined) && (UTCtoUser.UTCtoUserTimezone(new Date(),UsertimeZone) < trial.start_date) }>
          <button 
            type="button" 
            id="btnDeleteDevice" 
            className="icon" 
            onClick={() => onDeleteDevice(device,index)}>
            <img src={require('../../assets/img/delete-red.svg')}/>
          </button>
        </Conditional>  
      </td>
    </tr>
  );

};

DeviceListRow.propTypes = {
	onDeleteDevice: PropTypes.func.isRequired
};

export default DeviceListRow;

