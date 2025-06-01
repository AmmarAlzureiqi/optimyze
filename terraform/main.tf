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

# VPC
resource "aws_vpc" "optimyze_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "optimyze-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "optimyze_igw" {
  vpc_id = aws_vpc.optimyze_vpc.id

  tags = {
    Name = "optimyze-igw"
  }
}

# Public Subnet
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.optimyze_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "optimyze-public-subnet"
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
    Name = "optimyze-public-rt"
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

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "optimyze-airflow-sg"
  }
}

# Security Group for OpenSearch
resource "aws_security_group" "opensearch_sg" {
  name        = "optimyze-opensearch-sg"
  description = "Security group for OpenSearch"
  vpc_id      = aws_vpc.optimyze_vpc.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.airflow_sg.id]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  tags = {
    Name = "optimyze-opensearch-sg"
  }
}

# Key Pair
resource "aws_key_pair" "optimyze_key" {
  key_name   = "optimyze-key"
  public_key = var.public_key
}

# EC2 Instance for Airflow
resource "aws_instance" "airflow_instance" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.small"
  key_name      = aws_key_pair.optimyze_key.key_name

  vpc_security_group_ids = [aws_security_group.airflow_sg.id]
  subnet_id              = aws_subnet.public_subnet.id

  user_data = base64encode(templatefile("${path.module}/../scripts/user_data.sh", {
    supabase_url    = var.supabase_url
    supabase_key    = var.supabase_key
    opensearch_url  = aws_opensearch_domain.optimyze_search.endpoint
  }))

  tags = {
    Name = "optimyze-airflow"
  }
}

# Elastic IP
resource "aws_eip" "airflow_eip" {
  instance = aws_instance.airflow_instance.id
  domain   = "vpc"

  tags = {
    Name = "optimyze-airflow-eip"
  }
}

# OpenSearch Domain
resource "aws_opensearch_domain" "optimyze_search" {
  domain_name    = "optimyze-search"
  engine_version = "OpenSearch_2.11"

  cluster_config {
    instance_type  = "t3.small.search"
    instance_count = 1
  }

  ebs_options {
    ebs_enabled = true
    volume_type = "gp3"
    volume_size = 20
  }

  vpc_options {
    security_group_ids = [aws_security_group.opensearch_sg.id]
    subnet_ids         = [aws_subnet.public_subnet.id]
  }

  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "es:*"
        Principal = "*"
        Effect = "Allow"
        Resource = "arn:aws:es:${var.aws_region}:*:domain/optimyze-search/*"
      }
    ]
  })

  tags = {
    Domain = "optimyze-search"
  }
}

# IAM Role for EC2 to access OpenSearch
resource "aws_iam_role" "airflow_role" {
  name = "optimyze-airflow-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "airflow_policy" {
  name = "optimyze-airflow-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "es:*"
        ]
        Resource = aws_opensearch_domain.optimyze_search.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "airflow_policy_attachment" {
  role       = aws_iam_role.airflow_role.name
  policy_arn = aws_iam_policy.airflow_policy.arn
}

resource "aws_iam_instance_profile" "airflow_profile" {
  name = "optimyze-airflow-profile"
  role = aws_iam_role.airflow_role.name
}