module "circlecd_iam_user"{
    source = "../../Modules/iam_setup"
    profile = "${var.profile}"
    region = "${var.region}"
    cd_bucket_name = "${var.cd_bucket_name}"
    webapp_bucket_name = "${var.webapp_bucket_name}"
    app_name = "${var.app_name}"
    lambda_bucket_name = "${var.lambda_bucket_name}"
}