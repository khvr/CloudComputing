// Environment file middleware
const dotenv = require('dotenv');
dotenv.config();

// Bcrypt password middleware
var bcrypt = require('bcryptjs');

const aws = require('aws-sdk');
aws.config.update({
  secretAccessKey: process.env.aws_secret_access_key,
  accessKeyId: process.env.aws_access_key_id,
  region: process.env.aws_region
})

// aws-sdk s3 bucket connection
const s3 = new aws.S3()

//Statsd-Client
var Client = require('node-statsd-client').Client;
var client = new Client("localhost", 8125);
var delete_recipe_counter = 0;

// Database connection
const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'csye6225',
  password: process.env.DB_PASS
})

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

const deleteRecipe = (request, response) => {
  logger.log({
    level: 'info',
    message: 'function_call_delete_recipe'
  });
  var recipeDeleteStartDate = new Date();
  delete_recipe_counter = delete_recipe_counter + 1;
  client.count("count_recipe_request_delete", delete_recipe_counter);

  // checking for basic auth
  if (!request.headers.authorization || request.headers.authorization.indexOf('Basic ') === -1) {
    return response.status(401).json({ message: 'Missing Authorization Header' });
  }
  // getting username and password
  const base64Credentials = request.headers.authorization.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  const recipe_id = request.params.recipeId;

  //username check
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
      //password check
      if (bcrypt.compareSync(password, hash)) {

        // Getting user ID
        pool.query('SELECT id FROM users WHERE email_address = $1', [username], (error, results) => {
          if (error) {
            logger.log({
              level: 'error',
              message: error
            });
          }
          const user_id = results.rows[0].id
          pool.query('SELECT author_id FROM recipe WHERE recipe_id = $1', [recipe_id], (error, results) => {
            if (error) {
              logger.log({
                level: 'error',
                message: error
              });
            }
            else if (results.rowCount) {
              const author_id = results.rows[0].author_id
              if (user_id == author_id) {
                pool.query('SELECT * FROM recipe_image WHERE recipe_id = $1 AND user_id=$2 ', [recipe_id, user_id], (error, results) => {
                  if (error) {
                    logger.log({
                      level: 'error',
                      message: error
                    });
                  }
                  // console.log(results.rows[0])
                  else if (results.rowCount) {
                    const recipe_image_key = results.rows[0].recipe_image_name
                    const params = { Bucket: process.env.WEBAPP_S3_BUCKET_NAME, Key: recipe_image_key }

                    // Deleting from s3 bucket
                    s3.deleteObject(params, (err, data) => {
                      var recipeDelete_dbStartDate = new Date();
                      pool.query('DELETE FROM recipe WHERE recipe_id = $1', [recipe_id], (error, results) => {
                        if (error) {
                          logger.log({
                            level: 'error',
                            message: error
                          })
                        }
                        else {
                          var recipeDelete_dbEndDate = new Date();
                          var Delete_recipe_db_milliseconds = recipeDelete_dbEndDate.getMilliseconds() - recipeDelete_dbStartDate.getMilliseconds();
                          client.timing("timing_recipe(ms)_delete_query", Delete_recipe_db_milliseconds);
                          pool.query('DELETE FROM recipe_image WHERE recipe_id = $1 AND user_id= $2', [recipe_id, user_id], (error, results) => {
                            if (error) {
                              logger.log({
                                level: 'error',
                                message: error
                              })
                            }
                            pool.query('DELETE FROM recipe_image_metadata WHERE recipe_id = $1', [recipe_id], (error, results) => {
                              if (error) {
                                logger.log({
                                  level: 'error',
                                  message: error
                                })
                              }
                              response.status(204).send(`Recipe and its image are deleted`)
                            })
                          })
                        }
                      })
                    })
                  }
                })
              }
              else {
                response.status(401).json({ message: 'Unauthorized Request, wrong author' })
              }
            }
            else {
              response.status(404).json({ message: 'Recipe Not found' })
            }
          })
        })
      }
      else {
        response.status(401).json({ message: 'Unauthorized Request, wrong password' })
      }
    }
    else {
      response.status(404).json({ message: ' username not found' })
    }
  })
  var recipeDeleteEndDate = new Date();
  var delete_recipe_milliseconds = recipeDeleteEndDate.getMilliseconds() - recipeDeleteStartDate.getMilliseconds();
  client.timing("timing_recipe(ms)_request_delete", delete_recipe_milliseconds);
}

module.exports = {
  deleteRecipe
}