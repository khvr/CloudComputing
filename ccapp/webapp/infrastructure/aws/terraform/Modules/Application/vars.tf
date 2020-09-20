variable "profile" {}
variable "region" {}
variable "bucket_name" {}
variable "ami" {}
variable "key_name" {}
variable "vpc_id" {}
variable "allocated_storage" {
  default = 20
}
variable "instance_type" {
  default = "db.t2.medium"
}
variable "storage_type" {
  default = "gp2"
}
variable "database_identifier" {}
variable "database_name" {}
variable "database_password" {}
variable "TTL_DELAY" {}
variable "database_username" {}
variable "cd_bucket_name" {}
variable "lambda_bucket_name" {}
variable "ses_verified_domain" {}
variable "DOMAIN" {}
variable "SSLCertificateId" {}