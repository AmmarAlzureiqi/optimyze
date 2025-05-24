# terraform/mwaa.tf

# Generate random suffix for unique bucket name
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 bucket for MWAA
resource "aws_s3_bucket" "mwaa_bucket" {
  bucket = "${var.project_name}-${var.environment}-mwaa-${random_id.bucket_suffix.hex}"
}

# Configure bucket ownership (required for newer AWS accounts)
resource "aws_s3_bucket_ownership_controls" "mwaa_bucket_ownership" {
  bucket = aws_s3_bucket.mwaa_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "mwaa_bucket_access" {
  bucket = aws_s3_bucket.mwaa_bucket.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning (recommended for MWAA)
resource "aws_s3_bucket_versioning" "mwaa_bucket_versioning" {
  bucket = aws_s3_bucket.mwaa_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Secrets Manager for Supabase credentials
resource "aws_secretsmanager_secret" "supabase_credentials" {
  name = "${var.project_name}-${var.environment}-supabase-credentials-${random_id.bucket_suffix.hex}"
}

resource "aws_secretsmanager_secret_version" "supabase_credentials_value" {
  secret_id = aws_secretsmanager_secret.supabase_credentials.id
  secret_string = jsonencode({
    database_url = var.database_url
    supabase_url = var.supabase_url
    supabase_key = var.supabase_key
  })
}

# Upload requirements
resource "aws_s3_object" "requirements" {
  bucket  = aws_s3_bucket.mwaa_bucket.id
  key     = "requirements.txt"
  content = <<-EOT
    python-jobspy==1.1.80
    psycopg2-binary==2.9.5
    pandas==1.5.3
    requests==2.28.2
  EOT
  
  depends_on = [aws_s3_bucket_versioning.mwaa_bucket_versioning]
}

# Upload scraping DAG
resource "aws_s3_object" "scraping_dag" {
  bucket  = aws_s3_bucket.mwaa_bucket.id
  key     = "dags/job_scraping_dag.py"
  source  = "${path.module}/dags/job_scraping_dag.py"
  
  depends_on = [aws_s3_bucket_versioning.mwaa_bucket_versioning]
}

# Upload processing DAG
resource "aws_s3_object" "processing_dag" {
  bucket  = aws_s3_bucket.mwaa_bucket.id
  key     = "dags/job_processing_dag.py"
  source  = "${path.module}/dags/job_processing_dag.py"
  
  depends_on = [aws_s3_bucket_versioning.mwaa_bucket_versioning]
}

# MWAA environment
resource "aws_mwaa_environment" "optimyze_airflow" {
  name = "${var.project_name}-${var.environment}-airflow"
  
  source_bucket_arn = aws_s3_bucket.mwaa_bucket.arn
  dag_s3_path       = "dags"
  requirements_s3_path = "requirements.txt"
  
  execution_role_arn = aws_iam_role.mwaa_role.arn
  
  network_configuration {
    security_group_ids = [aws_security_group.mwaa_sg.id]
    subnet_ids         = aws_subnet.public[*].id
  }
  
  environment_class = "mw1.small"
  webserver_access_mode = "PUBLIC_ONLY"
  
  # Enable logging
  logging_configuration {
    dag_processing_logs {
      enabled   = true
      log_level = "INFO"
    }
    
    scheduler_logs {
      enabled   = true
      log_level = "INFO"
    }
    
    task_logs {
      enabled   = true
      log_level = "INFO"
    }
    
    webserver_logs {
      enabled   = true
      log_level = "INFO"
    }
    
    worker_logs {
      enabled   = true
      log_level = "INFO"
    }
  }
  
  depends_on = [
    aws_s3_object.requirements,
    aws_s3_object.scraping_dag,
    aws_s3_object.processing_dag
  ]
}

# IAM role for MWAA
resource "aws_iam_role" "mwaa_role" {
  name = "${var.project_name}-${var.environment}-mwaa-role-${random_id.bucket_suffix.hex}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["airflow-env.amazonaws.com", "airflow.amazonaws.com"]
        }
      }
    ]
  })
}

# Custom IAM policy for MWAA (instead of using the non-existent managed policy)
resource "aws_iam_role_policy" "mwaa_execution_policy" {
  name = "${var.project_name}-${var.environment}-mwaa-execution-policy"
  role = aws_iam_role.mwaa_role.name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "airflow:PublishMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject*",
          "s3:GetBucket*",
          "s3:List*"
        ]
        Resource = [
          aws_s3_bucket.mwaa_bucket.arn,
          "${aws_s3_bucket.mwaa_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:CreateLogGroup",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:GetLogRecord",
          "logs:GetLogGroupFields",
          "logs:GetQueryResults",
          "logs:DescribeLogGroups"
        ]
        Resource = "arn:aws:logs:*:*:log-group:airflow-${aws_mwaa_environment.optimyze_airflow.name}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ChangeMessageVisibility",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ReceiveMessage",
          "sqs:SendMessage"
        ]
        Resource = "arn:aws:sqs:*:*:airflow-celery-*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey*",
          "kms:Encrypt"
        ]
        NotResource = "arn:aws:kms:*:*:key/*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "sqs.${var.region}.amazonaws.com",
              "s3.${var.region}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

# Custom policy for Secrets Manager access
resource "aws_iam_role_policy" "mwaa_secrets_policy" {
  name = "${var.project_name}-${var.environment}-mwaa-secrets-policy"
  role = aws_iam_role.mwaa_role.name
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Effect   = "Allow"
        Resource = aws_secretsmanager_secret.supabase_credentials.arn
      }
    ]
  })
}

# Security group
resource "aws_security_group" "mwaa_sg" {
  name   = "${var.project_name}-${var.environment}-mwaa-sg-${random_id.bucket_suffix.hex}"
  vpc_id = aws_vpc.main.id
  
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-${var.environment}-mwaa-sg"
  }
}

# Outputs
output "mwaa_webserver_url" {
  value = aws_mwaa_environment.optimyze_airflow.webserver_url
}

output "secrets_manager_secret_name" {
  value = aws_secretsmanager_secret.supabase_credentials.name
}

output "mwaa_bucket_name" {
  value = aws_s3_bucket.mwaa_bucket.bucket
}