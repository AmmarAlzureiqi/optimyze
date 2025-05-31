"""
Job Scraper DAG for Optimyze
Scrapes jobs from LinkedIn and Indeed, processes them, and stores in Supabase + OpenSearch
"""

from datetime import datetime, timedelta
import os
import json
import uuid
from typing import List, Dict, Any

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago

import jobspy
from supabase import create_client, Client
from opensearchpy import OpenSearch
import requests

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
OPENSEARCH_URL = os.getenv('OPENSEARCH_URL')

# Job search configurations
JOB_SEARCHES = [
    {
        'site_name': 'linkedin',
        'search_term': 'software engineer',
        'location': 'Canada',
        'results_wanted': 100,
        'hours_old': 24,
        'country_indeed': 'Canada'
    },
    {
        'site_name': 'indeed',
        'search_term': 'software engineer',
        'location': 'Canada',
        'results_wanted': 100,
        'hours_old': 24,
        'country_indeed': 'Canada'
    },
    {
        'site_name': 'linkedin',
        'search_term': 'data scientist',
        'location': 'Canada',
        'results_wanted': 100,
        'hours_old': 24,
        'country_indeed': 'Canada'
    },
    {
        'site_name': 'indeed',
        'search_term': 'data scientist',
        'location': 'Canada',
        'results_wanted': 100,
        'hours_old': 24,
        'country_indeed': 'Canada'
    },
]

