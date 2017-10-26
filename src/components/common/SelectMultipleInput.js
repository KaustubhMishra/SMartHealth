 import React, {PropTypes} from 'react';

const SelectMultipleInput = ({name, label, onChange, values, error, options, optionHasIdName}) => {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label semibold uppercase">{label}</label>
      <div className="field">
        <select multiple
          name={name}
          value={values}
          onChange={onChange}
          className="form-control">
          {options.map((option) => {
            return <option key={option.id} value={option.id}>{option.name}</option>;
          })
          }
        </select>
        {error && <div className="alert alert-danger">{error}</div>}
      </div>
    </div>
  );
};

SelectMultipleInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  defaultOption: PropTypes.string,
  value: PropTypes.string,
  error: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.object)
};

export default SelectMultipleInput;
