import React, {PropTypes} from 'react';
import {Link} from 'react-router';

const SponsorListRow = ({sponsor, onDeletSponsor}) => {
  return (
    <tr className="grey">
      <td><img src={'/upload/profilepicture/' + sponsor.sponsor_image} className="sponsor-logo" />{sponsor.sponsor_company}</td>
      <td>{sponsor.contact_name}</td>
      <td>{sponsor.email_address}</td>
      <td>{sponsor.city}</td>
      <td>{sponsor.state}</td>
      <td>
        <Link to={'/sponsor/' + sponsor.id} className="icon">
          <img src={require('../../assets/img/edit-green.svg')} />
        </Link>
        <span className="icon"> 
          <img src={require('../../assets/img/delete-red.svg')} onClick={() => onDeletSponsor(sponsor)}/>
        </span>    
      </td>
    </tr>
  );
};

SponsorListRow.propTypes = {
  sponsor: PropTypes.object.isRequired
};

export default SponsorListRow;
