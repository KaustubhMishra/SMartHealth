'use strict';

var siteUser = require('../controller/profileController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {	

    /**
     * @swagger
     * /api/site/editProfile:
     *   post:
     *     description: Update user profile
     *     tags:
     *       - Profile
     *     produces:
     *       - application/json
     *     responses:
     *       200: 	
     *          description: Profile has been updated successfully.
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
     *       - name: profile_image
     *         in: formData
     *         description: profile image
     *         required: false
     *         type: file
     *       - name: firstname
     *         in: formData
     *         description: First name
     *         required: true
     *         type: string
     *       - name: lastname
     *         in: formData
     *         description: Last name
     *         required: true
     *         type: string
     *       - name: email
     *         in: formData
     *         description: Email
     *         required: true
     *         type: string
     *       - name: phonecode
     *         in: formData
     *         description: Phone Number Country Code
     *         required: true
     *         type: integer
     *         format: int32
     *       - name: phone
     *         in: formData
     *         description: Phone Number
     *         required: true
     *         type: integer
     *         format: int32     
     *       - name: timezone
     *         in: formData
     *         description: Timezone
     *         required: true
     *         type: string


     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string
     *       - name: body
     *         in: body
     *         description: json object used as input
     *         required: true
     *         schema:
     *           type: object
     *           properties:
     *             params:
     *               type: object
     *               properties:
     *                 pageNumber:
     *                   type: integer
     *                 pageSize:
     *                   type: integer
     *                 sortBy:
     *                   type: string
     *                 sortOrder:
     *                   type: string
     *             SearchParams:
     *               type: object
     *               properties:
     *                 searchTxt:
     *                   type: string  
     */	
	app.post('/api/site/editProfile', multipartMiddleware, siteUser.updateProfile);	
	app.post('/api/site/updatePassword',siteUser.changePasswordData);
	app.get('/api/site/getProfile',siteUser.getProfile);
     app.get('/api/site/getProfileWeb',siteUser.getProfileWeb);
	app.get('/api/site/getprofileimage',siteUser.getProfileImage);
     app.post('/api/site/editPatientProfile',multipartMiddleware, siteUser.updatePatientProfile);
     app.get('/api/site/contactInfo',siteUser.croCoordinatorContactInfo);
	//app.post('/api/site/chkcpid', siteUser.uniqueCPID);
};