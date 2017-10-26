'use strict';
var async = require('async');
var db = require('../../../../config/sequelize').db;
var Sequelize = require("sequelize");
db.models.trial_device.associate(db.models);
db.models.device.associate(db.models);
db.models.device_group.associate(db.models);
db.models.template.associate(db.models);
db.models.thing.associate(db.models);
db.models.trial.associate(db.models);
db.models.drug_type.associate(db.models);
db.models.dosage.associate(db.models);
db.models.frequency.associate(db.models);
db.models.patient.associate(db.models);
db.models.phase.associate(db.models);

var moment = require("moment");
exports.getPhasePatients = function(req, res, next) {

var trial_Id = req.params.trialId == 0 ? '' : req.params.trialId;

var whereval = {$or: [
    Sequelize.where(Sequelize.col('patients.phase_patients.phase.trial.active'), { $eq: 2}),
    Sequelize.where(Sequelize.col('patients.phase_patients.patient_id'), { $eq: null}),
    Sequelize.where(Sequelize.col('patients.phase_patients.phase.trial.id'), { $eq: trial_Id})
  ]}

var groupval = [
    Sequelize.col('user.id'),
    Sequelize.col('patients.phase_patients.phase.trial.active'),
  ]


db.models.patient.hasMany(db.models.phase_patient,{foreignKey:'patient_id'});
db.models.phase_patient.belongsTo(db.models.patient, {foreignKey: 'patient_id'});
db.models.phase.hasMany(db.models.phase_patient,{foreignKey:'phase_id'});
db.models.phase_patient.belongsTo(db.models.phase, {foreignKey: 'phase_id'});
db.models.trial.hasMany(db.models.phase,{foreignKey:'trial_id'});
db.models.phase.belongsTo(db.models.trial, {foreignKey: 'trial_id'});    

 db.models.user
    .findAll(
        {group:groupval,
         having:Sequelize.literal('(count(`user`.`id`) = 1 and `patients.phase_patients.phase.trial`.`active` = 2) or (`patients.phase_patients.phase.trial`.`id` is null) or (count(`user`.`id`) = 1 and `patients.phase_patients.phase.trial`.`active` = 1 and `patients.phase_patients.phase.trial`.`id` = "'+ trial_Id +'") or (count(`user`.`id`) > 1 and `patients.phase_patients.phase.trial`.`active` = 1 and `patients.phase_patients.phase.trial`.`id` = "'+ trial_Id +'")'),
         attributes:['id','email','firstname','lastname'],
         include : [{model : db.models.patient,attributes:['id','user_id','age','gender','placebo'],required:true,
         include: [{ model: db.models.phase_patient, attributes: ['id','phase_id','patient_id'],
                     include : [{model : db.models.phase,attributes:['id','trial_id'],
                                 include :[{model : db.models.trial,attributes:['id','active']}]
                                }]
                   }
                  ]}]   
        }
        ).then(function(patient) {
        if(patient)
        {   
           console.log('Phase Patient..........'); 
           res.json({
                status: true,
                data: patient,
                message: 'Success to load data..!'
            });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load data..!'
            });
        }
    }).catch(function(err) {
        console.log(err);
    });
};

