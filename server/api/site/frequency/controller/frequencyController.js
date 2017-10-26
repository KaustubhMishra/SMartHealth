'use strict';
 exports.getfrequencies = function(req, res, next) {
 	sequelizeDb.models.frequency.findAll()
	.then(function(frequencies) {
		if(frequencies)
		{
			res.json(frequencies);
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


