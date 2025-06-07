"""
Job Scraper DAG with Minsearch for Optimyze
Scrapes jobs and creates searchable index using Minsearch
"""

from datetime import datetime, timedelta
import os
import json
import uuid
import pickle
from typing import List, Dict, Any
import pandas as pd

from airflow import DAG
from airflow.operators.python import PythonOperator

import jobspy
from supabase import create_client, Client
import minsearch

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
MINSEARCH_INDEX_PATH = os.getenv('MINSEARCH_INDEX_PATH', '/home/airflow/search_index')

# Job search configurations
JOB_SEARCHES = [
    # Canada searches
    {'site_name': 'linkedin', 'search_term': 'software engineer', 'location': 'Canada', 'results_wanted': 100},
    {'site_name': 'indeed', 'search_term': 'software engineer', 'location': 'Canada', 'results_wanted': 100},
    {'site_name': 'linkedin', 'search_term': 'data scientist', 'location': 'Canada', 'results_wanted': 80},
    {'site_name': 'indeed', 'search_term': 'data scientist', 'location': 'Canada', 'results_wanted': 80},
    {'site_name': 'linkedin', 'search_term': 'python developer', 'location': 'Canada', 'results_wanted': 80},
    {'site_name': 'indeed', 'search_term': 'python developer', 'location': 'Canada', 'results_wanted': 80},
    
    # US searches
    {'site_name': 'linkedin', 'search_term': 'software engineer', 'location': 'United States', 'results_wanted': 150},
    {'site_name': 'indeed', 'search_term': 'software engineer', 'location': 'United States', 'results_wanted': 150},
    {'site_name': 'linkedin', 'search_term': 'data scientist', 'location': 'United States', 'results_wanted': 100},
    {'site_name': 'indeed', 'search_term': 'data scientist', 'location': 'United States', 'results_wanted': 100},
]

default_args = {
    'owner': 'optimyze',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'optimyze_job_scraper_minsearch',
    default_args=default_args,
    description='Job scraper with Minsearch indexing',
    schedule_interval='0 6 * * *',  # Daily at 6 AM
    catchup=False,
    max_active_runs=1,
    tags=['jobs', 'minsearch', 'etl']
)

