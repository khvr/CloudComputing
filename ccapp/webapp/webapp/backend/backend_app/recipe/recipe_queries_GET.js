// Environment file middleware
const dotenv = require('dotenv');
dotenv.config();

//Statsd-Client
var Client = require('node-statsd-client').Client;
var client = new Client("localhost", 8125);
var get_recipe_counter = 0;

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

// Getting recipe by id
const getRecipeById = (request, response) => {
  logger.log({
    level: 'info',
    message: 'function_call_get_recipe'
  });
  var recipeGetStartDate = new Date();
  get_recipe_counter = get_recipe_counter + 1;
  client.count("count_recipe_request_get", get_recipe_counter);
  const recipe_id = request.params.recipeId
  // Getting from the recipe database
  var recipeSelectStartDate = new Date();
  pool.query('SELECT * FROM recipe WHERE recipe_id = $1', [recipe_id], (error, results) => {
    if (error) {
      logger.log({
        level: 'error',
        message: error
      });
    }
    else if (results.rowCount) {
      var recipeSelectEndDate = new Date();
      var Select_recipe_db_milliseconds = recipeSelectEndDate.getMilliseconds() - recipeSelectStartDate.getMilliseconds();
      client.timing("timing_recipe(ms)_select_query", Select_recipe_db_milliseconds);

      response.status(200).send(results.rows[0])
    }
    else {
      response.status(404).json({ message: 'Recipe Not Found' })
    }
  })
  var recipeGetEndDate = new Date();
  var get_recipe_milliseconds = recipeGetEndDate.getMilliseconds() - recipeGetStartDate.getMilliseconds();
  client.timing("timing_recipe(ms)_request_get", get_recipe_milliseconds);
}

module.exports = {
  getRecipeById
}
