// Environment file middleware
const dotenv = require('dotenv');
dotenv.config();

// Bcrypt password middleware
var bcrypt = require('bcryptjs');

//Statsd-Client
var Client = require('node-statsd-client').Client;
var client = new Client("localhost", 8125);
var post_image_counter = 0

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

const multer = require('multer');
const multerS3 = require('multer-s3')
const aws = require('aws-sdk')


aws.config.update({
  secretAccessKey: process.env.aws_secret_access_key,
  accessKeyId: process.env.aws_access_key_id,
  region: process.env.aws_region
})

const s3 = new aws.S3()
const storage = multerS3({
  s3: s3,
  bucket: process.env.WEBAPP_S3_BUCKET_NAME,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, Date.now().toString() + "_" + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    //Accept a file
    cb(null, true);
  }
  else {
    //reject a file
    cb(null, false);
  }
}
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
}).single('recipeImage');

const express = require('express')
const router = express.Router()

router.post('/:recipeId/image', (request, response) => {
  logger.log({
    level: 'info',
    message: 'function_call_post_recipe_image'
  });
  var recipe_imagePostStartDate = new Date();
  post_image_counter = post_image_counter + 1;
  client.count("count_image_request_post", post_image_counter);

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
        pool.query('SELECT author_id , recipe_id FROM recipe WHERE author_id = $1 AND recipe_id = $2', [user_id, recipe_id], (error, results) => {
          if (error) {
            logger.log({
              level: 'error',
              message: error
            });
          }
          // Author id check
          else if (results.rowCount) {
            // Duplicate photo check
            pool.query('SELECT * FROM recipe_image WHERE recipe_id = $1', [recipe_id], (error, results) => {
              if (error) {
                logger.log({
                  level: 'error',
                  message: error
                });
              }
              else if (results.rowCount) {
                response.status(401).json({ message: 'Bad Request, Image already present. Please delete the previous Image to post another image' })
              }
              else {
                // uploading to s3 bucket
                var recipe_image_s3_InsertStartDate = new Date();
                upload(request, response, (err) => {
                  if (err) {
                    logger.log({
                      level: 'error',
                      message: err
                    });
                    response.send(err)
                  }
                  else {
                    var recipe_image_s3_InsertEndDate = new Date();
                    var Insert_recipe_image_s3_db_milliseconds = recipe_image_s3_InsertEndDate.getMilliseconds() - recipe_image_s3_InsertStartDate.getMilliseconds();
                    client.timing("timing_recipe_image(ms)_s3Bucket", Insert_recipe_image_s3_db_milliseconds);
                    // jpg,jpeg and png check
                    if (request.file) {
                      // inserting into recipe image
                      var recipe_imageInsertStartDate = new Date();
                      pool.query('INSERT INTO recipe_image (url, recipe_image_name, recipe_id, user_id) VALUES ($1, $2, $3, $4)', [request.file.location, request.file.key, recipe_id, user_id], (error, results) => {
                        var recipe_imageInsertEndDate = new Date();
                        var Insert_recipe_image_db_milliseconds = recipe_imageInsertEndDate.getMilliseconds() - recipe_imageInsertStartDate.getMilliseconds();
                        client.timing("timing_recipe_image(ms)_insert_query", Insert_recipe_image_db_milliseconds);
                        pool.query('SELECT recipe_image_id as id, url FROM recipe_image WHERE url = $1', [request.file.location], (error, results) => {
                          if (error) {
                            logger.log({
                              level: 'error',
                              message: error
                            });
                          }
                          const image_json = results.rows[0]
                          const image_id = results.rows[0].id
                          // updating recipe table
                          pool.query('UPDATE recipe SET  image = $1 WHERE recipe_id = $2 AND image IS NULL', [image_json, recipe_id], (error, results) => {
                            if (error) {
                              logger.log({
                                level: 'error',
                                message: error
                              });
                            }
                            response.status(201).send(image_json)
                            // inserting into metadata table

                            pool.query('INSERT INTO recipe_image_metadata (recipe_image_id,recipe_id,md5_hash,fieldname,originalname,encoding,mimetype,size,bucket,contentType,storageClass,location) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [image_id, recipe_id, request.file.etag, request.file.fieldname, request.file.originalname, request.file.encoding, request.file.mimetype, request.file.size, request.file.bucket, request.file.contentType, request.file.storageClass, request.file.location], (error, results) => {
                              if (error) {
                                logger.log({
                                  level: 'error',
                                  message: error
                                });
                              }

                              pool.query('SELECT * FROM recipe_image_metadata WHERE recipe_image_id = $1', [image_id], (error, results) => {
                                if (error) {
                                  logger.log({
                                    level: 'error',
                                    message: error
                                  });
                                }
                                logger.log({
                                  level: 'INFO',
                                  message: results.rows[0]
                                });

                              })
                            })
                          })
                        })
                      })
                    }
                    else {
                      response.status(400).json({ message: 'Bad Request, check for product Image, jpg,jpeg and png files are accepted' })
                    }
                  }
                })
              }
            })
          }
          else {
            response.status(401).json({ message: 'Unauthorized Request, wrong author' })
          }
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
  var recipe_imagePostEndDate = new Date();
  var post_recipe_image_milliseconds = recipe_imagePostEndDate.getMilliseconds() - recipe_imagePostStartDate.getMilliseconds();
  client.timing("timing_recipe_image(ms)_request_post", post_recipe_image_milliseconds);

})

module.exports = router