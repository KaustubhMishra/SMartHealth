import cookies from 'react-cookie';

export function permissionCheck(value) {
  let userRoleData = cookies.load('userData');
  if(userRoleData.indexOf(value) > -1){
    return true;
  }
  else{
    return false;
  }
}