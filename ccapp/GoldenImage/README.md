# AWS AMI for CSYE 6225

## Validate Template

```sh
packer validate -var 'aws_access_key=user_access_key' -var 'aws_secret_key=user_secret_key' -var 'aws_region=us-east-1' -var 'source_ami={ami-id}' centos-ami.json
```

## Build AMI

```
packer build -var-file=./ami-vars-local.json centos-ami.json
```

```

ami-vars-local.json file should look like this:

{
    "aws_region": "us-east-1",
    "aws_access_key": "user_access_key",
    "aws_secret_key": "user_secret_key",
    "source_ami": "{ami-id}"
}

```


### Instructions

1. Create AMI using the source CentOS AMI(AMI ID {ami-id}) with packer

2. Launching the EC2 instance from the created AMI 

3. Connect to the EC2 instance via ssh, manually configure the database (change temp password, create user and etc.)

4. Copy the webapp project using scp command 

5. Run the webapp API application

6. Open the port in the security group for incoming request

7. Use postman to test APIs from the IP address of the created EC2 instance

