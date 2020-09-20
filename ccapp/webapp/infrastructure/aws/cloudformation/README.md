Cloud Formation
=========

### Dependencies
Install the AWS CLI on Linux [https://docs.aws.amazon.com/cli/latest/userguide/install-linux.html]
and configure AWS CLI to your profile

## Build Instructions

Create a json file which contains the cloud formation template.
The template contains 3 public subnets, VPC, IGW being attached to the VPC.
Route Table defines a route out to the internet.

## Running Instructions

To create VPC using Cloud Formation:
1.Accept AWS Region,Stack Name, CIDR block and Subnets from the user.
2.Run: `bash csye6225-aws-cf-create-stack.sh \<aws_region\> \<vpc_cidr\> \<subnet1\> \<subnet2\> \<subnet3\> \<stack_name\> \<profile\>`

To teardown the Stack:
1.Run`bash csye6225-aws-cf-terminate-stack.sh \<AWS_REGION\> \<Stack_Name\> \<Stack_Profile\> `
2.Provide the name of the stack, profile and AWS Region.
 
