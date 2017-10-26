import React, {PropTypes} from 'react';
import TimePicker from 'rc-time-picker';

const SelectTimePicker = ({name,onChange,showSecond,defaultValue, value}) => {
  let wrapperClass = 'form-group';
  

  return (
    <div>
      <div className="field">
         <TimePicker
          showSecond={showSecond}
          defaultValue={moment()}
          className="form-control"
          onChange={onChange}
          name = {name}
          value = {value}
          format = {"HH:mm:ss"}
        />
      </div>
    </div>
  );
};

SelectTimePicker.propTypes = {
 
};

export default SelectTimePicker;
