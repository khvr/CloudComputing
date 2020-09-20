// Environment file middleware
const dotenv = require('dotenv');
dotenv.config();

// Bcrypt password middleware
var bcrypt = require('bcryptjs');

const aws = require('aws-sdk');

// aws-sdk s3 bucket connection
const s3 = new aws.S3()

//Statsd-Client
var Client = require('node-statsd-client').Client;
var client = new Client("localhost", 8125);
var delete_image_counter = 0


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

const deleteRecipeImage = (request, response) => {
  logger.log({
    level: 'info',
    message: 'function_call_delete_recipe_image'
  });
  var recipe_imageDeleteStartDate = new Date();
  delete_image_counter = delete_image_counter + 1;
  client.count("count_image_request_delete", delete_image_counter);

  // checking for basic auth
  if (!request.headers.authorization || request.headers.authorization.indexOf('Basic ') === -1) {
    return response.status(401).json({ message: 'Missing Authorization Header' });
  }
  // getting username and password
  const base64Credentials = request.headers.authorization.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  const recipe_id = request.params.recipeId;
  const image_id = request.params.imageId;

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
      const user_id = results.rows[0].id
      var hash = jsonContents.password

      //password check
      if (bcrypt.compareSync(password, hash)) {

        pool.query('SELECT * FROM recipe_image WHERE recipe_image_id = $1 ', [image_id], (error, results) => {
          if (error) {
            logger.log({
              level: 'error',
              message: error
            });
          }
          // Recipe image check
          else if (results.rowCount) {
            pool.query('SELECT author_id , recipe_id FROM recipe WHERE author_id = $1 AND recipe_id = $2 ', [user_id, recipe_id], (error, results) => {
              if (error) {
                logger.log({
                  level: 'error',
                  message: error
                });
              }
              //Recipe author check
              else if (results.rowCount) {
                pool.query('SELECT * FROM recipe_image WHERE recipe_image_id = $1 AND recipe_id = $2 AND user_id=$3 ', [image_id, recipe_id, user_id], (error, results) => {
                  if (error) {
                    logger.log({
                      level: 'error',
                      message: error
                    });
                  }
                  //Recipe Image author check
                  else if (results.rowCount) {
                    const recipe_image_key = results.rows[0].recipe_image_name
                    const params = { Bucket: process.env.WEBAPP_S3_BUCKET_NAME, Key: recipe_image_key }
                    // Deleting from s3 bucket
                    s3.deleteObject(params, (err, data) => {
                      if (err) {
                        logger.log({
                          level: 'error',
                          message: err.stack
                        });
                      }
                      else {
                        var recipe_image_db_DeleteStartDate = new Date();
                        pool.query('DELETE FROM recipe_image WHERE recipe_image_id = $1 AND recipe_id = $2 AND user_id= $3', [image_id, recipe_id, user_id], (error, results) => {
                          if (error) {
                            logger.log({
                              level: 'error',
                              message: error
                            });
                          }
                          var recipe_image_db_DeleteEndDate = new Date();
                          var Delete_recipe_image_db_milliseconds = recipe_image_db_DeleteEndDate.getMilliseconds() - recipe_image_db_DeleteStartDate.getMilliseconds();
                          client.timing("timing_recipe_image(ms)_delete_query", Delete_recipe_image_db_milliseconds);
                          response.status(204).send(`Recipe image deleted`)
                          pool.query('DELETE FROM recipe_image_metadata WHERE recipe_image_id = $1', [image_id], (error, results) => {
                            if (error) {
                              logger.log({
                                level: 'error',
                                message: error
                              });
                            }
                          })
                          pool.query('UPDATE recipe SET  image = null WHERE recipe_id = $1 AND author_id = $2', [recipe_id, user_id], (error, results) => {
                            if (error) {
                              logger.log({
                                level: 'error',
                                message: error
                              });
                            }
                          })
                        })
                      }
                    })
                  }
                  else {
                    response.status(401).json({ message: 'Unauthorized Request for ImageId, wrong author ' })
                  }
                })
              }
              else {
                response.status(401).json({ message: 'Unauthorized Request, wrong author' })
              }
            })
          }
          else {
            response.status(404).json({ message: 'Image Not Found' })
          }
        })
      }
      else {
        response.status(401).json({ message: 'Unauthorized Request, wrong password' })
      }
    }
    else {
      response.status(404).json({ message: 'Bad Request, username not found' })
    }
  })
  var recipe_imageDeleteEndDate = new Date();
  var delete_recipe_image_milliseconds = recipe_imageDeleteEndDate.getMilliseconds() - recipe_imageDeleteStartDate.getMilliseconds();
  client.timing("timing_recipe_image(ms)_request_delete", delete_recipe_image_milliseconds);
}

module.exports = {
  deleteRecipeImage
}