import Validator from 'validator';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';

export default function milestonevalidateInput(data,phaseData) {	
  let milestoneerrors = {};
   
   let phase_start_date = phaseData.start_date ? moment(phaseData.start_date).format("YYYY-MM-DD") : "";
   let phase_end_date = phaseData.tentitive_end_date ? moment(phaseData.tentitive_end_date).format("YYYY-MM-DD") : "";
   let start_date = data.start_date ? moment(data.start_date).format("YYYY-MM-DD") : "";
   let tentitive_end_date = data.tentitive_end_date ? moment(data.tentitive_end_date).format("YYYY-MM-DD") : "";

   if (!(data.name) || 
      (data.name && Validator.isNull(data.name))
     )
  {
    milestoneerrors.name = 'Name is required';
  }
  if (!(start_date) || 
      (start_date && Validator.isNull(start_date))
     )
  {
    milestoneerrors.start_date = 'Start Date is required';
  }
  else if ((start_date > phase_end_date) || (start_date < phase_start_date))
  {
    milestoneerrors.start_date = 'Start Date is Invalid';
  } 
  if (!(data.description) || 
      (data.description && Validator.isNull(data.description))
     )
  {
    milestoneerrors.description = 'Description is required';
  }
  if (!(tentitive_end_date) || 
      (tentitive_end_date && Validator.isNull(tentitive_end_date))
     )
  {
    milestoneerrors.tentitive_end_date = 'End Date is required';
  }
  else if (start_date > tentitive_end_date)
  {
    milestoneerrors.tentitive_end_date = 'End Date is Invalid';
  }
  else if ((tentitive_end_date > phase_end_date) || (tentitive_end_date < phase_start_date))
  {
    milestoneerrors.tentitive_end_date = 'End Date is Invalid';
  }  
  
  return {
    milestoneerrors,
    isMilestoneValid: isEmpty(milestoneerrors)
  };
}
