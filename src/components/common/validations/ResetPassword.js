import Validator from 'validator';
import isEmpty from 'lodash/isEmpty';

export default function validateInput(data) {

  let errors = {};

  if (Validator.isNull(data.password)) {
    errors.password = 'Password is Required';
  }

  if (Validator.isNull(data.confirmpassword)) {
    errors.confirmpassword = 'Confirm Password is Required';
  }

  if ((data.password != data.confirmpassword) && 
      (!Validator.isNull(data.password) && 
       !Validator.isNull(data.confirmpassword)
      ) 
     ) {
    errors.confirmpassword = 'Password and Confirm Password is Not Matched';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
}
