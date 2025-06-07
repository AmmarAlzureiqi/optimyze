# outputs.tf
output "airflow_url" {
  description = "Airflow UI URL"
  value       = "http://${aws_eip.airflow_eip.public_ip}:8080"
}

output "airflow_https_url" {
  description = "Airflow HTTPS URL (if SSL configured)"
  value       = "https://${aws_eip.airflow_eip.public_ip}"
}

output "ec2_public_ip" {
  description = "EC2 instance public IP"
  value       = aws_eip.airflow_eip.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/optimyze-key ubuntu@${aws_eip.airflow_eip.public_ip}"
}