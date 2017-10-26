'use strict';
 exports.getdrugTypes = function(req, res, next) {
 	
 	sequelizeDb.models.drug_type.findAll()
	.then(function(drugTypes) {
		if(drugTypes)
		{
			res.json(drugTypes);
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


