# Optimyze Infrastructure Setup

This Terraform configuration deploys a complete job search and aggregation platform infrastructure on AWS, including:

- **Airflow on EC2**: For job scraping and data processing workflows
- **Django on Lightsail**: For the backend API
- **Supabase**: For database (external service)
- **Frontend**: Hosted on Netlify (separate deployment)

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** installed (>= 1.0)
3. **SSH key pair** generated
4. **Supabase project** set up with database
5. **GitHub repository** (optional, for automatic deployment)

## ⚠️ IMPORTANT: User Data Size Limit Fix

The original setup scripts were too large for AWS EC2 user_data (16KB limit). The solution uses lightweight bootstrap scripts that download and run the full setup scripts to avoid this limitation.

## Updated Files Structure

```
scripts/
├── airflow_bootstrap.sh    # Lightweight Airflow bootstrap
├── django_bootstrap.sh     # Lightweight Django bootstrap
└── cleanup_old_scripts.sh  # Cleanup utility (optional)
```

## Quick Start

### 1. Clone and Setup

```bash
# Clone your infrastructure repository
git clone <your-repo-url>
cd <your-repo-name>

# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars
```

### 2. Configure Variables

Edit `terraform.tfvars` with your actual values:

```hcl
# AWS Configuration
aws_region = "ca-central-1"
public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAA... your-public-key-here"

# Supabase Configuration
supabase_url = "https://your-project-id.supabase.co"
supabase_key = "your-supabase-service-role-key"

# Airflow Configuration
airflow_admin_password = "your-secure-password"
airflow_admin_email = "admin@yourdomain.com"

# Django Configuration
django_secret_key = "your-super-secret-django-key"
allowed_hosts = "localhost,127.0.0.1,your-frontend.netlify.app"

# Optional: Auto-deployment from GitHub
github_repo = "https://github.com/yourusername/your-repo.git"
```

### 3. Generate Required Keys

```bash
# Generate SSH key pair if you don't have one
ssh-keygen -t rsa -b 4096 -f ~/.ssh/optimyze-key
# Copy the public key content to terraform.tfvars

# Generate Django secret key
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 4. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

### 5. Access Your Services

After deployment, Terraform will output the access information:

```bash
# Airflow UI
terraform output airflow_url
# Visit: http://YOUR-AIRFLOW-IP:8080
# Login with: admin / your-airflow-password

# Django API
terraform output django_api_url
# Visit: http://YOUR-DJANGO-IP/health/

# SSH Access
terraform output airflow_ssh_command
terraform output django_ssh_command
```

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Django API    │    │   Supabase      │
│   (Netlify)     │◄──►│   (Lightsail)   │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │ API Calls
                                ▼
                       ┌─────────────────┐
                       │   Airflow       │
                       │   (EC2)         │
                       └─────────────────┘
```

## Service Details

### Airflow (EC2)
- **Instance Type**: t3.medium (2 vCPU, 4GB RAM)
- **Port**: 8080 (Web UI)
- **Purpose**: Job scraping, data processing workflows
- **Location**: `/opt/airflow/`

### Django (Lightsail)
- **Bundle**: small_2_0 ($10/month - 2GB RAM, 1 vCPU)
- **Port**: 80 (via Nginx reverse proxy)
- **Purpose**: REST API for job data
- **Location**: `/opt/django/app/`

## Post-Deployment Tasks

### 1. Verify Services

```bash
# Check Airflow
curl http://$(terraform output -raw airflow_public_ip):8080/health

# Check Django
curl http://$(terraform output -raw django_public_ip)/health/
```

### 2. Deploy Your Code

If you didn't set up GitHub auto-deployment:

```bash
# SSH into Django instance
ssh -i ~/.ssh/optimyze-django-key ubuntu@$(terraform output -raw django_public_ip)

# Deploy your Django code
sudo -u django -i
cd /opt/django/app
git clone https://github.com/yourusername/your-django-repo.git .
/opt/django/deploy.sh

# SSH into Airflow instance
ssh -i ~/.ssh/optimyze-key ubuntu@$(terraform output -raw airflow_public_ip)

# Deploy your DAGs
sudo -u airflow -i
cd /opt/airflow/dags
# Copy your DAG files here
sudo supervisorctl restart airflow-scheduler
```

### 3. Configure Domain (Optional)

To use a custom domain:

1. Point your domain's A record to the service IPs
2. SSH into the instances and run:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## Monitoring and Maintenance

### Logs

```bash
# Airflow logs
sudo tail -f /var/log/airflow-webserver.log
sudo tail -f /var/log/airflow-scheduler.log

# Django logs
sudo tail -f /var/log/django.log
sudo tail -f /var/log/gunicorn-error.log

# Service status
sudo supervisorctl status
```

### Updates

```bash
# Update Django code
ssh ubuntu@django-ip
/opt/django/deploy.sh

# Update Airflow DAGs
ssh ubuntu@airflow-ip
/opt/airflow/deploy_dags.sh
```

## Cost Estimation

- **EC2 t3.medium**: ~$30/month
- **Lightsail small_2_0**: $10/month
- **EIP**: $3.6/month (when instance is running)
- **Total**: ~$43-45/month

## Security Notes

- SSH keys are used for instance access
- Security groups limit access to necessary ports
- Instances are in a public subnet (consider VPN for production)
- Update `allowed_hosts` to restrict Django access
- Consider using SSL certificates for production

## Troubleshooting

### Airflow not accessible
```bash
ssh ubuntu@airflow-ip
sudo supervisorctl status airflow-webserver
sudo supervisorctl restart airflow-webserver
```

### Django not responding
```bash
ssh ubuntu@django-ip
sudo supervisorctl status django
sudo nginx -t && sudo systemctl reload nginx
```

### Instance connection issues
- Check security groups allow SSH (port 22)
- Verify your public key is correct in terraform.tfvars
- Ensure you're using the right SSH key file

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all data and resources. Make sure to backup any important data first.

## Support

For issues:
1. Check the logs on the respective instances
2. Verify your terraform.tfvars configuration
3. Ensure AWS credentials are properly configured
4. Check security groups and network connectivity