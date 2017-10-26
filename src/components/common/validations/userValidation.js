import Validator from 'validator';
import isEmpty from 'lodash/isEmpty';

export default function validateInput(data) {

  let errors = {};
  
  if (Validator.isNull(data.firstname)) {
    errors.firstname = 'First Name is Required';
  }

  if (Validator.isNull(data.lastname)) {
    errors.lastname = 'Last Name is required';
  }

  if (Validator.isNull(data.email)) {
    errors.email = 'Email is required';
  }
 else if(!Validator.isEmail(data.email)) {
      errors.email = 'Email is invalid';
  }
  if (Validator.isNull(data.phone)) {
    errors.phone = 'Number is required';
  }

  else if (data.phone.length > 15) {
    errors.phone = 'Invalid Contact Number';
  }

  if (Validator.isNull(data.timezone)) {
    errors.timezone = 'Timezone is required';
  }
  if (Validator.isNull(data.role_id)) {
    errors.role_id = 'Role is required';
  }
  
  return {
    errors,
    isValid: isEmpty(errors)
  };
}
