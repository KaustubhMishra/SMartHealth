import Validator from 'validator';
import isEmpty from 'lodash/isEmpty';

export default function validateInput(data) {

  let errors = {};
  
  if (Validator.isNull(data.name)) {
    errors.name = 'Name is Required';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
}
