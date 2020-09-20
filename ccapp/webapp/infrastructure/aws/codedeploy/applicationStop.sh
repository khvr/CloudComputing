#!/bin/bash
cd /home/centos/csye6225/dev/webapp
ID="$(pm2 list | awk '/webapp/ {print $2}')"
echo $ID
if [ -z "${ID}" ]
then
    echo "empty"
else
    pm2 stop "webapp"
    pm2 delete "webapp"

fi