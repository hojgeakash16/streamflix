# StreamFlix: a Netflix-style 3-tier application on AWS

A video-catalogue web app (browse by genre, search, personal "My List", JWT login) built as a classic **three-tier architecture** and deployed to AWS with **Terraform**.

```
                     Users
                       |
                  CloudFront  (HTTPS, CDN)
                 /            \
        S3 bucket              Application Load Balancer
   (Tier 1: React app)                  |
                              Auto Scaling Group of EC2
                              (Tier 2: Node.js / Express API)
                                        |
                              RDS PostgreSQL  (private subnets)
                              (Tier 3: data)
```

| Tier | What | AWS service |
|------|------|-------------|
| 1. Presentation | React + Vite single-page app | S3 + CloudFront |
| 2. Application | Node.js / Express REST API with JWT auth | EC2 Auto Scaling Group behind an ALB |
| 3. Data | PostgreSQL (users, movies, watchlist) | RDS in private subnets |

**Security design:** each tier only accepts traffic from the tier in front of it (security groups chain ALB → app → DB); the database has no route to the internet and is not publicly accessible; the S3 bucket is private and only readable by CloudFront (Origin Access Control); passwords are bcrypt-hashed; IMDSv2 is enforced on EC2; DB storage is encrypted.

## Project layout

```
streamflix/
├── frontend/          React app (Tier 1)
├── backend/           Express API + SQL schema/seed (Tier 2 + 3 schema)
├── infra/             Terraform for everything on AWS
├── docker-compose.yml run all three tiers locally
└── docs/RESUME.md     Resume bullets + interview talking points
```

## Step 1: Run it locally (15 minutes)

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then:

```bash
docker compose up --build
```

Open http://localhost:5173, create an account and browse. The API creates the tables and seeds 12 sample movies on first start.

## Step 2: Put the code on GitHub

The servers pull your code from GitHub on boot, so your repo must be **public** (or you can adapt `user_data.sh.tpl` to use a token).

```bash
cd streamflix
git init && git add . && git commit -m "StreamFlix 3-tier app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/streamflix.git
git push -u origin main
```

## Step 3: Deploy to AWS

You need an AWS account, the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) (run `aws configure` with an IAM user's keys, never your root account), [Terraform](https://developer.hashicorp.com/terraform/install) and Node 18+.

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # edit github_repo_url to your repo
terraform init
terraform plan
terraform apply                                # type "yes"; takes ~10-15 min (RDS + CloudFront are slow)
```

Then build and upload the frontend:

```bash
cd ../frontend
npm install
npm run build
aws s3 sync dist s3://$(terraform -chdir=../infra output -raw s3_bucket) --delete
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=../infra output -raw cloudfront_distribution_id) --paths "/*"
```

Open the `website_url` printed by `terraform output`. Allow 5 extra minutes after the first apply for the EC2 server to boot and pass health checks; until then `/api` returns a 502/503.

## Step 4: Tear down (important, avoids charges)

```bash
cd infra
terraform destroy
```

## Cost

Roughly ₹1,500-2,500/month if left running (ALB, RDS and EC2 are the main items; partly covered by free tier for new accounts). For a resume project, deploy, take screenshots/a screen recording, then **destroy**. Set an AWS Budget alert of a few dollars before you start.

## Troubleshooting

- **502/503 on /api right after deploy:** the EC2 instance is still installing. Check the target group health in the EC2 console; wait for "healthy".
- **Check server logs:** EC2 console → instance → Connect (Session Manager or EC2 Instance Connect) → `sudo journalctl -u streamflix -f`. If the instance can't be reached, check `/var/log/cloud-init-output.log`.
- **Blank page after deploy:** you probably forgot the S3 sync or the cache invalidation.
- **Terraform "AMI/instance type not eligible":** change `instance_type` to `t2.micro` or `t3.small` in `terraform.tfvars`.

## Upgrade ideas (each one is a resume bullet)

1. **CI/CD**: GitHub Actions that runs on push, builds the frontend, syncs to S3 and invalidates CloudFront.
2. **Containers**: push the backend image to ECR and run on ECS Fargate instead of EC2.
3. **Secrets Manager** for DB credentials instead of user-data.
4. **Private app tier + NAT gateway**, plus RDS Multi-AZ.
5. **Custom domain + ACM certificate** with Route 53.
6. **Monitoring**: CloudWatch dashboards and alarms on ALB 5xx and RDS CPU.
7. **Remote Terraform state** in S3 with DynamoDB locking.
