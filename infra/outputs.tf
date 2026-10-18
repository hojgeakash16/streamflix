output "website_url" {
  description = "Open this in your browser once deployed"
  value       = "https://${aws_cloudfront_distribution.cdn.domain_name}"
}

output "s3_bucket" {
  description = "Upload the React build here"
  value       = aws_s3_bucket.web.bucket
}

output "cloudfront_distribution_id" {
  description = "Used to invalidate the cache after each frontend deploy"
  value       = aws_cloudfront_distribution.cdn.id
}

output "alb_dns_name" {
  value = aws_lb.app.dns_name
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.address
}
