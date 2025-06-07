# outputs.tf

# Airflow Outputs
output "airflow_url" {
  description = "Airflow UI URL"
  value       = "http://${aws_eip.airflow_eip.public_ip}:8080"
}

output "airflow_https_url" {
  description = "Airflow HTTPS URL (if SSL configured)"
  value       = "https://${aws_eip.airflow_eip.public_ip}"
}

output "airflow_public_ip" {
  description = "Airflow EC2 instance public IP"
  value       = aws_eip.airflow_eip.public_ip
}

output "airflow_ssh_command" {
  description = "SSH command to connect to Airflow instance"
  value       = "ssh -i ~/.ssh/optimyze-key ubuntu@${aws_eip.airflow_eip.public_ip}"
}

# Django Outputs
output "django_public_ip" {
  description = "Django backend public IP"
  value       = aws_lightsail_static_ip.django_static_ip.ip_address
}

output "django_api_url" {
  description = "Django API URL"
  value       = "http://${aws_lightsail_static_ip.django_static_ip.ip_address}"
}

output "django_ssh_command" {
  description = "SSH command for Django instance"
  value       = "ssh -i ~/.ssh/optimyze-django-key ubuntu@${aws_lightsail_static_ip.django_static_ip.ip_address}"
}

# Instance Information
output "airflow_instance_id" {
  description = "Airflow EC2 instance ID"
  value       = aws_instance.airflow_instance.id
}

output "django_instance_name" {
  description = "Django Lightsail instance name"
  value       = aws_lightsail_instance.django_backend.name
}

# Deployment Information
output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    airflow = {
      url = "http://${aws_eip.airflow_eip.public_ip}:8080"
      ip  = aws_eip.airflow_eip.public_ip
      ssh = "ssh -i ~/.ssh/optimyze-key ubuntu@${aws_eip.airflow_eip.public_ip}"
    }
    django = {
      url = "http://${aws_lightsail_static_ip.django_static_ip.ip_address}"
      ip  = aws_lightsail_static_ip.django_static_ip.ip_address
      ssh = "ssh -i ~/.ssh/optimyze-django-key ubuntu@${aws_lightsail_static_ip.django_static_ip.ip_address}"
    }
  }
}