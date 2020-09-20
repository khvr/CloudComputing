provider "aws" {
  profile = "${var.profile}"
  region  = "${var.region}"
}

#Assosciation of AWF with ALB
data "aws_wafregional_web_acl" "my_acl" {
  name = "generic-owasp-acl"
}

data "aws_alb" "app_alb" {
  name = "test-alb-tf"
}
resource "aws_wafregional_web_acl_association" "alb-association-acl" {
  resource_arn = "${data.aws_alb.app_alb.arn}"
  web_acl_id   = "${data.aws_wafregional_web_acl.my_acl.id}"
}