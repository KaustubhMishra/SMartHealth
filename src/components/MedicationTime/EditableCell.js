import React from 'react';
import TextInput from '../common/TextInput';
import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';
import moment from 'moment';

const EditableCell = ({medicationTime,onRowUpdate,index}) => {
    return (
    	<div className="form-group">
        	<label className="form-label">Time:</label>
        	<div className="row">
	            <div className="col-md-8">
		            <TimePicker
					    className="form-control"
					    showSecond={false}
					    id = {medicationTime.id}
					    name = {medicationTime.name}
					    onChange={ e=> onRowUpdate(e,index)}
					    defaultValue={ moment(medicationTime.value, 'HH:mm') }
					    value={ moment(medicationTime.value, 'HH:mm') }
					/>
				</div>
				<div className="col-md-4">
					<span className="time-format">HH:MM</span>
				</div>
			</div>
		</div> 
    );
};

EditableCell.propTypes = {
 
};

export default EditableCell;