'use strict';
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var siteFirmware = require('../controller/firmwareController');

module.exports = function(app) {

    app.post('/api/site/firmware', multipartMiddleware, siteFirmware.executefirmware);

};