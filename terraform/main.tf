# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-*-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# VPC for Airflow
resource "aws_vpc" "optimyze_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "optimyze-vpc"
    Project = "optimyze"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "optimyze_igw" {
  vpc_id = aws_vpc.optimyze_vpc.id

  tags = {
    Name    = "optimyze-igw"
    Project = "optimyze"
  }
}

# Public Subnet
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.optimyze_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name    = "optimyze-public-subnet"
    Project = "optimyze"
  }
}

# Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.optimyze_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.optimyze_igw.id
  }

  tags = {
    Name    = "optimyze-public-rt"
    Project = "optimyze"
  }
}

# Route Table Association
resource "aws_route_table_association" "public_rta" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# Security Group for Airflow
resource "aws_security_group" "airflow_sg" {
  name        = "optimyze-airflow-sg"
  description = "Security group for Airflow EC2 instance"
  vpc_id      = aws_vpc.optimyze_vpc.id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # Airflow web UI
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Airflow web UI"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # Communication with Django (if needed)
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Django communication"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name    = "optimyze-airflow-sg"
    Project = "optimyze"
  }
}

# Key Pair for EC2
resource "aws_key_pair" "optimyze_key" {
  key_name   = "optimyze-key"
  public_key = var.public_key

  tags = {
    Name    = "optimyze-key"
    Project = "optimyze"
  }
}

# EC2 Instance for Airflow
resource "aws_instance" "airflow_instance" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.airflow_instance_type
  key_name      = aws_key_pair.optimyze_key.key_name

  vpc_security_group_ids = [aws_security_group.airflow_sg.id]
  subnet_id              = aws_subnet.public_subnet.id

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/scripts/ec2_bootstrap.sh", {}))

  tags = {
    Name    = "optimyze-airflow"
    Project = "optimyze"
    Service = "airflow"
  }
}

# Elastic IP for Airflow
resource "aws_eip" "airflow_eip" {
  instance = aws_instance.airflow_instance.id
  domain   = "vpc"

  tags = {
    Name    = "optimyze-airflow-eip"
    Project = "optimyze"
  }

  depends_on = [aws_internet_gateway.optimyze_igw]
}

# Django Backend Lightsail Instance
resource "aws_lightsail_instance" "django_backend" {
  name              = "optimyze-django-backend"
  availability_zone = data.aws_availability_zones.available.names[0]
  blueprint_id      = "ubuntu_22_04"
  bundle_id         = var.django_bundle_id

  user_data = base64encode(templatefile("${path.module}/scripts/django_bootstrap.sh", {
    django_secret_key = var.django_secret_key
    allowed_hosts     = var.allowed_hosts
    supabase_url      = var.supabase_url
    supabase_key      = var.supabase_key
    github_repo       = var.github_repo
  }))

  tags = {
    Name        = "optimyze-django-backend"
    Environment = "production"
    Project     = "optimyze"
    Service     = "django"
  }
}

# Static IP for Django
resource "aws_lightsail_static_ip" "django_static_ip" {
  name = "optimyze-django-static-ip"
}

# Attach static IP to Django instance
resource "aws_lightsail_static_ip_attachment" "django_static_ip_attachment" {
  static_ip_name = aws_lightsail_static_ip.django_static_ip.name
  instance_name  = aws_lightsail_instance.django_backend.name
}

# Lightsail Key Pair for Django
resource "aws_lightsail_key_pair" "django_key" {
  name       = "optimyze-django-key"
  public_key = var.public_key
}