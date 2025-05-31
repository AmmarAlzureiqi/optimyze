# Optimyze ETL Infrastructure

A cost-effective Airflow ETL pipeline for scraping jobs from LinkedIn and Indeed, processing them, and storing in Supabase with OpenSearch indexing.

## Architecture

- **EC2 t3.small**: Hosts Airflow (scheduler + webserver)
- **OpenSearch t3.small.search**: Search and analytics engine
- **Supabase**: PostgreSQL database for job storage
- **JobSpy**: Python library for job scraping
- **Region**: Canada Central (ca-central-1)

## Estimated Monthly Cost

- EC2 t3.small: ~$20-25 CAD
- OpenSearch t3.small.search: ~$25-30 CAD
- Data transfer: ~$5-10 CAD
- **Total: ~$50-65 CAD/month**

## Prerequisites

1. **AWS Account** with CLI configured
2. **Terraform** installed
3. **Supabase Project** with your Django models deployed
4. **SSH Key Pair** (will be generated if needed)

## Quick Start

### 1. Prepare Supabase

Run the SQL seeds in your Supabase SQL editor:

```sql
-- Copy content from supabase_seeds.sql
```

### 2. Configure Environment

```bash
# Clone/download the Terraform files
git clone <your-repo> optimyze-etl
cd optimyze-etl

# Copy and edit the variables file
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Supabase details
```

### 3. Deploy Infrastructure

```bash
# Make setup script executable
chmod +x setup.sh

# Run the setup (this will guide you through the process)
./setup.sh
```

### 4. Deploy the DAG

```bash
# Make deploy script executable
chmod +x deploy_dag.sh

# Deploy the job scraper DAG
./deploy_dag.sh
```

## Configuration

### terraform.tfvars

```hcl
aws_region = "ca-central-1"
public_key = "ssh-rsa AAAAB3NzaC1yc2E... your-public-key"
supabase_url = "https://your-project.supabase.co"
supabase_key = "your-service-role-key"
domain_name = "airflow.yourdomain.com"  # Optional
```

### Job Search Configuration

Edit the `JOB_SEARCHES` list in `job_scraper_dag.py` to customize:

```python
JOB_SEARCHES = [
    {
        'site_name': 'linkedin',
        'search_term': 'software engineer',
        'location': 'Canada',
        'results_wanted': 100,
        'hours_old': 24,
    },
    # Add more searches...
]
```

## Usage

### Airflow UI

1. Access: `http://your-ec2-ip:8080`
2. Login: `admin` / `admin123`
3. Enable the `optimyze_job_scraper` DAG
4. Monitor runs and logs

### OpenSearch Dashboard

1. Access: `https://your-opensearch-endpoint/_dashboards`
2. Create visualizations and dashboards for job analytics

### SSH Access

```bash
ssh -i ~/.ssh/optimyze-key ubuntu@your-ec2-ip
```

## DAG Details

### Schedule
- Runs twice daily: 6 AM and 6 PM EST
- Can be triggered manually from Airflow UI

### Tasks
1. **scrape_jobs**: Scrapes jobs from configured sources
2. **process_jobs**: Deduplicates and processes job data
3. **store_in_supabase**: Stores jobs in PostgreSQL
4. **index_in_opensearch**: Indexes jobs for search
5. **log_scraper_run**: Logs run statistics

### Deduplication
- Uses combination of site + job_url as external_id
- Checks existing jobs in Supabase to avoid duplicates
- Processes ~200-400 jobs per run (varies by market conditions)

## Monitoring

### Service Status
```bash
# SSH into EC2 instance
ssh -i ~/.ssh/optimyze-key ubuntu@your-ec2-ip

# Check all services
sudo /home/airflow/check_services.sh

# Check specific services
sudo systemctl status airflow-scheduler
sudo systemctl status airflow-webserver
sudo systemctl status nginx
```

### Logs
```bash
# Airflow logs
tail -f /home/airflow/airflow/logs/scheduler/latest/*.log
tail -f /home/airflow/airflow/logs/dag_id/task_id/*/1.log

# System logs
sudo journalctl -u airflow-scheduler -f
sudo journalctl -u airflow-webserver -f
```

### Key Metrics
- Jobs scraped per run
- Duplicate detection rate
- Processing time
- Error rates

## Troubleshooting

### Common Issues

1. **DAG not appearing**
   - Check file permissions: `ls -la /home/airflow/airflow/dags/`
   - Restart scheduler: `sudo systemctl restart airflow-scheduler`

2. **JobSpy errors**
   - LinkedIn/Indeed may rate limit
   - Reduce `results_wanted` or increase `hours_old`
   - Check error logs in Airflow

3. **Supabase connection issues**
   - Verify URL and key in `/home/airflow/.env`
   - Check network connectivity

4. **OpenSearch connection issues**
   - OpenSearch domain takes 10-15 minutes to initialize
   - Check security group allows traffic

### Performance Tuning

1. **Increase job volume**
   - Add more search terms
   - Add more job sites (glassdoor, etc.)
   - Reduce `hours_old` for more recent jobs

2. **Optimize costs**
   - Reduce OpenSearch to development instance type
   - Use spot instances for EC2 (requires additional config)
   - Implement lifecycle policies for old jobs

## Security

### Production Recommendations

1. **Change default passwords**
2. **Set up SSL certificates**
3. **Restrict security group access**
4. **Use AWS Secrets Manager for sensitive data**
5. **Enable CloudTrail and monitoring**

### SSL Setup (Optional)

```bash
# SSH into instance
sudo certbot --nginx -d your-domain.com

# Update nginx config for HTTPS redirect
```

## Scaling

### Horizontal Scaling
- Add more EC2 instances behind a load balancer
- Use RDS for Airflow metadata database
- Consider AWS Managed Airflow (MWAA) for production

### Vertical Scaling
- Upgrade to t3.medium or larger
- Increase OpenSearch instance size
- Add more OpenSearch nodes

## Maintenance

### Regular Tasks
- Monitor disk usage on EC2
- Review and archive old jobs
- Update dependencies monthly
- Monitor AWS costs

### Backup Strategy
- Supabase handles database backups
- Consider S3 backup for Airflow configurations
- Document infrastructure changes

## Support

For issues:
1. Check Airflow logs first
2. Verify service status
3. Check AWS CloudWatch metrics
4. Review security group settings

## License

MIT License - feel free to modify for your needs.