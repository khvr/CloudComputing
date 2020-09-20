variable "profile" {}
variable "region" {}
variable "bucket_name" {}
variable "vpc_id" {}
variable "ami"  {}
variable "key_name" {} 
variable "allocated_storage"{
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
variable "database_username" {}
variable "cd_bucket_name" {}
variable "TTL_DELAY" {}
variable "lambda_bucket_name" {}
variable "ses_verified_domain"{}
variable "DOMAIN" {}
variable "SSLCertificateId" {}
