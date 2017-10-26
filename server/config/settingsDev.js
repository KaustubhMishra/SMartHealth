/*Crypto use for Encryption and Decryption of string */
var crypto = require('crypto');
/* Emailjs use for Email send email */
var email = require("emailjs");
var emailContainerHeaderString = '<!DOCTYPE html>';
emailContainerHeaderString += '<html lang="en-US">';
emailContainerHeaderString += '<head>';
emailContainerHeaderString += '<meta charset="utf-8">';
emailContainerHeaderString += '</head>';
emailContainerHeaderString += '<body>';
emailContainerHeaderString += '<header></header>';
emailContainerHeaderString += '<div>';

var emailContainerFooterString = '</div>';

emailContainerFooterString += '<div>';
emailContainerFooterString += '<p>Regards,</p>';
emailContainerFooterString += '<BR/>';

emailContainerFooterString += '<div>IoTConnect</div>';

emailContainerFooterString += '</div>';
emailContainerFooterString += '</body>';
emailContainerFooterString += '</html>';

var resetpasswordEmailBody = '<div>';
resetpasswordEmailBody += 'Dear %userfullname%, <br /><br />';
resetpasswordEmailBody += 'Please click on below link OR copy paste into browser to reset password.<br />';
resetpasswordEmailBody += '%resetpasswordlink%<br />';
resetpasswordEmailBody += '</div>';

var createpasswordEmailBody = '<div>';
createpasswordEmailBody += 'Dear %companyname%, <br />';
createpasswordEmailBody += 'Please click on below link OR copy paste into browser to create password.<br />';
createpasswordEmailBody += '%createpasswordlink%<br />';
createpasswordEmailBody += '</div>';

var usercredentailsEmailBody = '<div>';
usercredentailsEmailBody += 'Dear %userfullname%, <br /><br />';
usercredentailsEmailBody += 'Thank you for your registration with IoTConnect.<br /><br />';
usercredentailsEmailBody += 'Your registration information is below.<br /><br />';
usercredentailsEmailBody += 'Username : %username%<br />';
usercredentailsEmailBody += 'Password : %userpassword%<br />';
usercredentailsEmailBody += '</div>';

//Email Template End

var appPort = 3009;
var appSSLPort = 3015;
var appIPAddress = '192.168.4.41';
var siteUrl = 'http://'+appIPAddress+':'+appPort;
var superAdminUrl = 'http://'+appIPAddress+':'+appPort+'/admin';


module.exports = {
	mqttUrl: 'mqtt://192.168.4.41',
	DBPrefix: 'softwebo_',
	cassandraContactPoint: '192.168.4.41',
	cassandraContactDBUserName: 'admin',
	cassandraContactDBPassword: 'admin',
	cassandraDbBinPath: '/home/kafka/apache-cassandra-3.7/bin/',
	appPort: appPort,
	appSSLPort: appSSLPort,
	appIPAddress: appIPAddress,
	siteUrl: siteUrl,
	superAdminUrl: superAdminUrl,
	softweb_product_id: '1',
	saltKey: 'f196e5f12f16352f9c3db5caf8807ddc',
	secretKey: 'softwebsecret',
	clientKey: 'client',
	fetchSize: 25,
	paths: {
	    certificate: "public/upload/certificate",
	    sampleImportFile: "public/storage/sampleimportfile",
	    import: "public/upload/import",
	    tmp: "public/upload/tmp/",
	    userPicture: "public/upload/profilepicture/",
	    ruleErrorLog: "public/upload/rule_error_log",
	    jsTemplate: "public/upload/jsTemplate",
	    cassHistData: "public/upload/casshistdata"
	},
	validImageExtensions: ['.png','.jpg','.jpeg','gif'],
	emailserver: email.server.connect({
		host: "mail.softwebsolutions.com",
		user: "rohan@softwebsolutions.com",
		password: "TWw&nb8WNZOZ!7qI;T",
		port: 587,
	}),
	server: email.server.connect({
		host: "mail.softwebopensource.com",
		user: "test@softwebopensource.com",
		password: "DMr3vvGJ2Plfi5kUIv",
		port: 25,
	}),
	emailTemplate: {
        contactUsEmailSubject: 'You’ve received a message from an Accompany Music user.',
        signUpEmailSubject: 'Welcome to Accompany Music!',
        subscriptionEmailSubject: 'Thank you for your subscription to Accompany Music!',
        subscriptionReminderEmailSubject: 'A subscription reminder from Accompany Music :)',
        forgetPasswordEmailSubject: 'Accompany Music Password Reset',
        invitationEmailSubject: 'Welcome to Accompany!',
        thanksEmailSubject: ' Thanks for accepting our invitation to join Accompany.',


        resetpasswordSubject:'Your Reset Password link.',
        resetpasswordEmailBody:resetpasswordEmailBody,

        createpasswordSubject:'Welcome to IoTConnect. Your profile has been created.',
        createpasswordEmailBody:createpasswordEmailBody,

        usercredentailsSubject:'Welcome to IoTConnect. Your profile has been created.',
        usercredentailsEmailBody:usercredentailsEmailBody,


        emailContainerHeaderString: emailContainerHeaderString,
        emailContainerFooterString: emailContainerFooterString

    },
    cryptoAuthentication: {
        crypto: crypto,
        algorithm: 'aes-256-ctr',
        password: 'd6F3Efeq'
    }
};
