// Environment file middleware
const dotenv = require('dotenv');
dotenv.config();

// Bcrypt password middleware
var bcrypt = require('bcryptjs');

//metrics
var Client = require('node-statsd-client').Client;
var client = new Client("localhost", 8125);
var post_my_recipes_counter = 0


// Database connection
const Pool = require('pg').Pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'csye6225',
    password: process.env.DB_PASS
})

// logger
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log` 
        // - Write all logs error (and below) to `error.log`.
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

//aws sdk
const aws = require("aws-sdk");

var topicArn = process.env.sns_topic_arn;


const postAllMyRecipe = (request, response) => {
    logger.log({
        level: 'info',
        message: 'function_call_post_all_recipe'
    });
    post_my_recipes_counter = post_my_recipes_counter + 1;
    client.count("count_recipe_request_post_allrecipe", post_my_recipes_counter);
    // checking for basic auth
    if (!request.headers.authorization || request.headers.authorization.indexOf('Basic ') === -1) {
        return response.status(401).json({ message: 'Missing Authorization Header' });
    }
    // getting username and password
    const base64Credentials = request.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    //username check
    pool.query('SELECT password,id FROM users WHERE email_address = $1', [username], (error, results) => {
        if (error) {
            logger.log({
                level: 'error',
                message: error
            });
        }
        else if (results.rowCount) {
            var jsonContents = results.rows[0]
            var hash = jsonContents.password
            var user_id = jsonContents.id

            //password check
            if (bcrypt.compareSync(password, hash)) {

                pool.query('SELECT title, recipe_id FROM recipe WHERE author_id = $1', [user_id])
                    .then(results => {
                        const res = {
                            recipes: results.rows.map(result => {
                                return '\n' + result.title + ' : ' + 'https://' + process.env.domain + '/v1/recipe/' + result.recipe_id + '\n'
                            })
                        }
                        const messagedata = (res.recipes.slice(0)).join(' \n')
                        console.log(messagedata)



                        aws.config.update({
                            secretAccessKey: process.env.aws_secret_access_key,
                            accessKeyId: process.env.aws_access_key_id,
                            region: process.env.aws_region
                        })
                        console.log("Topic " + topicArn);
                        console.log("username = " + username);


                        var params = {
                            Message: messagedata, /* required */
                            TopicArn: topicArn,
                            Subject: username
                        };

                        var publishTextPromise = new aws.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();
                        publishTextPromise.then(
                            function (data) {
                                console.log(`Message ${params.Subject} send sent to the topic ${params.TopicArn} with links \n${params.Message} }`);
                                console.log("MessageID is " + data.MessageId);
                            }).catch(
                                function (err) {
                                    console.error(err, err.stack);
                                });
                        response.status(200).json({ status: 'success' });
                    })
            }
            else {
                response.status(401).json({ message: 'Unauthorized Request, wrong password' })
            }
        }
        else {
            response.status(400).json({ message: 'Bad Request, username not found' })
        }

    })

}

module.exports = {
    postAllMyRecipe
}