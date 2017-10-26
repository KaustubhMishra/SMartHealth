import React, {PropTypes} from 'react';

const TextArea = ({name, onChange, label, placeholder, value, error, maxLength, id, disabled}) => {
  let wrapperClass = 'form-group';
  if (error && error.length > 0) {
    wrapperClass += " " + 'has-error';
  }

  return (
    <div className={wrapperClass}>
      <label htmlFor={name} className="form-label">{label}</label>
      <div className="field">
        <textarea
          name={name}
          className="form-control"
          placeholder={placeholder}
          label={label}
          value={value}
          onChange={onChange}
          disabled={disabled}
          maxLength={maxLength}
          id={id}
        />
        {error && <div className="help-block">{error}</div>}
      </div>
    </div>
  );
};

TextArea.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string
};

export default TextArea;
