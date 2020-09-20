# AWS CLI

## DEPENDENCIES
``````````
Install the AWS CLI on Linux [https://docs.aws.amazon.com/cli/latest/userguide/install-linux.html] and configure AWS CLI to your profile

``````````
## SYNOPSIS


## VPC-SETUP
``````````
Automates the creation of a custom IPv4 VPC having public subnets, Internet gateway attached to VPC and route tables using Shell Scripting
``````````
### Running Instructions
``````````
To create a VPC using AWS CLI run the script: bash csye6225-aws-networking-setup.sh \<aws_region\> \<vpc_cidr\> \<subnet1\> \<subnet2\> \<subnet3\> \<vpc_name\> \<profile\>

``````````
## VPC-TERMINATION
``````````
Automates the deletion of a custom IPv4 VPC having public subnets, Internet gateway attached to VPC and route tables using Shell Scripting

``````````
### Running Instructions
``````````
To teardown the VPC: bash csye6225-aws-networking-setup.sh  \<profile\> \<aws_region\> \<vpc_name\>
``````````