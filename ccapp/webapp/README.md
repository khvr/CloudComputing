# CSYE 6225 - Fall 2019

## Team Information

| Name | NEU ID | Email Address |
| --- | --- | --- |
| Harsha vardhanram kalyanaraman | 001472407 | kalyanaraman.ha@northeastern.edu


## Technology Stack

RESTful API with Node.js, Express, and PostgreSQL

## Build Instructions

REST API Server

Follow below steps in order to start the application.
Install npm packages using `npm i` or `npm install`
Run application server using `npm start` or `npm run start`.
You can access the app at [http://localhost:3000/](http://localhost:3000).


## Deploy Instructions
1. Run your terraform scripts to create IAM role, VPC, ALB and EC2 instances.
2. In your circleci, set up environment variables in order to run the pipeline.
3. Set up codeploy instructions through your AWS console so that the EC2 Auto Scaling group is set to Webserver Group.
4. Run the curl command in order to deploy your code.


## Running 
UNIT TESTING

Follow below steps in order to test the application.
Run the tests using `npm run test`

## CI/CD
To run the CI/CD pipeline through circleci:
1. Create a token on circleci by navigating to Personal API tokens under user settings
2. Run the following command to trigger your pipeline:
curl -u [your-token-number]\
    -d build_parameters[CIRCLE_JOB]=build \
    https://circleci.com/api/v1.1/project/github/[your-github-username]/ccwebapp/tree/[assignment branch]

