module "my_vpc"{
    source = "../../Modules/Vpc"
    profile = "${var.profile}"
    region = "${var.region}"
    VPC_CIDR_block = "${var.VPC_CIDR_block}"
    subnet_1_CIDR = "${var.subnet_1_CIDR}"
    subnet_2_CIDR = "${var.subnet_2_CIDR}"
    subnet_3_CIDR = "${var.subnet_3_CIDR}"
}