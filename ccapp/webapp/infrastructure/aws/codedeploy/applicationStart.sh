#!/bin/bash

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/home/centos/csye6225/dev/webapp/cloudwatch-config.json \
    -s
    
cd /home/centos/csye6225/dev/webapp
sudo chown centos combined.log
sudo chown centos error.log
sudo chmod 664 combined.log
sudo chmod 664 error.log
sudo npm i -g pm2@latest
pm2 start index.js --name "webapp"