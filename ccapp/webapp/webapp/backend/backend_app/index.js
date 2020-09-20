const dotenv = require('dotenv');
dotenv.config();
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
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


const db = require('./users/queries')
const r_db_POST = require('./recipe/recipe_queries_POST')
const r_db_POST_AllRecipes = require('./recipe/recipe_queries_POST_link_recipes')
const r_db_GET = require('./recipe/recipe_queries_GET')
const r_db_GET_Latest = require('./recipe/recipe_queries_GET_latest')
const r_db_DELETE = require('./recipe/recipe_queries_DELETE')
const r_db_PUT = require('./recipe/recipe_queries_PUT')
const r_image_POST = require('./recipe_image/recipe_image_queries_POST')
const r_image_DELETE = require('./recipe_image/recipe_image_queries_DEL')
const r_image_GET = require('./recipe_image/recipe_image_queries_GET')
const port = 3000

// Database connection
const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'csye6225',
  password: process.env.DB_PASS
})

pool.connect((err, client, release) => {
  if (err) {
    logger.log({
      level: 'error',
      message: 'Database connection failed!!'
    });
  }
  else{
    logger.log({
      level: 'info',
      message: 'Database connected successfully to RDS'
    });
  }
})




const createTableText = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS users (
   id uuid DEFAULT uuid_generate_v4 (),
   first_name VARCHAR (50) NOT NULL,
   last_name VARCHAR (50) NOT NULL,
   password VARCHAR (65) NOT NULL,
   email_address VARCHAR (355) UNIQUE NOT NULL,
   account_created TIMESTAMP NOT NULL,
   account_updated TIMESTAMP
);
CREATE TABLE IF NOT EXISTS recipe (
   image json,
   recipe_id uuid DEFAULT uuid_generate_v4 (),
   created_ts TIMESTAMP NOT NULL,
   updated_ts TIMESTAMP NOT NULL,
   author_id uuid NOT NULL,
   cook_time_in_min INT CONSTRAINT five_multiple_ct CHECK ( cook_time_in_min != 0 AND cook_time_in_min % 5 = 0 ) NOT NULL,
   prep_time_in_min INT CONSTRAINT five_multiple_pt CHECK ( prep_time_in_min != 0 AND prep_time_in_min % 5 = 0 ) NOT NULL,
   total_time_in_min INT CONSTRAINT five_multiple_tt CHECK ( total_time_in_min != 0 AND total_time_in_min % 5 = 0 ) NOT NULL,
   title VARCHAR (50) NOT NULL,
   cusine VARCHAR (50) NOT NULL,
   servings INT CONSTRAINT servings_count_check CHECK( 
   servings >= 1
   AND servings <= 5
   ) NOT NULL,
   ingredients TEXT [],
   steps json [],
   nutrition_information json
);


CREATE TABLE IF NOT EXISTS recipe_image(
recipe_image_id uuid DEFAULT uuid_generate_v4 (),
recipe_image_name VARCHAR (50) NOT NULL,
url VARCHAR (1000) NOT NULL,
recipe_id uuid UNIQUE NOT NULL,
user_id uuid NOT NULL
);


CREATE TABLE IF NOT EXISTS recipe_image_metadata(
recipe_image_id uuid,
recipe_id uuid,
md5_hash VARCHAR (50) NOT NULL,      
fieldname VARCHAR (50) NOT NULL,
originalname VARCHAR (50) NOT NULL,
encoding  VARCHAR (50) NOT NULL,
mimetype VARCHAR (50) NOT NULL,   
size  INT NOT NULL,  
bucket VARCHAR (50) NOT NULL,    
contenttype  VARCHAR (50) NOT NULL,
storageclass  VARCHAR (50) NOT NULL,
location VARCHAR (100) NOT NULL
);
`
// create our temp table
pool.query(createTableText, (error, results) => {
  if (error) {
    logger.log({
      level: 'error',
      message: 'Database tables creation failed!!'
    });
  }

})


app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

//users
app.post('/v1/user', db.createUser)
app.get('/v1/user/self', db.getUserByAuth)
app.put('/v1/user/self', db.updateUser)

//recipe
app.post('/v1/recipe', r_db_POST.createRecipe)
app.post('/v1/myrecipes', r_db_POST_AllRecipes.postAllMyRecipe)
app.get('/v1/recipe/:recipeId', r_db_GET.getRecipeById)
app.get('/v2/recipes', r_db_GET_Latest.getNewestRecipe)
app.delete('/v1/recipe/:recipeId', r_db_DELETE.deleteRecipe)
app.put('/v1/recipe/:recipeId', r_db_PUT.updateRecipe)

//recipe image
app.use('/v1/recipe', r_image_POST)
app.get('/v1/recipe/:recipeId/image/:imageId', r_image_GET.getRecipeImageById)
app.delete('/v1/recipe/:recipeId/image/:imageId', r_image_DELETE.deleteRecipeImage)

//heath check
app.get('/health', (req, res) => res.status(200).json({ message: 'health check successful' }))

app.listen(port, () => {
  console.log(`App running on port ${port}.`)
})

module.exports = app