var AWS = require('aws-sdk');

var defineAccessKeyId = 'AKIAIA5BVDYK6OUL6M5A';
var defineSecretAccessKey = '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';
var defineRegion = 'us-east-1';
var isDevelopment = false;

AWS.config.update({
  accessKeyId: defineAccessKeyId,
  secretAccessKey: defineSecretAccessKey,
  region: defineRegion
});

if(isDevelopment) {
	//	development
	var applicationARN	= 'arn:aws:sns:us-east-1:665657858049:app/APNS_SANDBOX/CTMS-APP-DEVELOPMENT';
} else {
	//	live 
	var applicationARN	= 'arn:aws:sns:us-east-1:665657858049:app/APNS/CTMS-APP-LIVE';	
}



var SNS = new AWS.SNS();

module.exports = {
	SNS: SNS,
	applicationARN: applicationARN,
	isDevelopment: isDevelopment
}