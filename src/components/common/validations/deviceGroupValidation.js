import Validator from 'validator';
import isEmpty from 'lodash/isEmpty';

export default function validateInput(data) {
  let errors = {};

  if (Validator.isNull(data.name)) {
    errors.name = 'Name is required';
  }

  if(Validator.isNull(data.manufacturer)) {
      errors.manufacturer = 'Manufacturer is required';
  }

  if (Validator.isNull(data.firmware)) {
    errors.firmware = 'Firmware is required';
  }
  
  if (Validator.isNull(data.version)) {
    errors.version = 'Version is required';
  }

  if (Validator.isNull(data.device_group_id)) {
    errors.device_group_id = 'Device Group is required';
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
}
