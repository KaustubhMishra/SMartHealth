import React, {PropTypes} from 'react';
import SponsorListRow from './SponsorListRow';

const SponsorList = ({sponsors,onDeletSponsor}) => {
  return (
    <table id="example" className="display table table-bordered sponsor-table" cellspacing="0" width="100%">
      <thead>
      <tr>
        <th>Company</th>
        <th>Name</th>
        <th>Email</th>
        <th>City</th>
        <th>State</th>
        <th className="text-center" style={{width: 90 +'px'}}>Action</th>
      </tr>
      </thead>
      <tbody>
      {sponsors.map(sponsor =>
        <SponsorListRow key={sponsor.id} sponsor={sponsor} onDeletSponsor={onDeletSponsor}/>
      )}
      {sponsors.length == 0 &&
        <tr><td className="valign-center" colSpan="6">Data not found</td> </tr>
      }
      </tbody>
    </table>
  );
};

SponsorList.propTypes = {
  sponsors: PropTypes.array.isRequired,
  onDeletSponsor: PropTypes.func.isRequired
};

export default SponsorList;
