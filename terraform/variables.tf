# variables.tf
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ca-central-1"  # Canada (Central)
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "public_key_path" {
  description = "Path to the public key for EC2 access"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "supabase_connection_string" {
  description = "Supabase PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "airflow_fernet_key" {
  description = "Airflow Fernet key for encryption"
  type        = string
  sensitive   = true
}

variable "airflow_secret_key" {
  description = "Airflow webserver secret key"
  type        = string
  sensitive   = true
}