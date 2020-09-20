// Environment file middleware
const dotenv = require('dotenv');
dotenv.config();

// Bcrypt password middleware
var bcrypt = require('bcryptjs');

//Statsd-Client
var Client = require('node-statsd-client').Client;
var client = new Client("localhost", 8125);
var post_recipe_counter = 0;

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

const createRecipe = (request, response) => {
    logger.log({
        level: 'info',
        message: 'function_call_post_recipe'
    });
    var recipePostStartDate = new Date();
    post_recipe_counter = post_recipe_counter + 1;
    client.count("count_recipe_request_post", post_recipe_counter);
    // checking for basic auth
    if (!request.headers.authorization || request.headers.authorization.indexOf('Basic ') === -1) {
        return response.status(401).json({ message: 'Missing Authorization Header' });
    }
    // getting username and password
    const base64Credentials = request.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

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

                // Check for the Required fields
                if (request.body.hasOwnProperty('cook_time_in_min') && request.body.hasOwnProperty('prep_time_in_min') && request.body.hasOwnProperty('title') && request.body.hasOwnProperty('cusine') && request.body.hasOwnProperty('servings') && request.body.hasOwnProperty('ingredients') && request.body.hasOwnProperty('steps') && request.body.hasOwnProperty('nutrition_information')) {

                    // getting the user id
                    pool.query('SELECT id FROM users WHERE email_address = $1', [username], (error, results) => {
                        if (error) {
                            logger.log({
                                level: 'error',
                                message: error
                            });
                        }
                        var user_id = results.rows[0].id
                        // Getting Fields from Body
                        const { cook_time_in_min, prep_time_in_min, title, cusine, servings, ingredients, steps, nutrition_information } = request.body

                        // updating timestamps
                        const created_ts = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                        const updated_ts = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
                        const total_time_in_min = cook_time_in_min + prep_time_in_min


                        //Check if the title and cusine are strings
                        if (typeof title === 'string' && typeof cusine === 'string') {

                            //Check for array values to not have an empty array
                            if (ingredients.length != 0 && steps.length != 0) {
                                //To check if cook_time_in_min and prep_time_in_min are multiples of 5
                                if (cook_time_in_min % 5 == 0 && Number.isInteger(cook_time_in_min) && Number.isInteger(prep_time_in_min) && cook_time_in_min > 0 && prep_time_in_min % 5 == 0 && prep_time_in_min > 0) {
                                    //To check for serving count is between 0 and 6
                                    if (Number.isInteger(servings) && servings >= 1 && servings <= 5) {

                                        //INGREDIENTS
                                        // Extracting the item from the ingredient 

                                        var arrayLength = ingredients.length;
                                        const items = new Array();
                                        const quantities = new Array();
                                        for (var i = 0; i < arrayLength; i++) {
                                            const [quantity, measurement, ...result] = ingredients[i].split(' ')
                                            const item = result.join(" ")
                                            items.push(item)
                                            quantities.push(quantity)
                                        }

                                        function checkPosQty(quantity) {
                                            return quantity > 0;
                                        }

                                        function checkIntQty(quantity) {
                                            return !Number.isNaN(quantity)
                                        }

                                        // Check for ingredient string follows the pattern
                                        if (quantities.every(checkPosQty) && (quantities.every(checkIntQty))) {
                                            function find_duplicate_in_array(arra1) {
                                                var object = {};
                                                var result = [];

                                                arra1.forEach(function (item) {
                                                    if (!object[item])
                                                        object[item] = 0;
                                                    object[item] += 1;
                                                })

                                                for (var prop in object) {
                                                    if (object[prop] >= 2) {
                                                        result.push(prop);
                                                    }
                                                }
                                                return result;
                                            }
                                            duplicates = find_duplicate_in_array(items);
                                            // Check for duplicate items 
                                            if (duplicates.length == 0) {

                                                //STEPS
                                                // To check if step_no position does not repeat itself
                                                const valueArr = steps.map(function (item) { return item.position });
                                                const isDuplicate = valueArr.some(function (item, idx) {
                                                    return valueArr.indexOf(item) != idx
                                                });

                                                //check for duplicate position
                                                if (!isDuplicate) {

                                                    // Populating steps table
                                                    const positions = new Array();

                                                    steps.forEach((step) => {

                                                        positions.push(step.position)
                                                    })

                                                    function checkPosInt(position) {
                                                        return position > 0;
                                                    }

                                                    function checkIntPos(position) {
                                                        return Number.isInteger(position)
                                                    }
                                                    //Check if a position is greater than zero and integer
                                                    if (positions.every(checkPosInt) && (positions.every(checkIntPos))) {
                                                        // NUTRITION
                                                        // Check for the required fields in JSON
                                                        if ("calories" in nutrition_information && "cholesterol_in_mg" in nutrition_information && "sodium_in_mg" in nutrition_information && "carbohydrates_in_grams" in nutrition_information && "protein_in_grams" in nutrition_information) {
                                                            // console.log("inside if")

                                                            // Check for nutrition_information
                                                            if (!isNaN(nutrition_information.calories) && Number.isInteger(nutrition_information.calories) && !isNaN(nutrition_information.cholesterol_in_mg) && Number.isInteger(nutrition_information.sodium_in_mg) && !isNaN(nutrition_information.sodium_in_mg) && !isNaN(nutrition_information.carbohydrates_in_grams) && !isNaN(nutrition_information.protein_in_grams)) {
                                                                //RECIPE

                                                                // Setting the fields into database
                                                                var recipeInsertStartDate = new Date();
                                                                pool.query('INSERT INTO recipe (created_ts, updated_ts, author_id, cook_time_in_min, prep_time_in_min,total_time_in_min,title,cusine, servings,ingredients,steps,nutrition_information) VALUES ($1, $2, $3, $4, $5, $6,$7,$8,$9,$10,$11,$12)', [created_ts, updated_ts, user_id, cook_time_in_min, prep_time_in_min, total_time_in_min, title, cusine, servings, ingredients, steps, nutrition_information], (error, results) => {
                                                                    if (error) {
                                                                        logger.log({
                                                                            level: 'error',
                                                                            message: error
                                                                        });
                                                                    }
                                                                    else {
                                                                        var recipeInsertEndDate = new Date();
                                                                        var Insert_recipe_db_milliseconds = recipeInsertEndDate.getMilliseconds() - recipeInsertStartDate.getMilliseconds();
                                                                        client.timing("timing_recipe(ms)_insert_query", Insert_recipe_db_milliseconds);
                                                                        // Selecting from database and sending back to response body
                                                                        pool.query('SELECT * FROM recipe WHERE created_ts =$1 AND updated_ts =$2 AND author_id =$3 AND cook_time_in_min = $4 AND prep_time_in_min = $5 AND total_time_in_min = $6 AND title =$7', [created_ts, updated_ts, user_id, cook_time_in_min, prep_time_in_min, total_time_in_min, title], (error, results) => {
                                                                            if (error) {
                                                                                throw error
                                                                            }
                                                                            response.status(201).send(results.rows[0])

                                                                        })
                                                                    }

                                                                })
                                                            }
                                                            else {
                                                                response.status(400).json({ message: 'Bad Request, nutrition_information should be positive numbers  AND calories[INTEGER], sodium_in_mg[INTEGERS] ' })
                                                            }
                                                        }
                                                        else {
                                                            response.status(400).json({ message: 'Bad Request, Check required fields in nutrition_information: calories[integer], cholesterol_in_mg[number($float)], sodium_in_mg[integer], carbohydrates_in_grams[number($float)], protein_in_grams[number($float)] ' })
                                                        }
                                                    }
                                                    else {
                                                        response.status(400).json({ message: 'Bad Request, steps position is not an integer or  less than zero' })
                                                    }
                                                }
                                                else {
                                                    response.status(400).json({ message: 'Bad Request, Duplicate steps position' })
                                                }
                                            }

                                            else {
                                                response.status(400).json({ message: `Bad Request, check for duplicate ingredients:  ${duplicates}` })
                                            }
                                        }
                                        else {
                                            response.status(400).json({ message: 'Bad Request, The ingredient string should follow the order "Quantity[INT] Measurement[TEXT] Item[TEXT]" ' })
                                        }
                                    }
                                    else {
                                        response.status(400).json({ message: 'Bad Request, check for serving[INT] between 0 and 6' })
                                    }
                                }
                                else {
                                    response.status(400).json({ message: 'Bad Request, check for cook and prep times should be positive INT and a multiple of 5' })
                                }
                            }
                            else {
                                response.status(400).json({ message: 'Bad Request, check for ingredients, steps array' })
                            }
                        }
                        else {
                            response.status(400).json({ message: 'Bad Request, check for title[String] and cusine[String]' })
                        }

                    })
                }
                else {
                    response.status(400).json({ message: 'Bad Request, missing required fields' })
                }
            }
            else {
                response.status(401).json({ message: 'Unauthorized Request, wrong password' })
            }
        }
        else {
            response.status(401).json({ message: 'Bad Request, username not found' })
        }
    })
    var recipePostEndDate = new Date();
    var post_recipe_milliseconds = recipePostEndDate.getMilliseconds() - recipePostStartDate.getMilliseconds();
    client.timing("timing_recipe(ms)_request_post", post_recipe_milliseconds);

};

module.exports = {
    createRecipe
}