import React, {PropTypes} from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

const SelectAutoDropDownInput = ({name, label, onChange, defaultOption, value, error, options, isRequiredField,multiSelect}) => {

  let wrapperClass = 'form-group';
  let bootstrapClass = 'bootstrap-select bootstrap-select-arrow';
  if (error && error.length > 0) {
    wrapperClass += ' ' + 'has-error';
    bootstrapClass += ' controls-error';
  }
    return (
    <div className={wrapperClass}>
      <label htmlFor={name} className="form-label">{label}{isRequiredField ? <span className="color-red">*</span> : ''}</label>
      <div className="field">
        <Select className={bootstrapClass}
                name={name}
                label={label}
                value={value}
                multi={multiSelect? true : false}
                options={options}
                onChange={onChange}
                clearable={false}
        />
      </div>
      <span className={error ? 'form-group-error' : ''}>
        {error && <div className="form-error">{error}</div>}
      </span>
    </div>
  );
};

SelectAutoDropDownInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  error: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.object),
  isRequiredField:PropTypes.bool
};

export default SelectAutoDropDownInput;