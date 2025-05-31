# outputs.tf
output "airflow_public_ip" {
  description = "Public IP address of the Airflow server"
  value       = aws_eip.airflow_ip.public_ip
}

output "airflow_web_url" {
  description = "URL to access Airflow web interface"
  value       = "http://${aws_eip.airflow_ip.public_ip}:8080"
}

output "elasticsearch_url" {
  description = "URL to access Elasticsearch"
  value       = "http://${aws_eip.airflow_ip.public_ip}:9200"
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh -i ~/.ssh/id_rsa ec2-user@${aws_eip.airflow_ip.public_ip}"
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.airflow_server.id
}