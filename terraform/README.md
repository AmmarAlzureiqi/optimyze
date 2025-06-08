# Dockerized Airflow Deployment

## 📁 Directory Structure

Create this structure in your project:

```
your-project/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── ...
└── airflow/                    # ← NEW
    ├── docker-compose.yml
    ├── .env
    ├── requirements.txt
    ├── dags/
    │   ├── job_scraper_dag.py
    │   ├── job_processing_dag.py
    │   └── search_index_dag.py
    ├── logs/                   # (will be created)
    └── plugins/                # (optional)
```

## 🚀 Deployment Steps

### 1. **Deploy Infrastructure**
```bash
cd terraform/
terraform apply
```

### 2. **Copy Airflow Setup to EC2**
```bash
# Get your EC2 IP
AIRFLOW_IP=$(terraform output -raw airflow_public_ip)

# Copy the entire airflow folder
scp -i ~/.ssh/optimyze-key -r ../airflow ubuntu@$AIRFLOW_IP:/opt/

# SSH into the instance
ssh -i ~/.ssh/optimyze-key ubuntu@$AIRFLOW_IP
```

### 3. **Configure Environment**
```bash
# Edit the .env file with your actual values
cd /opt/airflow
nano .env

# Update these values:
# SUPABASE_URL=https://your-actual-project-id.supabase.co
# SUPABASE_KEY=your-actual-supabase-key
# SUPABASE_DB_PASSWORD=your-actual-db-password
```

### 4. **Start Airflow**
```bash
# Start all services
docker-compose up -d

# Check if everything is running
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. **Access Airflow**
- **URL**: `http://YOUR-EC2-IP:8080`
- **Username**: `admin`
- **Password**: `admin123`

## 🔧 Management Commands

```bash
# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs webserver
docker-compose logs scheduler

# Update DAGs (just copy new files to dags/ folder)
cp new_dag.py /opt/airflow/dags/

# Access Airflow CLI
docker-compose exec webserver airflow dags list
```

## 📊 Advantages of This Approach

✅ **Reliable**: Uses official Apache Airflow Docker images
✅ **Consistent**: Same environment everywhere
✅ **Easy to update**: Just change version in docker-compose.yml
✅ **Isolated**: Doesn't conflict with system packages
✅ **Portable**: Can run anywhere Docker runs
✅ **Quick startup**: 2-3 minutes vs 10+ minutes for manual install

## 🛠️ Troubleshooting

### Services won't start:
```bash
docker-compose logs
```

### Permission issues:
```bash
sudo chown -R 50000:0 /opt/airflow/{dags,logs,plugins}
```

### Update Airflow version:
```bash
# Edit docker-compose.yml, change image version
# Then restart
docker-compose down
docker-compose up -d
```

## 💰 Cost Optimization

This approach is perfect for using smaller instances since Docker is efficient:
- **t3.small** (2 vCPU, 2GB) - $15/month - Perfect for most workloads
- **t3.micro** (1 vCPU, 1GB) - $8/month - Good for light testing

Much better than the complex bootstrap scripts! 🎯