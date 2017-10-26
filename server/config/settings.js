/*Crypto use for Encryption and Decryption of string */
var crypto = require('crypto');
/* Emailjs use for Email send email */
var email = require("emailjs");
var emailTemplates = require('./emailTemplates');
var mainConfig = require('./mainConfig');

module.exports = {
	//Main Configuration
	mqttUrl: mainConfig.mqttUrl,
	DBPrefix: mainConfig.DBPrefix,
	cassandraContactPoint: mainConfig.cassandraContactPoint,
	cassandraContactDBUserName: mainConfig.cassandraContactDBUserName,
	cassandraContactDBPassword: mainConfig.cassandraContactDBPassword,
	cassandraDbBinPath: mainConfig.cassandraDbBinPath,
	appPort: mainConfig.appPort,
	appSSLPort: mainConfig.appSSLPort,
	appIPAddress: mainConfig.appIPAddress,
	siteUrl: mainConfig.siteUrl,
	superAdminUrl: mainConfig.superAdminUrl,

	softweb_product_id: '1',
	saltKey: 'f196e5f12f16352f9c3db5caf8807ddc',
	secretKey: 'softwebsecret',
	clientKey: 'client',
	fetchSize: 25,
        adminEmailID: mainConfig.adminEmailID,
        tempEmailID: mainConfig.tempEmailID,
	filesPath: {
	    certificate: "public/upload/certificate",
	    sampleImportFile: "public/storage/sampleimportfile",
	    import: "public/upload/import",
	    tmp: "public/upload/tmp/",
	    userPicture: "public/upload/profilepicture/",
	    ruleErrorLog: "public/upload/rule_error_log",
	    jsTemplate: "public/upload/jsTemplate",
	    cassHistData: "public/upload/casshistdata",
	    deviceDocument: "public/upload/document/"
	},
	validImageExtensions: ['.png','.jpg','.jpeg','gif'],
	validFileExtensions: ['.pdf', '.doc', '.ppt','.pptx','.docx'],
	emailserver: email.server.connect({
		host: "mail.softwebsolutions.com",
		user: "virendra@softwebsolutions.com",
		password: "aaOEAvq+DcQ.m&8KcT",
		port: 587,
	}),
	//Template configuration
	emailTemplate: {
        resetpasswordSubject: emailTemplates.resetpasswordSubject,
        resetpasswordEmailBody: emailTemplates.resetpasswordEmailBody,
        createpasswordSubject: emailTemplates.createpasswordSubject,
        createpasswordEmailBody: emailTemplates.createpasswordEmailBody,
        usercredentailsSubject: emailTemplates.usercredentailsSubject,
        usercredentailsEmailBody: emailTemplates.usercredentailsEmailBody,
        emailContainerHeaderString: emailTemplates.emailContainerHeaderString,
        emailContainerFooterString: emailTemplates.emailContainerFooterString
    },
    cryptoAuthentication: {
        crypto: crypto,
        algorithm: 'aes-256-ctr',
        password: 'd6F3Efeq'
    }
};
