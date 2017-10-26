import Validator from 'validator';
import isEmpty from 'lodash/isEmpty';

export default function validateInput(data) {

  let errors = {};
  
  if (Validator.isNull(data.oldPassword)) {
    errors.oldPassword = 'Old Password is Required';
  }

  if (Validator.isNull(data.newPassword)) {
    errors.newPassword = 'New Password is required';
  }

  if (Validator.isNull(data.confirmNewPassword)) {
    errors.confirmNewPassword = 'Confirm Password  is required';
  }
  if ((data.newPassword != data.confirmNewPassword) && 
      (!Validator.isNull(data.newPassword) && 
       !Validator.isNull(data.confirmNewPassword)
      ) 
     ) {
    errors.confirmNewPassword = 'New Password and Confirm New Password is Not Matched';
  }
  
  return {
    errors,
    isValid: isEmpty(errors)
  };
}
