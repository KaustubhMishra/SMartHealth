 'use strict';

var db = require('../../../../config/sequelize').db;
var commonLib = require('../../../../lib/common');
var mainConfig = require('../../../../config/mainConfig');
var fs = require('fs');
var async = require('async');

db.models.device.associate(db.models);
db.models.device_document.associate(db.models);

exports.getdevicelist = function(req, res, next) {
 	sequelizeDb.models.device.findAll()
	.then(function(deviceList) {
		if(deviceList)
		{
			res.json({
				status: true,
				data: deviceList,
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
	});
};

exports.getDeviceId = function(req, res, next) {
    
    var imageFolder = 'public/upload/profilepicture/';

    db.models.device.find({
        attributes:['id', 'name', 'manufacturer', 'firmware', 'version', 'device_image', 'device_group_id','model_number'],
        include: [
            {
                model: db.models.device_document,
                attributes:['id', 'deviceId', 'name'],
                as:'DeviceDocument'
            }
        ],
        where:{
            id:req.body.id
        }
    })
    .then(function(device) {
        if(device)
        {
            if(!fs.existsSync(imageFolder+device.dataValues.device_image)) {
                device.dataValues.device_image =''; 
            }

            res.json({
                status: true,
                data: device,
                message: 'Device load successfully'
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



exports.getdeviceGrouplist = function(req, res, next) {
 	
 	var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        return res.json({
            status: "fail",
            message: 'Unknown user'
        });
    }

 	db.models.device_group.findAll({
 		attributes: ['id','name'],
 		where: {
 			company_id: userInfo.companyId
 		}
 	})
	.then(function(deviceGroupData) {
		if(deviceGroupData)
		{
			res.json({
				status: true,
				data: deviceGroupData,
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
	});
};

exports.addDeviceData = function(req, res, next) {
    req.body = JSON.parse(req.body.deviceData);

    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        res.json({
            status: false,
            data: null,
            message: 'Unknown user'
        });
    }
    
    var devicefiles = {};
    var deviceDocuments = {};
    var deviceData = req.body;
    var companyId = userInfo.companyId;
    
    deviceData.DeviceImage = {};
    deviceData.DeviceDocument = [];

    console.log(req.files);
    async.series([
        function (callback) {
            async.forEachSeries(req.files, function (file, callbackFile) {
              console.log("yyyyyyyyyyyyyyyyyyyyy");
              console.log(file);
              if (file.fieldName.indexOf('file') != -1) {
                console.log("000000000000");
                devicefiles[file.fieldName] = file;
                callbackFile();
              } else if (file.fieldName.indexOf('document') != -1) {
                deviceDocuments[file.fieldName] = file;
                callbackFile();
              }
            },function(){
              callback(null, null);
            });
        },
        function (callback) {
            db.models.device.find({
              where: {name: deviceData.name}
            }).then(function (mc) {
              if (mc) {
                callback('Device Name already exists', null);
              } else {
                callback(null, null);
              }
            });
        },
        function (callback) {
            async.forEachSeries(devicefiles, function (devicefile, callbackImage) {
              console.log("1111111111111");
              var options = {
                'uploadedfileobj': devicefile,
                'storagepath': settings.filesPath.userPicture,
                'resizeinfo': false
              };
              commonLib.storeSFImage(options, function (result) {
                if (result.status) {
                  deviceData.device_image = result.data.filename;
                  callbackImage();
                } else {
                  callback(result.message, null);
                }
              });
            }, function () {
              callback(null, null);
            });
        },
        function (callback) {
        // Function 4.
            async.forEachSeries(deviceDocuments, function (deviceDocument, callbackDocument) {
              console.log("22222222222");
              var options = {
                'uploadedfileobj': deviceDocument,
                'storagepath': settings.filesPath.deviceDocument,
                'resizeinfo': false
              };
              commonLib.storeDocument(options, function (result) {
                if (result.status) {
                  let DocumentData = {
                    name: result.data.filename,
                  };
                  deviceData.DeviceDocument.push(DocumentData);
                  callbackDocument();
                } else {
                  callback(result.message, null);
                }
              });
            }, function () {
              callback(null, null);
            });
        },
    ],// Final Call function
        function (err, results) {
          if (err) {
            res.json({
              status: false,
              data: null,
              message: err
            });
          } else {
            console.log("INserteddddddddd");
            //console.log(deviceData);
            db.models.device.create(deviceData, {
                include: [
                    {
                        model: db.models.device_document,
                        as:'DeviceDocument'
                    }
                ]
            }).then(function (device) {
                if (device) {
                res.json({
                  status: true,
                  data: device,
                  message: 'Data saved successfully..!'
                });
              } else {
                res.json({
                  status: 'fail',
                  data: null,
                  message: 'Failed to save data..!'
                });
              }
            });
    }
    });
};


var saveDeviceData = function (deviceData, callback) {
    
	db.models.device.create(deviceData).then(function(deviceData) {
		callback ({ 'status': true }); 
	})
    .catch(function(err) {
		callback({
			'status': false,
			'message': err
		});
    });
};

exports.getdeviceListWithPagination = function(req, res, next) {
    
    var pageNumber = req.body.params.pageNumber;
    var pageSize = req.body.params.pageSize;

    db.models.device
    .findAndCountAll({
      //attributes: ['id', 'firstname','lastname','email', 'phone', 'timezone', 'role_id', 'active'],
      offset: pageNumber == '' ? pageNumber : (pageNumber - parseInt(1)) * pageSize,
      limit: pageSize
    })
    .then(function(device) {
        if(device)
        {   
            res.json({
                status: true,
                data: device,
                message: 'Device Load Successfully'
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

exports.deleteDeviceData = function(req, res, next) {
    
    var deviceID = req.params.id;
    db.models.device.destroy({ where: { id: deviceID} })
    .then(function(device) {
        if (device) {
            res.json({
            status: true,
            data: deviceID,
            message: 'Device deleted successfully.'
          });
        }
        else {
            res.json({
                status: false,
                data: null,
                message: 'Failed to delete device.'
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

exports.updateDeviceData = function (req, res, next) {
    console.log('Update Device.....................');
    var userInfo = generalConfig.getUserInfo(req);
    if (!userInfo.companyId) {
        res.json({
            status: false,
            data: null,
            message: 'Unknown user'
        });
    }

  var deviceID = req.params.id;
  var companyId = userInfo.companyId;
  console.log('User Info is.............. ');
  console.log(userInfo);
  //var devicedata = JSON.parse(req.body);
  
  db.models.device.findOne({
    where: {
      id: deviceID
    }
  }).then(function (device) {
        if(device)
        {
            var devicefiles = {};
            var deviceDocuments = {};
            var devicedata = JSON.parse(req.body.deviceData);
            console.log(devicedata);
            
            if(!devicedata.DeviceDocument)
            {
                devicedata.DeviceDocument = [];    
            }
            
            console.log('then...........................');
            console.log(devicedata);
            async.series([
          function (callback) {
            // Function 0.
            console.log('callback 0');
            console.log(req.files);
            async.forEachSeries(req.files, function (file, callbackFile) {
              if (file.fieldName.indexOf('image') != -1) {
                devicefiles[file.fieldName] = file;
                callbackFile();
              } else if (file.fieldName.indexOf('document') != -1) {
                deviceDocuments[file.fieldName] = file;
                callbackFile();
              }
            },function(){
              callback(null,null);
            });
          },
          function (callback) {
            console.log('Company Id is.............. ',companyId);
            // Function 1.
            console.log('callback 1');
            db.models.device.find({
              where: {name: devicedata.name, company_id: companyId}
            }).then(function (mc) {
              if (mc && mc.id != deviceID) {
                callback('device Name already exists', null);
              } else {
                callback(null, null);
              }
            });
          },
          function (callback) {
            console.log('callback 4');
             // Function 4.
            // Design device image object
            async.forEachSeries(devicefiles, function (devicefile, callbackImage) {
              var options = {
                'uploadedfileobj': devicefile,
                'storagepath': settings.filesPath.sfdevice,
                'resizeinfo': false
              };
              commonLib.storeSFImage(options, function (result) {
                if (result.status) {
                  let ImageData = {
                    name: result.data.filename,
                    deviceId: deviceID
                  };
                  devicedata.device_image.push(ImageData);
                  callbackImage();
                } else {
                  callback(result.message, null);
                }
              });
            }, function () {
              callback(null, null);
            });
          }, function (callback) {
            console.log('callback 5');
             // Function 5.
            // Design device document object
            async.forEachSeries(deviceDocuments, function (DeviceDocument, callbackDocument) {
              var options = {
                'uploadedfileobj': DeviceDocument,
                'storagepath': settings.filesPath.sfdeviceDocument,
                'resizeinfo': false
              };
              commonLib.storeDocument(options, function (result) {
                if (result.status) {
                  let DocumentData = {
                    name: result.data.filename,
                    deviceId: deviceID
                  };
                  devicedata.DeviceDocument.push(DocumentData);
                  callbackDocument();
                } else {
                  callback(result.message, null);
                }
              });
            }, function () {
              callback(null, null);
            });

          }],
          // Final Call function
            function (err, results) {
              if (err) {
                res.json({
                  status: false,
                  data: null,
                  message: err
                });
              } else {
                db.transaction(function (t) {
                  return device.update(devicedata, {transaction: t})
                  .then(function (result) {
                    console.log(' Enter 1');
                    console.log(devicedata.DeviceDocument);
                    
                     if(devicedata.DeviceDocument){
                         return Promise.all([
                              // Store a machice document
                              db.models.device_document.bulkCreate(devicedata.DeviceDocument, {
                                updateOnDuplicate: ['name', 'deviceId'],
                                transaction: t
                              }).then(function (newData) 
                                {
                                  console.log(' Enter 3');
                                  return db.models.device_document.findAll({
                                      where: {deviceId: deviceID},
                                      transaction: t
                                }).then(function (oldData) {
                                    //Find values that are in newData but not in oldData
                                    var addInstances = newData.filter(function (obj) {
                                      return !oldData.some(function (obj2) {
                                        return obj.id == obj2.id;
                                      });
                                    });
                                    //Find values that are in oldData but not in newData
                                    var removeInstances = oldData.filter(function (obj) {
                                      return !newData.some(function (obj2) {
                                        return obj.id == obj2.id;
                                      });
                                    });
                                    
                                    var removeIDs = removeInstances.map(function (value, index) {
                                      return value.id;
                                    });
                                    return db.models.device_document.destroy({
                                      where: {id: removeIDs},
                                      transaction: t
                                    });
                                  });

                              }).catch(function (err) {
                                console.log('document Error', err);
                              })

                        ]);
                      }
                      else
                      {
                        return Promise.all([
                                db.models.device_document.findAll({
                                      where: {deviceId: deviceID},
                                      transaction: t
                                }).then(function (oldData) {
                                  console.log(oldData);   
                                  var newData = [];
                                  console.log(' Enter 3');
                                    var addInstances = newData.filter(function (obj) {
                                      return !oldData.some(function (obj2) {
                                        return obj.id == obj2.id;
                                      });
                                    });
                                    //Find values that are in oldData but not in newData
                                    var removeInstances = oldData.filter(function (obj) {
                                      return !newData.some(function (obj2) {
                                        return obj.id == obj2.id;
                                      });
                                    });
                                    
                                    var removeIDs = removeInstances.map(function (value, index) {
                                      return value.id;
                                    });
                                    return db.models.device_document.destroy({
                                      where: {id: removeIDs},
                                      transaction: t
                                    });
                                  })
                        ]);
                      }
                   

                  });

                }).then(function (result) {
                  // Transaction has been committed
                  // result is whatever the result of the promise chain returned to the transaction callback
                  res.json({
                    status: true,
                    data: null,
                    message: 'Data updated successfully..!'
                  });
                }).catch(function (err) {
                    console.log(err);
                  // Transaction has been rolled back
                  // err is whatever rejected the promise chain returned to the transaction callback
                  res.json({
                    status: false,
                    message: err.message
                  });
                });
              }
            }
          )

        }
  })
  /*var failmsg = 'There was some problem updating device, please try later or contact administrator.';
  var successmsg = 'Device Data has been updated successfully.';

  var deviceID = req.params.id;
  var devicedata = JSON.parse(req.body.deviceData);
  
  db.models.device.findOne({
    where: {
      id: deviceID
    }
  }).then(function (device) {
        device.name  = devicedata.name;
        device.manufacturer = devicedata.manufacturer;
        device.firmware = devicedata.firmware;
        device.version = devicedata.version;
        device.device_group_id = devicedata.device_group_id;
        
        if (req.files && req.files.file) {
            var devicePicture = req.files.file;

            var options = {
                'uploadedfileobj' : devicePicture,
                'storagepath' : settings.filesPath.userPicture,
                'resizeinfo' : false
            }

            commonLib.storeSFImage(options, function(result) {
              if(result.status) {
                commonLib.removeProfilePicture(device.device_image);
                device.device_image = result.data.filename;
                device.save().then(function(result) {
                    if (result.status) {
                        res.json({
                            'status': true,
                            'data': result.data,
                            'message': successmsg,
                        });                   
                    } else {
                        res.json({
                            'status': false,
                            'message': result.message
                        });  
                    }
                });                     
              } else {
                    return res.json({
                        'status': false,
                        'message': failmsg
                    });
                }
            });

        } else {
          
            device.save().then(function(result) {
                if (result.status==true) {
                    return res.json({
                        'status': true,
                        'data': result.data,
                        'message': successmsg
                    });                   
                } else {  
                    return res.json({
                        'status': false,
                        'message': result.message
                    });  
                }
            });        
        }
    });*/
};

exports.getDeviceVitalData = function(req, res, next) {
    console.log('Vital Data.............');
    console.log(req.body.id);
    db.models.device_group.findAll({
        attributes:['id'],
        where:{
            id:req.body.id
        },
        include: [
            {
                model: db.models.template,
                attributes:['name'],
                include:[{
                    model: db.models.template_attr,
                    attributes:['name']
                }]
            }
        ]
    })
    .then(function(device) {
        if(device)
        {
            console.log('Start Device Data.............');
            console.log(device);
            console.log('End Device Data................');
            //console.log(device);
            /*for (var i =0; i <= 0; i++) {
                console.log(device[i].dataValues.template.length);
                for (var j =0; device[i].dataValues.template.length > 0; j++) {
                   console.log(device[i].dataValues.template.template_attr[j].name);
                }
            }*/
            res.json({
                status: true,
                data: device,
                message: 'Device load successfully'
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