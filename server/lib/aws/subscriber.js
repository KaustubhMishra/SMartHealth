/* Cron Boot */
var awsConfig = require('../../config/awsConfig')
var awsSNS = awsConfig.SNS;

/*
 AWS SNS
 @ Author : GK
 @ Create Topic
 @ Param : Name = Name of Topic ( Require ) 
 */
var createTopic = function createTopic(topicName, callback) {

   var params = {
            Name: topicName
    };
    awsSNS.createTopic(params, function(err, data) 
    {
        if(err)
        {
          return callback({"data":err, 'response': 'error' }); // error occurred
        }
        else
        {
          return callback({"data":data, 'response': 'success' }); // success response
        }
    });
    
};

/*
 AWS SNS
 @ Author : GK
 @ Delete Topic
 @ Param : topicArn = Topic Arn ( Require ) 
 */
var deleteTopic = function deleteTopic(topicArn, callback) {

    var params = {
            TopicArn: topicArn
    };
    
    awsSNS.deleteTopic(params, function(err, data) 
    {
        if(err)
        {
          return callback({"data":err, 'response': 'error' }); // error occurred
        }
        else
        {
          return callback({"data":data, 'response': 'success' }); // success response
        }
    });
    
};

/*
 AWS SNS
 @ Author : GK
 @ Create IOS Application 
 @ Param : Attributes
   @ Param : PlatformCredential = Private key of P12 Certificate ( Require )
   @ Param : PlatformPrincipal =  SSL Certificate of P12 Certificate ( Require )  
   @ Param : EventEndpointCreated = Topic Arn ( Optional )
   @ Param : EventEndpointDeleted = Topic Arn ( Optional )
   @ Param : EventEndpointUpdated = Topic Arn ( Optional )
   @ Param : EventDeliveryFailure = Topic Arn ( Optional )
 @ Param : Name = Application Name ( Require )
 @ Param : Platform = APNS (IOS Production) / APNS_SANDBOX (IOS Development)  ( Require )
 */

var createAppleApplication = function createAppleApplication(appname, appplatform, certificate, privatekey, callback) {

    var params = {
      Attributes: {
          PlatformCredential: privatekey,
          PlatformPrincipal: certificate
          /* ,
          EventEndpointCreated: topic_arn,
          EventEndpointDeleted: topic_arn,
          EventEndpointUpdated: topic_arn,
          EventDeliveryFailure: topic_arn */
      },
      Name: appname,
      Platform: appplatform
    };
    awsSNS.createPlatformApplication(params, function(err, data)
    {
      if(err)
      {
        return callback({"data":err, 'response': 'error' }); // error occurred
      }
      else 
      {
        return callback({"data":data, 'response': 'success' }); // success response
      }
    });
}

/*
 AWS SNS
 @ Author : GK
 @ Update IOS Application 
 @ Param : Attributes
   @ Param : PlatformCredential = Private key of P12 Certificate ( Require )
   @ Param : PlatformPrincipal =  SSL Certificate of P12 Certificate ( Require )  
   @ Param : EventEndpointCreated = Topic Arn ( Optional )
   @ Param : EventEndpointDeleted = Topic Arn ( Optional )
   @ Param : EventEndpointUpdated = Topic Arn ( Optional )
   @ Param : EventDeliveryFailure = Topic Arn ( Optional )
 @ Param : PlatformApplicationArn = Application ARN ( Require )
 */

var updateAppleApplication = function updateAppleApplication(appARN, certificate, privatekey, callback) {

    var params = {
        Attributes: {
            PlatformCredential: privatekey,
            PlatformPrincipal: certificate,
            /*EventEndpointCreated: topic_arn,
            EventEndpointDeleted: topic_arn,
            EventEndpointUpdated: topic_arn,
            EventDeliveryFailure: topic_arn*/
        },
        PlatformApplicationArn : appARN
      };
      awsSNS.setPlatformApplicationAttributes(params, function(err, data)
      {
        if(err)
        {
          return callback({"data":err, 'response': 'error' }); // error occurred
        }
        else 
        {
          return callback({"data":data, 'response': 'success' }); // success response
        }
      });
}

/*
 AWS SNS
 @ Author : GK
 @ Create Android Application 
 @ Google Cloud Messaging ( GCM )
 @ Param : Attributes
   @ Param : PlatformCredential = GCM API key ( Require )
   @ Param : EventEndpointCreated = Topic Arn ( Optional )
   @ Param : EventEndpointDeleted = Topic Arn ( Optional )
   @ Param : EventEndpointUpdated = Topic Arn ( Optional )
   @ Param : EventDeliveryFailure = Topic Arn ( Optional )
 @ Param : Name = Application Name ( Require )
 @ Param : Platform =  GCM ( Google Cloud Messaging ) ( Require )
 */

