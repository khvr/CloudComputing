provider "aws" {
  profile = "${var.profile}"
  region  = "${var.region}"
}
data "aws_caller_identity" "current" {}
data "aws_iam_user" "circleci" {
  user_name = "circleci"
}

resource "aws_iam_access_key" "circleci" {
  user = "${data.aws_iam_user.circleci.user_name}"
}



resource "aws_iam_user_policy" "CircleCI-Upload-To-S3" {
  name = "CircleCI-Upload-To-S3"
  user = "${data.aws_iam_user.circleci.user_name}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject"
            ],
            "Resource": [
                "arn:aws:s3:::${var.cd_bucket_name}/*"
            ]
        }
    ]
}

EOF
}

resource "aws_iam_user_policy" "CircleCI-lambdaS3" {
  name = "CircleCI-lambdaS3"
  user = "${data.aws_iam_user.circleci.user_name}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::${var.lambda_bucket_name}/*"
            ]
        }
    ]
}

EOF
}
resource "aws_iam_user_policy" "CircleCI-Update-lambda" {
  name = "CircleCI-Update-lambda"
  user = "${data.aws_iam_user.circleci.user_name}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "lambda:UpdateFunctionCode",
            "Resource": "arn:aws:lambda:${var.region}:${data.aws_caller_identity.current.account_id}:function:csye6225-fa19-lambda"
        }
    ]
}

EOF
}

resource "aws_iam_user_policy" "CircleCI-Code-Deploy" {
  name = "CircleCI-Code-Deploy"
  user = "${data.aws_iam_user.circleci.user_name}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codedeploy:RegisterApplicationRevision",
        "codedeploy:GetApplicationRevision"
      ],
      "Resource": [
        "arn:aws:codedeploy:${var.region}:${data.aws_caller_identity.current.account_id}:application:${var.app_name}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "codedeploy:CreateDeployment",
        "codedeploy:GetDeployment"
      ],
      "Resource": [
        "*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "codedeploy:GetDeploymentConfig"
      ],
      "Resource": [
        "arn:aws:codedeploy:${var.region}:${data.aws_caller_identity.current.account_id}:deploymentconfig:CodeDeployDefault.OneAtATime",
        "arn:aws:codedeploy:${var.region}:${data.aws_caller_identity.current.account_id}:deploymentconfig:CodeDeployDefault.HalfAtATime",
        "arn:aws:codedeploy:${var.region}:${data.aws_caller_identity.current.account_id}:deploymentconfig:CodeDeployDefault.AllAtOnce"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_user_policy" "circleci-ec2-ami" {
  name = "circleci-ec2-ami"
  user = "${data.aws_iam_user.circleci.user_name}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
      "Effect": "Allow",
      "Action" : [
        "ec2:AttachVolume",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:CopyImage",
        "ec2:CreateImage",
        "ec2:CreateKeypair",
        "ec2:CreateSecurityGroup",
        "ec2:CreateSnapshot",
        "ec2:CreateTags",
        "ec2:CreateVolume",
        "ec2:DeleteKeyPair",
        "ec2:DeleteSecurityGroup",
        "ec2:DeleteSnapshot",
        "ec2:DeleteVolume",
        "ec2:DeregisterImage",
        "ec2:DescribeImageAttribute",
        "ec2:DescribeImages",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeRegions",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSnapshots",
        "ec2:DescribeSubnets",
        "ec2:DescribeTags",
        "ec2:DescribeVolumes",
        "ec2:DetachVolume",
        "ec2:GetPasswordData",
        "ec2:ModifyImageAttribute",
        "ec2:ModifyInstanceAttribute",
        "ec2:ModifySnapshotAttribute",
        "ec2:RegisterImage",
        "ec2:RunInstances",
        "ec2:StopInstances",
        "ec2:TerminateInstances"
      ],
      "Resource" : "*"
  }]
}

EOF
}

resource "aws_iam_policy" "CodeDeploy-EC2-S3" {
  name = "CodeDeploy-EC2-S3"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "s3:Get*",
                "s3:List*"
            ],
            "Effect": "Allow",
            "Resource": "arn:aws:s3:::${var.cd_bucket_name}/*"
        }
    ]
}
EOF
}

resource "aws_iam_policy" "EC2-SNS" {
  name = "EC2-SNS"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:${var.region}:${data.aws_caller_identity.current.account_id}:mail_all_recipes"
    }
  ]
}
EOF
}

resource "aws_iam_policy" "EC2-webapp-S3" {
  name = "EC2-webapp-S3"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::${var.webapp_bucket_name}/*"
            ]
        }
    ]
}

EOF
}

resource "aws_iam_role" "EC2ServiceRole" {
  name = "EC2ServiceRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF

  tags = {
    name = "EC2ServiceRole"
  }
}
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2_profile"
  role = "${aws_iam_role.EC2ServiceRole.name}"
}
resource "aws_iam_role_policy_attachment" "EC2ServiceRole-Attach-CodeDeploy-EC2-S3" {
  role       = "${aws_iam_role.EC2ServiceRole.name}"
  policy_arn = "${aws_iam_policy.CodeDeploy-EC2-S3.arn}"
}

resource "aws_iam_role_policy_attachment" "EC2ServiceRole-Attach-EC2-webapp-S3" {
  role       = "${aws_iam_role.EC2ServiceRole.name}"
  policy_arn = "${aws_iam_policy.EC2-webapp-S3.arn}"
}

resource "aws_iam_role_policy_attachment" "EC2ServiceRole-Attach-CloudWatchAgent" {
  role       = "${aws_iam_role.EC2ServiceRole.name}"
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_role_policy_attachment" "EC2ServiceRole-Attach-EC2-SNS" {
  role       = "${aws_iam_role.EC2ServiceRole.name}"
  policy_arn = "${aws_iam_policy.EC2-SNS.arn}"
}

resource "aws_iam_role" "CodeDeployServiceRole" {
  name = "CodeDeployServiceRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "codedeploy.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF

  tags = {
    name = "CodeDeployServiceRole"
  }
}

resource "aws_iam_role_policy_attachment" "CodeDeployServiceRole-Attach-AWSCodeDeployRole" {
  role       = "${aws_iam_role.CodeDeployServiceRole.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole"
}



# LAMBDA roles and policies
resource "aws_iam_policy" "lambda-DynamoDB" {
  name = "lambda-DynamoDB"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/csye6225"
        }
    ]
}
EOF
}

resource "aws_iam_policy" "lambda-ses" {
  name = "lambda-ses"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "ses:*",
            "Resource": "*"
        }
    ]
}
EOF
}

resource "aws_iam_role" "LambdaServiceRole" {
  name = "LambdaServiceRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "LambdaServiceRole-Attach-lambda-DynamoDB" {
  role       = "${aws_iam_role.LambdaServiceRole.name}"
  policy_arn = "${aws_iam_policy.lambda-DynamoDB.arn}"
}

resource "aws_iam_role_policy_attachment" "LambdaServiceRole-Attach-lambda-basicExecution" {
  role       = "${aws_iam_role.LambdaServiceRole.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "LambdaServiceRole-Attach-lambda-ses" {
  role       = "${aws_iam_role.LambdaServiceRole.name}"
  policy_arn = "${aws_iam_policy.lambda-ses.arn}"
}