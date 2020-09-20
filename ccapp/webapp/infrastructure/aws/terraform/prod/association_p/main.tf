module "application_association"{
    source = "../../Modules/Association"
    profile="${var.profile}"
    region="${var.region}"
}