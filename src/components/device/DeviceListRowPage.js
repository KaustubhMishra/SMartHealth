import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import * as sponsorActions from '../../actions/sponsorActions';
import cookies from 'react-cookie';

const DeviceListRowPage = ({deviceListData, DeleteDevice}) => {
  return (
    <tr className="grey">
      <td>{deviceListData.name}</td>
      <td>{deviceListData.manufacturer}</td>
      <td>{deviceListData.firmware}</td>
      <td>{deviceListData.version}</td>
      <td>
        <Link to={'/deviceListData/' + deviceListData.id} className="icon">
          <img src={require('../../assets/img/edit-green.svg')} />
        </Link>
        <span className="icon">
          <img src={require('../../assets/img/delete-red.svg')} onClick={() => DeleteDevice(deviceListData)} />
        </span>
      </td>
    </tr>
  );

};

DeviceListRowPage.propTypes = {
  deviceListData: PropTypes.object.isRequired
};

export default DeviceListRowPage;
