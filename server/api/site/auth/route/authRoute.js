'use strict';

var siteAuth = require('../controller/authController');

module.exports = function(app) {

    /**
     * @swagger
     * /signin:
     *   post:
     *     description: Do Login Process
     *     tags:
     *       - Authentication Related Processes
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: get access and refresh tokens
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add basic token with Basic text, i.e. Basic {token}
     *         required: true
     *         type: string
     *       - name: username[email]
     *         in: formData
     *         description: Email/Username of User Account
     *         required: true
     *         type: string
     *       - name: password
     *         in: formData
     *         description: Password of User Account
     *         required: true
     *         type: string     
     *       - name: username[tmpflag]
     *         in: formData
     *         description: Static Input, value is 1
     *         required: true
     *         type: integer
     *       - name: grant_type
     *         in: formData
     *         description: Static Input, value is password
     *         required: true
     *         type: string
     */	
    //app.post('/api/site/auth/signin', siteAuth.signin);

    /**
     * @swagger
     * /api/site/auth/signout:
     *   get:
     *     description: Do Logout Process
     *     tags:
     *       - Authentication Related Processes
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: successfully logout
     */    
    app.get('/api/site/auth/signout', siteAuth.signout);
    app.post('/api/site/auth/enc', siteAuth.encryptCookies);
    app.post('/api/site/auth/dec', siteAuth.decryptCookies);

    /**
     * @swagger
     * /forgotpassword:
     *   post:
     *     description: Initiate reset password process by sending reset passsword link in email
     *     tags:
     *       - Authentication Related Processes
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: Reset password process initiated
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired     
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add basic token with Basic text, i.e. Basic {token}
     *         required: true
     *         type: string     
     *       - name: body
     *         in: body
     *         description: json object used as input
     *         required: true
     *         schema:
     *           type: object
     *           required:
     *           - params
     *           properties:
     *             params:
     *               type: object
     *               required:
     *               - email
     *               properties:
     *                 email:
     *                   type: string
     *                   format: email
     */    
    app.post('/forgotpassword', siteAuth.forgotpassword);

    /**
     * @swagger
     * /resetpassword:
     *   post:
     *     description: Complete reset password process by saving new passsword
     *     tags:
     *       - Authentication Related Processes
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: Password updated successfully.
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired     
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add basic token with Basic text, i.e. Basic {token}
     *         required: true
     *         type: string     
     *       - name: body
     *         in: body
     *         description: json object used as input
     *         required: true
     *         schema:
     *           type: object
     *           required:
     *           - token
     *           properties:
     *             token:
     *               type: string
     *             password:
     *               type: string
     */      
    app.post('/resetpassword', siteAuth.resetpassword);
    app.post('/createpassword', siteAuth.createPassword);
    app.get('/api/site/loginuserdata', siteAuth.getLoginUserSetting);
    app.post('/checkEmail', siteAuth.checkEmailRegistered); // Get login user setting (TimeZone )
};