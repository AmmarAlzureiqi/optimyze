output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main_instance.id
}

output "public_ip" {
  description = "Public IP address of the instance"
  value       = aws_eip.main_eip.public_ip
}

output "airflow_url" {
  description = "URL to access Airflow web UI"
  value       = "http://${aws_eip.main_eip.public_ip}:8080"
}

output "django_url" {
  description = "URL to access Django application"
  value       = "http://${aws_eip.main_eip.public_ip}:8000"
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i your-private-key.pem ubuntu@${aws_eip.main_eip.public_ip}"
}