exports.getFalloutPatients = function(req, res, next) {

console.log('Fallout Patient...............');


  
var searchTrialParameters = new Array();

console.log(req.params.trialId);

if(req.params.trialId != 0) {
      searchTrialParameters.push({
        id : req.params.trialId
      });
    }


var groupval = [
    Sequelize.col('patients.vital_dosage_statuses.trial_id'),
    Sequelize.col('patients.vital_dosage_statuses.patient_id'),
    Sequelize.col('patients.vital_dosage_statuses.status'),
    Sequelize.col('patients.vital_dosage_statuses.schedule_on'),
  ]

var orderval = [
    Sequelize.col('patients.vital_dosage_statuses.patient_id'),
    [Sequelize.col('patients.vital_dosage_statuses.schedule_on'),'DESC'],
    [Sequelize.col('patients.vital_dosage_statuses.status'),'DESC'],
  ]

db.models.patient.hasMany(db.models.vital_dosage_status,{foreignKey:'patient_id'});
db.models.vital_dosage_status.belongsTo(db.models.patient, {foreignKey: 'patient_id'});
db.models.phase.hasMany(db.models.vital_dosage_status,{foreignKey:'phase_id'});
db.models.vital_dosage_status.belongsTo(db.models.phase, {foreignKey: 'phase_id'});
db.models.trial.hasMany(db.models.phase,{foreignKey:'trial_id'});
db.models.phase.belongsTo(db.models.trial, {foreignKey: 'trial_id'});    

 db.models.user
    .findAll(
        {
         group:groupval,
         having:Sequelize.literal('`patients.vital_dosage_statuses`.`schedule_on` <=  now() and (`patients.vital_dosage_statuses.phase`.`start_date` <= now() and  `patients.vital_dosage_statuses.phase.tentitive_end_date` > now()) and `patients.vital_dosage_statuses.phase.trial`.`active` = 1'),
         order:orderval,
         attributes:['id','email','firstname','lastname'],
         include : [{model : db.models.patient,attributes:['id','user_id','age','gender','placebo'],required:true,
         include: [{ model: db.models.vital_dosage_status, attributes: ['id','phase_id','patient_id','schedule_on','status','trial_id'],
                     include : [{model : db.models.phase,attributes:['id','trial_id','start_date','tentitive_end_date','sr_no'],
                                 include :[{model : db.models.trial,attributes:['id','name','active'],
                                            where : searchTrialParameters}]
                                }]
                   }
                  ]}]   
        }
        ).then(function(patient) {
        if(patient)
        {  
          let Counter = 0;
          let FallOutPatient = 0;
          let patientList = [];

           async.forEach(Object.keys(patient), function (item, callback1)
                       { 
                            async.forEach(Object.keys(patient[item].dataValues.patients), function (item1, callback2)
                               { 
                                   
                                    Counter = 0; 
                                    async.forEach(Object.keys(patient[item].dataValues.patients[item1].dataValues.vital_dosage_statuses), function (item2, callback3)
                                       { 
                                           if(patient[item].dataValues.patients[item1].dataValues.vital_dosage_statuses[item2].dataValues.status == true){
                                                callback3('Break');
                                           }    
                                           else{
                                               Counter += 1 ;  
                                               if(Counter > 2)
                                               {
                                                 patientList.push(patient[item]);
                                                 FallOutPatient += 1;
                                                 callback3('Break');
                                               }
                                           } 

                                       }, function(err) {
                                                             
                                                         });
       
                               }, function(err) {
                                                    console.log(err);
                                                 });

                       }, function(err) {
                                        
                                         }); 
        

                res.json({ 
                  status: true,
                  data: patientList,
                  count: FallOutPatient,
                  message: 'Records loaded successfully.'
                });

        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load data..!'
            });
        }
    }).catch(function(err) {
        console.log(err);
    });

}


 exports.getPatients = function(req, res, next) {
 	  var pageNumber = '';
    var pageSize = '';

    
    if(req.body){
         pageNumber = req.body.params.pageNumber;
         pageSize = req.body.params.pageSize;
    }
  db.models.user.findAndCountAll({
	  attributes: ['id', 'firstname','lastname','email'],
	  include: [{
	      	model: db.models.role,
	  			where: { name:  'Patient'}
	  		},{
	      model: db.models.patient,
	      attributes: ['id','age', 'gender', 'placebo']}
	  ],
	  offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
	  limit: pageSize
	})
	.then(function(patient) {
		if(patient)
		{	
			res.json({
				status: true,
				data: patient,
				message: 'Patient Load Successfully'
			});
		}
		else {
			res.json({
				status: false,
				data: null,
				message: 'Failed to load data..!'
			});
		}
	}).catch(function(err) {
        console.log(err);
    });
};

exports.getAllPatients = function(req, res, next) {
   
    db.models.user
    .findAll({
      attributes: ['id', 'firstname','lastname','email'],
      include: [{
            model: db.models.role,
                where: { name:  'Patient'}
            },{
          model: db.models.patient,
          attributes: ['id','age', 'gender', 'placebo']}
      ]
    })
    .then(function(patient) {
        if(patient)
        {   
            res.json({
                status: true,
                data: patient,
                message: 'Patient Load Successfully'
            });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to load data..!'
            });
        }
    }).catch(function(err) {
        console.log(err);
    });
};

