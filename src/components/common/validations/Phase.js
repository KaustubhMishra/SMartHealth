import Validator from 'validator';
import isEmpty from 'lodash/isEmpty';
import _ from 'lodash';
import moment from 'moment';

export default function phasevalidateInput(dataList) {
  let isPhaseValid = true;
  let PhaseCount = 0;
  let data =  _.sortBy(dataList.phase, 'sr_no');
  let past_start_date = "";
  let past_tentitive_end_date = ""; 

for(var v=0; v<data.length;v++)
  {
           let start_date = data[v].start_date ? moment(data[v].start_date).format("YYYY-MM-DD") : "";
           let tentitive_end_date = data[v].tentitive_end_date ? moment(data[v].tentitive_end_date).format("YYYY-MM-DD") : "";
           let  trial_start_date = dataList.trial.start_date ? moment(dataList.trial.start_date).format("YYYY-MM-DD") : "";
           let  trial_end_date = dataList.trial.end_date ? moment(dataList.trial.end_date).format("YYYY-MM-DD") : "";


            data[v].phaseerrors = {};

            if(data[v].description || start_date || tentitive_end_date || data[v].participant_count ||
               (data[v].milestone.length > 0) || (data[v].patient.length > 0)
              )
            {

                  PhaseCount += 1;

                    if (!(data[v].description) || 
                         (data[v].description && Validator.isNull(data[v].description))
                       )
                        {
                          isPhaseValid = false;
                          data[v].phaseerrors.description = 'Description is Required';
                        }
                     if (!(start_date) || 
                         (start_date && Validator.isNull(start_date))
                       )
                        {
                          isPhaseValid = false;
                          data[v].phaseerrors.start_date = 'Start Date is Required';
                        }

                     if( 
                          (start_date <= past_tentitive_end_date) || 
                          (start_date > trial_end_date) 
                        )
                      {
                            isPhaseValid = false;
                            data[v].phaseerrors.start_date = 'Start Date is Invalid';
                      }
                       

                     if (!(tentitive_end_date) || 
                         (tentitive_end_date && Validator.isNull(tentitive_end_date))
                       )
                        {
                          isPhaseValid = false;
                          data[v].phaseerrors.tentitive_end_date = 'End Date is Required';
                        }
                    if(!(past_tentitive_end_date) && data[v].end_date)
                     {
                            isPhaseValid = false;
                            data[v].phaseerrors.end_date = 'End Date is Invalid';
                     }     
                     if ((tentitive_end_date && 
                         ((tentitive_end_date < start_date) 
                          || (tentitive_end_date > trial_end_date)))
                       )
                        {
                          isPhaseValid = false;
                          data[v].phaseerrors.tentitive_end_date = 'End Date is Invalid';
                        }  
                     if(tentitive_end_date > trial_end_date)
                      {
                        isPhaseValid = false;
                        data[v].phaseerrors.tentitive_end_date = 'End Date is Invalid';
                      }

                     if (!(data[v].participant_count) || 
                         (data[v].participant_count && Validator.isNull(data[v].participant_count))
                       )
                        {
                          isPhaseValid = false;
                          data[v].phaseerrors.participant_count = 'Participant Count is Required';
                        }  

                  
                   past_start_date = data[v].start_date ? moment(data[v].start_date).format("YYYY-MM-DD") : "";
                   past_tentitive_end_date = data[v].tentitive_end_date ? moment(data[v].tentitive_end_date).format("YYYY-MM-DD") : "";


                  for (var m =0 ; m < data[v].milestone.length;m++)
                    {
                      let milestone_start_date = data[v].milestone[m].start_date ? moment(data[v].milestone[m].start_date).format("YYYY-MM-DD") : "";
                      let milestone_end_date = data[v].milestone[m].tentitive_end_date ? moment(data[v].milestone[m].tentitive_end_date).format("YYYY-MM-DD") : "";


                      if( (milestone_start_date < start_date) || ( milestone_start_date > tentitive_end_date) )
                      {
                        isPhaseValid = false;
                        data[v].phaseerrors.start_date = 'Start Date is Invalid';
                      }
                      if( (milestone_end_date < start_date) || (milestone_end_date > tentitive_end_date) )
                      {
                        isPhaseValid = false;
                        data[v].phaseerrors.end_date = 'End Date is Invalid';
                      }
                    }        
            }
          }

  return {
    PhaseCount,
    isPhaseValid
  };
}
