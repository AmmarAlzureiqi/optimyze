from datetime import datetime, timedelta
import json
import psycopg2
import psycopg2.extras
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.amazon.aws.hooks.secrets_manager import SecretsManagerHook

def get_database_connection():
    """Get database credentials from Secrets Manager and create connection"""
    secrets_hook = SecretsManagerHook(aws_conn_id='aws_default')
    secret = secrets_hook.get_secret('optimyze-dev-supabase-credentials')
    credentials = json.loads(secret)
    
    conn = psycopg2.connect(credentials['database_url'])
    return conn

def scrape_jobs_from_source(source_name, site_name):
    """Scrape jobs for a specific source"""
    from jobspy import scrape_jobs
    import uuid
    
    # Get database connection
    conn = get_database_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get source ID
        cursor.execute("SELECT id FROM jobs_source WHERE jobspy_site_name = %s", (site_name,))
        source = cursor.fetchone()
        if not source:
            print(f"Source {site_name} not found in database")
            return
        source_id = source['id']
        
        # Create scraper run record
        run_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO jobs_scraperrun (id, source_id, status, start_time) VALUES (%s, %s, %s, NOW())",
            (run_id, source_id, 'RUNNING')
        )
        conn.commit()
        
        # Define search terms and locations
        search_terms = ["software engineer", "data scientist", "product manager", "backend developer", "frontend developer"]
        locations = ["New York, NY", "San Francisco, CA", "Los Angeles, CA", "Chicago, IL", "Austin, TX", "Remote"]
        
        total_jobs_found = 0
        total_jobs_created = 0
        total_jobs_updated = 0
        
        for search_term in search_terms:
            for location in locations:
                try:
                    print(f"Scraping {site_name} for '{search_term}' in '{location}'")
                    
                    # Scrape with high limits
                    jobs = scrape_jobs(
                        site_name=site_name,
                        search_term=search_term,
                        location=location,
                        results_wanted=500,  # High limit
                        hours_old=168,       # Last week
                        country_indeed='USA' if site_name == 'indeed' else None
                    )
                    
                    if jobs.empty:
                        continue
                        
                    total_jobs_found += len(jobs)
                    
                    # Process each job
                    for _, job in jobs.iterrows():
                        job_data = prepare_job_data(job, source_id)
                        
                        # Check if job exists
                        cursor.execute(
                            "SELECT id FROM jobs_job WHERE source_id = %s AND external_id = %s",
                            (source_id, job_data['external_id'])
                        )
                        existing_job = cursor.fetchone()
                        
                        if existing_job:
                            # Update existing job
                            update_job(cursor, existing_job['id'], job_data)
                            total_jobs_updated += 1
                        else:
                            # Create new job
                            create_job(cursor, job_data)
                            total_jobs_created += 1
                    
                    conn.commit()
                    
                except Exception as e:
                    print(f"Error scraping {search_term} in {location}: {str(e)}")
                    continue
        
        # Update scraper run
        cursor.execute(
            """UPDATE jobs_scraperrun 
               SET status = %s, end_time = NOW(), jobs_fetched = %s, 
                   jobs_created = %s, jobs_updated = %s 
               WHERE id = %s""",
            ('COMPLETED', total_jobs_found, total_jobs_created, total_jobs_updated, run_id)
        )
        conn.commit()
        
        print(f"Completed {site_name}: Found {total_jobs_found}, Created {total_jobs_created}, Updated {total_jobs_updated}")
        
    except Exception as e:
        # Update scraper run with error
        cursor.execute(
            "UPDATE jobs_scraperrun SET status = %s, end_time = NOW(), error_message = %s WHERE id = %s",
            ('FAILED', str(e), run_id)
        )
        conn.commit()
        raise
    finally:
        cursor.close()
        conn.close()

