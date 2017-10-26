'use strict';

var siteUser = require('../controller/userController');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

module.exports = function(app) {
    app.get('/api/site/getuser', siteUser.getById);

    /**
     * @swagger
     * /api/site/getuserlist:
     *   post:
     *     description: Get user list
     *     tags:
     *       - User
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: Data loaded successfully.
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
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
    app.post('/api/site/getuserlist', siteUser.getUserList);

    /**
     * @swagger
     * /api/site/getcompanygrouplist:
     *   post:
     *     description: Get Company's user group list (without pagination)
     *     tags:
     *       - User Group
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: Data loaded successfully.
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
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
     *             cid:
     *               type: string
     */
    app.post('/api/site/getcompanygrouplist', siteUser.getCompanyGroupList);
    //app.post('/api/site/getcompanygrouplistByCid', siteUser.getcompanygrouplistByCid);

    app.post('/api/site/user', siteUser.addUser);
    app.post('/api/site/user/checkemailexist', siteUser.checkEmailExist);
    //app.put('/api/site/user/:id', siteUser.updateUser);

    /**
     * @swagger
     * /api/site/user/{id}:
     *   get:
     *     tags:
     *       - User
     *     description: Get specific user detail
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string     
     *       - name: id
     *         description: User's id
     *         in: path
     *         required: true
     *         type: integer
     *         format: int64
     *     responses:
     *       200: 
     *          description: User record has been found successfully
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     */    
    app.get('/api/site/user/:id', siteUser.getUserById);

    /**
     * @swagger
     * /api/site/user:
     *   delete:
     *     description: Remove existing user
     *     tags:
     *       - User
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: User deleted successfully
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string
     *       - name: id
     *         description: User's id
     *         in: path
     *         required: true
     *         type: integer
     *         format: int64
     */         
    app.delete('/api/site/user/:id', siteUser.deleteUser);

    /**
     * @swagger
     * /api/site/user:
     *   post:
     *     description: Update existing user
     *     tags:
     *       - User
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: User updated successfully
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string
     *       - name: id
     *         description: User's id
     *         in: path
     *         required: true
     *         type: integer
     *         format: int64
     *       - name: firstname
     *         description: First Name of user
     *         in: formData
     *         required: true
     *         type: string
     *       - name: lastname
     *         description: Last Name of user
     *         in: formData
     *         required: true
     *         type: string
     *       - name: email
     *         description: Email Address of user
     *         in: formData
     *         required: true
     *         type: string
     *       - name: group
     *         description: User groups to which the user belongs
     *         in: formData
     *         required: true
     *         type: array
     *         collectionFormat: multi
     *         items:
     *           type: object
     *           properties:
     *             id:
     *               type: string
     *               description: ID of user group
     *             name:
     *               type: string
     *               description: Title of user group
     *       - name: phone
     *         description: Phone of user
     *         in: formData
     *         required: true
     *         type: string
     *       - name: status
     *         description: Active/Inactive status of user
     *         in: formData
     *         required: true
     *         type: boolean
     *       - name: timezone
     *         description: Timezone of location of user
     *         in: formData
     *         required: true
     *         type: string
     *       - name: profilepicture
     *         description: Profile picture of user
     *         in: formData
     *         required: false
     *         type: file
     */
    app.post('/api/site/user/:id', multipartMiddleware, siteUser.updateUser);    
    app.post('/api/site/user/status/:id', siteUser.changeStatus);    

    /**
     * @swagger
     * /api/site/getusergrouplist:
     *   post:
     *     description: Get user group list
     *     tags:
     *       - User Group
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: Data loaded successfully.
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
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
    app.post('/api/site/getusergrouplist', siteUser.getUserGroupList);

    /**
     * @swagger
     * /api/site/usergroup:
     *   post:
     *     description: Add new user group
     *     tags:
     *       - User Group
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: Group registration process has been successfully completed
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
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
     *             name:
     *               type: string 
     */    
    app.post('/api/site/usergroup', siteUser.addUserGroup);

    /**
     * @swagger
     * /api/site/usergroup:
     *   get:
     *     description: Get specific user group detail
     *     tags:
     *       - User Group
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: Data loaded successfully.
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string
     *       - name: id
     *         description: User Group's id
     *         in: path
     *         required: true
     *         type: integer
     *         format: int64
     */
    app.get('/api/site/usergroup/:id', siteUser.getUserGroupById);

    /**
     * @swagger
     * /api/site/usergroup:
     *   put:
     *     description: Update existing user group
     *     tags:
     *       - User Group
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: User Group has been updated successfully
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
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
     *             name:
     *               type: string 
     */        
    app.put('/api/site/usergroup/:id', siteUser.updateUserGroup);

    /**
     * @swagger
     * /api/site/usergroup:
     *   delete:
     *     description: Remove existing user group
     *     tags:
     *       - User Group
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: User Group deleted successfully
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string
     *       - name: id
     *         description: User Group's id
     *         in: path
     *         required: true
     *         type: integer
     *         format: int64
     */     
     app.delete('/api/site/usergroup/:id', siteUser.deleteUserGroup);
     app.post('/api/site/usergroup/checknameexist', siteUser.checkNameExist);

     app.post('/api/site/registermobiledevice', siteUser.registerMobileDevice); // Mobile Device Registration after Login from mobile device
     app.post('/api/site/deregistermobiledevice', siteUser.deregisterMobileDevice); // Deregister Mobile Device 

     //  webservices only for mobile
     app.post('/api/signup/:usertype',  siteUser.addUser);
     //User Role Routes
     app.post('/api/site/getuserrolelist', siteUser.getUserRoleList);  
     app.post('/api/site/getcompanyrolelist', siteUser.getCompanyRoleList);  
     app.post('/api/site/userrole', siteUser.addUserRole);
     app.get('/api/site/userrole/:id', siteUser.getUserRoleById);
     app.put('/api/site/userrole/:id', siteUser.updateUserRole);
     app.delete('/api/site/userrole/:id', siteUser.deleteUserRole);
     app.get('/api/site/getModulesAndPermission', siteUser.getModulesAndPermission);
     app.get('/updateCompanyAdminRole', siteUser.updateCompanyAdminRole);
     app.get('/api/site/getUserPermission', siteUser.getUserPermission);
     //app.post('/api/site/usergroup/checknameexist', siteUser.checkNameExist);

    app.post('/api/site/groupuserlist', siteUser.getGroupUserList);
    app.post('/getUserLists', siteUser.getUsers);
    app.get('/getUserRoles', siteUser.getUsersRoles);
    app.get('/getUserRolesName', siteUser.getUsersRolesName);

    app.post('/addUser', siteUser.addUsersData);
    app.delete('/deleteuser/:id', siteUser.deleteUserData);
    app.put('/updateUser/:id', siteUser.updateUser);
    app.post('/disableEnable', siteUser.disableUserLogin);
    app.post('/getuserById', siteUser.getUserId);

};