Terraform
=========

### Dependencies
Install the AWS CLI on Linux [https://docs.aws.amazon.com/cli/latest/userguide/install-linux.html]
and configure AWS CLI to your profile

## Build Instructions

change directory to the cloned repository and do:
`cd  csye6225/dev/ccwebapp/infrastructure/aws/terraform/<profile>/<module_to_be_created>`

## Running Instructions
To Initialize aws plugins:
`terraform init`

To create a module using terraform run the script:
`terraform apply`

Provide the required fields to create a module and build the infrastructure

To teardown the infrastructure:
`terraform destroy`

Provide the name of the module to destroy