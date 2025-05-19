variable "region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  default     = "optimyze"
}

variable "environment" {
  description = "Environment (dev, prod)"
  default     = "dev"
}

variable "opensearch_instance_type" {
  description = "OpenSearch instance type"
  default     = "t3.small.search"
}

variable "opensearch_master_user" {
  description = "OpenSearch master user"
  default     = "admin"
}

variable "opensearch_master_password" {
  description = "OpenSearch master password"
  sensitive   = true
}

variable "allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

# Add these to your existing variables.tf file
variable "database_url" {
  description = "Database connection URL (Supabase)"
  sensitive   = true
}

variable "supabase_url" {
  description = "Supabase URL"
}

variable "supabase_key" {
  description = "Supabase API key"
  sensitive   = true
}