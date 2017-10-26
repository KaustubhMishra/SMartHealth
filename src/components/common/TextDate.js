import React, {PropTypes} from 'react';

const TextDate = ({id,name, label,onBlur, disabled, placeholder, type, value, error}) => {
  let wrapperClass = 'form-group';
  if (error && error.length > 0) {
    wrapperClass += " " + 'has-error';
  }

  return (
    <div className={wrapperClass}>
      <label htmlFor={name} className="form-label">{label}</label>
      <div className="field input-group">
        <input
          id = {id}
          name={name}
          className="form-control"
          placeholder={placeholder}
          value={value}
          type={type}
          disabled={disabled}
          onBlur = {onBlur}/>
        <span className="input-group-addon">
          <i className="glyphicon glyphicon glyphicon-calendar"></i>
        </span>
      </div>
      {error && <div className="help-block">{error}</div>}
    </div>
  );
};

TextDate.propTypes = {
  name: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string
};

TextDate.defaultProps = {
  type: 'text'
}

export default TextDate;
