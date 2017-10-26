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

module.exports = {
	resetpasswordSubject:'Your Reset Password link.',
	resetpasswordEmailBody:resetpasswordEmailBody,

	createpasswordSubject:'Welcome to IoTConnect. Your profile has been created.',
	createpasswordEmailBody:createpasswordEmailBody,

	usercredentailsSubject:'Welcome to IoTConnect. Your profile has been created.',
	usercredentailsEmailBody:usercredentailsEmailBody,

	emailContainerHeaderString: emailContainerHeaderString,
	emailContainerFooterString: emailContainerFooterString
};