exports.deletePatientData = function(req, res, next) {
    
    var userID = req.params.id;
    db.models.user.destroy({
        where: { id: userID}
    }).then(function (result) {
        if(result) {
            res.json({
                status: true,
                data: userID,
                message: 'User deleted successfully.'
            });    
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to delete user.'
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

exports.getEnrolledPhasePatientsTrialsCRO = function(req, res, next) {

  var pageNumber = req.body.search.params.pageNumber;
  var pageSize = req.body.search.params.pageSize;
  var offset1 = pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize;
  
  
  var now = new Date(); 
  var currentMonth = now.getUTCMonth() + 1;
  var newDate = now.getUTCFullYear() + '-' + currentMonth + '-' + now.getUTCDate() + ' ' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds();
  

  var wheretrialcon = "";
  var trailselected = req.body.trialName;
  var genderselected = req.body.gender;

  if(trailselected) {
    wheretrialcon = " AND `trial`.`name` = '"+ trailselected +"'"
  }

  var wheregendercon = "";
  if(genderselected) {
    wheregendercon = "  AND `phases.phase_patients.patient`.`gender` = '"+ genderselected +"'"
  }

  db.query("SELECT  `trial`.`id`, `trial`.`name`, `trial`.`active`, `phases`.`id` AS `phases.id`, `phases`.`trial_id` AS `phases.trial_id`, `phases`.`sr_no` AS `sr_no`, `phases`.`description` AS `phases.description`, `phases`.`start_date` AS `phases.start_date`, `phases`.`tentitive_end_date` AS `phases.tentitive_end_date`, `phases`.`participant_count` AS `phases.participant_count`, `phases`.`active` AS `phases.active`, `phases`.`createdAt` AS `createdAt`, `phases`.`updatedAt` AS `phases.updatedAt`, `phases.phase_patients`.`id` AS `phases.phase_patients.id`, `phases.phase_patients`.`phase_id` AS `phase_id`, `phases.phase_patients`.`patient_id` AS `patient_id`, `phases.phase_patients.patient`.`id` AS `phases.phase_patients.patient.id`, `phases.phase_patients.patient`.`user_id` AS `phases.phase_patients.patient.user_id`, `phases.phase_patients.patient`.`age` AS `age`, `phases.phase_patients.patient`.`gender` AS `gender`, `phases.phase_patients.patient.user`.`id` AS `phases.phase_patients.patient.user.id`, `phases.phase_patients.patient.user`.`firstname` AS `firstname`, `phases.phase_patients.patient.user`.`lastname` AS `lastname` FROM `trial` AS `trial`     INNER JOIN `phase` AS `phases` ON `trial`.`id` = `phases`.`trial_id`     AND `phases`.`start_date` < '" + newDate + "'     AND `phases`.`tentitive_end_date` > '" + newDate + "'     AND `phases`.`active` = true     INNER JOIN `phase_patient` AS `phases.phase_patients` ON `phases`.`id` = `phases.phase_patients`.`phase_id`     AND `phases.phase_patients`.`phase_id` IS NOT NULL     AND `phases.phase_patients`.`patient_id` IS NOT NULL     LEFT OUTER JOIN `patient` AS `phases.phase_patients.patient` ON `phases.phase_patients`.`patient_id` = `phases.phase_patients.patient`.`id`     LEFT OUTER JOIN `user` AS `phases.phase_patients.patient.user` ON `phases.phase_patients.patient`.`user_id` = `phases.phase_patients.patient.user`.`id`     AND `phases.phase_patients.patient.user`.`deletedAt` IS NULL   WHERE `trial`.`active` = 1  " + wheretrialcon + " " + wheregendercon+ " LIMIT " + pageSize + " OFFSET " + offset1,
{
      type: sequelizeDb.QueryTypes.SELECT
    }).then(function(patient) {
      if(patient) {
        db.query("SELECT  count(*) AS totalCount  FROM `trial` AS `trial`     INNER JOIN `phase` AS `phases` ON `trial`.`id` = `phases`.`trial_id`     AND `phases`.`start_date` < '" + newDate + "'     AND `phases`.`tentitive_end_date` > '" + newDate + "'     AND `phases`.`active` = true     INNER JOIN `phase_patient` AS `phases.phase_patients` ON `phases`.`id` = `phases.phase_patients`.`phase_id`     AND `phases.phase_patients`.`phase_id` IS NOT NULL     AND `phases.phase_patients`.`patient_id` IS NOT NULL     LEFT OUTER JOIN `patient` AS `phases.phase_patients.patient` ON `phases.phase_patients`.`patient_id` = `phases.phase_patients.patient`.`id`     LEFT OUTER JOIN `user` AS `phases.phase_patients.patient.user` ON `phases.phase_patients.patient`.`user_id` = `phases.phase_patients.patient.user`.`id`     AND `phases.phase_patients.patient.user`.`deletedAt` IS NULL WHERE `trial`.`active` = 1 " + wheretrialcon + " " + wheregendercon+ " ",{
      type: sequelizeDb.QueryTypes.SELECT
    }).then(function(data){
        var ruleAry = [];
                ruleAry = {
                  count: data[0].totalCount,
                  rows: patient
                }

                res.json({ 
                  status: 'success',
                  data: ruleAry,
                  message: 'Records loaded successfully.'
                });
    })
      }
    else {
      res.json({
        status: false,
        data: null,
        message: 'Failed to load data..!'
      });
    }
  }).catch(function(err) {
      console.log(err);
  });
};

exports.getEnrolledTrialsCRO = function(req, res, next) {

  db.models.trial.findAll({
    attributes:['id', 'name', 'active'],
    where :{
      active:{
        $eq: 1
      }
    },
    include: [{
      model: sequelizeDb.models.phase,
      where: {
        start_date: {
            $lt: new Date()
        },
        tentitive_end_date: {
            $gt: new Date()
        },
        active: true
      },
      include : [{
        model: sequelizeDb.models.phase_patient, 
        attributes: ['id','phase_id','patient_id'],
        where:{
          phase_id:{
            $ne: null
          },
          patient_id:{
            $ne: null
          }
        },
        include:[{
          attributes: ['id','user_id','age','gender'],
          model: sequelizeDb.models.patient,
          include:[{
            model: sequelizeDb.models.user,
            attributes: ['firstname','lastname']
          }]
        }]
      }]  
    }]
  })
  .then(function(patient) {
    if(patient){
      res.json({
        status: true,
        data: patient,
        message: 'Success to load data..!'
      });
    }
    else {
      res.json({
        status: false,
        data: null,
        message: 'Failed to load data..!'
      });
    }
  }).catch(function(err) {
      console.log(err);
  });
};

exports.getEnrolledPhasePatientsTrialsDSMB = function(req, res, next) {

  var dsmb = generalConfig.getUserInfo(req);
  var dsmbId = dsmb.id;
  
  var pageNumber = req.body.search.params.pageNumber;
  var pageSize = req.body.search.params.pageSize;
  var offset1 = pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize;

  var now = new Date(); 
  var currentMonth = now.getUTCMonth() + 1;
  var newDate = now.getUTCFullYear() + '-' + currentMonth + '-' + now.getUTCDate() + ' ' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds();
  

  var wheretrialcon = "";
  var trailselected = req.body.trialName;
  var genderselected = req.body.gender;

  if(trailselected) {
    wheretrialcon = " AND `trial`.`name` = '"+ trailselected +"'"
  }

  var wheregendercon = "";
  if(genderselected) {
    wheregendercon = "  AND `phases.phase_patients.patient`.`gender` = '"+ genderselected +"'"
  }

  db.query("SELECT  `trial`.`id`, `trial`.`name`, `trial`.`active`, `phases`.`id` AS `phases.id`, `phases`.`trial_id` AS `phases.trial_id`, `phases`.`sr_no` AS `sr_no`, `phases`.`description` AS `phases.description`, `phases`.`start_date` AS `phases.start_date`, `phases`.`tentitive_end_date` AS `phases.tentitive_end_date`, `phases`.`participant_count` AS `phases.participant_count`, `phases`.`active` AS `phases.active`, `phases`.`createdAt` AS `createdAt`, `phases`.`updatedAt` AS `phases.updatedAt`, `phases.phase_patients`.`id` AS `phases.phase_patients.id`, `phases.phase_patients`.`phase_id` AS `phase_id`, `phases.phase_patients`.`patient_id` AS `patient_id`, `phases.phase_patients.patient`.`id` AS `phases.phase_patients.patient.id`, `phases.phase_patients.patient`.`user_id` AS `phases.phase_patients.patient.user_id`, `phases.phase_patients.patient`.`age` AS `age`, `phases.phase_patients.patient`.`gender` AS `gender`, `phases.phase_patients.patient.user`.`id` AS `phases.phase_patients.patient.user.id`, `phases.phase_patients.patient.user`.`firstname` AS `firstname`, `phases.phase_patients.patient.user`.`lastname` AS `lastname` FROM `trial` AS `trial`     INNER JOIN `phase` AS `phases` ON `trial`.`id` = `phases`.`trial_id`     AND `phases`.`start_date` < '" + newDate + "'     AND `phases`.`tentitive_end_date` > '" + newDate + "'     AND `phases`.`active` = true     INNER JOIN `phase_patient` AS `phases.phase_patients` ON `phases`.`id` = `phases.phase_patients`.`phase_id`     AND `phases.phase_patients`.`phase_id` IS NOT NULL     AND `phases.phase_patients`.`patient_id` IS NOT NULL     LEFT OUTER JOIN `patient` AS `phases.phase_patients.patient` ON `phases.phase_patients`.`patient_id` = `phases.phase_patients.patient`.`id`     LEFT OUTER JOIN `user` AS `phases.phase_patients.patient.user` ON `phases.phase_patients.patient`.`user_id` = `phases.phase_patients.patient.user`.`id`     AND `phases.phase_patients.patient.user`.`deletedAt` IS NULL   WHERE `trial`.`active` = 1 AND `trial`.`dsmb_id` = " + dsmbId +  " " + wheretrialcon + " " + wheregendercon+ " LIMIT " + pageSize + " OFFSET " + offset1,
{
      type: sequelizeDb.QueryTypes.SELECT
    }).then(function(patient) {
      if(patient) {
        db.query("SELECT  count(*) AS totalCount  FROM `trial` AS `trial`     INNER JOIN `phase` AS `phases` ON `trial`.`id` = `phases`.`trial_id`     AND `phases`.`start_date` < '" + newDate + "'     AND `phases`.`tentitive_end_date` > '" + newDate + "'     AND `phases`.`active` = true     INNER JOIN `phase_patient` AS `phases.phase_patients` ON `phases`.`id` = `phases.phase_patients`.`phase_id`     AND `phases.phase_patients`.`phase_id` IS NOT NULL     AND `phases.phase_patients`.`patient_id` IS NOT NULL     LEFT OUTER JOIN `patient` AS `phases.phase_patients.patient` ON `phases.phase_patients`.`patient_id` = `phases.phase_patients.patient`.`id`     LEFT OUTER JOIN `user` AS `phases.phase_patients.patient.user` ON `phases.phase_patients.patient`.`user_id` = `phases.phase_patients.patient.user`.`id`     AND `phases.phase_patients.patient.user`.`deletedAt` IS NULL WHERE `trial`.`active` = 1 AND `trial`.`dsmb_id` = " + dsmbId +  " " + wheretrialcon + " " + wheregendercon+ " ",{
      type: sequelizeDb.QueryTypes.SELECT
    }).then(function(data){
        var ruleAry = [];
                ruleAry = {
                  count: data[0].totalCount,
                  rows: patient
                }

                res.json({ 
                  status: 'success',
                  data: ruleAry,
                  message: 'Records loaded successfully.'
                });
    })
      }
    else {
      res.json({
        status: false,
        data: null,
        message: 'Failed to load data..!'
      });
    }
  }).catch(function(err) {
      console.log(err);
  });
};





exports.getEnrolledTrialsDSMB = function(req, res, next) {

  var dsmb = generalConfig.getUserInfo(req);
  var dsmbId = dsmb.id;

  db.models.trial.findAll({
    attributes:['id', 'name', 'active'],
    where :{
      active:{
        $eq: 1
      },
      dsmb_id: dsmbId
    },
    include: [{
      model: sequelizeDb.models.phase,
      where: {
        start_date: {
            $lt: new Date()
        },
        tentitive_end_date: {
            $gt: new Date()
        },
        active: true
      },
      include : [{
        model: sequelizeDb.models.phase_patient, 
        attributes: ['id','phase_id','patient_id'],
        where:{
          phase_id:{
            $ne: null
          },
          patient_id:{
            $ne: null
          }
        },
        include:[{
          attributes: ['id','user_id','age','gender'],
          model: sequelizeDb.models.patient,
          include:[{
            model: sequelizeDb.models.user,
            attributes: ['firstname','lastname']
          }]
        }]
      }]  
    }]
  })
  .then(function(patient) {
    if(patient){
      res.json({
        status: true,
        data: patient,
        message: 'Success to load data..!'
      });
    }
    else {
      res.json({
        status: false,
        data: null,
        message: 'Failed to load data..!'
      });
    }
  }).catch(function(err) {
      console.log(err);
  });
};





/*exports.getEnrolledSearchTrial = function(req, res, next) {

  var pageNumber = req.body.search.params.pageNumber;
  var pageSize = req.body.search.params.pageSize;
  //console.log(req.body);
  var offset1 = pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize;
  console.log(offset1);

  var now = new Date(); 
  var currentMonth = now.getUTCMonth() + 1;
  var newDate = now.getUTCFullYear() + '-' + currentMonth + '-' + now.getUTCDate() + ' ' + now.getUTCHours() + ':' + now.getUTCMinutes() + ':' + now.getUTCSeconds();
  

  var wheretrialcon = "";
  var trailselected = req.body.trialName;
  var genderselected = req.body.gender;

  if(trailselected) {
    wheretrialcon = " AND `patientPhase.trial`.`name` = '"+ trailselected +"'"
  }

  var wheregendercon = "";
  if(genderselected) {
    wheregendercon = "  AND `patient`.`gender` = '"+ genderselected +"'"
  }


  var partialQuery =  "FROM `patient` AS `patient` LEFT OUTER JOIN `user` AS `user` ON `patient`.`user_id` = `user`.`id` AND `user`.`deletedAt` IS NULL INNER JOIN (`phase_patient` AS `patientPhase.phase_patient` INNER JOIN `phase` AS `patientPhase` ON `patientPhase`.`id` = `patientPhase.phase_patient`.`phase_id`) ON `patient`.`id` = `patientPhase.phase_patient`.`patient_id` AND `patientPhase`.`start_date` < '" + newDate + "' AND `patientPhase`.`tentitive_end_date` > '" + newDate + "' AND `patientPhase`.`active` = true INNER JOIN `trial` AS `patientPhase.trial` ON `patientPhase`.`trial_id` = `patientPhase.trial`.`id` " + wheretrialcon + " WHERE  `patientPhase.trial`.`active` = 1 " + wheregendercon+ " LIMIT " + pageSize + " OFFSET " + offset1


  var countQuery = "SELECT count(*) AS totalCount  " +partialQuery;

  var trialDataQuery = "SELECT `patient`.`id`, `patient`.`user_id`, `patient`.`age`, `patient`.`gender`, `user`.`id` AS `user.id`, `user`.`firstname` AS `firstname`, `user`.`lastname` AS `lastname`, `patientPhase`.`id` AS `patientPhase.id`, `patientPhase`.`trial_id` AS `patientPhase.trial_id`, `patientPhase`.`sr_no` AS `patientPhase.sr_no`, `patientPhase`.`description` AS  `description`,`patientPhase.phase_patient`.`id` AS `patientPhase.phase_patient.id`, `patientPhase.phase_patient`.`phase_id` AS `patientPhase.phase_patient.phase_id`, `patientPhase.phase_patient`.`patient_id` AS `patientPhase.phase_patient.patient_id`, `patientPhase.phase_patient`.`age` AS `patientPhase.phase_patient.age`, `patientPhase.phase_patient`.`createdAt` AS `patientPhase.phase_patient.createdAt`, `patientPhase.phase_patient`.`updatedAt` AS `patientPhase.phase_patient.updatedAt`, `patientPhase.trial`.`id` AS `patientPhase.trial.id`, `patientPhase.trial`.`name` AS `name`, `patientPhase.trial`.`active` AS `patientPhase.trial.active`" +partialQuery;


  db.query(trialDataQuery,{
      type: sequelizeDb.QueryTypes.SELECT
    }).then(function(patient){
      if(patient) {

        db.query(countQuery,{
      type: sequelizeDb.QueryTypes.SELECT
    }).then(function(data){
        console.log("data");
        console.log(data);
        var ruleAry = [];
                ruleAry = {
                  count: data[0].totalCount,
                  rows: patient
                }

                res.json({ 
                  status: 'success',
                  data: ruleAry,
                  message: 'Records loaded successfully.'
                });
    })
      }
    else {
      res.json({
        status: false,
        data: null,
        message: 'Failed to load data..!'
      });
    }
    })
};*/



