'use strict';
 exports.getdosages = function(req, res, next) {
 	console.log('Come From dosage API.....');
 	
 	var drugTypeId = req.body.drugType;

 	console.log(drugTypeId);
 	
 	sequelizeDb.models.dosage.findAll({
 		where: {
 			drug_type_id: drugTypeId
 		}
 	})
	.then(function(dosages) {
		if(dosages)
		{
			res.json({
				status: true,
				data: dosages,
				message: 'Data load successfully'
			});
		}
		else {
			res.json({
				status: false,
				data: null,
				message: 'Failed to load data..!'
			});
		}
	});
};