def prepare_job_data(job, source_id):
    """Prepare job data for database insertion"""
    import uuid
    from datetime import datetime
    
    # Create location string
    location_parts = []
    if not pd.isna(job.get('city', '')):
        location_parts.append(job['city'])
    if not pd.isna(job.get('state', '')):
        location_parts.append(job['state'])
    if not pd.isna(job.get('country', '')):
        location_parts.append(job['country'])
    location = ', '.join(filter(None, location_parts)) or 'Not specified'
    
    # Handle date_posted
    posted_date = job.get('date_posted')
    if pd.isna(posted_date):
        posted_date = datetime.now()
    
    return {
        'id': str(uuid.uuid4()),
        'source_id': source_id,
        'external_id': job.get('job_url', '').split('/')[-1] or str(uuid.uuid4()),
        'title': job.get('title', ''),
        'company': job.get('company', ''),
        'location': location,
        'city': job.get('city', '') if not pd.isna(job.get('city', '')) else '',
        'state': job.get('state', '') if not pd.isna(job.get('state', '')) else '',
        'country': job.get('country', '') if not pd.isna(job.get('country', '')) else '',
        'company_url': job.get('company_url', '') if not pd.isna(job.get('company_url', '')) else '',
        'is_remote': bool(job.get('is_remote', False)),
        'job_type': job.get('job_type', '') if not pd.isna(job.get('job_type', '')) else '',
        'salary_min': job.get('min_amount') if not pd.isna(job.get('min_amount', None)) else None,
        'salary_max': job.get('max_amount') if not pd.isna(job.get('max_amount', None)) else None,
        'salary_interval': job.get('interval', '') if not pd.isna(job.get('interval', '')) else '',
        'salary_currency': job.get('currency', '') if not pd.isna(job.get('currency', '')) else '',
        'posted_date': posted_date,
        'description': job.get('description', ''),
        'url': job.get('job_url', ''),
        'details': job.to_dict(),
        'date_scraped': datetime.now()
    }

def create_job(cursor, job_data):
    """Insert new job into database"""
    columns = list(job_data.keys())
    placeholders = ', '.join(['%s'] * len(columns))
    column_names = ', '.join(columns)
    
    query = f"INSERT INTO jobs_job ({column_names}) VALUES ({placeholders})"
    cursor.execute(query, list(job_data.values()))

def update_job(cursor, job_id, job_data):
    """Update existing job in database"""
    # Remove id from job_data for update
    update_data = {k: v for k, v in job_data.items() if k != 'id'}
    
    set_clause = ', '.join([f"{k} = %s" for k in update_data.keys()])
    values = list(update_data.values()) + [job_id]
    
    query = f"UPDATE jobs_job SET {set_clause} WHERE id = %s"
    cursor.execute(query, values)

# Job Scraping DAG
with DAG(
    'job_scraping_dag',
    default_args={
        'owner': 'airflow',
        'depends_on_past': False,
        'email_on_failure': False,
        'email_on_retry': False,
        'retries': 2,
        'retry_delay': timedelta(minutes=5),
    },
    description='Scrape jobs from multiple sources',
    schedule_interval='@daily',
    start_date=datetime(2025, 5, 22),
    catchup=False,
    tags=['jobs', 'scraping'],
) as dag:
    
    # Create tasks for each job source
    scrape_indeed = PythonOperator(
        task_id='scrape_indeed',
        python_callable=scrape_jobs_from_source,
        op_kwargs={'source_name': 'Indeed', 'site_name': 'indeed'},
    )
    
    scrape_linkedin = PythonOperator(
        task_id='scrape_linkedin',
        python_callable=scrape_jobs_from_source,
        op_kwargs={'source_name': 'LinkedIn', 'site_name': 'linkedin'},
    )
    
    scrape_glassdoor = PythonOperator(
        task_id='scrape_glassdoor',
        python_callable=scrape_jobs_from_source,
        op_kwargs={'source_name': 'Glassdoor', 'site_name': 'glassdoor'},
    )
    
    # Run tasks in parallel
    [scrape_indeed, scrape_linkedin, scrape_glassdoor]