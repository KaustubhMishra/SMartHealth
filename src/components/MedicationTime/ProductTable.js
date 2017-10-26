import React from 'react';
import MedicationRow from './MedicationRow';

const ProductTable = ({MedicationTimeList,onRowAdd,onRowDel,onRowUpdate}) => {
  return (
      <div className="row">
        {
          MedicationTimeList.map((medicationTime, index) =>
            <MedicationRow 
              key={index} 
              medicationTime={medicationTime} 
              index={index} 
              onRowDel={onRowDel}
              onRowUpdate = {onRowUpdate}
            />
          )
        }
      </div>
    );
};

ProductTable.propTypes = {
 
};

export default ProductTable;