provider "aws" {
  region = var.region
}

# S3 bucket for document storage
resource "aws_s3_bucket" "document_storage" {
  bucket = "${var.project_name}-${var.environment}-documents"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-documents"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Make the bucket private
resource "aws_s3_bucket_acl" "document_storage_acl" {
  bucket = aws_s3_bucket.document_storage.id
  acl    = "private"
}

# Enable versioning for document history
resource "aws_s3_bucket_versioning" "document_versioning" {
  bucket = aws_s3_bucket.document_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

# CORS configuration for file uploads
resource "aws_s3_bucket_cors_configuration" "document_cors" {
  bucket = aws_s3_bucket.document_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# OpenSearch domain for job search
resource "aws_opensearch_domain" "job_search" {
  domain_name    = "${var.project_name}-${var.environment}-search"
  engine_version = "OpenSearch_2.5"
  
  cluster_config {
    instance_type            = var.opensearch_instance_type
    instance_count           = 1
    zone_awareness_enabled   = false
  }
  
  ebs_options {
    ebs_enabled = true
    volume_size = 10
  }
  
  encrypt_at_rest {
    enabled = true
  }
  
  node_to_node_encryption {
    enabled = true
  }
  
  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }
  
  advanced_security_options {
    enabled                        = true
    internal_user_database_enabled = true
    
    master_user_options {
      master_user_name     = var.opensearch_master_user
      master_user_password = var.opensearch_master_password
    }
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-search"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Create IAM user for Django to access AWS resources
resource "aws_iam_user" "django_app_user" {
  name = "${var.project_name}-${var.environment}-app-user"
}

# Access key for the IAM user
resource "aws_iam_access_key" "django_app_key" {
  user = aws_iam_user.django_app_user.name
}

# Policy for S3 access
resource "aws_iam_user_policy" "django_s3_policy" {
  name   = "${var.project_name}-${var.environment}-s3-policy"
  user   = aws_iam_user.django_app_user.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.document_storage.arn,
          "${aws_s3_bucket.document_storage.arn}/*"
        ]
      }
    ]
  })
}

# Policy for OpenSearch access
resource "aws_iam_user_policy" "django_opensearch_policy" {
  name   = "${var.project_name}-${var.environment}-opensearch-policy"
  user   = aws_iam_user.django_app_user.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "es:ESHttpGet",
          "es:ESHttpPut",
          "es:ESHttpPost",
          "es:ESHttpDelete"
        ]
        Effect   = "Allow"
        Resource = [
          aws_opensearch_domain.job_search.arn,
          "${aws_opensearch_domain.job_search.arn}/*"
        ]
      }
    ]
  })
}