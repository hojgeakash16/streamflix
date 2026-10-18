variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1" # Mumbai
}

variable "project" {
  description = "Name prefix for all resources"
  type        = string
  default     = "streamflix"
}

variable "github_repo_url" {
  description = "Public HTTPS git URL of YOUR copy of this project (the EC2 servers clone it on boot)"
  type        = string
}

variable "backend_path" {
  description = "Path to the backend folder inside the repo"
  type        = string
  default     = "backend"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}
