from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from airflow.operators.python_operator import PythonOperator
import requests
import logging

# DAG Configuration
default_args = {
    'owner': 'optimyze-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
    'catchup': False
}

dag = DAG(
    'search_index_rebuild',
    default_args=default_args,
    description='Rebuild search index on Django backend (same EC2 server)',
    schedule_interval='0 7 * * *',  # Daily at 7 AM (after job scraping at 6 AM)
    max_active_runs=1,
    tags=['search', 'django', 'index']
)

# Django configuration - same EC2 server, no SSH needed
DJANGO_INTERNAL_URL = "http://localhost:8000"  # Direct connection to gunicorn
DJANGO_PUBLIC_URL = "https://optimyzeapi.com"  # Public URL for external verification
DJANGO_PROJECT_PATH = "/opt/airflow/tmp/repo/backend"

def check_django_status(**context):
    """Check if Django backend is accessible"""
    try:
        # Test internal connection first
        logging.info("Checking Django internal status...")
        response = requests.get(f"{DJANGO_INTERNAL_URL}/api/jobs/search/status/", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            search_available = data.get('search_available', False)
            message = data.get('message', 'N/A')
            
            logging.info(f"✅ Django internal connection successful")
            logging.info(f"Search available: {search_available}")
            logging.info(f"Status message: {message}")
            
            # Also test public URL
            try:
                public_response = requests.get(f"{DJANGO_PUBLIC_URL}/api/jobs/search/status/", timeout=30)
                if public_response.status_code == 200:
                    logging.info(f"✅ Django public URL also accessible")
                else:
                    logging.warning(f"⚠️ Public URL returned: {public_response.status_code}")
            except Exception as e:
                logging.warning(f"⚠️ Public URL test failed: {e}")
            
            return True
        else:
            logging.error(f"❌ Django status check failed: {response.status_code}")
            return False
    except Exception as e:
        logging.error(f"❌ Error checking Django status: {e}")
        return False

def prepare_search_index_build(**context):
    """Prepare search index build command"""
    try:
        # Build command to run Django management command locally
        build_command = f"""
        cd {DJANGO_PROJECT_PATH} &&
        source venv/bin/activate &&
        python manage.py build_search_index --verbosity=2
        """
        
        # Store command in XCom for the bash operator
        context['task_instance'].xcom_push(key='build_command', value=build_command)
        
        logging.info("Search index build command prepared")
        return True
        
    except Exception as e:
        logging.error(f"Error preparing search index build: {e}")
        raise

def verify_search_functionality(**context):
    """Test search functionality after rebuild"""
    try:
        # Test search endpoint with multiple queries
        test_queries = ["python", "engineer", "remote", "developer"]
        
        for query in test_queries:
            response = requests.get(
                f"{DJANGO_INTERNAL_URL}/api/jobs/",
                params={"search": query, "page_size": 5},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                result_count = data.get('count', 0)
                logging.info(f"Search test '{query}': {result_count} results")
            else:
                logging.warning(f"Search test failed for '{query}': {response.status_code}")
        
        # Check search status endpoint again
        status_response = requests.get(f"{DJANGO_INTERNAL_URL}/api/jobs/search/status/", timeout=30)
        if status_response.status_code == 200:
            status_data = status_response.json()
            if status_data.get('search_available'):
                logging.info("✅ Search functionality is working correctly")
                
                # Log index metadata if available
                metadata = status_data.get('index_metadata')
                if metadata:
                    total_jobs = metadata.get('total_jobs', 'Unknown')
                    last_build = metadata.get('last_build', 'Unknown')
                    logging.info(f"Index contains {total_jobs} jobs, last built: {last_build}")
                
                return True
            else:
                logging.error("❌ Search index not available after rebuild")
                return False
        else:
            logging.error(f"Search status check failed: {status_response.status_code}")
            return False
            
    except Exception as e:
        logging.error(f"❌ Search functionality test failed: {e}")
        return False

# Task 1: Check Django and search status
check_status = PythonOperator(
    task_id='check_django_status',
    python_callable=check_django_status,
    dag=dag
)

# Task 2: Prepare search index build
prepare_build = PythonOperator(
    task_id='prepare_search_build',
    python_callable=prepare_search_index_build,
    dag=dag
)

# Task 3: Execute search index build locally (no SSH needed)
build_index = BashOperator(
    task_id='build_search_index',
    bash_command="""
    # Get build command from XCom
    build_cmd="{{ ti.xcom_pull(task_ids='prepare_search_build', key='build_command') }}"
    
    # Execute the command directly on same server
    echo "Executing: $build_cmd"
    eval "$build_cmd"
    
    # Check exit code
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo "✅ Search index build completed successfully"
    else
        echo "❌ Search index build failed with exit code: $exit_code"
        exit 1
    fi
    """,
    dag=dag
)

# Task 4: Verify search functionality
verify_search = PythonOperator(
    task_id='verify_search_functionality',
    python_callable=verify_search_functionality,
    dag=dag
)

# Task 5: Optional service restart (if needed)
restart_services = BashOperator(
    task_id='restart_services_if_needed',
    bash_command=f"""
    echo "=== Checking Service Health ==="
    
    # Check if Django service is running properly
    if ! systemctl is-active --quiet django; then
        echo "⚠️ Django service not active, restarting..."
        sudo systemctl restart django
        sleep 5
    else
        echo "✅ Django service is running"
    fi
    
    # Check if nginx is running properly
    if ! systemctl is-active --quiet nginx; then
        echo "⚠️ Nginx service not active, restarting..."
        sudo systemctl restart nginx
        sleep 5
    else
        echo "✅ Nginx service is running"
    fi
    
    # Verify services are responding
    sleep 3
    curl -f http://localhost:8000/api/jobs/search/status/ > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Django is responding"
    else
        echo "❌ Django not responding, attempting restart"
        sudo systemctl restart django
        sleep 10
    fi
    
    echo "=== Service Health Check Completed ==="
    """,
    dag=dag
)

# Task 6: Log completion and send notifications
log_completion = BashOperator(
    task_id='log_completion',
    bash_command=f"""
    echo "=== Search Index Rebuild Completed ==="
    echo "Timestamp: $(date)"
    echo "Django Backend: {DJANGO_PUBLIC_URL}"
    echo "Internal URL: {DJANGO_INTERNAL_URL}"
    echo "Project Path: {DJANGO_PROJECT_PATH}"
    echo "Status: SUCCESS"
    
    # Test final connectivity
    echo "=== Final Connectivity Test ==="
    curl -s {DJANGO_INTERNAL_URL}/api/jobs/search/status/ | python3 -m json.tool || echo "Internal test failed"
    curl -s {DJANGO_PUBLIC_URL}/api/jobs/search/status/ | python3 -m json.tool || echo "Public test failed"
    
    # Optional: Send notification to Slack or email
    # Uncomment and configure if you have webhook URL
    # curl -X POST -H 'Content-type: application/json' \\
    #   --data '{{"text":"🔍 Search index rebuild completed successfully on optimyzeapi.com"}}' \\
    #   ${{var.value.slack_webhook_url}}
    
    echo "✅ All tasks completed successfully!"
    """,
    dag=dag
)

# Define task dependencies - linear flow
check_status >> prepare_build >> build_index >> verify_search >> restart_services >> log_completion

# Alternative: Skip service restart if not needed
# check_status >> prepare_build >> build_index >> verify_search >> log_completion