// Environment file middleware
const dotenv = require('dotenv');
dotenv.config();
// Bcrypt password middleware
var bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);

var Client = require('node-statsd-client').Client;
var client = new Client("localhost", 8125);
var post_user_counter = 0
var get_user_counter = 0
var put_user_counter = 0

//logger
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

// Database connection
const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'csye6225',
  password: process.env.DB_PASS
})


//Password and email check
var passwordValidator = require('password-validator')
var validator = require("email-validator")

//Create a schema for password check
var schema = new passwordValidator()
schema
  .is().min(8)                                    // Minimum length 8
  .is().max(100)                                  // Maximum length 100
  .has().uppercase()                              // Must have an uppercase letter
  .has().lowercase()                              // Must have a lowercase letter
  .has().digits()                                 // Must have digits
  .has().symbols()                                // Must have a symbol
  .has().not().spaces()                           // Should not have spaces

//POST a new user

const createUser = (request, response) => {
  logger.log({
    level: 'info',
    message: 'function_call_post_user'
  });
  var userPostStartDate = new Date();
  //client.increment('my_counter');
  post_user_counter = post_user_counter + 1;
  client.count("count_user_request_post", post_user_counter)

  const { first_name, last_name, password, email_address } = request.body

  if (request.body.hasOwnProperty('first_name') && request.body.hasOwnProperty('last_name') && request.body.hasOwnProperty('password') && request.body.hasOwnProperty('email_address')) {
    if (schema.validate(password) && validator.validate(email_address)) {

      const account_created = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      const account_updated = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')

      // Check if the email address exists
      pool.query('SELECT * FROM users WHERE email_address = $1', [email_address], (error, results) => {
        if (error) {
          logger.log({
            level: 'error',
            message: error
          });
        }
        else if (results.rowCount) {
          response.status(400).json({ message: 'Bad Request, User account exists' })
        }
        else {
          const hash = bcrypt.hashSync(password, salt);
          var userInsertStartDate = new Date();
          pool.query('INSERT INTO users (first_name, last_name, password, email_address, account_created, account_updated) VALUES ($1, $2, $3, $4, $5, $6)', [first_name, last_name, hash, email_address, account_created, account_updated], (error, results) => {
            if (error) {
              logger.log({
                level: 'error',
                message: error
              });
            }
            var userInsertEndDate = new Date();
            var Insert_user_db_milliseconds = userInsertEndDate.getMilliseconds() - userInsertStartDate.getMilliseconds();
            client.timing("timing_user(ms)_insert_query", Insert_user_db_milliseconds);
            pool.query('SELECT id, first_name, last_name, email_address, account_created, account_updated FROM users WHERE email_address = $1', [email_address], (error, results) => {
              if (error) {
                logger.log({
                  level: 'error',
                  message: error
                });
              }
              response.status(201).send(results.rows[0])

            })
          })
        }
      })
    }
    else { response.status(400).json({ message: 'Bad Request, Check your email and password' }) }
  }

  else {
    response.status(400).json({ message: 'Bad Request, Please enter the required details' })
  }
  var userPostEndDate = new Date();
  var post_user_milliseconds = userPostEndDate.getMilliseconds() - userPostStartDate.getMilliseconds();
  client.timing("timing_user(ms)_request_post", post_user_milliseconds);
}



// GET a single user by id

