'use strict';

var siteRule = require('../controller/ruleController');
module.exports = function(app) {
    app.post('/api/site/getrulelist', siteRule.getRuleList);
    app.get('/api/site/rule/list/pageState/:pageState', siteRule.getRules);
    app.post('/api/site/rule', siteRule.addRule);
    app.put('/api/site/rule/:id', siteRule.updateRule);
    app.get('/api/site/rule/things', siteRule.getRuleThings);
    app.get('/api/site/rule/devices', siteRule.getDevices);
    app.get('/api/site/rule/commands', siteRule.getRuleCommands);
    app.get('/api/site/rule/:id', siteRule.getRuleById);
    app.delete('/api/site/rule/:id', siteRule.deleteRule);
    app.post('/api/site/rule/status/:id', siteRule.changeStatus);    
};