def get_supabase_client() -> Client:
    """Create and return Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def extract_skills_from_description(description: str) -> List[str]:
    """Extract skills from job description"""
    if not description:
        return []
    
    skills_keywords = [
        'python', 'javascript', 'java', 'typescript', 'react', 'node.js', 'nodejs',
        'angular', 'vue', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
        'django', 'flask', 'fastapi', 'express', 'spring', 'laravel', 'rails',
        'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
        'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'sql',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
        'git', 'github', 'gitlab', 'ci/cd', 'spark', 'hadoop', 'airflow',
        'tableau', 'power bi', 'linux', 'unix', 'bash', 'api', 'rest', 'graphql'
    ]
    
    description_lower = description.lower()
    found_skills = []
    
    for skill in skills_keywords:
        if skill in description_lower:
            found_skills.append(skill.title())
    
    return list(set(found_skills))

def setup_database_sources(**context) -> Dict[str, str]:
    """Ensure job sources exist in database"""
    supabase = get_supabase_client()
    
    sources_data = [
        {
            'name': 'LinkedIn',
            'url': 'https://linkedin.com',
            'description': 'Professional networking platform',
            'jobspy_site_name': 'linkedin',
            'is_active': True,
            'config': {}
        },
        {
            'name': 'Indeed',
            'url': 'https://indeed.com',
            'description': 'Job search engine',
            'jobspy_site_name': 'indeed',
            'is_active': True,
            'config': {}
        }
    ]
    
    source_mapping = {}
    
    for source_data in sources_data:
        try:
            existing = supabase.table('jobs_source').select('*').eq('jobspy_site_name', source_data['jobspy_site_name']).execute()
            
            if existing.data:
                source_id = existing.data[0]['id']
            else:
                source_data['id'] = str(uuid.uuid4())
                result = supabase.table('jobs_source').insert(source_data).execute()
                source_id = result.data[0]['id']
            
            source_mapping[source_data['jobspy_site_name']] = source_id
            
        except Exception as e:
            print(f"Error setting up source {source_data['name']}: {e}")
    
    return source_mapping

def scrape_jobs_task(**context) -> List[Dict[str, Any]]:
    """Scrape jobs from configured sources"""
    all_jobs = []
    
    for i, search_config in enumerate(JOB_SEARCHES):
        try:
            print(f"Scraping {i+1}/{len(JOB_SEARCHES)}: {search_config['site_name']} for '{search_config['search_term']}'")
            
            jobs = jobspy.scrape_jobs(
                site_name=search_config['site_name'],
                search_term=search_config['search_term'],
                location=search_config['location'],
                results_wanted=search_config['results_wanted'],
                hours_old=24 * 7,  # Past week
                country_indeed='Canada' if 'Canada' in search_config['location'] else 'USA'
            )
            
            if jobs is not None and not jobs.empty:
                jobs_list = jobs.to_dict('records')
                
                for job in jobs_list:
                    job['source_site'] = search_config['site_name']
                    job['search_term_used'] = search_config['search_term']
                    job['search_location'] = search_config['location']
                
                all_jobs.extend(jobs_list)
                print(f"✅ Scraped {len(jobs_list)} jobs")
            else:
                print(f"⚠️ No jobs found")
                
        except Exception as e:
            print(f"❌ Error scraping: {e}")
            continue
    
    print(f"🎉 Total jobs scraped: {len(all_jobs)}")
    return all_jobs

def process_and_store_jobs(scraped_jobs: List[Dict[str, Any]], **context) -> List[Dict[str, Any]]:
    """Process jobs and store in Supabase"""
    if not scraped_jobs:
        return []
    
    source_mapping = context['ti'].xcom_pull(task_ids='setup_database_sources')
    supabase = get_supabase_client()
    
    # Get existing jobs to avoid duplicates
    try:
        existing_jobs = supabase.table('jobs_job').select('external_id').execute()
        existing_external_ids = {job['external_id'] for job in existing_jobs.data}
    except Exception as e:
        print(f"Error fetching existing jobs: {e}")
        existing_external_ids = set()
    
    processed_jobs = []
    created_count = 0
    duplicate_count = 0
    
    for job in scraped_jobs:
        try:
            # Create external ID
            external_id = job.get('job_url', f"{job.get('title', '')}_{job.get('company', '')}")[:255]
            
            if external_id in existing_external_ids:
                duplicate_count += 1
                continue
            
            source_id = source_mapping.get(job.get('source_site', ''))
            if not source_id:
                continue
            
            # Extract skills
            skills = extract_skills_from_description(job.get('description', ''))
            
            # Process job data
            processed_job = {
                'id': str(uuid.uuid4()),
                'source_id': source_id,
                'external_id': external_id,
                'title': str(job.get('title', ''))[:255],
                'company': str(job.get('company', ''))[:255],
                'location': str(job.get('location', ''))[:255],
                'city': str(job.get('city', ''))[:100] if job.get('city') else '',
                'state': str(job.get('state', ''))[:100] if job.get('state') else '',
                'country': 'Canada' if 'Canada' in job.get('search_location', '') else 'USA',
                'company_url': str(job.get('company_url', ''))[:200] if job.get('company_url') else '',
                'is_remote': bool(job.get('is_remote', False)),
                'job_type': str(job.get('job_type', ''))[:50],
                'job_function': str(job.get('job_function', ''))[:100],
                'salary_range': str(job.get('salary_range', ''))[:255],
                'salary_min': float(job['salary_min']) if job.get('salary_min') and str(job['salary_min']).replace('.', '').isdigit() else None,
                'salary_max': float(job['salary_max']) if job.get('salary_max') and str(job['salary_max']).replace('.', '').isdigit() else None,
                'salary_interval': 'yearly',
                'salary_currency': 'CAD' if 'Canada' in job.get('search_location', '') else 'USD',
                'posted_date': job.get('date_posted', datetime.now()).isoformat() if job.get('date_posted') else datetime.now().isoformat(),
                'description': str(job.get('description', '')),
                'url': str(job.get('job_url', ''))[:200],
                'details': job,
                'skills': skills,
                'date_scraped': datetime.now().isoformat(),
                'is_archived': False,
            }
            
            processed_jobs.append(processed_job)
            existing_external_ids.add(external_id)
            
        except Exception as e:
            print(f"Error processing job: {e}")
            continue
    
    # Store in Supabase in batches
    batch_size = 50
    for i in range(0, len(processed_jobs), batch_size):
        batch = processed_jobs[i:i + batch_size]
        try:
            # Remove fields that don't exist in the database
            clean_batch = []
            for job in batch:
                clean_job = {k: v for k, v in job.items()}
                clean_batch.append(clean_job)
            
            supabase.table('jobs_job').insert(clean_batch).execute()
            created_count += len(batch)
            print(f"✅ Inserted batch of {len(batch)} jobs")
            
        except Exception as e:
            print(f"❌ Error inserting batch: {e}")
    
    print(f"📊 Processing summary: Created {created_count}, Duplicates {duplicate_count}")
    return processed_jobs

def create_minsearch_index(**context) -> None:
    """Create and save Minsearch index from all jobs in database"""
    supabase = get_supabase_client()
    
    # Fetch all jobs from database
    try:
        all_jobs_response = supabase.table('jobs_job')\
            .select('*')\
            .eq('is_archived', False)\
            .execute()
        
        all_jobs = all_jobs_response.data
        print(f"📊 Building index from {len(all_jobs)} jobs")
        
    except Exception as e:
        print(f"❌ Error fetching jobs for indexing: {e}")
        return
    
    if not all_jobs:
        print("⚠️ No jobs to index")
        return
    
    # Prepare documents for Minsearch
    documents = []
    for job in all_jobs:
        doc = {
            'id': job['id'],
            'title': job.get('title', ''),
            'company': job.get('company', ''),
            'location': job.get('location', ''),
            'city': job.get('city', ''),
            'state': job.get('state', ''),
            'country': job.get('country', ''),
            'description': job.get('description', ''),
            'skills': ' '.join(job.get('skills', [])) if job.get('skills') else '',
            'is_remote': str(job.get('is_remote', False)),
            'job_type': job.get('job_type', ''),
            'salary_min': job.get('salary_min', 0) or 0,
            'salary_max': job.get('salary_max', 0) or 0,
            'posted_date': job.get('posted_date', ''),
            'url': job.get('url', ''),
            'combined_text': f"{job.get('title', '')} {job.get('company', '')} {job.get('description', '')} {' '.join(job.get('skills', []))}"
        }
        documents.append(doc)
    
    # Create Minsearch index
    try:
        index = minsearch.Index(
            text_fields=['title', 'company', 'location', 'description', 'skills', 'combined_text'],
            keyword_fields=['city', 'state', 'country', 'is_remote', 'job_type'],
            numerical_fields=['salary_min', 'salary_max']
        )
        
        # Fit the index
        index.fit(documents)
        
        # Create directory if it doesn't exist
        os.makedirs(MINSEARCH_INDEX_PATH, exist_ok=True)
        
        # Save the index
        index_file = os.path.join(MINSEARCH_INDEX_PATH, 'jobs_index.pkl')
        with open(index_file, 'wb') as f:
            pickle.dump(index, f)
        
        # Save the documents for reference
        docs_file = os.path.join(MINSEARCH_INDEX_PATH, 'jobs_documents.pkl')
        with open(docs_file, 'wb') as f:
            pickle.dump(documents, f)
        
        print(f"✅ Minsearch index created and saved with {len(documents)} documents")
        print(f"📍 Index saved to: {index_file}")
        
        # Test the index
        test_results = index.search('software engineer python')
        print(f"🔍 Test search returned {len(test_results)} results")
        
    except Exception as e:
        print(f"❌ Error creating Minsearch index: {e}")

def log_scraper_run(**context) -> None:
    """Log the scraper run statistics"""
    ti = context['ti']
    
    scraped_jobs = ti.xcom_pull(task_ids='scrape_jobs') or []
    processed_jobs = ti.xcom_pull(task_ids='process_and_store_jobs') or []
    
    print(f"""
    🎉 SCRAPER RUN COMPLETED 🎉
    ===============================
    📊 Jobs Scraped: {len(scraped_jobs)}
    💾 Jobs Stored: {len(processed_jobs)}
    🔍 Search Index: Updated
    🌍 Locations: Canada, United States
    ⏰ Execution Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """)

# Define tasks
setup_sources_task = PythonOperator(
    task_id='setup_database_sources',
    python_callable=setup_database_sources,
    dag=dag,
)

scrape_jobs_task = PythonOperator(
    task_id='scrape_jobs',
    python_callable=scrape_jobs_task,
    dag=dag,
)

process_jobs_task = PythonOperator(
    task_id='process_and_store_jobs',
    python_callable=process_and_store_jobs,
    op_kwargs={'scraped_jobs': "{{ ti.xcom_pull(task_ids='scrape_jobs') }}"},
    dag=dag,
)

create_index_task = PythonOperator(
    task_id='create_minsearch_index',
    python_callable=create_minsearch_index,
    dag=dag,
)

log_run_task = PythonOperator(
    task_id='log_scraper_run',
    python_callable=log_scraper_run,
    dag=dag,
)

# Set task dependencies
setup_sources_task >> scrape_jobs_task >> process_jobs_task >> create_index_task >> log_run_task