import Validator from 'validator';
import isEmpty from 'lodash/isEmpty';

export default function validateInput(data) {

  let errors = {};
  
  if (Validator.isNull(data.sponsor_company)) {
    errors.sponsor_company = 'Company is Required';
  }

  if (Validator.isNull(data.contact_name)) {
    errors.contact_name = 'Name is required';
  }

  if (Validator.isNull(data.email_address)) {
    errors.email_address = 'Email is required';
  }
 else if(!Validator.isEmail(data.email_address)) {
      errors.email_address = 'Email is invalid';
  }
  if (Validator.isNull(data.contact_number)) {
    errors.contact_number = 'Number is required';
  }
  else if (data.contact_number.length > 15) {
    errors.contact_number = 'Invalid Contact Number';
  }

  if (Validator.isNull(data.contact_address_1)) {
    errors.contact_address_1 = 'Address is required';
  }
  if (Validator.isNull(data.city)) {
    errors.city = 'City is required';
  }
  
  if (Validator.isNull(data.country)) {
    errors.country = 'Country is required';
  }
  if (Validator.isNull(data.state)) {
    errors.state = 'State is required';
  }

  if (Validator.isNull(data.zip)) {
    errors.zip = 'Zip Code is required';
  }
  else if (!Validator.isNumeric(data.zip)) {
    errors.zip = 'Invalid Zip Code';
  }

  else if (data.zip.length < 4) {
    errors.zip = 'Zip Code Must Be More Then 4 Digit';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
}
