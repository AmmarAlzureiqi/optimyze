variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ca-central-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "public_key" {
  description = "Public SSH key for instance access"
  type        = string
}

# Supabase Configuration
variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

# Django Configuration
variable "django_secret_key" {
  description = "Django secret key"
  type        = string
  sensitive   = true
}

variable "allowed_hosts" {
  description = "Django allowed hosts (comma-separated)"
  type        = string
  default     = "localhost,127.0.0.1"
}

# Airflow Configuration
variable "airflow_admin_user" {
  description = "Airflow admin username"
  type        = string
  default     = "admin"
}

variable "airflow_admin_password" {
  description = "Airflow admin password"
  type        = string
  sensitive   = true
}

variable "airflow_admin_email" {
  description = "Airflow admin email"
  type        = string
  default     = "admin@optimyze.com"
}

# Repository Configuration
variable "github_repo" {
  description = "GitHub repository URL for the project"
  type        = string
  default     = ""
}