var createAndroidApplication = function createAndroidApplication(appname, appplatform, apikey, callback) {

    var params = {
      Attributes: {
          PlatformCredential: apikey
          /*EventEndpointCreated: topic_arn,
          EventEndpointDeleted: topic_arn,
          EventEndpointUpdated: topic_arn,
          EventDeliveryFailure: topic_arn */
      },
      Name: appname,
      Platform: appplatform
    };
    awsSNS.createPlatformApplication(params, function(err, data)
    {
      if(err)
      {
        return callback({"data":err, 'response': 'error' }); // error occurred
      }
      else 
      {

        return callback({"data":data, 'response': 'success' }); // success response
      }
    });
}

/*
 AWS SNS
 @ Author : GK
 @ Update Android Application 
 @ Google Cloud Messaging ( GCM )
 @ Param : Attributes
   @ Param : PlatformCredential = GCM API key ( Require )
   @ Param : EventEndpointCreated = Topic Arn ( Optional )
   @ Param : EventEndpointDeleted = Topic Arn ( Optional )
   @ Param : EventEndpointUpdated = Topic Arn ( Optional )
   @ Param : EventDeliveryFailure = Topic Arn ( Optional )
 @ Param : PlatformApplicationArn = Application ARN ( Require )
 */

var updateAndroidApplication = function updateAndroidApplication(appARN, apikey, callback) {

    var params = {
        Attributes: {
            PlatformCredential: apikey
            /*EventEndpointCreated: topic_arn,
            EventEndpointDeleted: topic_arn,
            EventEndpointUpdated: topic_arn,
            EventDeliveryFailure: topic_arn */
        },
        PlatformApplicationArn : appARN
      };
      awsSNS.setPlatformApplicationAttributes(params, function(err, data)
      {
        if(err)
        {
          return callback({"data":err, 'response': 'error' }); // error occurred
        }
        else 
        {
          return callback({"data":data, 'response': 'success' }); // success response
        }
      });
}

/*
 AWS SNS
 @ Author : GK
 @ Email Subscription 
 @ Param : Protocol = email ( Require )
 @ Param : TopicArn = Topic Arn ( Require )
 @ Param : Endpoint = Email address ( Require )
 */

var emailSubscription = function emailSubscription(topicARN, emailId, callback) {

    var params = {
      Protocol: 'email',
      TopicArn: topicARN,
      Endpoint: emailId
    };
    awsSNS.subscribe(params, function(err, data)
    {
        if (err)
        {
          return callback({"data":err, 'response': 'error' }); // error occurred
        }
        else
        {
          return callback({"data":data, 'response': 'success' }); // success response
        }
    });
}

/*
 AWS SNS
 @ Author : GK
 @ Unsubscription 
 @ Param : SubscriptionArn = Subscription Arn ( Require )
 */

var unSubscribe = function unSubscribe(SubscriptionArn ,callback)
{
    var params = {
      SubscriptionArn: SubscriptionArn /* required */
    };
    
    awsSNS.unsubscribe(params, function(err, data)
    {
        if (err)
        {
          return callback({"data":err, 'response': 'error' }); // error occurred
        }
        else
        {
          return callback({"data":data, 'response': 'success' }); // success response
        }
    });
}

/*
 AWS SNS
 @ Author : GK
 @ Create endpoint platform for application
 @ Push Notification 
 @ Param : PlatformApplicationArn = Application Arn ( Require )
 @ Param : deviceTokenId = Device Token ( Require )
 @ Param : CustomUserData = Any refrence text : not use anywhere in aws ( Require )
 */

var createPlatformEndpoint = function createPlatformEndpoint(applicationArn, deviceTokenId, customUserInformation, callback)
{

  var params = {
    PlatformApplicationArn: applicationArn,
    Token: deviceTokenId,
    CustomUserData: customUserInformation
  };

  awsSNS.createPlatformEndpoint(params, function(err, data)
  {
      if(err)
      {
        return callback({"data":err, 'response': 'error' }); // error occurred  
      }
      else
      {    
        return callback({"data":data, 'response': 'success' }); // success response
      }
  });
}

/*
 AWS SNS
 @ Author : GK
 @ Push notification subscription
 @ Param : Protocol = 'application' ( Require )
 @ Param : TopicArn = Topic Arn ( Require )
 @ Param : Endpoint = Device endpointArn ( Require )
 */

