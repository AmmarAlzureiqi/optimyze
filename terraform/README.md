# Optimyze Infrastructure - Terraform

This Terraform configuration deploys the infrastructure for the Optimyze job search and aggregation platform.

## 🏗️ Architecture Overview

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
                       │   (EC2 + Docker)│
                       └─────────────────┘
```

## 📦 Infrastructure Components

- **EC2 Instance**: Runs Dockerized Airflow for job processing workflows
- **Lightsail Instance**: Hosts Django REST API backend
- **VPC & Networking**: Secure networking with public subnets and security groups
- **Static IPs**: Consistent access to services

## 💰 Current Monthly Costs

| Service | Instance Type | Monthly Cost |
|---------|---------------|--------------|
| EC2 (Airflow) | t3.medium | ~$30 |
| Lightsail (Django) | nano_2_0 | $3.50 |
| Elastic IP | - | ~$3.60 |
| **Total** | | **~$37/month** |

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured
- Terraform installed (>= 1.0)
- SSH key pair generated
- Supabase project set up

### 1. Configure Variables

```bash
# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit with your actual values
nano terraform.tfvars
```

Required variables:
```hcl
aws_region = "ca-central-1"
public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAA..."
supabase_url = "https://your-project-id.supabase.co"
supabase_key = "your-supabase-service-role-key"
django_secret_key = "your-django-secret-key"
allowed_hosts = "localhost,127.0.0.1,your-domain.com"
airflow_admin_password = "your-secure-password"
airflow_admin_email = "admin@yourdomain.com"
github_repo = "https://github.com/yourusername/your-repo.git"  # optional
```

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Deploy everything
terraform apply
```

### 3. Access Your Services

```bash
# Get service URLs and SSH commands
terraform output

# Example outputs:
# airflow_public_ip = "3.97.123.45"
# django_api_url = "http://13.58.67.89"
```

## 📋 Post-Deployment Setup

### Airflow (Dockerized)

1. **SSH into EC2 instance**:
   ```bash
   ssh -i ~/.ssh/optimyze-key ubuntu@$(terraform output -raw airflow_public_ip)
   ```

2. **Copy your Airflow setup**:
   ```bash
   # From your local machine
   scp -i ~/.ssh/optimyze-key -r ../airflow ubuntu@AIRFLOW-IP:/opt/
   ```

3. **Start Airflow**:
   ```bash
   cd /opt/airflow
   docker compose up -d
   ```

4. **Access Airflow UI**:
   - URL: `http://AIRFLOW-IP:8080`
   - Username: `admin`
   - Password: `your-airflow-password`

### Django API (Lightsail)

1. **SSH into Lightsail instance**:
   ```bash
   ssh -i ~/.ssh/optimyze-django-key ubuntu@$(terraform output -raw django_public_ip)
   ```

2. **Check Django status**:
   ```bash
   curl http://localhost/health/
   ```

3. **Deploy your Django code** (if using GitHub repo):
   - Code is automatically cloned during setup
   - Or manually copy your Django project to `/opt/django/app/`

## 🔧 Instance Management

### Cost Optimization

To reduce costs for development:

```hcl
# In terraform.tfvars
airflow_instance_type = "t3.small"    # Reduce to $15/month
django_bundle_id = "nano_2_0"         # Keep at $3.50/month
```

### Scaling Up for Production

```hcl
# In terraform.tfvars
airflow_instance_type = "t3.large"    # Scale to $60/month
django_bundle_id = "small_2_0"        # Scale to $10/month
```

## 📊 Monitoring & Logs

### Airflow Logs
```bash
ssh ubuntu@airflow-ip
cd /opt/airflow
docker compose logs -f webserver
docker compose logs -f scheduler
```

### Django Logs
```bash
ssh ubuntu@django-ip
sudo tail -f /var/log/django.log
```

## 🔄 Updates & Maintenance

### Update Airflow
```bash
# Edit docker-compose.yml to change image version
# Then restart
docker compose down
docker compose up -d
```

### Update Django
```bash
# If using GitHub repo
cd /opt/django/app
git pull origin main
/opt/django/deploy.sh
```

### Infrastructure Updates
```bash
# Apply any changes to Terraform configuration
terraform plan
terraform apply
```

## 🗑️ Cleanup

To destroy all infrastructure:

```bash
terraform destroy
```

**⚠️ Warning**: This will delete all resources and data. Make sure to backup any important data first.

## 📁 File Structure

```
terraform/
├── main.tf              # Main infrastructure definition
├── variables.tf         # Variable definitions
├── outputs.tf          # Output values
├── terraform.tfvars    # Your configuration values (not in git)
├── scripts/
│   ├── ec2_bootstrap.sh     # EC2 setup (Docker installation)
│   └── django_bootstrap.sh  # Django setup script
└── README.md           # This file
```

## 🔐 Security Notes

- SSH keys are used for instance access
- Security groups restrict access to necessary ports only
- Consider using a VPN for production deployments
- Rotate passwords and keys regularly
- Don't commit `terraform.tfvars` to version control

## 🆘 Troubleshooting

### Common Issues

**Terraform apply fails**:
- Check AWS credentials: `aws sts get-caller-identity`
- Verify region availability: some instance types may not be available in all regions

**Can't SSH into instances**:
- Check security groups allow SSH (port 22)
- Verify your public key is correct in `terraform.tfvars`
- Use the correct SSH key file path

**Services not responding**:
- Check if services are running (see monitoring section)
- Verify security groups allow the required ports (80, 8080)
- Check instance logs for errors

**High costs**:
- Review instance types in `terraform.tfvars`
- Consider using smaller instances for development
- Remember to destroy unused environments

## 📞 Support

For infrastructure issues:
1. Check the troubleshooting section above
2. Review Terraform and service logs
3. Verify your configuration in `terraform.tfvars`

## 🔗 Related Documentation

- [Airflow Docker Setup](../airflow/README.md)
- [Django Deployment Guide](../django/README.md)
- [AWS Terraform Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)