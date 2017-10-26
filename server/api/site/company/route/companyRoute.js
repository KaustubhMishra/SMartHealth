'use strict';

var siteCompany = require('../controller/companyController');

module.exports = function(app) {

    /**
     * @swagger
     * /api/site/company:
     *   post:
     *     description: Add new daughter company
     *     tags:
     *       - Company
     *     produces:
     *       - application/json
     *     responses:
     *       200: 
     *          description: Company has been registered successfully.
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
     *             userCompany:
     *               type: string
     *             phonecodeCom:
     *               type: string
     *             companyphone:
     *               type: string
     *             companyaddress1:
     *               type: string
     *             companyaddress2:
     *               type: string
     *             companycountry:
     *               type: string
     *             companystate:
     *               type: string
     *             companycity:
     *               type: string
     *             companyfax:
     *               type: string
     *             email:
     *               type: string
     *             firstname:
     *               type: string
     *             lastname:
     *               type: string
     *             status:
     *               type: string
     */ 
    app.post('/api/site/company', siteCompany.addCompany); // Add new company

    /**
     * @swagger
     * /api/site/company/{id}:
     *   get:
     *     tags:
     *       - Company
     *     description: Get specific company detail
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string     
     *       - name: id
     *         description: Company's id
     *         in: path
     *         required: true
     *         type: integer
     *         format: int64
     *     responses:
     *       200: 
     *          description: Company record has been found successfully
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     */
    app.get('/api/site/company/:id', siteCompany.getCompanyById); // Get compnay details by Id

    /**
     * @swagger
     * /api/site/company/{id}:
     *   put:
     *     tags:
     *       - Company
     *     description: Updates a specific company record
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string     
     *       - name: id
     *         description: Company's id
     *         in: path
     *         required: true
     *         type: integer
     *         format: int64
     *       - name: body
     *         in: body
     *         description: json object used as input
     *         required: true
     *         schema:
     *           type: object
     *           properties:
     *             name:
     *               type: string
     *             address1:
     *               type: string
     *             address2:
     *               type: string
     *             city:
     *               type: string
     *             state:
     *               type: string
     *             country:
     *               type: string
     *             phonecodeCom:
     *               type: integer
     *             phone:
     *               type: integer
     *             fax:
     *               type: integer
     *     responses:
     *       200: 
     *          description: Company has been updated successfully
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     */    
    app.put('/api/site/company/:id', siteCompany.updateCompany); // Update company record

    /**
     * @swagger
     * /api/site/subuserdetails/:
     *   post:
     *     tags:
     *       - Company
     *     description: Get temporary password of daughter company admin account for proxy login
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string     
     *       - name: id
     *         description: Company's id
     *         in: path
     *         required: true
     *         type: integer
     *         format: int64
     *       - name: body
     *         in: body
     *         description: json object used as input
     *         required: true
     *         schema:
     *           type: object
     *           properties:
     *             useremail:
     *               type: string
     *             parentcompid:
     *               type: string
     *     responses:
     *       200: 
     *          description: Company has been updated successfully
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     */    
    app.post('/api/site/subuserdetails', siteCompany.subuserdetails); // 


    /**
     * @swagger
     * /api/site/getcompanylist:
     *   post:
     *     description: Get company list
     *     tags:
     *       - Company
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
    app.post('/api/site/getcompanylist', siteCompany.getCompanyList);
    app.delete('/api/site/company/:id', siteCompany.deleteCompany);

    /**
     * @swagger
     * /api/site/company/status/{id}:
     *   post:
     *     tags:
     *       - Company
     *     description: Updates active/inactive status of the specific company
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string     
     *       - name: id
     *         description: Company's id
     *         in: path
     *         required: true
     *         type: integer
     *         format: int64
     *       - name: body
     *         in: body
     *         description: json object used as input
     *         required: true
     *         schema:
     *           type: object
     *           properties:
     *             activate:
     *               type: boolean
     *     responses:
     *       200: 
     *          description: Company has been updated successfully.
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     */        
    app.post('/api/site/company/status/:id', siteCompany.changeStatus);

    /**
     * @swagger
     * /api/site/companyinfo:
     *   get:
     *     tags:
     *       - Company
     *     description: Get company parent info
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string
     *     responses:
     *       200: 
     *          description: Requested company record found
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     */    
    app.get('/api/site/companyinfo', siteCompany.companyDetails); // Get current login company details
    app.get('/api/site/addcpidrecords', siteCompany.addcpidrecords); // Add CPID Records

    //app.post('/api/site/company/checknameexist', siteCompany.checkNameExist); // Check Company Name Status ---'Delete'
    // app.get('/api/site/getuser', siteUser.getById);
    // app.get('/api/site/getcompanygrouplist', siteUser.getCompanyGroupList);


    /**
     * @swagger
     * /api/site/mycompanylist:
     *   get:
     *     tags:
     *       - Company
     *     description: Get child company list including self company in the list
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         in: header
     *         description: add access token with Bearer text, i.e. Bearer {access_token}
     *         required: true
     *         type: string
     *     responses:
     *       200: 
     *          description: Data loaded successfully.
     *       400: 
     *          description: invalid basic token
     *       503: 
     *          description: basic token is expired
     */
    app.get('/api/site/mycompanylist', siteCompany.getMyCompanyList);
    
};