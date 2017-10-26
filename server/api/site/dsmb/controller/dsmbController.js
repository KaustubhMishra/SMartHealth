'use strict';

exports.getdsmbs = function(req, res, next) {

 	sequelizeDb.models.user.findAll({
 		include: [
 			{
	      		model: sequelizeDb.models.role,
	  			where: { name:  'DSMB'}
	  		}
	  	]
 	})
	.then(function(dsmbs) {
		if(dsmbs)
		{
			res.json({
				status: true,
				data: dsmbs,
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

exports.getActiveDSMB = function(req, res, next) {
 	
 	sequelizeDb.models.user.findAndCountAll({
 		where:{
 			active: true,
 			role_id: 40
 		}
 	})
	.then(function(dsmbs) {
		if(dsmbs)
		{
			res.json({
				status: true,
				data: dsmbs,
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


