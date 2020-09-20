
provider "aws" {
  profile = "${var.profile}"
  region  = "${var.region}"
}

resource "aws_sns_topic" "user_updates" {
  name = "mail_all_recipes"
}

#also uncomment this
data "aws_subnet_ids" "example" {
  vpc_id = "${var.vpc_id}"
}
// S3 bucket creation
# resource "aws_kms_key" "mykey" {
#   description             = "This key is used to encrypt bucket objects"
#   deletion_window_in_days = 10
# }

#start from here
resource "aws_s3_bucket" "example" {
  bucket        = "${var.bucket_name}"
  acl           = "private"
  force_destroy = true

  lifecycle_rule {
    enabled = true

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        # kms_master_key_id = "${aws_kms_key.mykey.arn}"
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "example" {
  bucket             = "${aws_s3_bucket.example.id}"
  ignore_public_acls = true
}

resource "aws_db_subnet_group" "main" {
  name        = "main1"
  description = "Private Subnets"
  subnet_ids  = ["${element(tolist(data.aws_subnet_ids.example.ids), 0)}", "${element(tolist(data.aws_subnet_ids.example.ids), 1)}", "${element(tolist(data.aws_subnet_ids.example.ids), 2)}"]

}

resource "aws_db_instance" "default" {
  allocated_storage      = "${var.allocated_storage}"
  storage_type           = "${var.storage_type}"
  engine                 = "postgres"
  engine_version         = "11.5"
  identifier             = "${var.database_identifier}"
  instance_class         = "${var.instance_type}"
  name                   = "${var.database_name}"
  username               = "${var.database_username}"
  password               = "${var.database_password}"
  db_subnet_group_name   = "${aws_db_subnet_group.main.name}"
  vpc_security_group_ids = ["${aws_security_group.db.id}"]
  publicly_accessible    = true
  multi_az               = false
  skip_final_snapshot    = true

}

data "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2_profile"
}

# resource "aws_instance" "ec2_instance" {

#   ami         =  "${var.ami}"
#   instance_type  = "t2.micro"
#   iam_instance_profile = "${data.aws_iam_instance_profile.ec2_profile.name}"
#   subnet_id      = "${element(tolist(data.aws_subnet_ids.example.ids), 0)}"
#    user_data = <<-EOF
#               #!/bin/bash
#               mkdir -p /home/centos/csye6225/dev/webapp/
#               sudo chown -R centos:centos home/centos/csye6225
#               sudo echo DB_USER=dbuser >> /home/centos/csye6225/dev/webapp/.env
#               sudo echo DB_PASS= "${aws_db_instance.default.password}" >>  /home/centos/csye6225/dev/webapp/.env
#               sudo echo DB_HOST="${aws_db_instance.default.endpoint}" | sed s/:5432//g  >>  /home/centos/csye6225/dev/webapp/.env
#               sudo echo WEBAPP_S3_BUCKET_NAME = "${aws_s3_bucket.example.bucket}" >> /home/centos/csye6225/dev/webapp/.env
#               sudo echo sns_topic_arn = "${aws_sns_topic.user_updates.arn}" >> /home/centos/csye6225/dev/webapp/.env
#               sudo echo aws_region = "${var.region}" >> /home/centos/csye6225/dev/webapp/.env
#               EOF
#   vpc_security_group_ids = ["${aws_security_group.application.id}"]
#   disable_api_termination = "false"
#   ebs_block_device  {
#       device_name="/dev/xvda"
#       volume_type= "gp2"
#       volume_size= "20"
#       delete_on_termination = "true"
# }
#   key_name="${var.key_name}"
#   associate_public_ip_address = "true"

#   tags = {
#     Name = "webapp"
#   }
# }

# resource "aws_security_group" "application" {
#   name        = "application"
#   vpc_id     = "${var.vpc_id}"   

#   ingress {
#     from_port   = 443
#     to_port     = 443
#     protocol    = "tcp"
#     cidr_blocks     = ["0.0.0.0/0"]
#   }

#     ingress {
#     from_port   = 22
#     to_port     = 22
#     protocol    = "tcp"
#     cidr_blocks     = ["0.0.0.0/0"]
#     }

#     ingress {
#     from_port   = 3000
#     to_port     = 3000
#     protocol    = "tcp"
#     cidr_blocks     = ["0.0.0.0/0"]
#     }

#     ingress{
#     from_port   = 80
#     to_port     = 80
#     protocol    = "tcp"
#     cidr_blocks     = ["0.0.0.0/0"]
#   }

#   egress {
#     from_port       = 0
#     to_port         = 0
#     protocol        = "-1"
#     cidr_blocks     = ["0.0.0.0/0"]
#   }
# }

resource "aws_security_group" "db" {
  name = "my_db"

  description = "RDS postgres servers (terraform-managed)"
  vpc_id      = "${var.vpc_id}"

  # Only postgres in
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = ["${aws_security_group.application.id}"]
  }

  # Allow all outbound traffic.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "db-sg"
  }
}

