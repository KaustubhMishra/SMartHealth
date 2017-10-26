import React, {PropTypes} from 'react';
import { Conditional } from 'react-conditional-render';
import * as UTCtoUser from '../common/generalFunctions';

const PatientEnrolledListPage = ({patientEnrolledList, getPatientDetailedGraph, UsertimeZone}) => {
  var listRow = [];
  for(var i=0; i <patientEnrolledList.length; i++) {
    let pat = patientEnrolledList[i].patient_id;
    var tri = patientEnrolledList[i].id;
    var pha= patientEnrolledList[i].phase_id;
    listRow.push(
      <tr className="grey">
      <td onClick={() => getPatientDetailedGraph(pat, tri, pha)} > <a href="javascript:void(0)">{patientEnrolledList[i].firstname} {patientEnrolledList[i].lastname} </a></td>
      <td>{patientEnrolledList[i].gender}</td>
      <td>{patientEnrolledList[i].age}</td>
      <td>{patientEnrolledList[i].name}</td>
      <td>{patientEnrolledList[i].sr_no}</td>
      <td>{UTCtoUser.UTCtoUserTimezone(patientEnrolledList[i].createdAt, UsertimeZone)}</td>
      </tr>
    )
  }

  return (
    <table id="example" className="table table-striped table-bordered" cellspacing="0" width="100%">
      <thead>
      <tr>
        <th>Name</th>
        <th>Gender</th>
        <th>Age</th>
        <th>Trial</th>
        <th>Phase</th>
        <th>Enrolled On</th>
      </tr>
      </thead>
      <tbody>
      {listRow}
      {patientEnrolledList.length == 0 &&
          <tr><td className="valign-center" colSpan="6">Data not found</td> </tr>} 
      </tbody>
    </table>
  );
};

PatientEnrolledListPage.propTypes = {
  patient: PropTypes.array.isRequired
};

export default PatientEnrolledListPage;
