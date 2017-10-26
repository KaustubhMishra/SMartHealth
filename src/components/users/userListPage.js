import React, {PropTypes} from 'react';
import UserListRow from './userListRow';

const UserList = ({user, DeleteUser, HandleChange, disableUser}) => {
  return (
    <table id="example" className="display table table-bordered" cellspacing="0" width="100%">
      <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th className="text-center" style={{width: 90 +'px'}}>Status</th>
        <th className="text-center" style={{width: 90 +'px'}}>Action</th>
      </tr>
      </thead>
      <tbody>
      {user.map(user =>
        <UserListRow key={user.id} user={user} DeleteUser={DeleteUser} HandleChange={HandleChange} disableUser={disableUser}/>
      )}
      {user.length == 0 &&
        <tr><td className="valign-center" colSpan="6">Data not found</td> </tr>
      } 
      </tbody>
    </table>
  );
};

UserList.propTypes = {
  user: PropTypes.array.isRequired
};

export default UserList;
