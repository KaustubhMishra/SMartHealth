'use strict';

var feedback = require('../controller/feedbackController');

module.exports = function(app) {
	app.post('/api/site/feedbackData', feedback.postFeedback);
	app.get('/api/site/getfeedback', feedback.getFeedback);
};