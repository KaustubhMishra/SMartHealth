 /**
  * @author NB
  * Cluster setup 
  */
 var setupCluster = function setupCluster(app) {
     var fs = require('fs');
     var http = require('http');
     var https = require('https');
     var cluster = require('cluster');
     var config = require('./settings');

     var options = {
       key: fs.readFileSync('server/config/ssl-certificate/key.pem'),
       cert: fs.readFileSync('server/config/ssl-certificate/cert.pem')
     };

     var restartWorkers = function restartWorkers() {
             var wid;
             var workerIds = [];

             // create a copy of current running worker ids
             for (wid in cluster.workers) {
                 workerIds.push(wid);
             }

             workerIds.forEach(function(wid) {
                 cluster.workers[wid].send({
                     text: 'shutdown',
                     from: 'master'
                 });

                 setTimeout(function() {
                     if (cluster.workers[wid]) {
                         cluster.workers[wid].kill('SIGKILL');
                     }
                 }, 5000);
             });
         },
         resizeWorkers = function resizeWorkers(wSize) {
             if (isNaN(wSize) || wSize == '' || wSize == undefined) {
                 return;
             }

             var up = wSize - parseInt(Object.keys(cluster.workers).length);

             if (up == 0) { //no change  in worker number 
                 return;
             } else {
                 var wid;
                 var workerIds = [];
                 console.log("=============================================");
                 if (up > 0) {
                     console.log("Upgrading ...");
                     console.log("Current Workers: " + parseInt(Object.keys(cluster.workers).length));
                     console.log("Worker to be upgrade: " + up);
                     console.log("Worker upgrading...");
                     //create new worker
                     for (var i = 0; i < up; i++) {
                         worker = cluster.fork();
                         worker.on('message', function() {
                             console.log('arguments', arguments);
                         });
                     }
                     setTimeout(function() {
                         console.log("Upgrade done");
                     }, 1000);
                 } else {
                     up = -up;
                     console.log("Downgrading ...");
                     console.log("Current Workers: " + parseInt(Object.keys(cluster.workers).length));
                     console.log("Worker to be downgrade: " + up);
                     var k = 1;
                     // create a copy of current running worker ids
                     for (wid in cluster.workers) {
                         workerIds.push(wid);
                     }
                     console.log("Worker downgrading...");
                     workerIds.forEach(function(wid) {
                         //remove worker
                         if (k <= up) {
                             cluster.workers[wid].send({
                                 text: 'disconnect',
                                 from: 'master'
                             });
                             k++;
                         } else {
                             return;
                         }
                     });
                     setTimeout(function() {
                         console.log("Downgrade done");
                     }, 1000);
                 }
             }
         },
         getWorkerList = function getWorkerList() {
             setTimeout(function() {
                 console.log("=============================================");
                 console.log("Running Workers List.");
                 for (wid in cluster.workers) {
                     console.log('Worker ' + cluster.workers[wid].process.pid + ' is alive!');
                 }
             }, 500);
         },
         getWorkerCount = function getWorkerCount() {
             setTimeout(function() {
                 console.log("=============================================");
                 console.log("Total Running worker: " + parseInt(Object.keys(cluster.workers).length));
             }, 500);
         };
     if (cluster.isMaster) {
         var numWorkers;
         var i;
         var worker;

         //Get worker count
         try {
             var fileContent = fs.readFileSync('./server/config/clusterConfig.json').toString();
             var settings = JSON.parse(fileContent);

             if (settings.numWorkers && parseInt(settings.numWorkers) > 0) {
                 numWorkers = parseInt(settings.numWorkers);
             } else {
                 numWorkers = require('os').cpus().length;
             }
         } catch (e) {
             numWorkers = require('os').cpus().length;
         }

         console.log('Master cluster setting up ' + numWorkers + ' workers...');

         for (i = 0; i < numWorkers; i++) {
             worker = cluster.fork();
             worker.on('message', function() {
                 console.log('arguments', arguments);
             });
         }
         var fsTimeout;

         // fs.watch('./server/config/clusterConfig.json', function(file) {
         //     if (!fsTimeout) {
         //         try {
         //             var content = fs.readFileSync('./server/config/clusterConfig.json').toString();
         //             var settings = JSON.parse(content);
         //             if (settings.numWorkers && parseInt(settings.numWorkers) > 0) {
         //                 resizeWorkers(parseInt(settings.numWorkers));
         //             }
         //             if (settings.restartWorkers && settings.restartWorkers == true) {
         //                 //setTimeout(function(){
         //                 restartWorkers();
         //                 //},500);   
         //             }
         //             //print worker list
         //             if (settings.getWorkerList && settings.getWorkerList == true) {
         //                 getWorkerList();
         //             }
         //             //print worker count
         //             if (settings.getWorkerCount && settings.getWorkerCount == true) {
         //                 getWorkerCount();
         //             }
         //         } catch (e) {}
         //         fsTimeout = setTimeout(function() {
         //                 fsTimeout = null
         //             }, 300) // give 300 m seconds for multiple events
         //     }

         // });

         cluster.on('exit', function(_worker, code, signal) {
             console.log('Worker ' + _worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
             if (code != 151) {
                 console.log('Starting a new worker');
                 worker = cluster.fork();
                 worker.on('message', function() {
                     console.log('arguments', arguments);
                 });
             }
         });
     } else {

         http.createServer(app).listen(config.appPort, function() {
             console.log("Express server listening on port %s with worker pid:%s ", config.appPort, process.pid);
         });

         // Https
         https.createServer(options, app).listen(config.appSSLPort, function() {
             console.log("Express https(SSL) server listening on port %s with worker pid:%s ", config.appSSLPort, process.pid);
         });

         process.on('message', function(message) {
             if (message.text === 'shutdown') {
                 process.exit(0);
             }
             if (message.text === 'disconnect') {
                 process.exit(151);
             }
         });

     }
 };

 module.exports = {
     setup: setupCluster
 };