# Default arguments for the DAG
default_args = {
    'owner': 'optimyze',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Create the DAG
dag = DAG(
    'optimyze_job_scraper',
    default_args=default_args,
    description='Scrape jobs from multiple sources and store in Supabase + OpenSearch',
    schedule_interval='0 6,18 * * *',  # Run twice daily at 6 AM and 6 PM
    catchup=False,
    max_active_runs=1,
)

def get_supabase_client() -> Client:
    """Create and return Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_opensearch_client() -> OpenSearch:
    """Create and return OpenSearch client"""
    return OpenSearch(
        hosts=[OPENSEARCH_URL],
        http_compress=True,
        use_ssl=True,
        verify_certs=False,  # For development, set to True in production
        ssl_assert_hostname=False,
        ssl_show_warn=False,
    )

def scrape_jobs(**context) -> List[Dict[str, Any]]:
    """Scrape jobs from configured sources"""
    all_jobs = []
    
    for search_config in JOB_SEARCHES:
        try:
            print(f"Scraping {search_config['site_name']} for {search_config['search_term']} in {search_config['location']}")
            
            jobs = jobspy.scrape_jobs(
                site_name=search_config['site_name'],
                search_term=search_config['search_term'],
                location=search_config['location'],
                results_wanted=search_config['results_wanted'],
                hours_old=search_config['hours_old'],
                country_indeed=search_config.get('country_indeed', 'Canada')
            )
            
            if jobs is not None and not jobs.empty:
                # Convert DataFrame to list of dictionaries
                jobs_list = jobs.to_dict('records')
                
                # Add source information
                for job in jobs_list:
                    job['source_site'] = search_config['site_name']
                    job['search_term_used'] = search_config['search_term']
                
                all_jobs.extend(jobs_list)
                print(f"Successfully scraped {len(jobs_list)} jobs from {search_config['site_name']}")
            else:
                print(f"No jobs found for {search_config['site_name']} - {search_config['search_term']}")
                
        except Exception as e:
            print(f"Error scraping {search_config['site_name']}: {str(e)}")
            continue
    
    print(f"Total jobs scraped: {len(all_jobs)}")
    return all_jobs

def process_and_deduplicate_jobs(scraped_jobs: List[Dict[str, Any]], **context) -> List[Dict[str, Any]]:
    """Process and deduplicate jobs"""
    if not scraped_jobs:
        return []
    
    supabase = get_supabase_client()
    
    # Get existing job external_ids to avoid duplicates
    try:
        existing_jobs = supabase.table('jobs_job').select('external_id, source_id').execute()
        existing_external_ids = {job['external_id'] for job in existing_jobs.data}
    except Exception as e:
        print(f"Error fetching existing jobs: {e}")
        existing_external_ids = set()
    
    # Get source mappings
    try:
        sources = supabase.table('jobs_source').select('*').execute()
        source_mapping = {source['jobspy_site_name']: source['id'] for source in sources.data if source['jobspy_site_name']}
    except Exception as e:
        print(f"Error fetching sources: {e}")
        source_mapping = {}
    
    processed_jobs = []
    duplicates_found = 0
    
    for job in scraped_jobs:
        # Create external ID (combination of site + job_url or title+company)
        external_id = job.get('job_url', f"{job.get('title', '')}_{job.get('company', '')}")[:255]
        
        if external_id in existing_external_ids:
            duplicates_found += 1
            continue
        
        # Get source ID
        source_site = job.get('source_site', '')
        source_id = source_mapping.get(source_site)
        
        if not source_id:
            print(f"No source mapping found for {source_site}")
            continue
        
        # Process the job data to match our model
        processed_job = {
            'id': str(uuid.uuid4()),
            'source_id': source_id,
            'external_id': external_id,
            'title': job.get('title', '')[:255],
            'company': job.get('company', '')[:255],
            'location': job.get('location', '')[:255],
            'city': job.get('city', '')[:100] if job.get('city') else '',
            'state': job.get('state', '')[:100] if job.get('state') else '',
            'country': job.get('country', 'Canada')[:100],
            'company_url': job.get('company_url', '')[:200] if job.get('company_url') else '',
            'is_remote': bool(job.get('is_remote', False)),
            'job_type': job.get('job_type', '')[:50],
            'job_function': job.get('job_function', '')[:100],
            'salary_range': str(job.get('salary_range', ''))[:255] if job.get('salary_range') else '',
            'salary_min': float(job['salary_min']) if job.get('salary_min') and str(job['salary_min']).replace('.', '').isdigit() else None,
            'salary_max': float(job['salary_max']) if job.get('salary_max') and str(job['salary_max']).replace('.', '').isdigit() else None,
            'salary_interval': job.get('salary_interval', '')[:20],
            'salary_currency': job.get('salary_currency', 'CAD')[:10],
            'posted_date': job.get('date_posted', datetime.now()).isoformat() if job.get('date_posted') else datetime.now().isoformat(),
            'description': job.get('description', ''),
            'url': job.get('job_url', '')[:200],
            'details': job,  # Store raw job data
            'skills': [],  # TODO: Extract skills from description
            'date_scraped': datetime.now().isoformat(),
            'is_archived': False,
            'indexed_in_opensearch': False,
        }
        
        processed_jobs.append(processed_job)
        existing_external_ids.add(external_id)  # Add to set to avoid duplicates within this batch
    
    print(f"Processed {len(processed_jobs)} jobs, found {duplicates_found} duplicates")
    return processed_jobs

def store_jobs_in_supabase(processed_jobs: List[Dict[str, Any]], **context) -> Dict[str, int]:
    """Store processed jobs in Supabase"""
    if not processed_jobs:
        return {'created': 0, 'errors': 0}
    
    supabase = get_supabase_client()
    
    created_count = 0
    error_count = 0
    
    # Insert jobs in batches of 100
    batch_size = 100
    for i in range(0, len(processed_jobs), batch_size):
        batch = processed_jobs[i:i + batch_size]
        
        try:
            result = supabase.table('jobs_job').insert(batch).execute()
            created_count += len(batch)
            print(f"Successfully inserted batch of {len(batch)} jobs")
        except Exception as e:
            print(f"Error inserting batch: {e}")
            error_count += len(batch)
    
    return {'created': created_count, 'errors': error_count}

def index_jobs_in_opensearch(processed_jobs: List[Dict[str, Any]], **context) -> Dict[str, int]:
    """Index jobs in OpenSearch for search functionality"""
    if not processed_jobs:
        return {'indexed': 0, 'errors': 0}
    
    try:
        client = get_opensearch_client()
        
        # Create index if it doesn't exist
        index_name = 'optimyze_jobs'
        if not client.indices.exists(index=index_name):
            client.indices.create(
                index=index_name,
                body={
                    'mappings': {
                        'properties': {
                            'title': {'type': 'text', 'analyzer': 'standard'},
                            'company': {'type': 'keyword'},
                            'location': {'type': 'text'},
                            'city': {'type': 'keyword'},
                            'state': {'type': 'keyword'},
                            'country': {'type': 'keyword'},
                            'is_remote': {'type': 'boolean'},
                            'job_type': {'type': 'keyword'},
                            'salary_min': {'type': 'float'},
                            'salary_max': {'type': 'float'},
                            'posted_date': {'type': 'date'},
                            'description': {'type': 'text', 'analyzer': 'standard'},
                            'skills': {'type': 'keyword'},
                            'date_scraped': {'type': 'date'},
                        }
                    }
                }
            )
        
        indexed_count = 0
        error_count = 0
        
        for job in processed_jobs:
            try:
                # Prepare document for indexing
                doc = {
                    'id': job['id'],
                    'title': job['title'],
                    'company': job['company'],
                    'location': job['location'],
                    'city': job['city'],
                    'state': job['state'],
                    'country': job['country'],
                    'is_remote': job['is_remote'],
                    'job_type': job['job_type'],
                    'salary_min': job['salary_min'],
                    'salary_max': job['salary_max'],
                    'posted_date': job['posted_date'],
                    'description': job['description'][:5000],  # Limit description length
                    'skills': job['skills'],
                    'date_scraped': job['date_scraped'],
                    'url': job['url'],
                }
                
                client.index(
                    index=index_name,
                    id=job['id'],
                    body=doc
                )
                indexed_count += 1
                
            except Exception as e:
                print(f"Error indexing job {job.get('id', 'unknown')}: {e}")
                error_count += 1
        
        return {'indexed': indexed_count, 'errors': error_count}
        
    except Exception as e:
        print(f"OpenSearch connection error: {e}")
        return {'indexed': 0, 'errors': len(processed_jobs)}

def log_scraper_run(**context) -> None:
    """Log the scraper run statistics to Supabase"""
    ti = context['ti']
    
    # Get results from previous tasks
    scraped_jobs = ti.xcom_pull(task_ids='scrape_jobs') or []
    processed_jobs = ti.xcom_pull(task_ids='process_jobs') or []
    supabase_result = ti.xcom_pull(task_ids='store_in_supabase') or {'created': 0, 'errors': 0}
    opensearch_result = ti.xcom_pull(task_ids='index_in_opensearch') or {'indexed': 0, 'errors': 0}
    
    supabase = get_supabase_client()
    
    try:
        # Get default source for logging (you can modify this logic)
        sources = supabase.table('jobs_source').select('id').limit(1).execute()
        source_id = sources.data[0]['id'] if sources.data else None
        
        if source_id:
            scraper_run = {
                'id': str(uuid.uuid4()),
                'source_id': source_id,
                'end_time': datetime.now().isoformat(),
                'status': 'COMPLETED',
                'jobs_fetched': len(scraped_jobs),
                'jobs_created': supabase_result['created'],
                'jobs_updated': 0,
                'jobs_errored': supabase_result['errors'] + opensearch_result['errors'],
                'params': {'searches': JOB_SEARCHES}
            }
            
            supabase.table('jobs_scraperrun').insert(scraper_run).execute()
            
    except Exception as e:
        print(f"Error logging scraper run: {e}")
    
    print(f"""
    Scraper Run Summary:
    - Jobs Scraped: {len(scraped_jobs)}
    - Jobs Processed: {len(processed_jobs)}
    - Jobs Created in Supabase: {supabase_result['created']}
    - Jobs Indexed in OpenSearch: {opensearch_result['indexed']}
    - Total Errors: {supabase_result['errors'] + opensearch_result['errors']}

# Define tasks
scrape_jobs_task = PythonOperator(
    task_id='scrape_jobs',
    python_callable=scrape_jobs,
    dag=dag,
)

process_jobs_task = PythonOperator(
    task_id='process_jobs',
    python_callable=process_and_deduplicate_jobs,
    op_args=[],
    op_kwargs={'scraped_jobs': "{{ ti.xcom_pull(task_ids='scrape_jobs') }}"},
    dag=dag,
)

store_supabase_task = PythonOperator(
    task_id='store_in_supabase',
    python_callable=store_jobs_in_supabase,
    op_args=[],
    op_kwargs={'processed_jobs': "{{ ti.xcom_pull(task_ids='process_jobs') }}"},
    dag=dag,
)

index_opensearch_task = PythonOperator(
    task_id='index_in_opensearch',
    python_callable=index_jobs_in_opensearch,
    op_args=[],
    op_kwargs={'processed_jobs': "{{ ti.xcom_pull(task_ids='process_jobs') }}"},
    dag=dag,
)

log_run_task = PythonOperator(
    task_id='log_scraper_run',
    python_callable=log_scraper_run,
    dag=dag,
)

# Set task dependencies
scrape_jobs_task >> process_jobs_task
process_jobs_task >> [store_supabase_task, index_opensearch_task]
[store_supabase_task, index_opensearch_task] >> log_run_task