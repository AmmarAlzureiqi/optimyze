# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ca-central-1"
}

variable "public_key" {
  description = "Public SSH key for instance access"
  type        = string
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

# Airflow Configuration
variable "airflow_instance_type" {
  description = "EC2 instance type for Airflow"
  type        = string
  default     = "t3.small"  # 2 vCPU, 4GB RAM - good for Airflow
}

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

# Django Configuration
variable "django_bundle_id" {
  description = "Lightsail bundle ID for Django instance"
  type        = string
  default     = "micro_2_0" 
}

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

# Repository Configuration
variable "github_repo" {
  description = "GitHub repository URL for the project"
  type        = string
  default     = ""
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}

variable "deploy_key" {
  description = "GitHub deploy key (private key for repo access)"
  type        = string
  sensitive   = true
  default     = ""
}

# Domain Configuration (optional)
variable "domain_name" {
  description = "Domain name for SSL certificate (optional)"
  type        = string
  default     = ""
}