'use strict';
var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");

	
exports.getallSideeffects = function(req, res, next) {
 	db.models.side_effects.findAll()
	.then(function(sideeffects) {
		if(sideeffects)
		{
			res.json({
				status: true,
				data: sideeffects,
				message: 'Sideeffects load successfully'
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

 exports.getSideEffects = function(req, res, next) {
 	
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;

 	db.models.side_effects.findAndCountAll({
 		offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
      	limit: pageSize
    })
	.then(function(sideeffects) {
		if(sideeffects)
		{
			res.json({
				status: true,
				data: sideeffects,
				message: 'Sideeffects load successfully'
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


exports.savedSideEffect = function(req, res, next) {
	var state= {}; 
	if(req.body.state1) {
		state= req.body.state1;
	} else {
		state= req.body.state;
	}
	console.log(state); 
	
	var data = {
		"name" : req.body.name,
		"active" : 1
	};

	console.log(data);
	sequelizeDb.models.side_effects.create(data)
	.then(function(sideeffects) {
		if(sideeffects)
		{
			res.json({
				status: true,
				data: sideeffects,
				message: 'Data saved successfully..!'
			});
		}
		else {
			res.json({
				status: false,
				data: null,
				message: 'Failed to save data..!'
			});
		}
	});
};


exports.updateSideEffect = function(req, res, next) {
	var data = {
		"name" : req.body.name,
		"active" : 1
	};

	var sideeffectID = req.params.id;
	sequelizeDb.models.side_effects.find({ where: { id: sideeffectID} })
	.then(function(sideeffect) {
		if (sideeffect) {
			console.log('sideeffect got.......');
			console.log(data);
	    sequelizeDb.models.side_effects.update(data,{
				where: { id: sideeffectID}
			}).then(function (result) {
				console.log(result);
				res.json({
			  	status: true,
			  	data: result,
			  	message: 'Data updated successfully..!'
			  })
	  }).catch(function(err){
			  	console.log(err);
					res.json({
						status: false,
						data: null,
						message: err.message
					})
	  			})
	}
	  else {
			res.json({
				status: false,
				data: null,
				message: 'Data not found to update..!'
			});
	  }
	}).catch(function(err){
		res.json({
			status: false,
			data: null,
			message: err.message
		});
	});
};


exports.deleteSideEffect = function(req, res, next) {
	var sideeffectID = req.params.id;
	sequelizeDb.models.side_effects.destroy({ where: { id: sideeffectID} })
	.then(function(sideeffect) {
		if (sideeffect) {
			res.json({
		  	status: true,
		  	data: sideeffectID,
		  	message: 'Data removed successfully..!'
		  });
	  }
	  else {
			res.json({
				status: false,
				data: null,
				message: 'Data not found to remove..!'
			});
	  }
	}).catch(function(err){
		res.json({
			status: false,
			data: null,
			message: err.message
		});
	});
};


exports.getSideEffectById = function(req, res, next) {
    sequelizeDb.models.side_effects.find({
        where:{
            id:req.body.id
        }
    })
    .then(function(sideEffect) {
        if(sideEffect)
        {
            res.json({
                status: true,
                data: sideEffect,
                message: 'sideEffect load successfully'
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