resource "aws_dynamodb_table" "dynamodb-table" {
  name           = "csye6225"
  read_capacity  = 20
  write_capacity = 20
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }
  ttl {
    attribute_name = "TTL"
    enabled        = true
  }
}

// Creation of cloud Deploy s3 bucket
// S3 bucket creation
resource "aws_s3_bucket" "cd_bucket" {
  bucket        = "${var.cd_bucket_name}"
  acl           = "private"
  force_destroy = true

  lifecycle_rule {
    enabled = true

    expiration {
      days = 60
    }
    noncurrent_version_expiration {
      days = 1
    }
  }
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        # kms_master_key_id = "${aws_kms_key.mykey.arn}"
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "example1" {
  bucket             = "${aws_s3_bucket.cd_bucket.id}"
  ignore_public_acls = true
}

data "aws_iam_role" "LambdaServiceRole" {
  name = "LambdaServiceRole"
}

resource "aws_s3_bucket" "serverless_bucket" {
  bucket        = "${var.lambda_bucket_name}"
  acl           = "private"
  force_destroy = true

  lifecycle_rule {
    enabled = true

    expiration {
      days = 60
    }
    noncurrent_version_expiration {
      days = 1
    }
  }
}

data "archive_file" "dummy" {
  type        = "zip"
  output_path = "${path.module}/lambda_function_payload.zip"
  source {
    content  = "#csye6225-lambda"
    filename = "Readme.md"
  }
}

resource "aws_lambda_function" "csye6225-fa19-lambda" {

  function_name = "csye6225-fa19-lambda"
  filename      = "${data.archive_file.dummy.output_path}"
  role          = "${data.aws_iam_role.LambdaServiceRole.arn}"
  handler       = "index.handler"
  runtime       = "nodejs8.10"

  environment {
    variables = {
      domain     = "${var.DOMAIN}"
      TTL_DELAY  = "${var.TTL_DELAY}"
      sendermail = "${var.ses_verified_domain}"
    }
  }
}

resource "aws_lambda_permission" "with_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.csye6225-fa19-lambda.function_name}"
  principal     = "sns.amazonaws.com"
  source_arn    = "${aws_sns_topic.user_updates.arn}"
}

resource "aws_sns_topic_subscription" "lambda" {
  topic_arn = "${aws_sns_topic.user_updates.arn}"
  protocol  = "lambda"
  endpoint  = "${aws_lambda_function.csye6225-fa19-lambda.arn}"
}

#Modified Auto scaling
resource "aws_security_group" "elb" {
  name        = "elb"
  vpc_id      = "${var.vpc_id}"
  description = "Load Balancer firewall rules"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "elb-sg"
  }
}

