console.log('Loading function');

var AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1"})
var docClient = new AWS.DynamoDB.DocumentClient();
const uuidv1 = require('uuid/v1')
var ses = new AWS.SES();


exports.handler = (event, context, callback) => {

    //Checking if the token already generated
    console.log(event.Records[0].Sns.Subject);
    console.log(event.Records[0].Sns.Message);
    var username = event.Records[0].Sns.Subject;
    var messagedata = event.Records[0].Sns.Message;
    console.log("NEW");
    console.log("Username " + username);
    var params = {
        TableName: "csye6225",
        Key: {
            "id": username
        }
    };
    docClient.get(params, function (err, data) {

        if (data.Item == undefined) {
            console.log("Inside err method");
            console.log("users::fetchOneByKey::error - " + JSON.stringify(err, null, 2));
            var newToken = uuidv1();
            var expireTime = Math.floor(Date.now() / 1000) + (60 * process.env.TTL_DELAY);
           
            var newData = {
                TableName: "csye6225",
                Item: {
                    "id": username,
                    "token": newToken,
                    "TTL": expireTime
                }
            };
            docClient.put(newData, function (err, data) {
                if (err) {
                    console.error("Unable to add record in DB", username, ". Error JSON:", JSON.stringify(err, null, 2));
                    return err;
                } else {
                    console.log("Token add to the DB succeeded:", username);
                    console.log("Calling SES to send data to username " + username + " Token :" + newToken);
                    var sender = process.env.sendermail;
                    console.log("Sender " + sender);
                                   
                    var params = {
                        Destination: { /* required */
                            // CcAddresses: [
                            //   'EMAIL_ADDRESS',
                            //   /* more items */
                            // ],
                            ToAddresses: [
                                username,
                                /* more items */
                            ]
                        },
                        Message: { /* required */
                            Body: { /* required */
                                Html: {
                                    Charset: "UTF-8",
                                    Data: messagedata
                                    // Data: "HTML_FORMAT_BODY"
                                },
                                Text: {
                                    Charset: "UTF-8",
                                    Data: "TEXT_FORMAT_BODY"
                                }
                            },
                            Subject: {
                                Charset: 'UTF-8',
                                Data: 'Link to all Recipes'
                            }
                        },
                        Source: sender, /* required */
                        //   ReplyToAddresses: [
                        //      'EMAIL_ADDRESS',
                        //     /* more items */
                        //   ],
                    };

                    // Create the promise and SES service object
                    var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

                    // Handle promise's fulfilled/rejected states
                    sendPromise.then(
                        function (data) {
                            console.log(data.MessageId);
                        }).catch(
                            function (err) {
                                console.error(err, err.stack);
                            });
                        

                    return true;
                }
            });
        }
        else {
            console.log("Token Present !! No Action needed:", data.Item.token);
            return true;
        }
    });
    return false;
};