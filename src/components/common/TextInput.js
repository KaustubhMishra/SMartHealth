import React, {PropTypes} from 'react';

const TextInput = ({id,name, label, onChange,onSelect, disabled, placeholder, type, value, error}) => {
  let wrapperClass = 'form-group';
  if (error && error.length > 0) {
    wrapperClass += " " + 'has-error';
  }

  return (
    <fieldset className={wrapperClass}>
      <label htmlFor={name} className="form-label">{label}</label>
      <div className="field">
        <input
          id = {id}
          name={name}
          className="form-control"
          placeholder={placeholder}
          value={value}
          type={type}
          disabled={disabled}
          onChange={onChange}
          onSelect = {onSelect}/>
        {error && <div className="help-block">{error}</div>}
      </div>
    </fieldset>
  );
};

TextInput.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string
};

TextInput.defaultProps = {
  type: 'text'
}

export default TextInput;