const getUserByAuth = (request, response) => {
  logger.log({
    level: 'info',
    message: 'function_call_get_user'
  });
  var userGetStartDate = new Date();
  get_user_counter = get_user_counter + 1;
  client.count("count_user_request_get", get_user_counter);

  if (!request.headers.authorization || request.headers.authorization.indexOf('Basic ') === -1) {
    return response.status(401).json({ message: 'Missing Authorization Header' });
  }

  const base64Credentials = request.headers.authorization.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  // const id = request.params.id

  pool.query('SELECT password FROM users WHERE email_address = $1', [username], (error, results) => {

    if (error) {
      logger.log({
        level: 'error',
        message: error
      });
    }
    else if (results.rowCount) {

      var jsonContents = results.rows[0]
      //console.log(jsonContents)
      var hash = jsonContents.password

      if (bcrypt.compareSync(password, hash)) {
        var userSelectStartDate = new Date();
        pool.query('SELECT id, first_name, last_name, email_address, account_created, account_updated FROM users WHERE email_address = $1', [username], (error, results) => {
          if (error) {
            logger.log({
              level: 'error',
              message: error
            });
          }
          else if (results.rowCount) {
            var userSelectEndDate = new Date();
            var Select_user_db_milliseconds = userSelectEndDate.getMilliseconds() - userSelectStartDate.getMilliseconds();
            client.timing("timing_user(ms)_select_query", Select_user_db_milliseconds);
            response.status(200).send(results.rows[0])

          }
          else {
            response.status(401).json({ message: "Unauthorized Request" })
          }
        })
      }
      else {
        response.status(401).json({ message: 'Unauthorized Request, wrong password' })
      }
    }
    else {
      response.status(401).json({ message: 'Bad Request, username not found' })
    }

  })
  var userGetEndDate = new Date();
  var get_user_milliseconds = userGetEndDate.getMilliseconds() - userGetStartDate.getMilliseconds();
  client.timing("timing_user(ms)_request_get", get_user_milliseconds);
}

// PUT updated data in an existing user

const updateUser = (request, response) => {
  logger.log({
    level: 'info',
    message: 'function_call_put_user'
  });
  var userPutStartDate = new Date();
  put_user_counter = put_user_counter + 1;
  client.count("count_user_request_put", put_user_counter);
  if (!request.headers.authorization || request.headers.authorization.indexOf('Basic ') === -1) {
    return response.status(401).json({ message: 'Missing Authorization Header' });
  }

  const base64Credentials = request.headers.authorization.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  // // const id = request.params.id

  pool.query('SELECT password FROM users WHERE email_address = $1', [username], (error, results) => {
    if (error) {
      logger.log({
        level: 'error',
        message: error
      });
    }
    else if (results.rowCount) {

      var jsonContents = results.rows[0]
      var hash = jsonContents.password


      if (bcrypt.compareSync(password, hash)) {

        const { first_name, last_name, password } = request.body

        if (Object.keys(request.body).length == 3 && request.body.hasOwnProperty('first_name') && request.body.hasOwnProperty('last_name') && request.body.hasOwnProperty('password')) {

          if (schema.validate(password)) {
            const account_updated_1 = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

            const hash = bcrypt.hashSync(password, salt);
            pool.query('SELECT id, first_name, last_name, email_address, account_created, account_updated FROM users WHERE email_address = $1', [username], (error, results) => {
              if (error) {
                logger.log({
                  level: 'error',
                  message: error
                });
              }
              else if (results.rowCount) {
                var userUpdateStartDate = new Date();
                pool.query('UPDATE users SET first_name = $1, last_name = $2, password = $3, account_updated = $4 WHERE email_address = $5', [first_name, last_name, hash, account_updated_1, username], (error, results) => {
                  response.status(204).json({ message: 'No Content' })
                  var userUpdateEndDate = new Date();
                  var Update_user_db_milliseconds = userUpdateEndDate.getMilliseconds() - userUpdateStartDate.getMilliseconds();
                  client.timing("timing_user(ms)_update_query", Update_user_db_milliseconds);

                })
              }
              else {
                response.status(401).json({ message: "Unauthorized Request" })
              }
            })
          }
          else {
            response.status(400).json({ message: 'Bad Request, Weak Password' })
          }

        }
        else {
          response.status(400).json({ message: 'Bad Request, Please set only the required fields' })
        }

      }
      else {
        response.status(401).json({ message: `Unauthorized request, Wrong password` })
      }
    }
    else {
      response.status(401).json({ message: 'Bad Request, username not found' })

    }

  })
  var userPutEndDate = new Date();
  var put_user_milliseconds = userPutEndDate.getMilliseconds() - userPutStartDate.getMilliseconds();
  client.timing("timing_user(ms)_request_put", put_user_milliseconds);
}

//EXPORT

module.exports = {
  createUser,
  getUserByAuth,
  updateUser
}