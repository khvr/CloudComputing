// Environment file middleware
const dotenv = require('dotenv');
dotenv.config();

//Statsd-Client
var Client = require('node-statsd-client').Client;
var client = new Client("localhost", 8125);
var get_image_counter = 0

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

// Getting recipe_image by id
const getRecipeImageById = (request, response) => {
  logger.log({
    level: 'info',
    message: 'function_call_get_recipe_image'
  });
  var recipe_imageGetStartDate = new Date();
  get_image_counter = get_image_counter + 1;
  client.count("count_image_request_get", get_image_counter);
  const recipe_id = request.params.recipeId
  const Imageid = request.params.imageId
  // Getting from the recipe database
  var recipe_imageSelectStartDate = new Date();
  pool.query('SELECT recipe_image_id as id, url FROM recipe_image WHERE recipe_id = $1 AND recipe_image_id = $2', [recipe_id, Imageid], (error, results) => {
    if (error) {
      logger.log({
        level: 'error',
        message: error
      });
    }
    else if (results.rowCount) {
      var recipe_imageSelectEndDate = new Date();
      var Select_recipe_image_db_milliseconds = recipe_imageSelectEndDate.getMilliseconds() - recipe_imageSelectStartDate.getMilliseconds();
      client.timing("timing_recipe_image(ms)_select_query", Select_recipe_image_db_milliseconds);
      response.status(200).send(results.rows[0])
    }
    else {
      response.status(404).json({ message: 'Recipe Image Not Found' })
    }
  })
  var recipe_imageGetEndDate = new Date();
  var get_recipe_image_milliseconds = recipe_imageGetEndDate.getMilliseconds() - recipe_imageGetStartDate.getMilliseconds();
  client.timing("timing_recipe_image(ms)_request_get", get_recipe_image_milliseconds);
}

module.exports = {
  getRecipeImageById
}
