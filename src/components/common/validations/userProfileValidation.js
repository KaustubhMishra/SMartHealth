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
  
  if (Validator.isNull(data.phone)) {
    errors.phone = 'Number is required';
  }

  else if (data.phone.length > 15) {
    errors.phone = 'Invalid Contact Number';
  }

  if (Validator.isNull(data.contact_address)) {
    errors.contact_address = 'Address is required';
  }
  
  if (Validator.isNull(data.country)) {
    errors.country = 'Country is required';
  }
  if (Validator.isNull(data.state)) {
    errors.state = 'State is required';
  }
  if (Validator.isNull(data.city)) {
    errors.city = 'City is required';
  }
  if (Validator.isNull(data.fax)) {
    errors.fax = 'Fax is required';
  }
  else if (data.fax.length > 10) {
    errors.fax = 'Invalid Fax Number';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
}
