provider "aws" {
  profile = "${var.profile}" 
  region  = "${var.region}" 
}

resource "aws_vpc" "tf_vpc" {
  cidr_block = "${var.VPC_CIDR_block}"
  enable_dns_hostnames = true
  enable_dns_support = true

  tags= {
    Name = "tf_vpc"
  }
}
 
#  Declare the data source
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "sub1" {
  vpc_id     = "${aws_vpc.tf_vpc.id}"
  cidr_block = "${var.subnet_1_CIDR}"
  availability_zone = "${data.aws_availability_zones.available.names[0]}"

  tags = {
    Name = "sub1"
  }
}
resource "aws_subnet" "sub2" {
  vpc_id     = "${aws_vpc.tf_vpc.id}"
  cidr_block = "${var.subnet_2_CIDR}"
  availability_zone = "${data.aws_availability_zones.available.names[1]}"

  tags = {
    Name = "sub2"
  }
}

resource "aws_subnet" "sub3" {
  vpc_id     = "${aws_vpc.tf_vpc.id}"
  cidr_block = "${var.subnet_3_CIDR}"
  availability_zone = "${data.aws_availability_zones.available.names[2]}"

  tags = {
    Name = "sub3"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = "${aws_vpc.tf_vpc.id}"

  tags = {
    Name = "main"
  }
}

resource "aws_route_table" "r" {
  vpc_id = "${aws_vpc.tf_vpc.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.gw.id}"
  }

  tags = {
    Name = "main"
  }
}

resource "aws_route_table_association" "a" {
  subnet_id      = "${aws_subnet.sub1.id}"
  route_table_id = "${aws_route_table.r.id}"
}
resource "aws_route_table_association" "a2" {
  subnet_id      = "${aws_subnet.sub2.id}"
  route_table_id = "${aws_route_table.r.id}"
}
resource "aws_route_table_association" "a3" {
  subnet_id      = "${aws_subnet.sub3.id}"
  route_table_id = "${aws_route_table.r.id}"
}



