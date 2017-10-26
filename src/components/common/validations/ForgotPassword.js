import Validator from 'validator';
import isEmpty from 'lodash/isEmpty';

export default function validateInput(data) {

  let errors = {};

  if (Validator.isNull(data.email)) {
    errors.email = 'Email is required';
  }

  else if(!Validator.isEmail(data.email)) {
      errors.email = 'Email is invalid';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
}
