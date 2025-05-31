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

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Security Group
resource "aws_security_group" "airflow_sg" {
  name_prefix = "airflow-elasticsearch-"
  description = "Security group for Airflow and Elasticsearch"

  # Airflow Web UI
  ingress {
    description = "Airflow Web UI"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict this to your IP in production
  }

  # Elasticsearch API
  ingress {
    description = "Elasticsearch API"
    from_port   = 9200
    to_port     = 9200
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict this in production
  }

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict this to your IP
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "airflow-elasticsearch-sg"
  }
}

# Key Pair (you'll need to create this manually or provide existing one)
resource "aws_key_pair" "airflow_key" {
  key_name   = "airflow-key"
  public_key = file(var.public_key_path)
}

# EC2 Instance
resource "aws_instance" "airflow_server" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.small"
  key_name              = aws_key_pair.airflow_key.key_name
  vpc_security_group_ids = [aws_security_group.airflow_sg.id]
  
  root_block_device {
    volume_size = 30  # 30GB storage
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/setup.sh", {
    supabase_connection_string = var.supabase_connection_string
    airflow_fernet_key        = var.airflow_fernet_key
    airflow_secret_key        = var.airflow_secret_key
  })

  tags = {
    Name        = "airflow-elasticsearch-server"
    Environment = var.environment
  }
}

# Elastic IP
resource "aws_eip" "airflow_ip" {
  instance = aws_instance.airflow_server.id
  domain   = "vpc"

  tags = {
    Name = "airflow-elasticsearch-eip"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "airflow_logs" {
  name              = "/aws/ec2/airflow"
  retention_in_days = 7

  tags = {
    Environment = var.environment
    Application = "airflow"
  }
}