output "s3_bucket_name" {
  value = aws_s3_bucket.document_storage.bucket
}

output "opensearch_endpoint" {
  value = aws_opensearch_domain.job_search.endpoint
}

output "access_key_id" {
  value     = aws_iam_access_key.django_app_key.id
  sensitive = true
}

output "secret_access_key" {
  value     = aws_iam_access_key.django_app_key.secret
  sensitive = true
}