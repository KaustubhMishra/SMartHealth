'use strict';
var async = require('async');
var Sequelize = require("sequelize");
var moment = require("moment");
var now = moment().format("DD-MM-YYYY");
var notificationController = require('../../notification/controller/notificationController');

sequelizeDb.models.trial_device.associate(sequelizeDb.models);
sequelizeDb.models.device.associate(sequelizeDb.models);
sequelizeDb.models.device_group.associate(sequelizeDb.models);
sequelizeDb.models.template.associate(sequelizeDb.models);
sequelizeDb.models.thing.associate(sequelizeDb.models);
sequelizeDb.models.trial.associate(sequelizeDb.models);
sequelizeDb.models.drug_type.associate(sequelizeDb.models);
sequelizeDb.models.dosage.associate(sequelizeDb.models);
sequelizeDb.models.frequency.associate(sequelizeDb.models);
sequelizeDb.models.patient.associate(sequelizeDb.models);
sequelizeDb.models.phase.associate(sequelizeDb.models);

exports.getTrials = function(req, res, next) {
  
  var pageNumber = req.body.search.params.pageNumber;
  var pageSize = req.body.search.params.pageSize;
  
  var searchTrialParameters = new Array();
  var searchPhaseParameters = new Array();
 
  
  //var todaydate = new Date(new Date().setDate(new Date().getDate()));
  var todaydate = new Date();
  
    if(req.body.sponsorId != undefined && req.body.sponsorId != 'undefined' && req.body.sponsorId != "") {
      console.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww");
      console.log(req.body.sponsorId);
      searchTrialParameters.push({
        sponsor_id: req.body.sponsorId
      });
    }
    if(req.body.trialId != undefined && req.body.trialId != 'undefined' && req.body.trialId != "") {
      searchTrialParameters.push({
        id: req.body.trialId
      });
    }
   if(req.body.statusId != undefined  && req.body.statusId != 'undefined'  && req.body.statusId != "") {
    console.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww");
      if(req.body.statusId == 1) //On Time
      { 
         searchTrialParameters.push({$and : {active: req.body.statusId, 
                                          end_date: { $gte : todaydate } 
                      }});
         
      }
      else if(req.body.statusId == 2) // Compeleted
      {

         searchTrialParameters.push({active: req.body.statusId});
      }
     else if(req.body.statusId == 3) //Delayed
      {
        
         searchTrialParameters.push({$and : {active: 1, 
                                          end_date: { $lt : todaydate } 
                      }});
         
      }
    }

  var orderval = [
    [Sequelize.col('id'), 'ASC'],
  ]  
   
  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  sequelizeDb.models.trial.findAndCountAll({
      order : 'trial.id ASC,phases.sr_no ASC',
      where: searchTrialParameters,
      include: [
        {model: sequelizeDb.models.phase, attributes: ['id','tentitive_end_date','sr_no'],
         where : {$and: {sr_no: { $gte:  req.body.phaseId }, 
                                          tentitive_end_date: { $ne: null }
                      }}, 
         required: true
         }
      ], 
    offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
    limit: pageSize
     
}).then(function(trialData)
    {
        if(trialData)
        {
          //res.json(trials);
          

          var trialListArray = [];
              
           if(trialData.rows[0])
           {
              async.forEach(Object.keys(trialData.rows), function (item, callback1)
                       {    
                         var trialList = {};
                          var status = 0;
                          
                             
                             if(trialData.rows[item].dataValues.active == 2) 
                             {
                                  status = 100;
                                  trialList = 
                                                  {
                                                    "id" : trialData.rows[item].dataValues.id,
                                                    "company_id" : trialData.rows[item].dataValues.company_id,
                                                    "sponsor_id" : trialData.rows[item].dataValues.sponsor_id,
                                                    "name" : trialData.rows[item].dataValues.name,
                                                    "description" : trialData.rows[item].dataValues.description,
                                                    "trial_type" : trialData.rows[item].dataValues.trial_type,
                                                    "dsmb_id" : trialData.rows[item].dataValues.dsmb_id,
                                                    "drug_name" : trialData.rows[item].dataValues.drug_name,
                                                    "drug_description" : trialData.rows[item].dataValues.drug_description,
                                                    "drug_type_id" : trialData.rows[item].dataValues.drug_type_id,
                                                    "dosage_id" : trialData.rows[item].dataValues.dosage_id,
                                                    "frequency_id" : trialData.rows[item].dataValues.frequency_id,
                                                    "start_date" : trialData.rows[item].dataValues.start_date,
                                                    "end_date" : trialData.rows[item].dataValues.end_date,
                                                    "active" : trialData.rows[item].dataValues.active,
                                                    "status" : status,
                                                    "count" : trialData.count,
                                                    "rows": trialData.rows
                                                  }
                                            
                                            trialListArray.push(trialList);
                             }
                             else
                             {
                                      var curr = moment(new Date()).format("YYYY-MM-DD 23:59:59");
                                      var start = moment(trialData.rows[item].dataValues.start_date).format("YYYY-MM-DD 23:59:59");
                                      var end = moment(trialData.rows[item].dataValues.end_date).format("YYYY-MM-DD 23:59:59");

                                      if ((start < curr) && (curr < end) ) { 
                                              var end_date = new Date(moment(trialData.rows[item].dataValues.end_date).format("YYYY-MM-DD 23:59:59"));
                                              var start_date = new Date(moment(trialData.rows[item].dataValues.start_date).format("YYYY-MM-DD 23:59:59"));
                                              var timeDiff = Math.abs(end_date.getTime() - start_date.getTime());
                                              var compDiff = Math.abs(new Date().getTime() - start_date.getTime());
                                              var trialDuration = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
                                              var compDuration = Math.ceil(compDiff / (1000 * 3600 * 24));   
                                               
                                              status = Math.ceil(Math.abs((compDuration / trialDuration) * 100 ));
                                              

                                      }
                                      else
                                      {
                                        status = 0;
                                      }
                                      trialList = 
                                                  {
                                                    "id" : trialData.rows[item].dataValues.id,
                                                    "company_id" : trialData.rows[item].dataValues.company_id,
                                                    "sponsor_id" : trialData.rows[item].dataValues.sponsor_id,
                                                    "name" : trialData.rows[item].dataValues.name,
                                                    "description" : trialData.rows[item].dataValues.description,
                                                    "trial_type" : trialData.rows[item].dataValues.trial_type,
                                                    "dsmb_id" : trialData.rows[item].dataValues.dsmb_id,
                                                    "drug_name" : trialData.rows[item].dataValues.drug_name,
                                                    "drug_description" : trialData.rows[item].dataValues.drug_description,
                                                    "drug_type_id" : trialData.rows[item].dataValues.drug_type_id,
                                                    "dosage_id" : trialData.rows[item].dataValues.dosage_id,
                                                    "frequency_id" : trialData.rows[item].dataValues.frequency_id,
                                                    "start_date" : trialData.rows[item].dataValues.start_date,
                                                    "end_date" : trialData.rows[item].dataValues.end_date,
                                                    "active" : trialData.rows[item].dataValues.active,
                                                    "status" : status,
                                                    "count" : trialData.count,
                                                    "rows": trialData.rows
                                                  }
                                            
                                            trialListArray.push(trialList);
                             }  
                        }, function(err) {
                                        
                                         }); 
          }
         res.json({
            status: true,
            data: trialListArray,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
  
};


exports.gettrialsSelectListDSMB = function(req, res, next) {
  
  var userInfo = generalConfig.getUserInfo(req);
  var dsmbId = userInfo.id;

  var searchTrialParameters = new Array();
  
    if(req.body.sponsorId != undefined && dsmbId != 'undefined' && req.body.trialId != "") {
      searchTrialParameters.push({
        sponsor_id: req.body.sponsorId,
        dsmb_id: dsmbId,
        id: req.body.trialId
      });
    } else if(req.body.sponsorId != undefined && dsmbId != 'undefined') {
      searchTrialParameters.push({
        sponsor_id: req.body.sponsorId,
        dsmb_id: dsmbId
      });
    }

  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'});
  sequelizeDb.models.phase.hasMany(sequelizeDb.models.milestone,{foreignKey:'phase_id'});  
  sequelizeDb.models.trial.findAll({
      where: searchTrialParameters,
      include: [
        {model: sequelizeDb.models.phase, attributes: ['id']}
  ]

}).then(function(trialData)
    {

        if(trialData)
        {

          var trialListArray = [];
              
           if(trialData[0])
                {

                 async.forEach(Object.keys(trialData), function (item, callback1)
                       {   
                          var trialList = {};

                            trialList = {
                              "id" : trialData[item].dataValues.id,
                              "company_id" : trialData[item].dataValues.company_id,
                              "sponsor_id" : trialData[item].dataValues.sponsor_id,
                              "name" : trialData[item].dataValues.name,
                              "description" : trialData[item].dataValues.description,
                              "trial_type" : trialData[item].dataValues.trial_type,
                              "dsmb_id" : trialData[item].dataValues.dsmb_id,
                              "drug_name" : trialData[item].dataValues.drug_name,
                              "drug_description" : trialData[item].dataValues.drug_description,
                              "drug_type_id" : trialData[item].dataValues.drug_type_id,
                              "dosage_id" : trialData[item].dataValues.dosage_id,
                              "frequency_id" : trialData[item].dataValues.frequency_id,
                              "start_date" : trialData[item].dataValues.start_date,
                              "end_date" : trialData[item].dataValues.end_date,
                              "active" : trialData[item].dataValues.active,
                             }
                          
                              trialListArray.push(trialList);

                       }, function(err) {
                                        
                                         });
                  
                }

          res.json({
            status: true,
            data: trialListArray,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });

};


exports.gettrialsSelectListCRO = function(req, res, next) {
  
  var userInfo = generalConfig.getUserInfo(req);
  var croCoordinatorId = userInfo.id;

  var searchTrialParameters = new Array();

  
  if(req.body.sponsorId && req.body.trialId) {
    searchTrialParameters.push({
      sponsor_id: req.body.sponsorId,
      id: req.body.trialId,
      croCoordinator_id: croCoordinatorId
    });
  } else if(req.body.sponsorId && croCoordinatorId) {
    searchTrialParameters.push({
      sponsor_id: req.body.sponsorId,
      croCoordinator_id: croCoordinatorId
    });
  }

  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'});
  sequelizeDb.models.phase.hasMany(sequelizeDb.models.milestone,{foreignKey:'phase_id'});  
  sequelizeDb.models.trial.findAll({
      where: searchTrialParameters,
      include: [
        {model: sequelizeDb.models.phase, attributes: ['id']}
  ]

}).then(function(trialData)
    {

        if(trialData)
        {

          var trialListArray = [];
              
           if(trialData[0])
                {

                 async.forEach(Object.keys(trialData), function (item, callback1)
                       {   
                          var trialList = {};

                            trialList = {
                              "id" : trialData[item].dataValues.id,
                              "company_id" : trialData[item].dataValues.company_id,
                              "sponsor_id" : trialData[item].dataValues.sponsor_id,
                              "name" : trialData[item].dataValues.name,
                              "description" : trialData[item].dataValues.description,
                              "trial_type" : trialData[item].dataValues.trial_type,
                              "dsmb_id" : trialData[item].dataValues.dsmb_id,
                              "drug_name" : trialData[item].dataValues.drug_name,
                              "drug_description" : trialData[item].dataValues.drug_description,
                              "drug_type_id" : trialData[item].dataValues.drug_type_id,
                              "dosage_id" : trialData[item].dataValues.dosage_id,
                              "frequency_id" : trialData[item].dataValues.frequency_id,
                              "start_date" : trialData[item].dataValues.start_date,
                              "end_date" : trialData[item].dataValues.end_date,
                              "active" : trialData[item].dataValues.active,
                             }
                          
                              trialListArray.push(trialList);

                       }, function(err) {
                                        
                                         });
                  
                }

          res.json({
            status: true,
            data: trialListArray,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });

};



exports.gettrialsSelectList = function(req, res, next) {
  
  var userInfo = generalConfig.getUserInfo(req);
  var dsmbId = userInfo.id;
  

  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'});
  sequelizeDb.models.phase.hasMany(sequelizeDb.models.milestone,{foreignKey:'phase_id'});  
  sequelizeDb.models.trial.findAll({
    where: {sponsor_id : req.body.sponsorId},
      include: [
        {model: sequelizeDb.models.phase, attributes: ['id']}
  ]

}).then(function(trialData)
    {

        if(trialData)
        {

          var trialListArray = [];
              
           if(trialData[0])
                {

                 async.forEach(Object.keys(trialData), function (item, callback1)
                       {   
                          var trialList = {};

                            trialList = {
                              "id" : trialData[item].dataValues.id,
                              "company_id" : trialData[item].dataValues.company_id,
                              "sponsor_id" : trialData[item].dataValues.sponsor_id,
                              "name" : trialData[item].dataValues.name,
                              "description" : trialData[item].dataValues.description,
                              "trial_type" : trialData[item].dataValues.trial_type,
                              "dsmb_id" : trialData[item].dataValues.dsmb_id,
                              "drug_name" : trialData[item].dataValues.drug_name,
                              "drug_description" : trialData[item].dataValues.drug_description,
                              "drug_type_id" : trialData[item].dataValues.drug_type_id,
                              "dosage_id" : trialData[item].dataValues.dosage_id,
                              "frequency_id" : trialData[item].dataValues.frequency_id,
                              "start_date" : trialData[item].dataValues.start_date,
                              "end_date" : trialData[item].dataValues.end_date,
                              "active" : trialData[item].dataValues.active,
                             }
                          
                              trialListArray.push(trialList);

                       }, function(err) {
                                        
                                         });
                  
                }

          res.json({
            status: true,
            data: trialListArray,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });

};

exports.getTrialDataById = function(req, res, next) {

  var trialID = req.params.id;

    sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'});
    sequelizeDb.models.phase.hasMany(sequelizeDb.models.milestone,{foreignKey:'phase_id'});
    sequelizeDb.models.phase.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'phase_id'});
    sequelizeDb.models.patient.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'patient_id'});
    sequelizeDb.models.phase_patient.belongsTo(sequelizeDb.models.patient, {foreignKey: 'patient_id'});

    sequelizeDb.models.user.hasMany(sequelizeDb.models.patient,{foreignKey:'user_id'});
    sequelizeDb.models.patient.belongsTo(sequelizeDb.models.user, {foreignKey: 'user_id'});

    sequelizeDb.models.trial.hasMany(sequelizeDb.models.trial_device,{foreignKey:'trial_id'});
    sequelizeDb.models.trial_device.belongsTo(sequelizeDb.models.trial, {foreignKey: 'trial_id'});
    sequelizeDb.models.device.hasMany(sequelizeDb.models.trial_device,{foreignKey:'device_id'});
    sequelizeDb.models.trial_device.belongsTo(sequelizeDb.models.device, {foreignKey: 'device_id'});

    sequelizeDb.models.trial.hasMany(sequelizeDb.models.trial_dosage_frequency,{foreignKey:'trial_id'});
    sequelizeDb.models.trial_dosage_frequency.belongsTo(sequelizeDb.models.trial, {foreignKey: 'trial_id'});

    sequelizeDb.models.trial.findAll({
      where: {
        id : trialID
      },
      include: [
        {
          model: sequelizeDb.models.phase, 
                include: [
                            {model: sequelizeDb.models.milestone},
                            {model: sequelizeDb.models.phase_patient, attributes: ['id','phase_id','patient_id'],
                              include:[{model: sequelizeDb.models.patient, attributes: ['id','user_id','age','gender'],
                                                include:[{model: sequelizeDb.models.user, attributes: ['id','firstname','lastname','email']}]
                                        }]
                            }
                          ]
        },
        {
          model : sequelizeDb.models.trial_device, attributes: ['id','trial_id','device_id','active'],
              include : [{model: sequelizeDb.models.device,attributes: ['id','name','manufacturer','firmware','version','device_group_id']}]
        },
        {
          model : sequelizeDb.models.trial_dosage_frequency, attributes: ['id','trial_id','frequency_time']
        }],order: [
                   [ sequelizeDb.models.phase, 'sr_no', 'ASC' ]
                  ]

}).then(trialData => {
        res.json({
            status: true,
            data: trialData,
            message: 'Data Fetched successfully..!'
          });
        
})
                     
};


exports.updateTrial = function(req, res, next) {
    
  console.log('Update Trial............');

  var trialID = req.body.trial.id;
  var timezone = '';
  var userInfo = generalConfig.getUserInfo(req);

async.series([
              function (callback) {
                sequelizeDb.models.user.find({ where: { id: userInfo.id} })
                  .then(function(user) {
                      timezone = user.dataValues.timezone;
                      callback(null,1);
                  })
              },
              function (callback) {
                  updateTrialData(timezone);
                      callback(null,2);

              },
              function (callback) {
                  console.log('fire notification after Update Trial........');
                  //notificationController.setNotifications();
                  callback(null,3);

              }
            ], function (err, results) {
                      if (err) {
                        res.json({
                          status: false,
                          data: null,
                          message: 'Failedsettings to store uploaded files'
                        });
                      } else {
                         res.json({
                                   status: true,
                                   data: results,
                                   message: 'Data updated successfully..!'
                                });
                      }
                    })
                                                                       
             

  var updateTrialData = function(timezone) {
    
  var trialData = []; 

  var trialdata = {
    "company_id" : req.body.trial.company_id,
    "sponsor_id" : req.body.trial.sponsor_id,
    "name" : req.body.trial.name,
    "description" : req.body.trial.description,
    "trial_type" : req.body.trial.trial_type,
    "dsmb_id" : req.body.trial.dsmb_id,
    "croCoordinator_id" : req.body.trial.croCoordinator_id,
    "drug_name" : req.body.trial.drug_name,
    "drug_description" : req.body.trial.drug_description,
    "drug_type_id" : req.body.trial.drug_type_id,
    "dosage_id" : req.body.trial.dosage_id,
    "frequency_id" : req.body.trial.frequency_id,
    "start_date" : generalConfig.convertUTCDate(moment(req.body.trial.start_date).format("YYYY-MM-DD 00:00:00"), timezone),
    "end_date" : generalConfig.convertUTCDate(moment(req.body.trial.end_date).format("YYYY-MM-DD 23:59:59"), timezone),
    "active" : 1,
    "pre_vital_type": req.body.trial.pre_vital_type,
    "post_vital_type": req.body.trial.post_vital_type
  };

  
  sequelizeDb.models.trial.find({ where: { id: trialID} })
  .then(function(trial) {

      if(trial)
      {
          sequelizeDb.models.trial.update(trialdata,{
              where: { id: trialID}
            }).then(function (trialres) {
                  trialData = trialdata;
                  
                  sequelizeDb.models.trial_device.destroy({
                                     where: { 
                                              trial_id:  trialID
                                            }
                                  })    
                                  .then(function () 
                                        {

                                        });

                  sequelizeDb.models.trial_dosage_frequency.destroy({
                                     where: { 
                                              trial_id:  trialID
                                            }
                                  })    
                                  .then(function () 
                                        {

                                        });


                   sequelizeDb.models.vital_dosage_status.destroy({
                                     where: { 
                                              trial_id:  trialID
                                            }
                                  })    
                                  .then(function () 
                                        {

                                        });

                   if(req.body.device)
                   {
                      var deviceArray = [];

                        async.forEach(Object.keys(req.body.device), function (item1)
                        {  
                            var deviceData = {
                                            "trial_id" : trialID,
                                            "device_id" : req.body.device[item1].id,
                                            "active" : 1
                                           }

                            deviceArray.push(deviceData);

                        }, function(err) {
                          
                              }); 

                        if(deviceArray){
                             sequelizeDb.models.trial_device.bulkCreate(deviceArray,{
                                  }).then(function (deviceres) 
                                          { 

                                          }, function(err) {
      
                                                            });   
                        }
                        
                    }

                    if(req.body.MedicationTimeList)
                    {
                      var MedicationTimeList = [];

                        async.forEach(Object.keys(req.body.MedicationTimeList), function (medicationItem)
                        {  
                           var DosageFrequencyArray = {
                                           "trial_id" : trialID,
                                           "frequency_time" : generalConfig.convertUTCDate(moment(new Date()).format("YYYY-MM-DD " + req.body.MedicationTimeList[medicationItem].value), timezone)
                                           }

                            MedicationTimeList.push(DosageFrequencyArray);

                        }, function(err) {
                          
                              }); 

                        if(MedicationTimeList){
                             sequelizeDb.models.trial_dosage_frequency.bulkCreate(MedicationTimeList,{
                                  }).then(function (medres) 
                                          { 

                                          }, function(err) {
      
                                                            });   
                        }
                        
                    }

                     
                  async.forEach(Object.keys(req.body.phase), function (phaseitem, callback1)
                     { 

                        sequelizeDb.models.milestone.destroy({
                                     where: { 
                                              phase_id: req.body.phase[phaseitem].id                    
                                            }
                                  })    
                                  .then(function (affectedMilestonerowcount) 
                                        {

                                        });
                        
                        sequelizeDb.models.phase_patient.destroy({
                                     where: { 
                                              phase_id: req.body.phase[phaseitem].id                    
                                            }
                                  })    
                                  .then(function (affectedMilestonerowcount) 
                                        {

                                        });

                                  
                        var PhaseUpdatedData = { 
                                          "id" : req.body.phase[phaseitem].id,
                                          "trial_id" : req.body.phase[phaseitem].trial_id,
                                          "sr_no" : req.body.phase[phaseitem].sr_no,
                                          "description" : req.body.phase[phaseitem].description,
                                          "start_date": req.body.phase[phaseitem].start_date ? generalConfig.convertUTCDate(moment(req.body.phase[phaseitem].start_date).format("YYYY-MM-DD 00:00:00"), timezone) : null,
                                          "tentitive_end_date": req.body.phase[phaseitem].tentitive_end_date ? generalConfig.convertUTCDate(moment(req.body.phase[phaseitem].tentitive_end_date).format("YYYY-MM-DD 23:59:59"), timezone) : null,
                                          "participant_count": req.body.phase[phaseitem].participant_count,
                                          "active": 1
                                        }
                          
                        sequelizeDb.models.phase.update(PhaseUpdatedData,{
                                where: { id: req.body.phase[phaseitem].id}
                              }).then(function (phaseres) 
                              {
                                  
                                  if(req.body.phase[phaseitem].milestone){
                                      async.forEach(Object.keys(req.body.phase[phaseitem].milestone), function (item2, callback2)
                                      {  
                                        
                                          var MilestoneData = { "phase_id" : req.body.phase[phaseitem].id,
                                                                    "name" : req.body.phase[phaseitem].milestone[item2].name,
                                                                    "description" : req.body.phase[phaseitem].milestone[item2].description,
                                                                    "start_date": req.body.phase[phaseitem].milestone[item2].start_date ? generalConfig.convertUTCDate(moment(req.body.phase[phaseitem].milestone[item2].start_date).format("YYYY-MM-DD 00:00:00"), timezone) : null,
                                                                    "tentitive_end_date": req.body.phase[phaseitem].milestone[item2].tentitive_end_date ? generalConfig.convertUTCDate(moment(req.body.phase[phaseitem].milestone[item2].tentitive_end_date).format("YYYY-MM-DD 23:59:59"), timezone) : null,
                                                                    "active": 1
                                                                  }
                                              sequelizeDb.models.milestone.create(MilestoneData,{
                                                }).then(function (milestoneres) 
                                                        { 

                                                        }, function(err) {
                    
                                                                          }); 
                                        

                                      }, function(err) {
                                        
                                            }); 

                                    }
                                    if(req.body.phase[phaseitem].patient)
                                    {
                                      let vitalDosageArray = [];
                                      let patientDataArray = [];
                                      
                                      async.forEach(Object.keys(req.body.phase[phaseitem].patient), function (item2, callback2)
                                      {  
                                        
                                                    var date2 = new Date(generalConfig.convertUTCDate(moment(req.body.phase[phaseitem].start_date).format("YYYY-MM-DD 00:00:00"), timezone));
                                                    var date1 = new Date(generalConfig.convertUTCDate(moment(req.body.phase[phaseitem].tentitive_end_date).format("YYYY-MM-DD 23:59:59"), timezone));
                                                    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
                                                    var dayDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));   
                                                     //dayDifference += 1;

                                                  
                                                    
                                                    
                                                    //var schedule_on = new Date(); 
                                                    var schedule_on_utc,schedule_on_utc_time;

                                                    console.log('Day Difference.......');
                                                    console.log(dayDifference);
                                                    for (var d=0; d<dayDifference;d++)
                                                    {
                                                       var count = d * 24;

                                                        if(req.body.MedicationTimeList)
                                                        {
                                                             async.forEach(Object.keys(req.body.MedicationTimeList), function (meditem)
                                                              { 
                                                                var OneDayAheedDate  =  date2.getTime() + parseInt(count)*60*60*1000;
                                                                   //schedule_on = new Date(OneDayAheedDate);
                                                                
                                                                   
                                                                   for (var v=1;v<=3;v++)
                                                                   {
                                                                    var newTime,newDate,duration = '';   
                                                                    if(v == 1)
                                                                    {
                                                                        //newDate = generalConfig.convertUTCDate(moment(OneDayAheedDate).format("YYYY-MM-DD "+ req.body.MedicationTimeList[meditem].value), timezone);
                                                                        //newTime = moment(newDate).format('HH:mm:ss');
                                                                        duration = moment.duration({hours: 1})
                                                                        schedule_on_utc_time = moment(req.body.MedicationTimeList[meditem].value, 'HH:mm:ss').subtract(duration).format('HH:mm:ss');
                                                                        schedule_on_utc = generalConfig.convertUTCDate(moment(OneDayAheedDate).format("YYYY-MM-DD "+ schedule_on_utc_time), timezone);
                                                                    }
                                                                    else if (v == 2)
                                                                    {
                                                                        schedule_on_utc = generalConfig.convertUTCDate(moment(OneDayAheedDate).format("YYYY-MM-DD "+ req.body.MedicationTimeList[meditem].value), timezone);
                                                                    }
                                                                    else
                                                                    {
                                                                        duration = moment.duration({hours: 1})
                                                                        schedule_on_utc_time = moment(req.body.MedicationTimeList[meditem].value, 'HH:mm:ss').add(duration).format('HH:mm:ss');
                                                                        schedule_on_utc = generalConfig.convertUTCDate(moment(OneDayAheedDate).format("YYYY-MM-DD "+ schedule_on_utc_time), timezone);
                                                                    }
                                                                       var vitalDosageData = {
                                                                                              "trial_id" : trialID,
                                                                                              "phase_id" : req.body.phase[phaseitem].id,
                                                                                              "patient_id" : req.body.phase[phaseitem].patient[item2].patients[0].id,
                                                                                              "type" : v,
                                                                                              "schedule_on" : schedule_on_utc
                                                                                          }
                                                                                          
                                                                        vitalDosageArray.push(vitalDosageData);
                                                                   }
                                                                   

                                                              }, function(err) {
                                        
                                                                   }); 

                                                        }
                                                    }

                                         var PatientData = { "phase_id" : req.body.phase[phaseitem].id,
                                                            "patient_id" : req.body.phase[phaseitem].patient[item2].patients[0].id,
                                                            "age" : req.body.phase[phaseitem].patient[item2].patients[0].age
                                                          }

                                          patientDataArray.push(PatientData);           
                                               
                                        

                                      }, function(err) {
                                        
                                            }); 


                                  async.series([
                                    function (callback) {
                                      if(patientDataArray)
                                          {
                                            sequelizeDb.models.phase_patient.bulkCreate(
                                                      patientDataArray
                                                    ).then(function (Response) {
                                                         callback(null,1);
                                                    }).catch(function(err) {
                                                                             
                                                                          });
                                          }
                                      else {
                                        callback();
                                      }
                                    },
                                    function (callback) {
                                      if(vitalDosageArray)
                                          {
                                            sequelizeDb.models.vital_dosage_status.bulkCreate(
                                                      vitalDosageArray
                                                    ).then(function (Response) {
                                                         callback(null,2);
                                                    }).catch(function(err) {
                                                                             
                                                                          });
                                          }
                                      else {
                                        callback();
                                      }
                                    }
                                  ], function (err, results) {
                                            if (err) {
                                              res.json({
                                                status: false,
                                                data: null,
                                                message: 'Failedsettings to store uploaded files'
                                              });
                                            } else {
                                               res.json({
                                                         status: true,
                                                         data: trialData,
                                                         message: 'Data saved successfully..!'
                                                      });
                                            }
                                          })
                                                                                             
                                     } 

                              });
                      
                     }, function(err) {
                                        
                        });  
  

                   res.json({
                      status: true,
                      data: trialData,
                      message: 'Data updated successfully..!'
                    });
      });
    }

  }).catch(function(err){
    res.json({
      status: false,
      data: null,
      message: err.message
    });
  });

}
};




exports.addTrial = function(req, res, next) {

  var timezone = '';
  var userInfo = generalConfig.getUserInfo(req);

  var trialdata = null;

async.series([
              function (callback) {
                sequelizeDb.models.user.find({ where: { id: userInfo.id} })
                  .then(function(user) {
                      
                      timezone = user.dataValues.timezone;
                      callback(null,1);
                  })
              },
              function (callback) {
                  saveTrialData(req,timezone, function(err, data){
                    if(err) {
                      callback(err,2);
                    } else {
                      trialdata = data;
                      callback(null,2);                       
                    }
                  });
              }], function (err, results) {
                      if (err) {
                        res.json({
                          status: false,
                          data: null,
                          message: 'Failedsettings to store uploaded files'
                        });
                      } else {
                         res.json({
                                   status: true,
                                   data: trialdata,
                                   message: 'Data saved successfully..!'
                                });
                      }
                    })        
};


var toTimeZone = function(time, zone) {

    var moment = require('moment-timezone');

    var format = 'HH:mm:ss';

    return moment(time, format).tz(zone).format(format);
}

var saveTrialData = function(req,timezone, callbackFunc) { 

  var trialData = [];
  
  var trialdata = {
    "company_id" : req.body.trial.company_id,
    "sponsor_id" : req.body.trial.sponsor_id,
    "name" : req.body.trial.name,
    "description" : req.body.trial.description,
    "trial_type" : req.body.trial.trial_type,
    "dsmb_id" : req.body.trial.dsmb_id,
    "croCoordinator_id" : req.body.trial.croCoordinator_id,
    "drug_name" : req.body.trial.drug_name,
    "drug_description" : req.body.trial.drug_description,
    "drug_type_id" : req.body.trial.drug_type_id,
    "dosage_id" : req.body.trial.dosage_id,
    "frequency_id" : req.body.trial.frequency_id,
    "start_date" : req.body.trial.start_date ? generalConfig.convertUTCDate(moment(req.body.trial.start_date).format("YYYY-MM-DD 00:00:00"), timezone) : null,
    "end_date" : req.body.trial.end_date ? generalConfig.convertUTCDate(moment(req.body.trial.end_date).format("YYYY-MM-DD 23:59:59"), timezone) : null,
    "active" : 1,
    "pre_vital_type": req.body.trial.pre_vital_type,
    "post_vital_type": req.body.trial.post_vital_type,
  };


 sequelizeDb.transaction(function(t) 
  {
        return Promise.all([
              sequelizeDb.models.trial.create(trialdata, {
                transaction: t
            }).then(
            function (restrial) {
                     trialData =  restrial.dataValues;
                     let trialInfo = restrial.dataValues;
                     let trialID = trialInfo.id;
                     let PhaseDataArray = [];  
                     var deviceDataArray = [];


                    if(req.body.MedicationTimeList)
                    {
                      var MedicationTimeList = [];

                        async.forEach(Object.keys(req.body.MedicationTimeList), function (medicationItem)
                        {  
                           var DosageFrequencyArray = {
                                           "trial_id" : trialID,
                                           "frequency_time" : generalConfig.convertUTCDate(moment(new Date()).format("YYYY-MM-DD " + req.body.MedicationTimeList[medicationItem].value), timezone)
                                           }

                            MedicationTimeList.push(DosageFrequencyArray);

                        }, function(err) {
                          
                              }); 

                        if(MedicationTimeList){
                             sequelizeDb.models.trial_dosage_frequency.bulkCreate(MedicationTimeList,{
                                  }).then(function (medres) 
                                          { 

                                          }, function(err) {
      
                                                            });   
                        }
                        
                    }
                     
                     async.forEach(Object.keys(req.body.device), function (item1)
                      {  
                        var deviceArray = {
                                            "trial_id" : trialID,
                                            "device_id" : req.body.device[item1].id,
                                            "active" : 1
                                           }
                        deviceDataArray.push(deviceArray);
                      }, function(err) {
                                                          
                                       }); 

                     if(deviceDataArray){
                            sequelizeDb.models.trial_device.bulkCreate(
                                  deviceDataArray,
                                   { transaction: t }
                                ).then(function (deviceResponse) 
                                {

                                });

                     }

                     
                     async.forEach(Object.keys(req.body.phase), function (item1, callback1)
                     {  
                      
                        var PhaseData = { "trial_id" : trialID,
                                          "sr_no" : req.body.phase[item1].sr_no,
                                          "description" : req.body.phase[item1].description,
                                          "start_date": (req.body.phase[item1].start_date ? generalConfig.convertUTCDate(moment(req.body.phase[item1].start_date).format("YYYY-MM-DD 00:00:00"), timezone) : null ),
                                          "tentitive_end_date": (req.body.phase[item1].tentitive_end_date ? generalConfig.convertUTCDate(moment(req.body.phase[item1].tentitive_end_date).format("YYYY-MM-DD 23:59:59"), timezone) : null ),
                                          "participant_count": (req.body.phase[item1].participant_count == "" ? null : req.body.phase[item1].participant_count),
                                          "active": 1
                                        }
                        PhaseDataArray.push(PhaseData);  
                      
                     }, function(err) {
                                        
                        });  

               

               if(PhaseDataArray) 
                {
                  sequelizeDb.models.phase.bulkCreate(
                      PhaseDataArray,
                       { transaction: t }
                    ).then(function (phaseResponse) 
                    {
                          
                             let MilestoneDataArray = []; 
                             let PatientDataArray = [];  
                             let vitalDosageArray = [];


                                   async.forEach(Object.keys(req.body.phase), function (item2, callback1)
                                    {
                                      async.forEach(Object.keys(phaseResponse), function (item1, callback2)
                                       {  
                                         if(req.body.phase[item2].sr_no == phaseResponse[item1].sr_no)
                                         {

                                                 async.forEach(Object.keys(req.body.phase[item2].milestone), function (item3, callback3)
                                                  { 
                                                    var MilestoneData = { "phase_id" : phaseResponse[item1].id,
                                                                          "name" : req.body.phase[item2].milestone[item3].name,
                                                                          "description" : req.body.phase[item2].milestone[item3].description,
                                                                          "start_date": req.body.phase[item2].milestone[item3].start_date ? generalConfig.convertUTCDate(moment(req.body.phase[item2].milestone[item3].start_date).format("YYYY-MM-DD 00:00:00"), timezone) : null,
                                                                          "tentitive_end_date": req.body.phase[item2].milestone[item3].tentitive_end_date ? generalConfig.convertUTCDate(moment(req.body.phase[item2].milestone[item3].tentitive_end_date).format("YYYY-MM-DD 23:59:59"), timezone) : null,
                                                                          "active": 1
                                                                        }
                                                     MilestoneDataArray.push(MilestoneData); 
                                                  }, function(err) {
                                                      
                                                     }); 

                                                 async.forEach(Object.keys(req.body.phase[item2].patient), function (item4, callback4)
                                                  { 

                                                    var date2 = new Date(generalConfig.convertUTCDate(moment(req.body.phase[item2].start_date).format("YYYY-MM-DD 00:00:00"), timezone));
                                                    var date1 = new Date(generalConfig.convertUTCDate(moment(req.body.phase[item2].tentitive_end_date).format("YYYY-MM-DD 23:59:59"), timezone));
                                                    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
                                                    var dayDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));   
                                                     //dayDifference += 1;

                                                   
                                                    var schedule_on_utc,schedule_on_utc_time;

                                                    for (var d=0; d<dayDifference;d++)
                                                    {
                                                       var count = d * 24;

                                                        if(req.body.MedicationTimeList)
                                                        {
                                                             async.forEach(Object.keys(req.body.MedicationTimeList), function (meditem)
                                                              { 
                                                                var OneDayAheedDate  =  date2.getTime() + parseInt(count)*60*60*1000;
                                                                   //schedule_on = new Date(OneDayAheedDate);
                                                                
                                                                   
                                                                   for (var v=1;v<=3;v++)
                                                                   {
                                                                    var newTime,newDate,duration = '';   
                                                                    if(v == 1)
                                                                    {
                                                                        //newDate = generalConfig.convertUTCDate(moment(OneDayAheedDate).format("YYYY-MM-DD "+ req.body.MedicationTimeList[meditem].value), timezone);
                                                                        //newTime = moment(newDate).format('HH:mm:ss');
                                                                        duration = moment.duration({hours: 1})
                                                                        schedule_on_utc_time = moment(req.body.MedicationTimeList[meditem].value, 'HH:mm:ss').subtract(duration).format('HH:mm:ss');
                                                                        schedule_on_utc = generalConfig.convertUTCDate(moment(OneDayAheedDate).format("YYYY-MM-DD "+ schedule_on_utc_time), timezone);
                                                                    }
                                                                    else if (v == 2)
                                                                    {
                                                                        schedule_on_utc = generalConfig.convertUTCDate(moment(OneDayAheedDate).format("YYYY-MM-DD "+ req.body.MedicationTimeList[meditem].value), timezone);
                                                                    }
                                                                    else
                                                                    {
                                                                        duration = moment.duration({hours: 1})
                                                                        schedule_on_utc_time = moment(req.body.MedicationTimeList[meditem].value, 'HH:mm:ss').add(duration).format('HH:mm:ss');
                                                                        schedule_on_utc = generalConfig.convertUTCDate(moment(OneDayAheedDate).format("YYYY-MM-DD "+ schedule_on_utc_time), timezone);
                                                                    }
                                                                       var vitalDosageData = {
                                                                                              "trial_id" : trialID,
                                                                                              "phase_id" : phaseResponse[item1].id,
                                                                                              "patient_id" : req.body.phase[item2].patient[item4].patients[0].id,
                                                                                              "type" : v,
                                                                                              "schedule_on" : schedule_on_utc
                                                                                          }
                                                                                          
                                                                        vitalDosageArray.push(vitalDosageData);
                                                                   }
                                                                   

                                                              }, function(err) {
                                        
                                                                   }); 

                                                        }
                                                    }

                                                    var PatientData = { "phase_id" : phaseResponse[item1].id,
                                                                          "patient_id" : req.body.phase[item2].patient[item4].patients[0].id,
                                                                          "age" : req.body.phase[item2].patient[item4].patients[0].age
                                                                      }
                                                     PatientDataArray.push(PatientData); 
                                                  }, function(err) {
                                                      
                                                     }); 

                                         }
                                       }, function(err) {
                                                      
                                           }); 

                                       
                                   }, function(err) {
                                                      
                                      });  

                              async.series([
                                    function (callback) {
                                      if(MilestoneDataArray)
                                          {
                                            sequelizeDb.models.milestone.bulkCreate(
                                                      MilestoneDataArray
                                                    ).then(function (milestoneResponse) {
                                                         callback(null,1);
                                                    }).catch(function(err) {
                                                                             
                                                                          });
                                          }
                                      else {
                                        callback(null,1);
                                      }
                                    },
                                    function (callback) {
                                      if(PatientDataArray)
                                          {
                                            sequelizeDb.models.phase_patient.bulkCreate(
                                                      PatientDataArray
                                                    ).then(function (phasePatientResponse) {
                                                         callback(null,2);
                                                    }).catch(function(err) {
                                                                             
                                                                          });
                                          }
                                      else {
                                        callback(null,2);
                                      }
                                    },
                                    function (callback) {
                                      if(vitalDosageArray)
                                          {
                                            sequelizeDb.models.vital_dosage_status.bulkCreate(
                                                      vitalDosageArray
                                                    ).then(function (vitalResponse) {
                                                         callback(null,3);
                                                    }).catch(function(err) {
                                                                             
                                                                          });
                                          }
                                      else {
                                        callback(null,3);
                                      }
                                    }
                                  ], function (err, results) {
                                            if (err) {
                                              callbackFunc(err, null);
                                              // res.json({
                                              //   status: false,
                                              //   data: null,
                                              //   message: 'Failedsettings to store uploaded files'
                                              // });
                                            } else {
                                              callbackFunc(false, trialData);
                                               // res.json({
                                               //           status: true,
                                               //           data: trialData,
                                               //           message: 'Data saved successfully..!'
                                               //        });
                                            }
                                          })
                          
                    });
                }  
                else
                {
                  callbackFunc(false, trialData);
                   // res.json({
                   //             status: true,
                   //             data: trialData,
                   //             message: 'Data saved successfully..!'
                   //         });
                }          
            })
        ]).then(function(response) { 
             t.commit();
          }).catch(function(err) {
               t.rollback();
            });
  }).catch(function(err) {
    });

  }


exports.deleteTrialData = function(req, res, next) {
  

  var trialID = req.params.id;
  var deletedPhaseIDs = [];

    

        return sequelizeDb.models.trial.
        findOne({where: { id: trialID }})
        .then(function (trial) {

              console.log(trialID);
              sequelizeDb.models.trial_device.destroy({
                    where: { 
                            trial_id: trialID                      
                           }
                 })    
                
                

                sequelizeDb.models.trial_dosage_frequency.destroy({
                    where: { 
                            trial_id: trialID                       
                           }
                 })  

                sequelizeDb.models.vital_dosage_status.destroy({
                                    where: { 
                                            trial_id: trialID                       
                                           }
                                  })    
                                  .then(function () 
                                        {

                                        });

              sequelizeDb.models.phase.
                  findAll({where: { 
                        trial_id: {
                            $in: Sequelize.literal('(SELECT id FROM trial WHERE id = "'+trialID+'")')
                        }                        
                    }})
                        .then(function (phase) {
                              async.forEach(Object.keys(phase), function (item, callback1)
                                            { 
                                              deletedPhaseIDs.push(phase[item].id);
                                            }, function(err) {
                                          });

                            if(deletedPhaseIDs)
                            {    


                              sequelizeDb.models.notification.destroy({
                                  where: {$and : {phase_id: {
                                                               $in: deletedPhaseIDs
                                                            }  , 
                                                  trial_id: trialID
                                    }}
                               }) .then(function (affectedNotificationrowcount) 
                                        {   

                               sequelizeDb.models.milestone.destroy({
                                     where: { 
                                              phase_id: {
                                              $in: deletedPhaseIDs
                                              }                        
                                            }
                                  })    
                                  .then(function (affectedMilestonerowcount) 
                                        {  
                                          sequelizeDb.models.phase_patient.destroy({
                                             where: { 
                                                      phase_id: {
                                                      $in: deletedPhaseIDs
                                                      }                        
                                                    }
                                          })    
                                          .then(function (affectedPhasePatientrowcount) 
                                                {

                                                     sequelizeDb.models.phase.destroy({
                                                          where: { 
                                                                  id: {
                                                                    $in: deletedPhaseIDs
                                                                  }                        
                                                                 }
                                                       })    
                                                     .then(function (affectedrowcount) 
                                                        {

                                                                      sequelizeDb.models.trial.destroy({ where: { id: trialID} })    
                                                                            .then(function (result) 
                                                                                 {  
                                                                                    res.json({
                                                                                              status: true,
                                                                                              data: result,
                                                                                              message: 'Data removed successfully..!'
                                                                                            });    
                                                                            }); 
                                                                   
                                                      }).catch(function(e){
                                                           console.log('Here..........1');
                                                      }); 

                                                });
                                              
                                  });

                                 });
                              }
                            else
                            {
                              sequelizeDb.models.trial.destroy({ where: { id: trialID} })    
                                                    .then(function (result) 
                                                         {
                                                            res.json({
                                                                      status: true,
                                                                      data: result,
                                                                      message: 'Data removed successfully..!'
                                                                    });    
                                                    }); 
                            }

                          })
                    });      
};





exports.compeletetrialData = function(req, res, next) {
      
         var trialdata = {
            "id" : req.params.id,
            "company_id" : req.body.company_id,
            "sponsor_id" : req.body.sponsor_id,
            "name" : req.body.name,
            "description" : req.body.description,
            "trial_type" : req.body.trial_type,
            "dsmb_id" : req.body.dsmb_id,
            "drug_name" : req.body.drug_name,
            "drug_description" : req.body.drug_description,
            "drug_type_id" : req.body.drug_type_id,
            "dosage_id" : req.body.dosage_id,
            "frequency_id" : req.body.frequency_id,
            "start_date" : req.body.start_date,
            "end_date" : req.body.end_date,
            "active" : 2
          };

          var trialID = req.params.id;
          sequelizeDb.models.trial.find({ where: { id: trialID} })
          .then(function(trial) {
            if (trial) {
              sequelizeDb.models.trial.update(trialdata,{
                where: { id: trialID}
              }).then(function (result) {
                res.json({
                  status: true,
                  data: trialdata,
                  message: 'Data updated successfully..!'
                });
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

exports.getTrialByPateintId = function(req, res, next) {
  
  var userInfo = generalConfig.getUserInfo(req);
  if (!userInfo.companyId) {
      return res.json({
          status: "fail",
          message: 'Unknown user'
      });
  }    
   
  var patientId;
    sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'});
    sequelizeDb.models.phase.hasMany(sequelizeDb.models.milestone,{foreignKey:'phase_id'});
    sequelizeDb.models.phase.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'phase_id'});
    sequelizeDb.models.patient.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'patient_id'});
    sequelizeDb.models.phase_patient.belongsTo(sequelizeDb.models.patient, {foreignKey: 'patient_id'});
    sequelizeDb.models.phase_patient.belongsTo(sequelizeDb.models.phase, {foreignKey: 'phase_id'});
    sequelizeDb.models.device.hasMany(sequelizeDb.models.thing, {foreignKey: 'device_master_id'});
    sequelizeDb.models.patient.hasMany(sequelizeDb.models.thing, {foreignKey: 'patient_id'});

    sequelizeDb.models.user.hasMany(sequelizeDb.models.patient,{foreignKey:'user_id'});
    sequelizeDb.models.patient.belongsTo(sequelizeDb.models.user, {foreignKey: 'user_id'});

    sequelizeDb.models.patient.findAll({
    attributes: ['id','user_id','age','gender'],
      where: {
        user_id: req.body.patient_id
      }
    }).then(function(data){
      
      patientId = data[0].dataValues.id;
      sequelizeDb.models.trial.findAll({
        include: [
          {
            model: sequelizeDb.models.phase,attributes: ['id','trial_id', 'start_date', 'tentitive_end_date'],
                  
                  include: [
                              {model: sequelizeDb.models.phase_patient, attributes: ['id','phase_id','patient_id'],
                                include:[{model: sequelizeDb.models.patient, 
                                            attributes: ['id','user_id','age','gender'],
                                            where : { user_id : req.body.patient_id }
                                          }]
                              }
                            ]
          },
          {
            model: sequelizeDb.models.trial_device,
            attributes:['device_id'],
            include: [{
              model: sequelizeDb.models.device,
              attributes:['id', 'name', 'manufacturer', 'firmware', 'device_group_id', 'device_image']
            }]
          },
          {
            model: sequelizeDb.models.thing,
            attributes:['id', 'device_group_id', 'name', 'serial_number', 'trial_id', 'device_master_id', 'patient_id'],
            where: {
              patient_id: patientId
            },
            required: false
          },
          {
            model: sequelizeDb.models.drug_type,
            attributes:['name']
          },
          {
            model: sequelizeDb.models.dosage,
            attributes:['name', 'qty']
          },
          {
            model: sequelizeDb.models.frequency,
            attributes:['name']
          }
        ]
      }).then(function(trialData) {
  //var commonArray = [];
  var progressStatusPercentage = '92%';
  var progressStatusMessage = 'of the time medicine taken on time you have done a great job. Keep it up';
  
   async.series([
      function (callback) {
          
        for (var i = 0; i < trialData.length; i++) {
          var traiaDevice = trialData[i].dataValues.trial_devices;
          var traiaDeviceLength = traiaDevice.length;
          var trialDeviceArray = [];

          trialData[i].dataValues.progressStatusPercentage = progressStatusPercentage;
          trialData[i].dataValues.progressStatusMessage = progressStatusMessage;

          trialData[i].dataValues.trial_devicesInfo = [];
          for (var j = 0; j < traiaDeviceLength; j++) {
            var obj =  {
                          "id": traiaDevice[j].dataValues.device.id,
                          "name": traiaDevice[j].dataValues.device.name,
                          "manufacturer": traiaDevice[j].dataValues.device.manufacturer,
                          "firmware": traiaDevice[j].dataValues.device.firmware,
                          "device_group_id": traiaDevice[j].dataValues.device.device_group_id
                        }
            
            trialData[i].dataValues.trial_devicesInfo.push(obj);


          }
          //trialData[i].dataValues.trial_devicesInfo.push(trialDeviceArray);
        
          if(i+parseInt(1) == trialData.length)
          {
            
            
            callback();
            

          }
        }
      },
      function (callback) {

        if(trialData){
                res.json({
                  status: true,
                  data: trialData,
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
      }
    ]);

  }).catch(function(err) {
    console.log(err);
      return res.json({
          status: 'fail',
          data: null,
          message: 'Your request has not been completed successfully',
      }); 
  });
});
}

exports.getPatientTrial = function(req, res, next) {

  var userInfo = generalConfig.getUserInfo(req);
  if (!userInfo.companyId) {
      return res.json({
          status: "fail",
          message: 'Unknown user'
      });
  }    
   
  sequelizeDb.models.patient.findOne({
      where: {
          user_id: userInfo.id
      }
  }).then(function(patient) {
      if(patient) {

          sequelizeDb.models.trial.findOne({
              //attributes: ['id', 'name', 'company_id', 'description', 'sponsor_id', 'trial_type', 'dsmb_id'],
              include : [{     
                    //attributes: ['name', 'qty', 'dosage_unit', 'drug_type_id'],
                    model: sequelizeDb.models.dosage,
                    required: true,
                    include : [{
                        attributes: ['name'],
                        model: sequelizeDb.models.drug_type,
                        required: true                
                    }]
                }, {
                    //attributes: ['frequency_time'],
                    model: sequelizeDb.models.trial_dosage_frequency,
                    required: true
                }, {
                    //attributes: ['id','name','serial_number','device_group_id','device_master_id'],
                    model: sequelizeDb.models.thing,
                    include : [{
                        attributes: ['id','name','description'],
                        model: sequelizeDb.models.sensor
                    }, {
                        attributes: ['name'],
                        model: sequelizeDb.models.device
                    }],
                    where: {
                        patient_id: userInfo.id
                    },
                    required: false
                }, {
                    attributes: ['id', 'name', 'manufacturer', 'firmware', 'version', 'device_image_path'],
                    model: sequelizeDb.models.device,
                    as : 'trialDevices',
                    include : [{
                        attributes: ['id', 'name'],
                        model: sequelizeDb.models.device_group,
                        include : [{
                            attributes: ['id', 'name'],
                            model: sequelizeDb.models.template,
                            include : [{
                                attributes: ['id', 'parent_attr_id', 'name', 'description', 'type', 'localId', 'status', 'unit', 'min', 'max'],
                                model: sequelizeDb.models.template_attr
                            }]
                        }]
                    }]           
                }, {
                  //attributes: ['sr_no','description','start_date','tentitive_end_date'],
                  model: sequelizeDb.models.phase,
                  as : 'activePhase',
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
                      attributes: ['id', 'user_id'],
                      model: sequelizeDb.models.patient,
                      as : 'phasePatients',
                      where: {
                          user_id: userInfo.id
                      }
                  }]
              }], where:{
                active:{
                  $eq: 1
                }
              }        
          }).then(function(trial){

              var trialData = {};
              if(trial) {

                  trialData.hasActiveTrial = true;
                  trialData.trial = trial;

                  trialData.trial.activePhase.setDataValue('phasePatients',undefined);

                  var now = new Date();
                  var currentdatetime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
                  sequelizeDb.models.vital_dosage_status.findAll({
                      attributes: [[Sequelize.fn('count', Sequelize.col('trial_id')), 'totaldosage'], [Sequelize.fn('sum', Sequelize.col('status')), 'totaltaken']],
                      where: {
                          trial_id: trial.id,
                          patient_id: patient.id,
                          schedule_on: {
                              $lt: currentdatetime
                          },
                          type: '2'
                      }, 
                      //order: ['schedule_on']
                  }).then(function(dosages) {                                      
                      if(dosages) {

                          var progressStatus = dosages[0];

                          //if(progressStatus.getDataValue('totaldosage') > 0) {
                          if(progressStatus.getDataValue('totaldosage') == 0) {

                              progressStatus.setDataValue('percentage', '0%');
                              progressStatus.setDataValue('message', 'No dosage available.');
                              progressStatus.setDataValue('totaltaken', 0);

                          } else {                            
                              /*if(trialData.trial.active == 2) {
                                return res.json({
                                  'status': false,
                                  'data': null,
                                  'message': 'You are no longer enrolled in a trial. Please contact your trial coordinator for any questions.'
                                });
                              } */
                                var progressStatusPercentage = ( parseInt(progressStatus.getDataValue('totaltaken')) * 100 ) / parseInt(progressStatus.getDataValue('totaldosage'));
                                //var progressStatusPercentage = Math.round(progressStatusPercentage * 100) / 100;
                                var progressStatusPercentage = Math.round(progressStatusPercentage);
                                console.log(progressStatusPercentage);
                                if(progressStatusPercentage > 80) {
                                    var progressStatusMessage = 'of the time, medicine is taken on time. You have done a great job. Keep it Up!!';
                                } else if(80 >= progressStatusPercentage && progressStatusPercentage > 50) {
                                    var progressStatusMessage = 'of the time, medicine is taken on time. Please try to take your medicines on time.';
                                } else if(50 >= progressStatusPercentage) {
                                    var progressStatusMessage = 'of the time, medicine is taken on time. Please take your medicines on time to make this trial successful.';
                                }

                                progressStatus.setDataValue('percentage', progressStatusPercentage+'%');
                                progressStatus.setDataValue('message',progressStatusMessage);
                                
                          }
                          
                          trialData.trial.setDataValue('progressStatus', progressStatus);
                          
                          return res.json({
                            'status': true,
                            'data': trialData,
                            'message': 'Trial data loaded successfully'
                          });

                      } else {

                          return res.json({
                            'status': true,
                            'data': trialData,
                            'message': 'Trial data loaded successfully'
                          });
                      }

                  }).catch(function(err) {
                      console.log(err); 
                      res.json({
                          status: false,
                          data: null,
                          message: 'Failed to load dosages data..!'
                      });
                  });                    
                
              } else {

                  trialData.hasActiveTrial = false;
                  return res.json({
                    'status': true,
                    'data': trialData,
                    'message': 'You are no longer enrolled in a trial. Please contact your trial coordinator for any questions.'
                  }); 
              }

          }).catch(function(err) {
              console.log(err);
              return res.json({
                'status': false,
                'message': 'Failed to load data'
              });
          });
            
      } else {
          res.json({
              status: false,
              data: null,
              message: 'Patient data not found.'
          });
      }
  });

}


exports.getTrialsStatus = function(req, res, next) {
  sequelizeDb.models.trial.findAll({
    where:{
      active:{
        $eq:1
      }
    },
    attributes: ['name'],
    include : [{     
      model: sequelizeDb.models.phase,
      attributes: ['start_date', 'tentitive_end_date'],
      where:{
        start_date: {
          $lte: new Date()
        },
        tentitive_end_date: {
          $gte: new Date()
        }
      }
    }]
  }).then(function(trialData)
    {
      if(trialData) {
        var TrialLength = trialData.length;
        
        var trialListArray= [];
        var trialStatusList = {};
        for(var i= 0; i < TrialLength; i++) {
          var phaseLength = trialData[i].dataValues.phases.length;
          for(var j=0; j<phaseLength; j++) {
            if(moment(Date.now()) >= moment(trialData[i].dataValues.phases[j].start_date)) {
              var daysDiff = moment(Date.now()).diff(moment(trialData[i].dataValues.phases[j].start_date), 'days');
              //var daysDiffDelayed = moment(Date.now()).diff(moment(milestoneData[i].dataValues.tentitive_end_date), 'days');
              trialStatusList = {
                "name": trialData[i].dataValues.name,
                "dayDifference": daysDiff
              }
              trialListArray.push(trialStatusList);
            }
          }
        } 
        res.json({
          status: true,
          data: trialListArray,
          message: 'Success to load data..!'
        });
      }
      else {
        res.json({
          status: false,
          data: [],
          message: 'No data found..!'
        });
      }
    }).catch(function(err) {
        return res.json({
          status: 'fail',
          data: null,
          message: 'Your request has not been completed successfully',
        }); 
    });
};


exports.getTrialsStatusDSMB = function(req, res, next) {
  
  
  var userInfo = generalConfig.getUserInfo(req);
  var dsmbId = userInfo.id;

  if (!userInfo.companyId) {
      return res.json({
          status: "fail",
          message: 'Unknown user'
      });
  }

  sequelizeDb.models.trial.findAll({
    attributes: ['name', 'start_date'],
    where:{
      dsmb_id: dsmbId,
      active:{
        $eq:1
      }
    },
    attributes: ['name'],
    include : [{     
      model: sequelizeDb.models.phase,
      attributes: ['start_date', 'tentitive_end_date'],
      where:{
        start_date: {
          $lte: new Date()
        },
        tentitive_end_date: {
          $gte: new Date()
        }
      }
    }]
  }).then(function(trialData)
    {
      if(trialData) {
        var TrialLength = trialData.length;
        var trialListArray= [];
        var trialStatusList = {};
        for(var i= 0; i < TrialLength; i++) {
          var phaseLength = trialData[i].dataValues.phases.length;
          for(var j=0; j<phaseLength; j++) {
            if(moment(Date.now()) >= moment(trialData[i].dataValues.phases[j].start_date)) {
              var daysDiff = moment(Date.now()).diff(moment(trialData[i].dataValues.phases[j].start_date), 'days');
              //var daysDiffDelayed = moment(Date.now()).diff(moment(milestoneData[i].dataValues.tentitive_end_date), 'days');
              trialStatusList = {
                "name": trialData[i].dataValues.name,
                "dayDifference": daysDiff
              }
              trialListArray.push(trialStatusList);
            }
          }
        }
        res.json({
          status: true,
          data: trialListArray,
          message: 'Success to load data..!'
        });
      }
      else {
        res.json({
          status: false,
          data: [],
          message: 'No data found..!'
        });
      }
    }).catch(function(err) {
        return res.json({
          status: 'fail',
          data: null,
          message: 'Your request has not been completed successfully',
        }); 
    });
};

exports.getTrialsStatusCoordinator = function(req, res, next) {
  
  
  var userInfo = generalConfig.getUserInfo(req);
  var croCoordinatorId = userInfo.id;


  if (!userInfo.companyId) {
      return res.json({
          status: "fail",
          message: 'Unknown user'
      });
  }

  sequelizeDb.models.trial.findAll({
    where:{
      croCoordinator_id: croCoordinatorId,
      active:{
        $eq:1
      }
    },
    attributes: ['name'],
    include : [{     
      model: sequelizeDb.models.phase,
      attributes: ['start_date', 'tentitive_end_date'],
      where:{
        start_date: {
          $lte: new Date()
        },
        tentitive_end_date: {
          $gte: new Date()
        }
      }
    }]    
  }).then(function(trialData)
    {
      if(trialData) {
        var TrialLength = trialData.length;
        
        var trialListArray= [];
        var trialStatusList = {};
        for(var i= 0; i < TrialLength; i++) {
          var phaseLength = trialData[i].dataValues.phases.length;
          for(var j=0; j<phaseLength; j++) {
            if(moment(Date.now()) >= moment(trialData[i].dataValues.phases[j].start_date)) {
              var daysDiff = moment(Date.now()).diff(moment(trialData[i].dataValues.phases[j].start_date), 'days');
              //var daysDiffDelayed = moment(Date.now()).diff(moment(milestoneData[i].dataValues.tentitive_end_date), 'days');
              trialStatusList = {
                "name": trialData[i].dataValues.name,
                "dayDifference": daysDiff
              }
              trialListArray.push(trialStatusList);
            }
          }
        } 
        res.json({
          status: true,
          data: trialListArray,
          message: 'Success to load data..!'
        });
      }
      else {
        res.json({
          status: false,
          data: [],
          message: 'No data found..!'
        });
      }
    }).catch(function(err) {
        return res.json({
          status: 'fail',
          data: null,
          message: 'Your request has not been completed successfully',
        }); 
    });
};



exports.getTrialpieChartStatus = function(req, res, next) {
  
  
  var userInfo = generalConfig.getUserInfo(req);
  var dsmbId = userInfo.id;


  if (!userInfo.companyId) {
      return res.json({
          status: "fail",
          message: 'Unknown user'
      });
  }

  var todaydate = new Date();
   
  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  sequelizeDb.models.trial.findAndCountAll({
    where:{
      active:{
        $eq:1
      }
    },
    include: [
      {
        model: sequelizeDb.models.phase, 
        attributes: ['id','tentitive_end_date','sr_no', 'participant_count'],
        where: {
          start_date: {
            $lte: new Date()
          },
          tentitive_end_date: {
            $gte: new Date()
          }
        },  
        include: [
          {model: sequelizeDb.models.milestone},                            
        ],
        required: true
      }
    ]
  }).then(function(trialData)
    {
      var AllCount = trialData.count;
      var onTimeCount = 0; 
      var onDelayedCount = 0;
      var participantCount;
      var participantCountResult=0;
        if(trialData)
        {
          
          var trialListArray = [];
          var trialStatus = [];
          var trialListArrayFinal = [];
          var tempStartDate;
          var tempEndDate;    
          var trialEndDate;
          var trialStartDate;
          var trialProgressStatus;

          var trialStatusList = {};


          if(trialData.rows[0])
           {
              async.forEach(Object.keys(trialData.rows), function (item, callback1)
                       {    
                          
                             if(trialData.rows[item].dataValues.active == 2) 
                             {
                        
                             }
                             else
                             {
                                if(trialData.rows[item].dataValues.phases) {
                                  var phasecount = trialData.rows[item].dataValues.phases.length;
                                            
                                          for(var i=phasecount-1; i>=0; i--){
                                            tempStartDate = trialData.rows[item].dataValues.phases[i].start_date;

                                            participantCount = trialData.rows[item].dataValues.phases[i].participant_count;
                                            
                                            participantCountResult = participantCountResult + participantCount; 
                                            
                                          }
                                }   
                                var daysDiff = moment(trialData.rows[item].dataValues.end_date).diff(moment(Date.now()), 'days');
                                 
                                if(daysDiff < 0)  
                                {
                                    onDelayedCount += 1;
                                } 
                                else
                                {
                                    onTimeCount += 1;
                                }
                             } 
                             
                        }, function(err) {
                                        
                                         }); 

               trialStatusList = {
                "onTimeCount" : onTimeCount,
                "onDelayedCount" : onDelayedCount,
                "participantCountResult": participantCountResult
              }   
          }

         
          res.json({
            data: trialStatusList,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
};

exports.getTrialpieChartStatusDSMB = function(req, res, next) {
  
  
  var userInfo = generalConfig.getUserInfo(req);
  var dsmbId = userInfo.id;
  

  if (!userInfo.companyId) {
      return res.json({
          status: "fail",
          message: 'Unknown user'
      });
  }

  var todaydate = new Date();
   
  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  sequelizeDb.models.trial.findAndCountAll({
    where:{
      dsmb_id:dsmbId,
      active:{
        $eq:1
      }
    },
    include: [
      {
        model: sequelizeDb.models.phase, attributes: ['id','tentitive_end_date','sr_no', 'participant_count'], 
        where: {
          start_date: {
            $lte: new Date()
          },
          tentitive_end_date: {
            $gte: new Date()
          }
        },
        required: true
      }
    ]
  }).then(function(trialData)
    {
      var AllCount = trialData.count;
      var onTimeCount = 0; 
      var onDelayedCount = 0;

        if(trialData)
        {
          
          var trialListArray = [];
          var trialStatus = [];
          var trialListArrayFinal = [];
          var tempStartDate;
          var tempEndDate;    
          var trialEndDate;
          var trialStartDate;
          var trialProgressStatus;
          var participantCount;
          var participantCountResult=0;

          var trialStatusList = {};


          if(trialData.rows[0])
           {
              async.forEach(Object.keys(trialData.rows), function (item, callback1)
                       {    
                          
                             if(trialData.rows[item].dataValues.active == 2) 
                             {
                                 //onTimeCount += 1;
                             }
                             else
                             {
                                if(trialData.rows[item].dataValues.phases) {
                                  var phasecount = trialData.rows[item].dataValues.phases.length;
                                            
                                          for(var i=phasecount-1; i>=0; i--){
                                            tempStartDate = trialData.rows[item].dataValues.phases[i].start_date;

                                            participantCount = trialData.rows[item].dataValues.phases[i].participant_count;
                                            
                                            participantCountResult = participantCountResult + participantCount; 
                                            
                                          }
                                }

                                     

                                var daysDiff = moment(trialData.rows[item].dataValues.end_date).diff(moment(Date.now()), 'days');

                                
                                if(daysDiff < 0)  
                                {
                                    
                                    onDelayedCount += 1;
                                } 
                                else
                                {
                                    
                                    onTimeCount += 1;
                                }
                             } 
                             
                        }, function(err) {
                                        
                                         }); 

               trialStatusList = {
                "onTimeCount" : onTimeCount,
                "onDelayedCount" : onDelayedCount,
                "participantCountResult": participantCountResult
              }   
          }
         
          res.json({
            data: trialStatusList,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
};

exports.getTrialpieChartStatusCoordinator = function(req, res, next) {
  
  
  var userInfo = generalConfig.getUserInfo(req);
  var croCoordinatorId = userInfo.id;

  if (!userInfo.companyId) {
      return res.json({
          status: "fail",
          message: 'Unknown user'
      });
  }

  var todaydate = new Date();
   
  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  sequelizeDb.models.trial.findAndCountAll({
    where:{
      croCoordinator_id:croCoordinatorId,
      active:{
        $eq:1
      }
    },
    include: [
      {
        model: sequelizeDb.models.phase, attributes: ['id','tentitive_end_date','sr_no', 'participant_count'], 
        where: {
          start_date: {
            $lte: new Date()
          },
          tentitive_end_date: {
            $gte: new Date()
          }
        },
        required: true
      }
    ]
  }).then(function(trialData)
    {
      var AllCount = trialData.count;
      var onTimeCount = 0; 
      var onDelayedCount = 0;

        if(trialData)
        {
          
          var trialListArray = [];
          var trialStatus = [];
          var trialListArrayFinal = [];
          var tempStartDate;
          var tempEndDate;    
          var trialEndDate;
          var trialStartDate;
          var trialProgressStatus;
          var participantCount;
          var participantCountResult=0;

          var trialStatusList = {};


          if(trialData.rows[0])
           {
              async.forEach(Object.keys(trialData.rows), function (item, callback1)
                       {    
                          
                             if(trialData.rows[item].dataValues.active == 2) 
                             {
                                 //onTimeCount += 1;
                             }
                             else
                             {
                                if(trialData.rows[item].dataValues.phases) {
                                  var phasecount = trialData.rows[item].dataValues.phases.length;
                                            
                                          for(var i=phasecount-1; i>=0; i--){
                                            tempStartDate = trialData.rows[item].dataValues.phases[i].start_date;

                                            participantCount = trialData.rows[item].dataValues.phases[i].participant_count;
                                            
                                            participantCountResult = participantCountResult + participantCount; 
                                            
                                          }
                                }

                                     

                                var daysDiff = moment(trialData.rows[item].dataValues.end_date).diff(moment(Date.now()), 'days');

                                
                                if(daysDiff < 0)  
                                {
                                    
                                    onDelayedCount += 1;
                                } 
                                else
                                {
                                    
                                    onTimeCount += 1;
                                }
                             } 
                             
                        }, function(err) {
                                        
                                         }); 

               trialStatusList = {
                "onTimeCount" : onTimeCount,
                "onDelayedCount" : onDelayedCount,
                "participantCountResult": participantCountResult
              }   
          }
         
          res.json({
            data: trialStatusList,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
};



exports.getTrialsByDSMBId = function(req, res, next) {
    
    var userInfo = generalConfig.getUserInfo(req);
    var dsmbId = userInfo.id;
    
    var pageNumber = req.body.search.params.pageNumber;
    var pageSize = req.body.search.params.pageSize;

    var todaydate = new Date();
    var searchTrialParameters = new Array();

    if(req.body.sponsorId != undefined && req.body.sponsorId != 'undefined' && req.body.sponsorId != "") {
      searchTrialParameters.push({
        sponsor_id: req.body.sponsorId,
        dsmb_id:dsmbId
      });
    }
    if(req.body.trialId != undefined && req.body.trialId != 'undefined' && req.body.trialId != "") {
      searchTrialParameters.push({
        id: req.body.trialId,
        dsmb_id:dsmbId
      });
    }
   if(req.body.statusId != undefined  && req.body.statusId != 'undefined'  && req.body.statusId != "") {

      if(req.body.statusId == 1) //On Time
      {
         searchTrialParameters.push({$and : {active: req.body.statusId, 
                                          end_date: { $gte : todaydate },
                                          dsmb_id:dsmbId 
                      }});
         
      }
      else if(req.body.statusId == 2) // Compeleted
      {
         searchTrialParameters.push({active: req.body.statusId, dsmb_id:dsmbId});
      }
     else if(req.body.statusId == 3) //Delayed
      {
         searchTrialParameters.push({$and : {active: 1, 
                                          end_date: { $lt : todaydate },
                                          dsmb_id:dsmbId 
                      }});
         
      }
    } else {

      searchTrialParameters.push({dsmb_id : dsmbId}); 
    }



    sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'});
    sequelizeDb.models.phase.hasMany(sequelizeDb.models.milestone,{foreignKey:'phase_id'});
    sequelizeDb.models.phase.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'phase_id'});
    sequelizeDb.models.patient.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'patient_id'});
    sequelizeDb.models.phase_patient.belongsTo(sequelizeDb.models.patient, {foreignKey: 'patient_id'});

    sequelizeDb.models.user.hasMany(sequelizeDb.models.patient,{foreignKey:'user_id'});
    sequelizeDb.models.patient.belongsTo(sequelizeDb.models.user, {foreignKey: 'user_id'});

    sequelizeDb.models.trial.hasMany(sequelizeDb.models.trial_device,{foreignKey:'trial_id'});
    sequelizeDb.models.trial_device.belongsTo(sequelizeDb.models.trial, {foreignKey: 'trial_id'});
    sequelizeDb.models.device.hasMany(sequelizeDb.models.trial_device,{foreignKey:'device_id'});
    sequelizeDb.models.trial_device.belongsTo(sequelizeDb.models.device, {foreignKey: 'device_id'});    

    sequelizeDb.models.trial.findAndCountAll({
      where:searchTrialParameters,
      include: [
        {model: sequelizeDb.models.phase, attributes: ['id','tentitive_end_date','sr_no'],
         where : {$and: {sr_no: { $gte:  req.body.phaseId }, 
                                          tentitive_end_date: { $ne: null }
                      }}, 
         required: true, 
         order: [
                  ['sr_no', 'ASC']
                ]
         }
      ],
    offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
    limit: pageSize
}).then(function(trialData)
    {
      
      //console.log(trialData);
        if(trialData)
        {
          //res.json(trials);

          var trialListArray = [];
              
           if(trialData.rows[0])
           {
              async.forEach(Object.keys(trialData.rows), function (item, callback1)
                       {    
                          var trialList = {};
                          var status = 0;
                          
                             
                             if(trialData.rows[item].dataValues.active == 2) 
                             {
                                  status = 100;
                                  trialList = 
                                                  {
                                                    "id" : trialData.rows[item].dataValues.id,
                                                    "company_id" : trialData.rows[item].dataValues.company_id,
                                                    "sponsor_id" : trialData.rows[item].dataValues.sponsor_id,
                                                    "name" : trialData.rows[item].dataValues.name,
                                                    "description" : trialData.rows[item].dataValues.description,
                                                    "trial_type" : trialData.rows[item].dataValues.trial_type,
                                                    "dsmb_id" : trialData.rows[item].dataValues.dsmb_id,
                                                    "drug_name" : trialData.rows[item].dataValues.drug_name,
                                                    "drug_description" : trialData.rows[item].dataValues.drug_description,
                                                    "drug_type_id" : trialData.rows[item].dataValues.drug_type_id,
                                                    "dosage_id" : trialData.rows[item].dataValues.dosage_id,
                                                    "frequency_id" : trialData.rows[item].dataValues.frequency_id,
                                                    "start_date" : trialData.rows[item].dataValues.start_date,
                                                    "end_date" : trialData.rows[item].dataValues.end_date,
                                                    "active" : trialData.rows[item].dataValues.active,
                                                    "status" : status,
                                                    "count" : trialData.count,
                                                    "rows": trialData.rows
                                                  }
                                            
                                            trialListArray.push(trialList);
                             }
                             else
                             {
                                      if(trialData.rows[item].dataValues.phases)
                                      {
                                          async.forEach(Object.keys(trialData.rows[item].dataValues.phases), function (item1, callback2)
                                                {

                                                          if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 4 &&
                                                             (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                             trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                             trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null)
                                                             )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            if (now > enddate) {
                                                               status = 100;
                                                            } 
                                                          } 
                                                          else if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 3 && 
                                                                  (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                                   trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                                    trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null)
                                                                 )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            if (now > enddate) {
                                                               status = 75;
                                                            } 
                                                          } 
                                                          else if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 2  &&
                                                                    (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                                     trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                                      trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null
                                                                    )
                                                                 )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            if (now > enddate) {
                                                               status = 50;
                                                            } 
                                                          } 
                                                          else if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 1 && 
                                                                    (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                                     trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                                     trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null
                                                                    )
                                                                 )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            

                                                            if (now > enddate) {
                                                               status = 25;
                                                            } 
                                                          } 

                                                     
                                                }, function(err) {
                                                      
                                                       }); 
                                        

                                         trialList = 
                                                  {
                                                    "id" : trialData.rows[item].dataValues.id,
                                                    "company_id" : trialData.rows[item].dataValues.company_id,
                                                    "sponsor_id" : trialData.rows[item].dataValues.sponsor_id,
                                                    "name" : trialData.rows[item].dataValues.name,
                                                    "description" : trialData.rows[item].dataValues.description,
                                                    "trial_type" : trialData.rows[item].dataValues.trial_type,
                                                    "dsmb_id" : trialData.rows[item].dataValues.dsmb_id,
                                                    "drug_name" : trialData.rows[item].dataValues.drug_name,
                                                    "drug_description" : trialData.rows[item].dataValues.drug_description,
                                                    "drug_type_id" : trialData.rows[item].dataValues.drug_type_id,
                                                    "dosage_id" : trialData.rows[item].dataValues.dosage_id,
                                                    "frequency_id" : trialData.rows[item].dataValues.frequency_id,
                                                    "start_date" : trialData.rows[item].dataValues.start_date,
                                                    "end_date" : trialData.rows[item].dataValues.end_date,
                                                    "active" : trialData.rows[item].dataValues.active,
                                                    "status" : status,
                                                    "count" : trialData.count,
                                                    "rows": trialData.rows
                                                  }
                                            
                                            trialListArray.push(trialList);

                                      }
                            }

                              
                        }, function(err) {
                                        
                                         }); 
          }
          
          res.json({
            status: true,
            data: trialListArray,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
};
        
      
exports.getTrialsByCROId = function(req, res, next) {
  

    var userInfo = generalConfig.getUserInfo(req);
    var croCoordinatorId = userInfo.id;
    
    var pageNumber = req.body.search.params.pageNumber;
    var pageSize = req.body.search.params.pageSize;

    var todaydate = new Date();
    var searchTrialParameters = new Array();


    if(req.body.sponsorId != undefined && req.body.sponsorId != 'undefined' && req.body.sponsorId != "") {
      searchTrialParameters.push({
        sponsor_id: req.body.sponsorId,
        croCoordinator_id: croCoordinatorId
      });
    }
    if(req.body.trialId != undefined && req.body.trialId != 'undefined' && req.body.trialId != "") {
      searchTrialParameters.push({
        id: req.body.trialId,
        croCoordinator_id: croCoordinatorId
      });
    }
   if(req.body.statusId != undefined  && req.body.statusId != 'undefined'  && req.body.statusId != "") {

      if(req.body.statusId == 1) //On Time
      {
         searchTrialParameters.push({$and : {active: req.body.statusId, 
                                          end_date: { $gte : todaydate },
                                          croCoordinator_id: croCoordinatorId 
                      }});
         
      }
      else if(req.body.statusId == 2) // Compeleted
      {
         searchTrialParameters.push({active: req.body.statusId, croCoordinator_id: croCoordinatorId });
      }
     else if(req.body.statusId == 3) //Delayed
      {
         searchTrialParameters.push({$and : {active: 1, 
                                          end_date: { $lt : todaydate },
                                          croCoordinator_id: croCoordinatorId 
                      }});
         
      }
    } else {
      searchTrialParameters.push({croCoordinator_id: croCoordinatorId}); 
    }
    
    sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'});
    sequelizeDb.models.phase.hasMany(sequelizeDb.models.milestone,{foreignKey:'phase_id'});
    sequelizeDb.models.phase.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'phase_id'});
    sequelizeDb.models.patient.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'patient_id'});
    sequelizeDb.models.phase_patient.belongsTo(sequelizeDb.models.patient, {foreignKey: 'patient_id'});

    sequelizeDb.models.user.hasMany(sequelizeDb.models.patient,{foreignKey:'user_id'});
    sequelizeDb.models.patient.belongsTo(sequelizeDb.models.user, {foreignKey: 'user_id'});

    sequelizeDb.models.trial.hasMany(sequelizeDb.models.trial_device,{foreignKey:'trial_id'});
    sequelizeDb.models.trial_device.belongsTo(sequelizeDb.models.trial, {foreignKey: 'trial_id'});
    sequelizeDb.models.device.hasMany(sequelizeDb.models.trial_device,{foreignKey:'device_id'});
    sequelizeDb.models.trial_device.belongsTo(sequelizeDb.models.device, {foreignKey: 'device_id'});    

    sequelizeDb.models.trial.findAndCountAll({
      where: searchTrialParameters,
      include: [
        {model: sequelizeDb.models.phase, attributes: ['id','tentitive_end_date','sr_no'],
         where : {$and: {sr_no: { $gte:  req.body.phaseId }, 
                                          tentitive_end_date: { $ne: null }
                      }}, 
         required: true, 
         order: [
                  ['sr_no', 'ASC']
                ]
         }
      ],
    offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
    limit: pageSize
}).then(function(trialData)
    {
    
      
        if(trialData)
        {
          //res.json(trials);

          var trialListArray = [];
              
           if(trialData.rows[0])
           {
              async.forEach(Object.keys(trialData.rows), function (item, callback1)
                       {    
                          var trialList = {};
                          var status = 0;
                          
                             
                             if(trialData.rows[item].dataValues.active == 2) 
                             {
                                  status = 100;
                                  trialList = 
                                                  {
                                                    "id" : trialData.rows[item].dataValues.id,
                                                    "company_id" : trialData.rows[item].dataValues.company_id,
                                                    "sponsor_id" : trialData.rows[item].dataValues.sponsor_id,
                                                    "name" : trialData.rows[item].dataValues.name,
                                                    "description" : trialData.rows[item].dataValues.description,
                                                    "trial_type" : trialData.rows[item].dataValues.trial_type,
                                                    "dsmb_id" : trialData.rows[item].dataValues.dsmb_id,
                                                    "drug_name" : trialData.rows[item].dataValues.drug_name,
                                                    "drug_description" : trialData.rows[item].dataValues.drug_description,
                                                    "drug_type_id" : trialData.rows[item].dataValues.drug_type_id,
                                                    "dosage_id" : trialData.rows[item].dataValues.dosage_id,
                                                    "frequency_id" : trialData.rows[item].dataValues.frequency_id,
                                                    "start_date" : trialData.rows[item].dataValues.start_date,
                                                    "end_date" : trialData.rows[item].dataValues.end_date,
                                                    "active" : trialData.rows[item].dataValues.active,
                                                    "status" : status,
                                                    "count" : trialData.count,
                                                    "rows": trialData.rows
                                                  }
                                            
                                            trialListArray.push(trialList);
                             }
                             else
                             {
                                      if(trialData.rows[item].dataValues.phases)
                                      {
                                          async.forEach(Object.keys(trialData.rows[item].dataValues.phases), function (item1, callback2)
                                                {

                                                          if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 4 &&
                                                             (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                             trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                             trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null)
                                                             )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            if (now > enddate) {
                                                               status = 100;
                                                            } 
                                                          } 
                                                          else if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 3 && 
                                                                  (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                                   trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                                    trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null)
                                                                 )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            if (now > enddate) {
                                                               status = 75;
                                                            } 
                                                          } 
                                                          else if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 2  &&
                                                                    (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                                     trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                                      trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null
                                                                    )
                                                                 )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            if (now > enddate) {
                                                               status = 50;
                                                            } 
                                                          } 
                                                          else if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 1 && 
                                                                    (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                                     trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                                     trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null
                                                                    )
                                                                 )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            

                                                            if (now > enddate) {
                                                               status = 25;
                                                            } 
                                                          } 

                                                     
                                                }, function(err) {
                                                      
                                                       }); 
                                        

                                         trialList = 
                                                  {
                                                    "id" : trialData.rows[item].dataValues.id,
                                                    "company_id" : trialData.rows[item].dataValues.company_id,
                                                    "sponsor_id" : trialData.rows[item].dataValues.sponsor_id,
                                                    "name" : trialData.rows[item].dataValues.name,
                                                    "description" : trialData.rows[item].dataValues.description,
                                                    "trial_type" : trialData.rows[item].dataValues.trial_type,
                                                    "dsmb_id" : trialData.rows[item].dataValues.dsmb_id,
                                                    "drug_name" : trialData.rows[item].dataValues.drug_name,
                                                    "drug_description" : trialData.rows[item].dataValues.drug_description,
                                                    "drug_type_id" : trialData.rows[item].dataValues.drug_type_id,
                                                    "dosage_id" : trialData.rows[item].dataValues.dosage_id,
                                                    "frequency_id" : trialData.rows[item].dataValues.frequency_id,
                                                    "start_date" : trialData.rows[item].dataValues.start_date,
                                                    "end_date" : trialData.rows[item].dataValues.end_date,
                                                    "active" : trialData.rows[item].dataValues.active,
                                                    "status" : status,
                                                    "count" : trialData.count,
                                                    "rows": trialData.rows
                                                  }
                                            
                                            trialListArray.push(trialList);

                                      }
                            }

                              
                        }, function(err) {
                                        
                                         }); 
          }
          
          res.json({
            status: true,
            data: trialListArray,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
};
                     
exports.getTrialMetrics = function(req, res, next) {
  
  
  var userInfo = generalConfig.getUserInfo(req);
  var dsmbId = userInfo.id;

  if (!userInfo.companyId) {
      return res.json({
          status: "fail",
          message: 'Unknown user'
      });
  }

  var todaydate = new Date();
   
  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  sequelizeDb.models.trial.findAndCountAll({
    where:{
      active:{
        $eq:1
      }
    },
    include: [
      {
        model: sequelizeDb.models.phase, 
        attributes: ['id','tentitive_end_date','sr_no', 'participant_count'],
        where: {
          start_date: {
            $lte: new Date()
          },
          tentitive_end_date: {
            $gte: new Date()
          }
        },
        required: true
      }
    ]
  }).then(function(trialData)
    {
      
      var AllCount = trialData.count;
      var onTimeCount = 0; 
      var onDelayedCount = 0;
      var participantCount;

      var participantCountResult=0;
        if(trialData)
        {
          
          var trialListArray = [];
          var trialStatus = [];
          var trialListArrayFinal = [];
          var tempStartDate;
          var tempEndDate;    
          var trialEndDate;
          var trialStartDate;
          var trialProgressStatus;
          var activeTrialCount;


          var trialStatusList = {};


          if(trialData.rows[0])
           {
              async.forEach(Object.keys(trialData.rows), function (item, callback1){    
                if(trialData.rows[item].dataValues.phases) {
                  var phasecount = trialData.rows[item].dataValues.phases.length;
                            
                  for(var i=phasecount-1; i>=0; i--){
                    tempStartDate = trialData.rows[item].dataValues.phases[i].start_date;

                    participantCount = trialData.rows[item].dataValues.phases[i].participant_count;
                    
                    participantCountResult = participantCountResult + participantCount; 
                    activeTrialCount = trialData.count;
                  }
                }          
              }, 
              function(err) {
                console.log(err)                  
              }); 

               trialStatusList = {
                "participantCountResult": participantCountResult,
                "activeTrialCount": activeTrialCount

              }   
          }

         
          res.json({
            data: trialStatusList,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
};

exports.getTrialDSMBMetrics = function(req, res, next) {
  
  
  var userInfo = generalConfig.getUserInfo(req);
  var dsmbId = userInfo.id;

  if (!userInfo.companyId) {
      return res.json({
          status: "fail",
          message: 'Unknown user'
      });
  }

  var todaydate = new Date();
   
  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  sequelizeDb.models.trial.findAndCountAll({
    where:{
      dsmb_id: dsmbId,
      active:{
        $eq:1
      }
    },
    include: [
      {
        model: sequelizeDb.models.phase, attributes: ['id','tentitive_end_date','sr_no', 'participant_count'], 
        where: {
          start_date: {
            $lte: new Date()
          },
          tentitive_end_date: {
            $gte: new Date()
          }
        },
        required: true
      }
    ]
  }).then(function(trialData)
    {
      if(trialData.count == 0){
        var participantCountResult=0;
        var activeTrialCount= 0;
        var trialStatusList = {};

        trialStatusList = {
          "participantCountResult": participantCountResult,
          "activeTrialCount": activeTrialCount
        }   

        res.json({
          data: trialStatusList,
          message: 'Success to load data..!'
        });
      } else {
          var participantCount;

          var participantCountResult=0;
          if(trialData)
          {
            
            var trialListArray = [];
            var trialStatus = [];
            var trialListArrayFinal = [];
            var tempStartDate;
            var tempEndDate;    
            var trialEndDate;
            var trialStartDate;
            var trialProgressStatus;
            var activeTrialCount;


            var trialStatusList = {};


            if(trialData.rows[0])
             {
                async.forEach(Object.keys(trialData.rows), function (item, callback1)
                         {    
                            
                               if(trialData.rows[item].dataValues.active == 2) 
                               {
                                   //onTimeCount += 1;
                               }
                               else
                               {
                                  if(trialData.rows[item].dataValues.phases) {
                                    var phasecount = trialData.rows[item].dataValues.phases.length;
                                              
                                            for(var i=phasecount-1; i>=0; i--){
                                              tempStartDate = trialData.rows[item].dataValues.phases[i].start_date;

                                              participantCount = trialData.rows[item].dataValues.phases[i].participant_count;
                                              
                                              participantCountResult = participantCountResult + participantCount; 
                                              activeTrialCount = trialData.count;
                                            }
                                  }   
                                  var daysDiff = moment(trialData.rows[item].dataValues.end_date).diff(moment(Date.now()), 'days');
                               } 
                               
                          }, function(err) {
                                          
                                           }); 
                 trialStatusList = {
                  "participantCountResult": participantCountResult,
                  "activeTrialCount": activeTrialCount

                }   
            }

           
            res.json({
              data: trialStatusList,
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
        }
    }).catch(function(err) {
      console.log(err);
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
};


exports.getTrialCROMetrics = function(req, res, next) {
  
  
  var userInfo = generalConfig.getUserInfo(req);
  var croCoordinatorId = userInfo.id;

  if (!userInfo.companyId) {
      return res.json({
          status: "fail",
          message: 'Unknown user'
      });
  }

  var todaydate = new Date();
   
  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  sequelizeDb.models.trial.findAndCountAll({
    where:{
      croCoordinator_id: croCoordinatorId,
      active:{
        $eq:1
      }
    },
    include: [
      {
        model: sequelizeDb.models.phase, attributes: ['id','tentitive_end_date','sr_no', 'participant_count'], 
        where: {
          start_date: {
            $lte: new Date()
          },
          tentitive_end_date: {
            $gte: new Date()
          }
        },
        required: true
      }
    ]
  }).then(function(trialData)
    {
      
      if(trialData.count == 0){
        var participantCountResult=0;
        var activeTrialCount= 0;
        var trialStatusList = {};

        trialStatusList = {
          "participantCountResult": participantCountResult,
          "activeTrialCount": activeTrialCount
        }   

        res.json({
          data: trialStatusList,
          message: 'Success to load data..!'
        });
      }
      else{
        var participantCount;

        var participantCountResult=0;
          if(trialData)
          {
            
            var trialListArray = [];
            var trialStatus = [];
            var trialListArrayFinal = [];
            var tempStartDate;
            var tempEndDate;    
            var trialEndDate;
            var trialStartDate;
            var trialProgressStatus;
            var activeTrialCount;


            var trialStatusList = {};


            if(trialData.rows[0])
             {
              async.forEach(Object.keys(trialData.rows), function (item, callback1)
                       {    
                          
                             if(trialData.rows[item].dataValues.active == 2) 
                             {
                                 //onTimeCount += 1;
                             }
                             else
                             {
                                if(trialData.rows[item].dataValues.phases) {
                                  var phasecount = trialData.rows[item].dataValues.phases.length;
                                            
                                          for(var i=phasecount-1; i>=0; i--){
                                            
                                            participantCount = trialData.rows[item].dataValues.phases[i].participant_count;
                                            
                                            participantCountResult = participantCountResult + participantCount; 
                                            activeTrialCount = trialData.count;
                                          }
                                }   
                             } 
                             
                        }, function(err) {
                                        
                                         }); 
               trialStatusList = {
                "participantCountResult": participantCountResult,
                "activeTrialCount": activeTrialCount

              }   
          }

         
          res.json({
            data: trialStatusList,
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
      }
    }).catch(function(err) {
      console.log(err);
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
};


exports.getTrialsDetailsMetrics = function(req, res, next) {
  var trialID = req.params.id;

  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  
  sequelizeDb.models.trial.findOne({
    attributes: ['id','name','start_date', 'end_date'],
    where: {
      id: trialID
    }/*,
    include: [
      {
        model: sequelizeDb.models.phase, 
        attributes: ['id','tentitive_end_date','sr_no', 'participant_count', 'start_date'], 
        include: [
          {
            model: sequelizeDb.models.phase_patient, 
            attributes: ['patient_id']
          },
        ],
        required: true
      }
    ]*/
  }).then(function(trialData)
    {
      sequelizeDb.models.phase.findOne({
        as : 'activePhase',
        attributes: ['id','tentitive_end_date','sr_no', 'participant_count', 'start_date'],
        where: {
            start_date: {
                $lte: new Date()
            },
            tentitive_end_date: {
                $gte: new Date()
            },
            trial_id: trialData.dataValues.id,
            active: true
        }
      }).then(function(phaseData) {
        
        if(phaseData == null) {
          trialStatusList = {
            "trialName": trialData.dataValues.name,
            "trialStartDate": trialData.dataValues.start_date,
            "trialEndDate": trialData.dataValues.end_date,
            "participantCountResult": 0,
            "activeTrialCount": 1,
            "activeTrialPhase": "No Active Phase"
          }
          
          trialStatusList.trialStartDate = new Date(trialStatusList.trialStartDate).toDateString().substring(3);
          trialStatusList.trialEndDate = new Date(trialStatusList.trialEndDate).toDateString().substring(3);
          
          console.log(trialStatusList);
          res.json({
            data: trialStatusList,
            message: 'Success to load data..!'
          });
        } else {
          var trialStatusList = {};
          var ExpectedDays;
          var TotalDays;
          var TotalDelay;
          var ExpectedResultDays;
          var ExpectedDelayedDays;
          
          var phaseStartDate = moment(phaseData.dataValues.start_date).format("DD/MM/YYYY");
          
          var phaseEndDate = moment(phaseData.dataValues.tentitive_end_date).format("DD/MM/YYYY");
          
          var participantCountResult = phaseData.dataValues.participant_count;
          if(participantCountResult == null) {
            participantCountResult = 0;
          }
          var activeTrialPhase = phaseData.dataValues.sr_no;

          ExpectedDays = moment(phaseData.dataValues.tentitive_end_date).diff(moment(phaseData.dataValues.start_date), 'days');
          if(moment(phaseData.dataValues.tentitive_end_date) < moment(Date.now())) {
            console.log("Hiiiii");
            TotalDays = moment(Date.now()).diff(moment(phaseData.dataValues.start_date), 'days');
            TotalDelay = moment(Date.now()).diff(moment(phaseData.dataValues.tentitive_end_date), 'days');
            ExpectedResultDays = (ExpectedDays * 100)/TotalDays;
            ExpectedDelayedDays = (TotalDelay * 100)/TotalDays;
          } else if(moment(phaseData.dataValues.tentitive_end_date) > moment(Date.now())) {
            console.log("Heyyyy");
            TotalDays = moment(Date.now()).diff(moment(phaseData.dataValues.start_date), 'days');
            TotalDelay = moment(Date.now()).diff(moment(phaseData.dataValues.tentitive_end_date), 'days');
            ExpectedResultDays = (TotalDays * 100)/ExpectedDays;
            ExpectedDelayedDays = 0;
          }

          trialStatusList = {
            "trialName": trialData.dataValues.name,
            "phaseId": phaseData.dataValues.id,
            "trialStartDate": trialData.dataValues.start_date,
            "trialEndDate": trialData.dataValues.end_date,
            "participantCountResult": participantCountResult,
            "activeTrialCount": 1,
            "activeTrialPhase": activeTrialPhase,
            "ExpectedResultDays" : ExpectedResultDays,
            "ExpectedDelayedDays": ExpectedDelayedDays,
            "TotalDelay": TotalDelay
          }

          res.json({
            data: trialStatusList,
            message: 'Success to load data..!'
          });
        }
        

        
      }).catch(function(err) {
      console.log(err);
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });

    }).catch(function(err) {
      console.log(err);
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
  }
        
      /*var participantCount;
      var participantCountResult=0;
        if(trialData)
        {
          var activeTrialCount;
          var trialStartDate;
          var patientId ='';
          var trialEndDate;
          var activeTrialPhase =0;
          var trialStatusList = {};
          var dayDifference;
          var ExpectedDays;
          var TotalDays;
          var TotalDelay;
          var ExpectedResultDays;
          var ExpectedDelayedDays;
          if(trialData.rows[0])
           {
              async.forEach(Object.keys(trialData.rows), function (item, callback1)
                       {    
                          
                             if(trialData.rows[item].dataValues.active == 2) 
                             {
                             }
                             else
                             {
                                if(trialData.rows[item].dataValues.phases) {
                                  var phasecount = trialData.rows[item].dataValues.phases.length;
                                            
                                          for(var i=phasecount-1; i>=0; i--){
                                            console.log("trialData.rows[item].dataValues.phases[i].participant_count");
                                            console.log(trialData.rows[item].dataValues.phases[i].participant_count);
                                            participantCount = trialData.rows[item].dataValues.phases[i].participant_count;
                                            participantCountResult = participantCountResult + participantCount; 
                                            activeTrialCount = trialData.count;
                                            if(trialData.rows[item].dataValues.phases[i].start_date != undefined && trialData.rows[item].dataValues.phases[i].tentitive_end_date != null) {
                                              if(trialData.rows[item].dataValues.phases[i].participant_count == null) {
                                                participantCountResult = 0;
                                              }
                                              activeTrialPhase = trialData.rows[item].dataValues.phases[i].sr_no;
                                              trialStartDate = moment(trialData.rows[item].dataValues.phases[i].start_date).format("DD/MM/YYYY");
                                              trialEndDate = moment(trialData.rows[item].dataValues.phases[i].tentitive_end_date).format("DD/MM/YYYY");
                                              var date = new Date();
                                              var date2 = new Date(date);
                                              var date1 = new Date(trialData.rows[item].dataValues.phases[i].start_date);
                                              var timeDiff = Math.abs(date2.getTime() - date1.getTime());
                                              dayDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                              ExpectedDays = moment(trialData.rows[item].dataValues.phases[i].tentitive_end_date).diff(moment(trialData.rows[item].dataValues.phases[i].start_date), 'days');
                                              if(moment(trialData.rows[item].dataValues.phases[i].tentitive_end_date) < moment(Date.now())) {
                                                console.log("Hiiiii");
                                                TotalDays = moment(Date.now()).diff(moment(trialData.rows[item].dataValues.phases[i].start_date), 'days');
                                                TotalDelay = moment(Date.now()).diff(moment(trialData.rows[item].dataValues.phases[i].tentitive_end_date), 'days');
                                                ExpectedResultDays = (ExpectedDays * 100)/TotalDays;
                                                ExpectedDelayedDays = (TotalDelay * 100)/TotalDays;
                                              } else if(moment(trialData.rows[item].dataValues.phases[i].tentitive_end_date) > moment(Date.now())) {
                                                console.log("Heyyyy");
                                                TotalDays = moment(Date.now()).diff(moment(trialData.rows[item].dataValues.phases[i].start_date), 'days');
                                                TotalDelay = moment(Date.now()).diff(moment(trialData.rows[item].dataValues.phases[i].tentitive_end_date), 'days');
                                                ExpectedResultDays = (TotalDays * 100)/ExpectedDays;
                                                ExpectedDelayedDays = 0;
                                              }
                                            }
                                          }
                                }   
                                
                             } 
                             
                        }, function(err) {
                                        
                                         });
                console.log("ExpectedDays");
                console.log(ExpectedDays);
                console.log("TotalDays");
                console.log(TotalDays);
                console.log("TotalDelay");
                console.log(TotalDelay);
                console.log("ExpectedResultDays");
                console.log(ExpectedResultDays);
                console.log("ExpectedDelayedDays");
                console.log(ExpectedDelayedDays);
               trialStatusList = {
                "trialName": trialData.rows[0].dataValues.name,
                "trialStartDate": trialStartDate,
                "trialEndDate": trialEndDate,
                "participantCountResult": participantCountResult,
                "activeTrialCount": activeTrialCount,
                "activeTrialPhase": activeTrialPhase,
                "ExpectedResultDays" : ExpectedResultDays,
                "ExpectedDelayedDays": ExpectedDelayedDays,
                "TotalDelay": TotalDelay
              }   
          }
         
          res.json({
            data: trialStatusList,
            message: 'Success to load data..!'
          });
        }
    else {
      res.json({
        status: false,
        data: null,
        message: 'Failed to load data..!'
      });
    }*/


exports.getTrialMilestoneStatus = function(req, res, next) {
  //console.log("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
  var trialID = req.params.id;

  console.log(trialID);

  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  
  sequelizeDb.models.trial.findOne({
    attributes: ['id','name','start_date', 'end_date'],
    where: {
      id: trialID
    }
  }).then(function(trialData)
    {
      sequelizeDb.models.phase.findOne({
        as : 'activePhase',
        attributes: ['id','tentitive_end_date','sr_no', 'participant_count', 'start_date'],
        where: {
            start_date: {
                $lte: new Date()
            },
            tentitive_end_date: {
                $gte: new Date()
            },
            trial_id: trialData.dataValues.id,
            active: true
        }
      }).then(function(phaseData){
          if(phaseData) {
            sequelizeDb.models.milestone.findAll({
              attributes: ['name', 'start_date', 'tentitive_end_date'],
              where:{
                phase_id: phaseData.dataValues.id
              }
            }).then(function(milestoneData){
                var milestoneDataLength = milestoneData.length;
                var trialListArray= [];
                var trialStatusList = {};
                if(milestoneData) {
                  for(var i= 0; i < milestoneDataLength; i++) {
                    if(moment(Date.now()) >= moment(milestoneData[i].dataValues.start_date)) {
                      var daysDiff = moment(Date.now()).diff(moment(milestoneData[i].dataValues.start_date), 'days');
                      var daysDiffDelayed = moment(Date.now()).diff(moment(milestoneData[i].dataValues.tentitive_end_date), 'days');
                      trialStatusList = {
                        "dayDifference": daysDiff,
                        "milestoneName": milestoneData[i].dataValues.name,
                        "daysDiffDelayed": daysDiffDelayed
                      }
                      trialListArray.push(trialStatusList);
                    } else {

                    }
                    
                  }
                  res.json({
                    data: trialListArray,
                    message: 'Success to load data..!'
                  });
                } else{
                  res.json({
                    status: false,
                    data: null,
                    message: 'Failed to load data..!'
                  });
                }
            });
          } else {
            res.json({
              status: true,
              data: [],
              message: 'No data found..!'
            });  
          }
        
      });
    }).catch(function(err) {
      console.log(err);
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
}

exports.getTrialPatients = function(req, res, next) {
  var trialID = req.params.id;

  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  
  sequelizeDb.models.trial.findOne({
    where:{
      id: trialID
    },
    include : [{
      model: sequelizeDb.models.phase,
      include : [{
          attributes: ['id', 'user_id'],
          model: sequelizeDb.models.patient,
          as : 'phasePatients'
      }]
    }]        
  }).then(function(trialData){
    var Demo = [];
    var userId ='';
    if(trialData) {

      var phaseCount = trialData.dataValues.phases.length;
      for(var i=phaseCount-1; i>=0; i--) {
        var phasePatientCount = trialData.dataValues.phases[i].dataValues.phasePatients.length;
        for(var j=phasePatientCount-1; j>=0; j--) {
          Demo.push(trialData.dataValues.phases[i].dataValues.phasePatients[j].dataValues.user_id); 
        }
      }
      //console.log(Demo);
      sequelizeDb.models.user
      .findAndCountAll({
        attributes: ['id', 'firstname','lastname','email'],
        where:{
          id:Demo
        },
        include: [{
              model: sequelizeDb.models.role,
              where: { name:  'Patient'}
            },{
            model: sequelizeDb.models.patient,
            attributes: ['id','age', 'gender', 'placebo']}
        ]
      }).then(function(data) {
        res.json({
          data: data,
          message: 'Success to load data..!'
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
      return res.json({
        status: 'fail',
        data: null,
        message: 'Your request has not been completed successfully',
      }); 
    });
}

exports.getActiveTrials = function(req, res, next) {
  
  var pageNumber = req.body.search.params.pageNumber;
  var pageSize = req.body.search.params.pageSize;
  
  var searchTrialParameters = new Array();
  var searchPhaseParameters = new Array();
 
  console.log("!222222222222222222222222222");
  //var todaydate = new Date(new Date().setDate(new Date().getDate()));
  var todaydate = new Date();
  
   if(req.body.statusId != undefined  && req.body.statusId != 'undefined'  && req.body.statusId != "") {
    console.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww");
      if(req.body.statusId == 1) //On Time
      { 
         searchTrialParameters.push({$and : {active: req.body.statusId, 
                                          end_date: { $gte : todaydate } 
                      }});
         
      }
      else if(req.body.statusId == 2) // Compeleted
      {

         searchTrialParameters.push({active: req.body.statusId});
      }
     else if(req.body.statusId == 3) //Delayed
      {
        
         searchTrialParameters.push({$and : {active: 1, 
                                          end_date: { $lt : todaydate } 
                      }});
         
      }
    }

  var orderval = [
    [Sequelize.col('id'), 'ASC'],
  ]  
   
  sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'}); 
  sequelizeDb.models.trial.findAndCountAll({
      order : 'trial.id ASC,phases.sr_no ASC',
      where: {
        active: req.body.statusId
      },
      include: [
        {
          model: sequelizeDb.models.phase, attributes: ['id', 'start_date', 'tentitive_end_date','sr_no'],
          where : {
            $and: {
              sr_no: { 
                $gte:  req.body.phaseId 
              }, 
              start_date: {
                $lte: new Date()
              },
              tentitive_end_date: {
                  $gte: new Date()
              }
            }
          }, 
         required: true
         }
      ], 
    offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
    limit: pageSize
     
}).then(function(trialData)
    {
        console.log("!11111111111111111111111");
        if(trialData)
        {
          //res.json(trials);
          

          var trialListArray = [];
              
           if(trialData.rows[0])
           {
              async.forEach(Object.keys(trialData.rows), function (item, callback1)
                       {    
                         var trialList = {};
                          var status = 0;
                          
                             
                             if(trialData.rows[item].dataValues.active == 2) 
                             {
                                  status = 100;
                                  trialList = 
                                                  {
                                                    "id" : trialData.rows[item].dataValues.id,
                                                    "company_id" : trialData.rows[item].dataValues.company_id,
                                                    "sponsor_id" : trialData.rows[item].dataValues.sponsor_id,
                                                    "name" : trialData.rows[item].dataValues.name,
                                                    "description" : trialData.rows[item].dataValues.description,
                                                    "trial_type" : trialData.rows[item].dataValues.trial_type,
                                                    "dsmb_id" : trialData.rows[item].dataValues.dsmb_id,
                                                    "drug_name" : trialData.rows[item].dataValues.drug_name,
                                                    "drug_description" : trialData.rows[item].dataValues.drug_description,
                                                    "drug_type_id" : trialData.rows[item].dataValues.drug_type_id,
                                                    "dosage_id" : trialData.rows[item].dataValues.dosage_id,
                                                    "frequency_id" : trialData.rows[item].dataValues.frequency_id,
                                                    "start_date" : trialData.rows[item].dataValues.start_date,
                                                    "end_date" : trialData.rows[item].dataValues.end_date,
                                                    "active" : trialData.rows[item].dataValues.active,
                                                    "status" : status,
                                                    "count" : trialData.count,
                                                    "rows": trialData.rows
                                                  }
                                            
                                            trialListArray.push(trialList);
                             }
                             else
                             {
                                      var curr = moment(new Date()).format("YYYY-MM-DD 23:59:59");
                                      var start = moment(trialData.rows[item].dataValues.start_date).format("YYYY-MM-DD 23:59:59");
                                      var end = moment(trialData.rows[item].dataValues.end_date).format("YYYY-MM-DD 23:59:59");

                                      if ((start < curr) && (curr < end) ) { 
                                              var end_date = new Date(moment(trialData.rows[item].dataValues.end_date).format("YYYY-MM-DD 23:59:59"));
                                              var start_date = new Date(moment(trialData.rows[item].dataValues.start_date).format("YYYY-MM-DD 23:59:59"));
                                              var timeDiff = Math.abs(end_date.getTime() - start_date.getTime());
                                              var compDiff = Math.abs(new Date().getTime() - start_date.getTime());
                                              var trialDuration = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
                                              var compDuration = Math.ceil(compDiff / (1000 * 3600 * 24));   
                                               
                                              status = Math.ceil(Math.abs((compDuration / trialDuration) * 100 ));
                                              

                                      }
                                      else
                                      {
                                        status = 0;
                                      }
                                      trialList = 
                                                  {
                                                    "id" : trialData.rows[item].dataValues.id,
                                                    "company_id" : trialData.rows[item].dataValues.company_id,
                                                    "sponsor_id" : trialData.rows[item].dataValues.sponsor_id,
                                                    "name" : trialData.rows[item].dataValues.name,
                                                    "description" : trialData.rows[item].dataValues.description,
                                                    "trial_type" : trialData.rows[item].dataValues.trial_type,
                                                    "dsmb_id" : trialData.rows[item].dataValues.dsmb_id,
                                                    "drug_name" : trialData.rows[item].dataValues.drug_name,
                                                    "drug_description" : trialData.rows[item].dataValues.drug_description,
                                                    "drug_type_id" : trialData.rows[item].dataValues.drug_type_id,
                                                    "dosage_id" : trialData.rows[item].dataValues.dosage_id,
                                                    "frequency_id" : trialData.rows[item].dataValues.frequency_id,
                                                    "start_date" : trialData.rows[item].dataValues.start_date,
                                                    "end_date" : trialData.rows[item].dataValues.end_date,
                                                    "active" : trialData.rows[item].dataValues.active,
                                                    "status" : status,
                                                    "count" : trialData.count,
                                                    "rows": trialData.rows
                                                  }
                                            
                                            trialListArray.push(trialList);
                             }  
                        }, function(err) {
                                        
                                         }); 
          }
         res.json({
            status: true,
            data: trialListArray,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
    });
  
};


exports.getActiveTrialCRO = function(req, res, next) {
  

    var userInfo = generalConfig.getUserInfo(req);
    var croCoordinatorId = userInfo.id;
    
    var pageNumber = req.body.search.params.pageNumber;
    var pageSize = req.body.search.params.pageSize;

    var todaydate = new Date();
    var searchTrialParameters = new Array();


    if(req.body.sponsorId != undefined && req.body.sponsorId != 'undefined' && req.body.sponsorId != "") {
      searchTrialParameters.push({
        sponsor_id: req.body.sponsorId,
        croCoordinator_id: croCoordinatorId
      });
    }
    if(req.body.trialId != undefined && req.body.trialId != 'undefined' && req.body.trialId != "") {
      searchTrialParameters.push({
        id: req.body.trialId,
        croCoordinator_id: croCoordinatorId
      });
    }
   if(req.body.statusId != undefined  && req.body.statusId != 'undefined'  && req.body.statusId != "") {

      if(req.body.statusId == 1) //On Time
      {
         searchTrialParameters.push({$and : {active: req.body.statusId, 
                                          end_date: { $gte : todaydate },
                                          croCoordinator_id: croCoordinatorId 
                      }});
         
      }
      else if(req.body.statusId == 2) // Compeleted
      {
         searchTrialParameters.push({active: req.body.statusId, croCoordinator_id: croCoordinatorId });
      }
     else if(req.body.statusId == 3) //Delayed
      {
         searchTrialParameters.push({$and : {active: 1, 
                                          end_date: { $lt : todaydate },
                                          croCoordinator_id: croCoordinatorId 
                      }});
         
      }
    } else {
      searchTrialParameters.push({croCoordinator_id: croCoordinatorId}); 
    }
    
    sequelizeDb.models.trial.hasMany(sequelizeDb.models.phase,{foreignKey:'trial_id'});
    sequelizeDb.models.phase.hasMany(sequelizeDb.models.milestone,{foreignKey:'phase_id'});
    sequelizeDb.models.phase.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'phase_id'});
    sequelizeDb.models.patient.hasMany(sequelizeDb.models.phase_patient,{foreignKey:'patient_id'});
    sequelizeDb.models.phase_patient.belongsTo(sequelizeDb.models.patient, {foreignKey: 'patient_id'});

    sequelizeDb.models.user.hasMany(sequelizeDb.models.patient,{foreignKey:'user_id'});
    sequelizeDb.models.patient.belongsTo(sequelizeDb.models.user, {foreignKey: 'user_id'});

    sequelizeDb.models.trial.hasMany(sequelizeDb.models.trial_device,{foreignKey:'trial_id'});
    sequelizeDb.models.trial_device.belongsTo(sequelizeDb.models.trial, {foreignKey: 'trial_id'});
    sequelizeDb.models.device.hasMany(sequelizeDb.models.trial_device,{foreignKey:'device_id'});
    sequelizeDb.models.trial_device.belongsTo(sequelizeDb.models.device, {foreignKey: 'device_id'});    

    sequelizeDb.models.trial.findAndCountAll({
      where: searchTrialParameters,
      include: [
        {model: sequelizeDb.models.phase, attributes: ['id','tentitive_end_date','sr_no'],
         where : {
            $and: {
              sr_no: { 
                $gte:  req.body.phaseId 
              }, 
              start_date: {
                $lte: new Date()
              },
              tentitive_end_date: {
                  $gte: new Date()
              }
            }
          }, 
         required: true, 
         order: [
                  ['sr_no', 'ASC']
                ]
         }
      ],
    offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
    limit: pageSize
}).then(function(trialData)
    {
    
      
        if(trialData)
        {
          //res.json(trials);

          var trialListArray = [];
              
           if(trialData.rows[0])
           {
              async.forEach(Object.keys(trialData.rows), function (item, callback1)
                       {    
                          var trialList = {};
                          var status = 0;
                          
                             
                             if(trialData.rows[item].dataValues.active == 2) 
                             {
                                  status = 100;
                                  trialList = 
                                                  {
                                                    "id" : trialData.rows[item].dataValues.id,
                                                    "company_id" : trialData.rows[item].dataValues.company_id,
                                                    "sponsor_id" : trialData.rows[item].dataValues.sponsor_id,
                                                    "name" : trialData.rows[item].dataValues.name,
                                                    "description" : trialData.rows[item].dataValues.description,
                                                    "trial_type" : trialData.rows[item].dataValues.trial_type,
                                                    "dsmb_id" : trialData.rows[item].dataValues.dsmb_id,
                                                    "drug_name" : trialData.rows[item].dataValues.drug_name,
                                                    "drug_description" : trialData.rows[item].dataValues.drug_description,
                                                    "drug_type_id" : trialData.rows[item].dataValues.drug_type_id,
                                                    "dosage_id" : trialData.rows[item].dataValues.dosage_id,
                                                    "frequency_id" : trialData.rows[item].dataValues.frequency_id,
                                                    "start_date" : trialData.rows[item].dataValues.start_date,
                                                    "end_date" : trialData.rows[item].dataValues.end_date,
                                                    "active" : trialData.rows[item].dataValues.active,
                                                    "status" : status,
                                                    "count" : trialData.count,
                                                    "rows": trialData.rows
                                                  }
                                            
                                            trialListArray.push(trialList);
                             }
                             else
                             {
                                      if(trialData.rows[item].dataValues.phases)
                                      {
                                          async.forEach(Object.keys(trialData.rows[item].dataValues.phases), function (item1, callback2)
                                                {

                                                          if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 4 &&
                                                             (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                             trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                             trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null)
                                                             )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            if (now > enddate) {
                                                               status = 100;
                                                            } 
                                                          } 
                                                          else if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 3 && 
                                                                  (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                                   trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                                    trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null)
                                                                 )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            if (now > enddate) {
                                                               status = 75;
                                                            } 
                                                          } 
                                                          else if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 2  &&
                                                                    (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                                     trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                                      trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null
                                                                    )
                                                                 )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            if (now > enddate) {
                                                               status = 50;
                                                            } 
                                                          } 
                                                          else if(trialData.rows[item].dataValues.phases[item1].dataValues.sr_no == 1 && 
                                                                    (trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != "" &&
                                                                     trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != undefined &&
                                                                     trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date != null
                                                                    )
                                                                 )
                                                          {
                                                            var enddate = moment(trialData.rows[item].dataValues.phases[item1].dataValues.tentitive_end_date).format("DD-MM-YYYY")
                                                            

                                                            if (now > enddate) {
                                                               status = 25;
                                                            } 
                                                          } 

                                                     
                                                }, function(err) {
                                                      
                                                       }); 
                                        

                                         trialList = 
                                                  {
                                                    "id" : trialData.rows[item].dataValues.id,
                                                    "company_id" : trialData.rows[item].dataValues.company_id,
                                                    "sponsor_id" : trialData.rows[item].dataValues.sponsor_id,
                                                    "name" : trialData.rows[item].dataValues.name,
                                                    "description" : trialData.rows[item].dataValues.description,
                                                    "trial_type" : trialData.rows[item].dataValues.trial_type,
                                                    "dsmb_id" : trialData.rows[item].dataValues.dsmb_id,
                                                    "drug_name" : trialData.rows[item].dataValues.drug_name,
                                                    "drug_description" : trialData.rows[item].dataValues.drug_description,
                                                    "drug_type_id" : trialData.rows[item].dataValues.drug_type_id,
                                                    "dosage_id" : trialData.rows[item].dataValues.dosage_id,
                                                    "frequency_id" : trialData.rows[item].dataValues.frequency_id,
                                                    "start_date" : trialData.rows[item].dataValues.start_date,
                                                    "end_date" : trialData.rows[item].dataValues.end_date,
                                                    "active" : trialData.rows[item].dataValues.active,
                                                    "status" : status,
                                                    "count" : trialData.count,
                                                    "rows": trialData.rows
                                                  }
                                            
                                            trialListArray.push(trialList);

                                      }
                            }

                              
                        }, function(err) {
                                        
                                         }); 
          }
          
          res.json({
            status: true,
            data: trialListArray,
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
        return res.json({
            status: 'fail',
            data: null,
            message: 'Your request has not been completed successfully',
        }); 
});
};