'use strict';

var siteCommand = require('../controller/commandController');

/**
 * @swagger
 * definition:
 *   CommandGet:
 *     properties:
 *       id:
 *         type: string
 *   CommandPost:
 *     properties:
 *       name:
 *         type: string
 *       command:
 *         type: string
 *     required:
 *     - name
 *     - command
 *     example:
 *       name: Puma
 *       command: 1_1
 */

module.exports = function(app) {

	/**
	 * @swagger
	 * /api/site/command/{id}:
	 *   get:
	 *     tags:
	 *       - Commands
	 *     description: Returns a single command record
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *        - name: id
	 *          description: Command's id
	 *          in: path
	 *          required: true
	 *          type: integer
	 *          format: int64
	 *     responses:
	 *       200:
	 *         description: A single command
	 *     schema:
	 *         $ref: '#/definitions/CommandGet'
	 */
    app.post('/api/site/command', siteCommand.getCommandList); // Get command list
    

    app.get('/api/site/command/:id', siteCommand.getCommand); // get Command Record by ID
    app.put('/api/site/command/:id', siteCommand.updateCommand); // Update Command
    app.post('/api/site/command/add', siteCommand.addCommand); // Add Command
    app.delete('/api/site/command/:id', siteCommand.deleteCommand); // Delete Command
    app.get('/api/site/commandlist', siteCommand.getCommands); // Get command Command

};