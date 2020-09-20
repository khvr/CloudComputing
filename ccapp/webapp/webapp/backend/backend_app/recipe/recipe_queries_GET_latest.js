// Environment file middleware
const dotenv = require('dotenv');
dotenv.config();

//Statsd-Client
var Client = require('node-statsd-client').Client;
var client = new Client("localhost", 8125);
var get_latest_recipe_counter = 0;
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
const getNewestRecipe = (request, response) => {
  logger.log({
    level: 'info',
    message: 'function_call_get_latest_recipe'
  });
  var recipeGetAllStartDate = new Date();
  get_latest_recipe_counter = get_latest_recipe_counter + 1;
  client.count("count_recipe_request_get", get_latest_recipe_counter);

  // Getting Newest recipe from the recipe database
  pool.query('SELECT * FROM recipe ORDER BY created_ts DESC LIMIT 1', (error, results) => {
    var recipeAllSelectStartDate = new Date();
    if (error) {
      logger.log({
        level: 'error',
        message: error
      });
    }
    else if (results.rowCount) {
      var recipeAllSelectEndDate = new Date();
      var Select_recipe_all_db_milliseconds = recipeAllSelectEndDate.getMilliseconds() - recipeAllSelectStartDate.getMilliseconds();
      client.timing("timing_recipe(ms)_select_all_query", Select_recipe_all_db_milliseconds);
      response.status(200).send(results.rows[0])
    }
    else {
      response.status(404).json({ message: 'Recipe Not Found' })
    }
  })
  var recipeGetAllEndDate = new Date();
  var get_recipe_all_milliseconds = recipeGetAllEndDate.getMilliseconds() - recipeGetAllStartDate.getMilliseconds();
  client.timing("timing_recipe(ms)_request_get_all", get_recipe_all_milliseconds);
}

module.exports = {
  getNewestRecipe
}
