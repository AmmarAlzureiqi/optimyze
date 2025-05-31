# Airflow + Elasticsearch Deployment Guide

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **SSH Key Pair** generated on your local machine
3. **Supabase Project** with connection details
4. **Terraform** installed locally

## Setup Steps

### 1. Generate SSH Key (if you don't have one)

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
```

### 2. Generate Required Keys

```bash
# Generate Fernet key for Airflow encryption
python3 -c "from cryptography.fernet import Fernet; print('FERNET_KEY:', Fernet.generate_key().decode())"

# Generate secret key for Airflow webserver
openssl rand -base64 32
```

### 3. Configure Terraform Variables

```bash
# Copy the example file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your actual values
nano terraform.tfvars
```

Fill in:
- Your Supabase connection string
- Generated Fernet key
- Generated secret key
- Your SSH public key path

### 4. Prepare Your DAG Files

Create a `dags/` directory in your project and add your DAG files:

```
project/
├── main.tf
├── variables.tf
├── outputs.tf
├── setup.sh
├── terraform.tfvars
├── dags/
│   ├── job_processing_dag.py
│   └── job_scraping_dag.py
└── requirements.txt
```

### 5. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

### 6. Upload Your DAGs and Requirements

After deployment, you'll need to copy your files to the server:

```bash
# Get the server IP from Terraform output
SERVER_IP=$(terraform output -raw airflow_public_ip)

# Copy your DAGs
scp -r dags/ ec2-user@$SERVER_IP:/home/ec2-user/airflow-app/

# Copy requirements.txt
scp requirements.txt ec2-user@$SERVER_IP:/home/ec2-user/airflow-app/

# SSH into the server to restart services with new requirements
ssh ec2-user@$SERVER_IP
cd /home/ec2-user/airflow-app

# Update the environment file with requirements
REQUIREMENTS=$(cat requirements.txt | tr '\n' ' ')
sed -i "s/_PIP_ADDITIONAL_REQUIREMENTS=.*/_PIP_ADDITIONAL_REQUIREMENTS=$REQUIREMENTS/" .env

# Restart to pick up new requirements
./manage-airflow.sh restart
```

## Access Your Services

After deployment:

- **Airflow Web UI**: `http://YOUR_SERVER_IP:8080`
  - Username: `admin`
  - Password: `admin`

- **Elasticsearch**: `http://YOUR_SERVER_IP:9200`

## Management Commands

SSH into your server and use the management script:

```bash
# SSH to server
ssh ec2-user@YOUR_SERVER_IP

# Start services
./manage-airflow.sh start

# Stop services
./manage-airflow.sh stop

# Restart services
./manage-airflow.sh restart

# View logs
./manage-airflow.sh logs

# Check status
./manage-airflow.sh status
```

## Updating DAGs

To update your DAGs:

```bash
# Copy new DAG files
scp -r dags/ ec2-user@$SERVER_IP:/home/ec2-user/airflow-app/

# The scheduler will automatically pick up changes
```

## Monitoring

- **System Resources**: `htop` (pre-installed)
- **Docker Status**: `docker ps`
- **Logs**: `./manage-airflow.sh logs`
- **Elasticsearch Health**: `curl http://localhost:9200/_cluster/health`

## Security Considerations

**Important**: This setup has open security groups for demonstration. For production:

1. **Restrict Security Groups**: 
   - Only allow your IP for ports 8080, 9200, and 22
   - Use a VPN or bastion host

2. **Enable HTTPS**:
   - Use Application Load Balancer with SSL certificate
   - Configure Airflow for HTTPS

3. **Change Default Passwords**:
   - Change the Airflow admin password
   - Use strong authentication methods

4. **Database Security**:
   - Ensure Supabase has proper access controls
   - Use connection pooling if needed

## Troubleshooting

### Services Won't Start
```bash
# Check Docker status
docker ps -a

# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h
```

### Can't Access Web UI
```bash
# Check if port 8080 is listening
netstat -tlnp | grep 8080

# Check security group allows port 8080
# Check if Airflow container is running
docker ps | grep airflow
```

### Performance Issues
```bash
# Monitor resource usage
htop

# Check container resource usage
docker stats

# Consider upgrading to t3.medium if needed
```

## Cost Optimization

- **Instance**: t3.small (~$16/month)
- **Storage**: 30GB (~$3/month)
- **Data Transfer**: Minimal for development
- **Total**: ~$20/month

To reduce costs:
- Stop instance when not in use
- Use scheduled start/stop
- Monitor usage with CloudWatch

## Backup Strategy

```bash
# Backup DAGs (automated via Git)
git add dags/
git commit -m "Update DAGs"
git push

# Backup Elasticsearch data
docker exec elasticsearch_container elasticsearch-dump --input=http://localhost:9200 --output=/backup/backup.json

# Backup logs
tar -czf airflow-logs-$(date +%Y%m%d).tar.gz logs/
```