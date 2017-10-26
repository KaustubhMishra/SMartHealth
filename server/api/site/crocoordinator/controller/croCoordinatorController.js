'use strict';

 exports.getCroCoordinatorList = function(req, res, next) {
 	console.log('Request Come From Cro Coordinator API.....');
 	sequelizeDb.models.user.findAll({
 		include: [
 			{
	      		model: sequelizeDb.models.role,
	  			where: { name:  'CRO Coordinator'}
	  		}
	  	]
 	})
	.then(function(croCoordinator) {
		if(croCoordinator)
		{
			res.json({
				status: true,
				data: croCoordinator,
				message: 'Data load Successfully..!'
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


