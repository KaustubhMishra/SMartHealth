import Validator from 'validator';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';

export default function trialvalidateInput(data) {	
  let trialerrors = {};
  let trialDisplayErrors = [];

  let start_date = data.start_date ? moment(data.start_date).format("YYYY-MM-DD") : "";
  let end_date = data.end_date ? moment(data.end_date).format("YYYY-MM-DD") : "";

  if (!(data.sponsor_id) || 
  	  (data.sponsor_id && Validator.isNull(data.sponsor_id))
  	 )
  {
  	trialerrors.sponsor_id = 'Sponsor is required';
    trialDisplayErrors.push({children: 'Sponsor is required' , key : 1 });
  }
  if (!(data.name) || 
  	  (data.name && Validator.isNull(data.name))
  	 )
  {
  	trialerrors.name = 'Name is required';
    trialDisplayErrors.push({children: 'Name is required' , key : 2 });
  }
  if (!(data.description) || 
  	  (data.description && Validator.isNull(data.description))
  	 )
  {
  	trialerrors.description = 'Description is required';
  }
  if (!(data.trial_type) || 
  	  (data.trial_type && Validator.isNull(data.trial_type))
  	 )
  {
  	trialerrors.trial_type = 'Type is required';
  }
  if (!(data.dsmb_id) || 
  	  (data.dsmb_id && Validator.isNull(data.dsmb_id))
  	 )
  {
  	trialerrors.dsmb_id = 'DSMB is required';
  }

  if (!(data.croCoordinator_id) || 
      (data.croCoordinator_id && Validator.isNull(data.croCoordinator_id))
     )
  {
    trialerrors.croCoordinator_id = 'Cro Coordinator is required';
  }

  if (!(data.drug_name) || 
  	  (data.drug_name && Validator.isNull(data.drug_name))
  	 )
  {
  	trialerrors.drug_name = 'Drug Name is required';
  }
  if (!(data.drug_description) || 
  	  (data.drug_description && Validator.isNull(data.drug_description))
  	 )
  {
  	trialerrors.drug_description = 'Drug Description is required';
  }
  

  if (!(data.drug_type_id) || 
  	  (data.drug_type_id && Validator.isNull(data.drug_type_id))
  	 )
  {
  	trialerrors.drug_type_id = 'Drug Type is required';
  }
  if (!(data.dosage_id) || 
  	  (data.dosage_id && Validator.isNull(data.dosage_id))
  	 )
  {
  	trialerrors.dosage_id = 'Dosage is required';
  }
  if (!(data.frequency_id) || 
  	  (data.frequency_id && Validator.isNull(data.frequency_id))
  	 )
  {
  	trialerrors.frequency_id = 'Frequency is required';
  }

  if (!(start_date) || 
  	  (start_date && Validator.isNull(start_date))
  	 )
  {
  	trialerrors.start_date = 'Start Date is required';
  }
  
  if (!(end_date) || 
  	  (end_date && Validator.isNull(end_date))
  	 )
  {
  	trialerrors.end_date = 'End Date is required';
  }
  
 else if (start_date > end_date)
  {
  	trialerrors.end_date = 'End Date is Invalid';
  }

  return {
    trialDisplayErrors,
    trialerrors,
    isTrialValid: isEmpty(trialerrors)
  };
}
