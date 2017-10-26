 import React, {PropTypes} from 'react';

const RadioInput = ({name, label, onChange, onclick, checked, value, error, onDisable, id}) => {
  let wrapperClass = 'radio-field';
  if (error && error.length > 0) {
    wrapperClass += " " + 'has-error';
  }

  return (
      <div className={wrapperClass}>
        <input
          type="radio"
          name={name}
          className="css-radio"
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={onDisable}
          id={id}
          />
        <label htmlFor={id} className="css-label">{label}</label>
        {error && <div className="help-block">{error}</div>}
      </div>
  );
};

RadioInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onclick: PropTypes.func,
  value: PropTypes.string,
  error: PropTypes.string,
  checked: PropTypes.string,
  onChange:PropTypes.func,
  onDisable:PropTypes.string,
  id:PropTypes.string
};

RadioInput.defaultProps = {
  type: 'radio'
};

export default RadioInput;

