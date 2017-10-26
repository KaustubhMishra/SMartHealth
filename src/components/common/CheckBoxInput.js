 import React, {PropTypes} from 'react';

const CheckBoxInput = ({name, label, onChange, onclick, checked, value, error, onDisable, id}) => {
  let wrapperClass = 'checkbox-field';
  if (error && error.length > 0) {
    wrapperClass += " " + 'has-error';
  }

  return (
      <div className={wrapperClass}>
        <input
          type="checkbox"
          name={name}
          className="css-checkbox"
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

CheckBoxInput.propTypes = {
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

CheckBoxInput.defaultProps = {
  type: 'radio'
};

export default CheckBoxInput;

