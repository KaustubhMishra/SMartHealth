import React, {PropTypes} from 'react';
import DeviceListRowPage from './DeviceListRowPage';

const DeviceListPage = ({deviceListData, DeleteDevice}) => {
  return (
    <table id="example" className="display table table-bordered" cellspacing="0" width="100%">
      <thead>
      <tr>
        <th>Name</th>
        <th>Manufacture</th>
        <th>FirmWare</th>
        <th>Version</th>
        <th className="text-center" style={{width: 90 +'px'}}>Action</th>
      </tr>
      </thead>
      <tbody>
      {deviceListData.map(deviceListData =>
        <DeviceListRowPage key={deviceListData.id} deviceListData={deviceListData} DeleteDevice={DeleteDevice} />
      )}
      {deviceListData.length == 0 &&
        <tr><td className="valign-center" colSpan="6">Data not found</td> </tr>
      } 
      </tbody>
    </table>
  );
};

DeviceListPage.propTypes = {
  deviceListData: PropTypes.array.isRequired
};

export default DeviceListPage;
