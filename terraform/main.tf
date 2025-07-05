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

# Get latest Ubuntu AMI
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
}

# Security Group
resource "aws_security_group" "main_sg" {
  name        = "optimyze-sg"
  description = "Security group for Optimyze application"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Airflow Web UI
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Django (if needed)
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "optimyze-sg"
    Project = "optimyze"
  }
}

# Key Pair
resource "aws_key_pair" "main_key" {
  key_name   = "optimyze-key"
  public_key = var.public_key

  tags = {
    Name    = "optimyze-key"
    Project = "optimyze"
  }
}

# EC2 Instance
resource "aws_instance" "main_instance" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.main_key.key_name

  vpc_security_group_ids = [aws_security_group.main_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/scripts/bootstrap.sh", {
    django_secret_key = var.django_secret_key
    allowed_hosts     = var.allowed_hosts
    supabase_url      = var.supabase_url
    supabase_key      = var.supabase_key
    github_repo       = var.github_repo
    airflow_admin_user = var.airflow_admin_user
    airflow_admin_password = var.airflow_admin_password
    airflow_admin_email = var.airflow_admin_email
  }))

  tags = {
    Name    = "optimyze-main"
    Project = "optimyze"
  }
}

# Elastic IP
resource "aws_eip" "main_eip" {
  instance = aws_instance.main_instance.id
  domain   = "vpc"

  tags = {
    Name    = "optimyze-eip"
    Project = "optimyze"
  }
}