resource "aws_security_group" "application" {
  name   = "application"
  vpc_id = "${var.vpc_id}"

  #SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  #application
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = ["${aws_security_group.elb.id}"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

#load balancer:
# Target groups:
data "aws_caller_identity" "current" {}
resource "aws_alb" "test" {
  name                       = "test-alb-tf"
  internal                   = false
  security_groups            = ["${aws_security_group.elb.id}"]
  subnets                    = ["${element(tolist(data.aws_subnet_ids.example.ids), 0)}", "${element(tolist(data.aws_subnet_ids.example.ids), 1)}", "${element(tolist(data.aws_subnet_ids.example.ids), 2)}"]
  enable_deletion_protection = false
}

resource "aws_alb_target_group" "AutoScalingTargetGroup" {
  name     = "AutoScalingTargetGroup"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = "${var.vpc_id}"

  health_check {
                port = "3000"
                protocol = "HTTP"
                path = "/health"
                healthy_threshold = 2
                unhealthy_threshold = 2
                interval = 5
                timeout = 4
                matcher = "200"
        }
}

resource "aws_lb_listener" "listener" {
  load_balancer_arn = "${aws_alb.test.arn}"
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:${var.region}:${data.aws_caller_identity.current.account_id}:certificate/${var.SSLCertificateId}"

  default_action {
    type             = "forward"
    target_group_arn = "${aws_alb_target_group.AutoScalingTargetGroup.arn}"
  }
}

# The Auto Scaling Application Stack:
# Setup Autoscaling for EC2 Instances:

# Launch Configuration:

resource "aws_launch_configuration" "asg_launch_config" {
  name                 = "asg_launch_config"
  image_id             = "${var.ami}"
  instance_type        = "t2.micro"
  iam_instance_profile = "${data.aws_iam_instance_profile.ec2_profile.name}"
  user_data            = <<-EOF
              #!/bin/bash
              mkdir -p /home/centos/csye6225/dev/webapp/
              sudo chown -R centos:centos home/centos/csye6225
              sudo echo DB_USER=dbuser >> /home/centos/csye6225/dev/webapp/.env
              sudo echo DB_PASS= "${aws_db_instance.default.password}" >>  /home/centos/csye6225/dev/webapp/.env
              sudo echo DB_HOST="${aws_db_instance.default.endpoint}" | sed s/:5432//g  >>  /home/centos/csye6225/dev/webapp/.env
              sudo echo WEBAPP_S3_BUCKET_NAME = "${aws_s3_bucket.example.bucket}" >> /home/centos/csye6225/dev/webapp/.env
              sudo echo sns_topic_arn = "${aws_sns_topic.user_updates.arn}" >> /home/centos/csye6225/dev/webapp/.env
              sudo echo aws_region = "${var.region}" >> /home/centos/csye6225/dev/webapp/.env
              sudo echo domain = "${var.DOMAIN}" >> /home/centos/csye6225/dev/webapp/.env
              EOF
  security_groups      = ["${aws_security_group.application.id}"]
  ebs_block_device {
    device_name           = "/dev/xvda"
    volume_type           = "gp2"
    volume_size           = "20"
    delete_on_termination = "true"
  }
  key_name                    = "${var.key_name}"
  associate_public_ip_address = "true"
}

# Auto Scaling Group:
resource "aws_autoscaling_group" "WebServerGroup" {
  name = "WebServerGroup"
  launch_configuration = "${aws_launch_configuration.asg_launch_config.name}"
  vpc_zone_identifier       = ["${element(tolist(data.aws_subnet_ids.example.ids), 0)}", "${element(tolist(data.aws_subnet_ids.example.ids), 1)}", "${element(tolist(data.aws_subnet_ids.example.ids), 2)}"]
  #While developing
  min_size = 3
  max_size = 10
  desired_capacity = 3
  default_cooldown = 60
  
 tag {
    key                 = "Name"
    value               = "webapp"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_attachment" "WebServerGroup_attachment_AutoScalingTargetGroup" {
  autoscaling_group_name = "${aws_autoscaling_group.WebServerGroup.id}"
  alb_target_group_arn   = "${aws_alb_target_group.AutoScalingTargetGroup.arn}"
}

resource "aws_autoscaling_policy" "WebServerScaleUpPolicy" {
  name = "WebServerScaleUpPolicy"
  policy_type = "SimpleScaling"
  adjustment_type = "ChangeInCapacity"
  autoscaling_group_name = "${aws_autoscaling_group.WebServerGroup.name}"
  cooldown = 60
  scaling_adjustment = 1
}

resource "aws_autoscaling_policy" "WebServerScaleDownPolicy" {
  name = "WebServerScaleDownPolicy"
  policy_type = "SimpleScaling"
  adjustment_type = "ChangeInCapacity"
  autoscaling_group_name = "${aws_autoscaling_group.WebServerGroup.name}"
  cooldown = 60
  scaling_adjustment = -1
}

#ScaleUp Alarm
resource "aws_cloudwatch_metric_alarm" "CPUAlarmHigh" {
  alarm_name = "ScaleUp"
  alarm_description = "Scale-up if average CPU usage is above 5%"
  metric_name = "CPUUtilization"
  namespace = "AWS/EC2"
  threshold = "5"
  comparison_operator = "GreaterThanThreshold"
  period = 60
  evaluation_periods = "2"
  statistic = "Average"
  dimensions = {
    AutoScalingGroupName = "${aws_autoscaling_group.WebServerGroup.name}"
  }
  alarm_actions = ["${aws_autoscaling_policy.WebServerScaleUpPolicy.arn}"]
}

#ScaleDown Alarm
resource "aws_cloudwatch_metric_alarm" "CPUAlarmLow" {
  alarm_name = "ScaleDown"
  alarm_description = "Scale-up if average CPU usage is below 3%"
  metric_name = "CPUUtilization"
  namespace = "AWS/EC2"
  comparison_operator = "LessThanThreshold"
  period = 60
  evaluation_periods = "2"
  threshold = "3"
  statistic = "Average"
  dimensions = {
    AutoScalingGroupName = "${aws_autoscaling_group.WebServerGroup.name}"
  }
  alarm_actions = ["${aws_autoscaling_policy.WebServerScaleDownPolicy.arn}"]

}

#DNS Update
data "aws_route53_zone" "zone" {
  name         = "${var.DOMAIN}"
  private_zone = false
}

resource "aws_route53_record" "www" {
  zone_id = "${data.aws_route53_zone.zone.id}"
  name    = "${var.DOMAIN}"
  type    = "A"
  alias {
    name                   = "${aws_alb.test.dns_name}"
    zone_id                = "${aws_alb.test.zone_id}"
    evaluate_target_health = false
  }
}