var pushSubscription = function pushSubscription( topicArn, endPointArn, callback)
{
    var params = {
      Protocol: 'application',
      TopicArn: topicArn,
      Endpoint: endPointArn
    };
    
   awsSNS.subscribe(params, function(err, data)
   {
        if(err)
        {
          return callback({"data":err, 'response': 'error' }); // error occurred  
        }
        else
        {
          return callback({"data":data, 'response': 'success' }); // success response
        }
   });
}

var getSubscriptionRecord = function getSubscriptionRecord( topicArn, callback)
{
  var params = {
    TopicArn: topicArn
  };

  awsSNS.listSubscriptionsByTopic(params, function(err, data) {
    if (err)
    {
      return callback({"data":err, 'response': 'error' }); // error occurred  
    }
    else
    {
      return callback({"data":data, 'response': 'success' }); // success response
    }
  });
}

/*
 AWS SNS
 @ Author : GK
 @ Push notification subscription
 @ Update Device Token in endpointArn
 @ Param : endPointArn = Device endpointArn ( Require )
 @ Param : devicePushToken = Device new Token ( Require )
 */
var updateEndpointDeviceId = function updateEndpointDeviceId(endPointArn ,devicePushToken, callback)
{
  var params = {
      Attributes: { 
        Token: devicePushToken,
        Enabled: 'true',
        
      },
      EndpointArn: endPointArn
  };

  awsSNS.setEndpointAttributes(params, function(err, data)
  {
    if(err)
    {
      return callback({"data":err, 'response': 'error' }); // error occurred  
    }
    else
    {
      return callback({"data":data, 'response': 'success' }); // success response
    }
  });
}

/*
 AWS SNS
 @ Author : GK
 @ Push notification subscription
 @ Remove registred device
 @ Param : endPointArn = Device endpointArn ( Require )
 */
var deleteEndpoint = function deleteEndpoint(endPointArn, callback)
{
    var params = {
      EndpointArn: endPointArn
    };
    awsSNS.deleteEndpoint(params, function(err, data) 
    {
      if(err)
      {
         return callback({"data":err, 'response': 'error' }); // error occurred  
      }
      else
      {
         return callback({"data":data, 'response': 'success' }); // success response
      }
    });
}

/*
 AWS SNS
 @ Author : GK
 @ SMS Subscription 
 @ Param : Protocol = sms ( Require )
 @ Param : TopicArn = Topic Arn ( Require )
 @ Param : Endpoint = Phone Number ( Require )
 */
var smsSubscription = function smsSubscription(topicARN, phoneNumber, callback) {

    var params = {
      Protocol: 'sms',
      TopicArn: topicARN,
      Endpoint: phoneNumber
    };
    awsSNS.subscribe(params, function(err, data)
    {
        if (err)
        {
          return callback({"data":err, 'response': 'error' }); // error occurred
        }
        else
        {
          return callback({"data":data, 'response': 'success' }); // success response
        }
    });
}

/*
 AWS SNS
 @ Author : GK
 @ Get Subscribe Record details Using Subscription Arn
 @ Param : subscriptionArn = Subscription Arn ( Require )
 */
var getSubscriptionData = function getSubscriptionData( subscriptionArn, callback)
{
    var params = {
      SubscriptionArn: subscriptionArn, /* required */
    };
    awsSNS.getSubscriptionAttributes(params, function(err, data)
    {
        if (err)
        {
          return callback({'data':err, 'response': 'error' }); // error occurred
        }
        else
        {
          return callback({'data':data, 'response': 'success' }); // success response
        }
    });
}

/*
 AWS SNS
 @ Author : GK
 @ Delete Application 
 @ Param : applicationArn =  Application Arn ( Require )
 */
var deleteApplication = function deleteApplication( applicationArn, callback) {

    var params = {
        PlatformApplicationArn: applicationArn /* required */
    };
    awsSNS.deletePlatformApplication(params, function(err, data)
    {
      if(err)
      {
        return callback({"data":err, 'response': 'error' }); // error occurred
      }
      else 
      {

        return callback({"data":data, 'response': 'success' }); // success response
      }
    });
}

module.exports = {
    createTopic: createTopic,
    deleteTopic: deleteTopic,
    createAppleApplication: createAppleApplication,
    updateAppleApplication: updateAppleApplication,
    createAndroidApplication: createAndroidApplication,
    updateAndroidApplication: updateAndroidApplication,
    emailSubscription: emailSubscription,
    unSubscribe: unSubscribe,
    createPlatformEndpoint: createPlatformEndpoint,
    pushSubscription: pushSubscription,
    getSubscriptionRecord: getSubscriptionRecord,
    updateEndpointDeviceId: updateEndpointDeviceId,
    deleteEndpoint: deleteEndpoint,
    smsSubscription: smsSubscription,
    getSubscriptionData: getSubscriptionData,
    deleteApplication: deleteApplication
};