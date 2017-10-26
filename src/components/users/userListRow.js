import React, {PropTypes} from 'react';
import {Link} from 'react-router';
import * as sponsorActions from '../../actions/sponsorActions';
import cookies from 'react-cookie';
import { Conditional } from 'react-conditional-render';


const UserListRow = ({user, DeleteUser, HandleChange, disableUser}) => {

  return (
    <tr className="grey">
      <td>{user.firstname} {user.lastname}</td>
      <td>{user.email}</td>
      <td>{user.role.name}</td>
      <td className="text-center">
        <label className="switch1">
          <Conditional condition={user.role.name != 'CRO'}>
            <input type="checkbox"
              name="disableUser"
              onChange={e=>HandleChange(e, user.id )}
              checked={user.active}
            />
          </Conditional>
          <div className="slider round">
          </div>
        </label>
      </td>
      <td>
        <Link to={'/user/' + user.id} className="icon">
          <img src={require('../../assets/img/edit-green.svg')} />
        </Link>
        <Conditional condition={user.role.name != 'CRO'}>
        <span className="icon">
          <img src={require('../../assets/img/delete-red.svg')} onClick={() => DeleteUser(user)}/>
          </span>
        </Conditional>
      </td>
    </tr>
  );

};

UserListRow.propTypes = {
  user: PropTypes.object.isRequired
};

export default UserListRow;
