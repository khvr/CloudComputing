# CSYE 6225 - Fall 2019

## Team Information

| Name | NEU ID | Email Address |
| --- | --- | --- |
| Harsha vardhanram kalyanaraman | 001472407 | kalyanaraman.ha@northeastern.edu

## Technology Stack

Lambda with Node.js, Express, and PostgreSQL

## Build Instructions

Curl and trigeer the cicd with API call.


## Deploy Instructions
The CircleCI automatically updates the code in lambda. 
1. Create your Infrastructure by running terraform apply which will build your VPC, Auto Scaling groups and ALB and IAM Roles.
2. Add your environment variables in your circleci for running the pipeline.
3. Run the curl command to deploy code in your pipeline.


## Running 
The Webapp '/v1/myrecipe' end point will publish a sns notification and it is subscribed by lambda.
The lambda sends the email using the AWS SES service 

## CI/CD
Any code commit will trigger a Circle CI build which will store the revision in lambda S3 bucket and update the Lambda function zip.
To run the CI/CD pipeline through circleci:
1. Create a token on circleci by navigating to Personal API tokens under user settings
2. Run the following command to trigger your pipeline:
curl -u (your-token-number)\
    -d build_parameters[CIRCLE_JOB]=build \
    https://circleci.com/api/v1.1/project/github/(your-github-username)/csye6225-fa19-lambda/tree/(assignment-branch)


