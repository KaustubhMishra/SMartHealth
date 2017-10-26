'use strict';

var dataPoint = require('../controller/datapointController');
var dataPointRule = require('../controller/datapointruleController');


module.exports = function(app) {
	app.post('/datapoint', dataPoint.storeData);
	app.post('/datapointrule', dataPointRule.addParentChildRuleData);
	app.post('/datapointsensorupdate', dataPointRule.sensorValueUpdateProcess);
	app.post('/api/site/prediction', dataPointRule.runPrediction);
};