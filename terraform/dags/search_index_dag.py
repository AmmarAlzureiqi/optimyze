from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from airflow.operators.python_operator import PythonOperator
from airflow.sensors.external_task_sensor import ExternalTaskSensor
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
    description='Rebuild search index on Django backend',
    schedule_interval='0 3 * * *',  # Daily at 3 AM (after job processing)
    max_active_runs=1,
    tags=['search', 'django', 'index']
)

# Django backend IP (will be set after deployment)
DJANGO_IP = "{{ var.value.django_backend_ip }}"  # Set this as Airflow variable

def check_django_health(**context):
    """Check if Django backend is healthy"""
    try:
        response = requests.get(f"http://{DJANGO_IP}/health/", timeout=30)
        if response.status_code == 200:
            logging.info("Django backend is healthy")
            return True
        else:
            logging.error(f"Django health check failed: {response.status_code}")
            return False
    except Exception as e:
        logging.error(f"Django health check error: {e}")
        return False

def trigger_search_index_build(**context):
    """Trigger search index build on Django backend"""
    try:
        # SSH command to run the Django management command
        ssh_command = f"""
        ssh -o StrictHostKeyChecking=no -i /home/ubuntu/.ssh/optimyze-key.pem ubuntu@{DJANGO_IP} '
        cd /opt/django/app &&
        source /opt/django/venv/bin/activate &&
        python manage.py build_search_index --force --verbosity=2
        '
        """
        
        # Store command in XCom for the bash operator
        context['task_instance'].xcom_push(key='ssh_command', value=ssh_command)
        
        logging.info("Search index build command prepared")
        return True
        
    except Exception as e:
        logging.error(f"Error preparing search index build: {e}")
        raise

def check_search_functionality(**context):
    """Test search functionality after rebuild"""
    try:
        # Test search endpoint
        test_queries = ["python developer", "software engineer", "remote"]
        
        for query in test_queries:
            response = requests.get(
                f"http://{DJANGO_IP}/api/jobs/",
                params={"search": query, "page_size": 5},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                result_count = data.get('count', 0)
                logging.info(f"Search test '{query}': {result_count} results")
            else:
                logging.warning(f"Search test failed for '{query}': {response.status_code}")
        
        # Check search status endpoint
        status_response = requests.get(f"http://{DJANGO_IP}/api/search-status/", timeout=30)
        if status_response.status_code == 200:
            status_data = status_response.json()
            if status_data.get('search_available'):
                logging.info("✅ Search functionality is working correctly")
                return True
            else:
                logging.error("❌ Search index not available")
                return False
        else:
            logging.error(f"Search status check failed: {status_response.status_code}")
            return False
            
    except Exception as e:
        logging.error(f"Search functionality test failed: {e}")
        return False

# Task 1: Wait for job processing to complete (optional)
wait_for_jobs = ExternalTaskSensor(
    task_id='wait_for_job_processing',
    external_dag_id='job_processing_dag',  # Your existing job processing DAG
    external_task_id=None,  # Wait for entire DAG
    timeout=3600,  # 1 hour timeout
    poke_interval=300,  # Check every 5 minutes
    mode='reschedule',
    dag=dag
)

# Task 2: Check Django health
check_health = PythonOperator(
    task_id='check_django_health',
    python_callable=check_django_health,
    dag=dag
)

# Task 3: Prepare search index build
prepare_build = PythonOperator(
    task_id='prepare_search_build',
    python_callable=trigger_search_index_build,
    dag=dag
)

# Task 4: Execute search index build via SSH
build_index = BashOperator(
    task_id='build_search_index',
    bash_command="""
    # Get SSH command from XCom
    ssh_cmd="{{ ti.xcom_pull(task_ids='prepare_search_build', key='ssh_command') }}"
    
    # Execute the command
    eval "$ssh_cmd"
    
    # Check exit code
    if [ $? -eq 0 ]; then
        echo "✅ Search index build completed successfully"
    else
        echo "❌ Search index build failed"
        exit 1
    fi
    """,
    dag=dag
)

# Task 5: Test search functionality
test_search = PythonOperator(
    task_id='test_search_functionality',
    python_callable=check_search_functionality,
    dag=dag
)

# Task 6: Log completion
log_completion = BashOperator(
    task_id='log_completion',
    bash_command="""
    echo "=== Search Index Rebuild Completed ==="
    echo "Timestamp: $(date)"
    echo "Django Backend: {{ var.value.django_backend_ip }}"
    echo "Status: SUCCESS"
    
    # Optional: Send notification to Slack or email
    # curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"🔍 Search index rebuild completed successfully"}' \
    #   {{ var.value.slack_webhook_url }}
    """,
    dag=dag
)

# Define task dependencies
wait_for_jobs >> check_health >> prepare_build >> build_index >> test_search >> log_completion

# Alternative: Run independently without waiting for job processing
# check_health >> prepare_build >> build_index >> test_search >> log_completion