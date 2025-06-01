"""
Comprehensive Job Scraper DAG for Optimyze
Scrapes jobs from multiple sources across Canada and US, processes them, and stores in Supabase
"""

from datetime import datetime, timedelta
import os
import json
import uuid
import re
from typing import List, Dict, Any, Optional
import pandas as pd

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago

import jobspy
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('/home/airflow/.env') 
# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# Job search configurations - expanded for comprehensive coverage
JOB_SEARCHES = [
    # Software Engineering roles
    {'site_name': 'linkedin', 'search_term': 'software engineer', 'location': 'Canada', 'results_wanted': 20},
    {'site_name': 'indeed', 'search_term': 'software engineer', 'location': 'Canada', 'results_wanted': 20},
    {'site_name': 'linkedin', 'search_term': 'software developer', 'location': 'Canada', 'results_wanted': 20},
    {'site_name': 'indeed', 'search_term': 'software developer', 'location': 'Canada', 'results_wanted': 20},
    {'site_name': 'linkedin', 'search_term': 'full stack developer', 'location': 'Canada', 'results_wanted': 15},
    {'site_name': 'indeed', 'search_term': 'full stack developer', 'location': 'Canada', 'results_wanted': 15},
    
    # Data roles
    {'site_name': 'linkedin', 'search_term': 'data scientist', 'location': 'Canada', 'results_wanted': 15},
    {'site_name': 'indeed', 'search_term': 'data scientist', 'location': 'Canada', 'results_wanted': 15},
    {'site_name': 'linkedin', 'search_term': 'data analyst', 'location': 'Canada', 'results_wanted': 15},
    {'site_name': 'indeed', 'search_term': 'data analyst', 'location': 'Canada', 'results_wanted': 15},
    {'site_name': 'linkedin', 'search_term': 'data engineer', 'location': 'Canada', 'results_wanted': 15},
    {'site_name': 'indeed', 'search_term': 'data engineer', 'location': 'Canada', 'results_wanted': 15},
    
    # Frontend/Backend roles
    {'site_name': 'linkedin', 'search_term': 'frontend developer', 'location': 'Canada', 'results_wanted': 10},
    {'site_name': 'indeed', 'search_term': 'frontend developer', 'location': 'Canada', 'results_wanted': 10},
    {'site_name': 'linkedin', 'search_term': 'backend developer', 'location': 'Canada', 'results_wanted': 10},
    {'site_name': 'indeed', 'search_term': 'backend developer', 'location': 'Canada', 'results_wanted': 10},
    
    # DevOps and Cloud roles
    {'site_name': 'linkedin', 'search_term': 'devops engineer', 'location': 'Canada', 'results_wanted': 10},
    {'site_name': 'indeed', 'search_term': 'devops engineer', 'location': 'Canada', 'results_wanted': 10},
    {'site_name': 'linkedin', 'search_term': 'cloud engineer', 'location': 'Canada', 'results_wanted': 10},
    {'site_name': 'indeed', 'search_term': 'cloud engineer', 'location': 'Canada', 'results_wanted': 10},
    
    # US searches - major tech hubs
    {'site_name': 'linkedin', 'search_term': 'software engineer', 'location': 'United States', 'results_wanted': 20},
    {'site_name': 'indeed', 'search_term': 'software engineer', 'location': 'United States', 'results_wanted': 20},
    {'site_name': 'linkedin', 'search_term': 'data scientist', 'location': 'United States', 'results_wanted': 20},
    {'site_name': 'indeed', 'search_term': 'data scientist', 'location': 'United States', 'results_wanted': 20},
    {'site_name': 'linkedin', 'search_term': 'software developer', 'location': 'United States', 'results_wanted': 20},
    {'site_name': 'indeed', 'search_term': 'software developer', 'location': 'United States', 'results_wanted': 20},
]

# Default arguments for the DAG
default_args = {
    'owner': 'optimyze',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=10),
}

# Create the DAG
dag = DAG(
    'optimyze_quick_job_scraper',
    default_args=default_args,
    description='Comprehensive job scraper for Canada and US tech roles',
    schedule_interval='0 6 * * *',  # Run daily at 6 AM
    catchup=False,
    max_active_runs=1,
    tags=['jobs', 'etl', 'scraping']
)

# ALL FUNCTION DEFINITIONS FIRST
def get_supabase_client() -> Client:
    """Create and return Supabase client"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def extract_skills_from_description(description: str) -> List[str]:
    """Extract skills from job description using keyword matching"""
    if not description:
        return []
    
    # Common tech skills to look for
    skills_keywords = [
        # Programming languages
        'python', 'javascript', 'java', 'typescript', 'react', 'node.js', 'nodejs',
        'angular', 'vue', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
        
        # Frameworks and libraries
        'django', 'flask', 'fastapi', 'express', 'spring', 'laravel', 'rails',
        'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
        
        # Databases
        'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'sql',
        
        # Cloud and DevOps
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins',
        'git', 'github', 'gitlab', 'ci/cd',
        
        # Data tools
        'spark', 'hadoop', 'airflow', 'kafka', 'tableau', 'power bi',
        
        # Other tools
        'linux', 'unix', 'bash', 'shell', 'api', 'rest', 'graphql', 'microservices'
    ]
    
    description_lower = description.lower()
    found_skills = []
    
    for skill in skills_keywords:
        if skill in description_lower:
            found_skills.append(skill.title())
    
    return list(set(found_skills))  # Remove duplicates

def parse_salary(salary_text: str) -> tuple[Optional[float], Optional[float], str]:
    """Parse salary text and return min, max, and interval"""
    if not salary_text:
        return None, None, 'yearly'
    
    # Clean the salary text
    salary_clean = re.sub(r'[^\d\-\.,k]', ' ', str(salary_text).lower())
    
    # Look for salary ranges like "50000-70000" or "50k-70k"
    range_match = re.search(r'(\d+(?:\.\d+)?)\s*k?\s*[-–—]\s*(\d+(?:\.\d+)?)\s*k?', salary_clean)
    if range_match:
        min_sal = float(range_match.group(1))
        max_sal = float(range_match.group(2))
        
        # Handle k notation
        if 'k' in salary_text.lower():
            min_sal *= 1000
            max_sal *= 1000
            
        return min_sal, max_sal, 'yearly'
    
    # Look for single salary values
    single_match = re.search(r'(\d+(?:\.\d+)?)\s*k?', salary_clean)
    if single_match:
        salary = float(single_match.group(1))
        if 'k' in salary_text.lower():
            salary *= 1000
        return salary, salary, 'yearly'
    
    return None, None, 'yearly'

def determine_job_category(title: str, description: str) -> str:
    """Determine job category based on title and description"""
    title_lower = title.lower()
    desc_lower = description.lower() if description else ""
    
    if any(word in title_lower for word in ['data scientist', 'machine learning', 'ml engineer']):
        return 'Data Science'
    elif any(word in title_lower for word in ['data analyst', 'business analyst']):
        return 'Data Analysis'
    elif any(word in title_lower for word in ['data engineer', 'big data']):
        return 'Data Engineering'
    elif any(word in title_lower for word in ['frontend', 'front-end', 'front end', 'ui developer']):
        return 'Frontend Development'
    elif any(word in title_lower for word in ['backend', 'back-end', 'back end', 'api developer']):
        return 'Backend Development'
    elif any(word in title_lower for word in ['full stack', 'fullstack']):
        return 'Full Stack Development'
    elif any(word in title_lower for word in ['devops', 'site reliability', 'sre']):
        return 'DevOps'
    elif any(word in title_lower for word in ['cloud', 'aws', 'azure', 'gcp']):
        return 'Cloud Engineering'
    elif any(word in title_lower for word in ['mobile', 'ios', 'android', 'react native']):
        return 'Mobile Development'
    elif any(word in title_lower for word in ['security', 'cybersecurity']):
        return 'Security'
    else:
        return 'Software Engineering'

def scrape_jobs_task(**context) -> List[Dict[str, Any]]:
    """Scrape jobs from all configured sources"""
    all_jobs = []
    
    for i, search_config in enumerate(JOB_SEARCHES):
        try:
            print(f"Scraping {i+1}/{len(JOB_SEARCHES)}: {search_config['site_name']} for '{search_config['search_term']}' in {search_config['location']}")
            
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
                
                # Add search metadata
                for job in jobs_list:
                    job['source_site'] = search_config['site_name']
                    job['search_term_used'] = search_config['search_term']
                    job['search_location'] = search_config['location']
                
                all_jobs.extend(jobs_list)
                print(f"✅ Scraped {len(jobs_list)} jobs from {search_config['site_name']}")
            else:
                print(f"⚠️ No jobs found for {search_config['site_name']} - {search_config['search_term']}")
                
        except Exception as e:
            print(f"❌ Error scraping {search_config['site_name']}: {str(e)}")
            continue
    
    print(f"🎉 Total jobs scraped: {len(all_jobs)}")
    return all_jobs

def setup_database_sources(**context) -> Dict[str, str]:
    """Ensure job sources exist in database"""
    supabase = get_supabase_client()
    
    sources_data = [
        {
            'name': 'LinkedIn',
            'url': 'https://linkedin.com',
            'description': 'Professional networking platform with job listings',
            'jobspy_site_name': 'linkedin',
            'is_active': True,
            'config': {}
        },
        {
            'name': 'Indeed',
            'url': 'https://indeed.com',
            'description': 'Popular job search engine',
            'jobspy_site_name': 'indeed',
            'is_active': True,
            'config': {}
        }
    ]
    
    source_mapping = {}
    
    for source_data in sources_data:
        try:
            # Check if source exists
            existing = supabase.table('jobs_source').select('*').eq('jobspy_site_name', source_data['jobspy_site_name']).execute()
            
            if existing.data:
                source_id = existing.data[0]['id']
                print(f"✅ Source '{source_data['name']}' already exists")
            else:
                # Create new source
                source_data['id'] = str(uuid.uuid4())
                result = supabase.table('jobs_source').insert(source_data).execute()
                source_id = result.data[0]['id']
                print(f"✅ Created new source '{source_data['name']}'")
            
            source_mapping[source_data['jobspy_site_name']] = source_id
            
        except Exception as e:
            print(f"❌ Error setting up source {source_data['name']}: {e}")
    
    return source_mapping

def process_and_deduplicate_jobs(**context) -> List[Dict[str, Any]]:
    """Process scraped jobs and remove duplicates"""
    # Pull scraped jobs from XCom directly
    scraped_jobs = context['ti'].xcom_pull(task_ids='scrape_jobs')
    
    if not scraped_jobs:
        print("⚠️ No scraped jobs found")
        return []
    
    print(f"📊 Processing {len(scraped_jobs)} scraped jobs")
    
    # Get source mapping from previous task
    source_mapping = context['ti'].xcom_pull(task_ids='setup_database_sources')
    
    supabase = get_supabase_client()
    
    # Get existing job external_ids to avoid duplicates
    try:
        existing_jobs = supabase.table('jobs_job').select('external_id').execute()
        existing_external_ids = {job['external_id'] for job in existing_jobs.data}
        print(f"📊 Found {len(existing_external_ids)} existing jobs in database")
    except Exception as e:
        print(f"❌ Error fetching existing jobs: {e}")
        existing_external_ids = set()
    
    processed_jobs = []
    duplicates_found = 0
    errors = 0
    
    for i, job in enumerate(scraped_jobs):
        try:
            # Debug: Check what type of object we're dealing with
            if i == 0:  # Log first item for debugging
                print(f"🔍 First job type: {type(job)}")
                print(f"🔍 First job keys: {list(job.keys()) if hasattr(job, 'keys') else 'No keys method'}")
            
            # Create external ID
            job_url = job.get('job_url', '')
            external_id = job_url if job_url else f"{job.get('title', '')}_{job.get('company', '')}"
            external_id = external_id[:255]  # Truncate to fit database field
            
            if external_id in existing_external_ids:
                duplicates_found += 1
                continue
            
            # Get source ID
            source_site = job.get('source_site', '')
            source_id = source_mapping.get(source_site)
            
            if not source_id:
                print(f"⚠️ No source mapping found for {source_site}")
                continue
            
            # Parse salary
            salary_min, salary_max, salary_interval = parse_salary(job.get('salary_range', ''))
            
            # Extract skills
            skills = extract_skills_from_description(job.get('description', ''))
            
            # Determine category
            category = determine_job_category(job.get('title', ''), job.get('description', ''))
            
            # Handle date_posted safely
            date_posted = job.get('date_posted')
            if date_posted is not None:
                try:
                    # If it's already a datetime object
                    if hasattr(date_posted, 'isoformat'):
                        posted_date_iso = date_posted.isoformat()
                    # If it's a string, try to parse it
                    elif isinstance(date_posted, str):
                        posted_date_iso = date_posted
                    # If it's a float/int timestamp, convert it
                    elif isinstance(date_posted, (int, float)) and not pd.isna(date_posted):
                        posted_date_iso = datetime.fromtimestamp(date_posted).isoformat()
                    else:
                        # Fallback to current datetime
                        posted_date_iso = datetime.now().isoformat()
                except Exception:
                    # If anything goes wrong, use current datetime
                    posted_date_iso = datetime.now().isoformat()
            else:
                posted_date_iso = datetime.now().isoformat()

            # Process the job data
            processed_job = {
                'id': str(uuid.uuid4()),
                'source_id': source_id,
                'external_id': external_id,
                'title': str(job.get('title', ''))[:255],
                'company': str(job.get('company', ''))[:255],
                'location': str(job.get('location', ''))[:255],
                'city': str(job.get('city', ''))[:100] if job.get('city') else '',
                'state': str(job.get('state', ''))[:100] if job.get('state') else '',
                'country': str(job.get('country', 'Canada' if 'Canada' in job.get('search_location', '') else 'USA'))[:100],
                'company_url': str(job.get('company_url', ''))[:200] if job.get('company_url') else '',
                'is_remote': bool(job.get('is_remote', False)),
                'job_type': str(job.get('job_type', ''))[:50],
                'job_function': str(job.get('job_function', ''))[:100],
                'salary_range': str(job.get('salary_range', ''))[:255],
                'salary_min': salary_min,
                'salary_max': salary_max,
                'salary_interval': salary_interval,
                'salary_currency': 'CAD' if 'Canada' in job.get('search_location', '') else 'USD',
                'posted_date': posted_date_iso,
                'description': str(job.get('description', '')),
                'url': str(job.get('job_url', ''))[:200],
                'details': job,  # Store raw job data
                'skills': skills,
                'date_scraped': datetime.now().isoformat(),
                'is_archived': False,
                'indexed_in_opensearch': False,
                'job_category': category,
            }
            
            processed_jobs.append(processed_job)
            existing_external_ids.add(external_id)
            
        except Exception as e:
            print(f"❌ Error processing job {i+1}: {e}")
            print(f"🔍 Job data type: {type(job)}")
            print(f"🔍 Job data sample: {str(job)[:200]}...")
            errors += 1
            continue
    
    print(f"📊 Processing summary:")
    print(f"   - Processed: {len(processed_jobs)} jobs")
    print(f"   - Duplicates: {duplicates_found}")
    print(f"   - Errors: {errors}")
    
    return processed_jobs

def serialize_for_json(obj):
    """Convert non-JSON serializable objects to JSON serializable format"""
    if hasattr(obj, 'isoformat'):  # datetime, date objects
        return obj.isoformat()
    elif isinstance(obj, (pd.Timestamp, pd.NaT.__class__)):
        return obj.isoformat() if not pd.isna(obj) else None
    elif pd.isna(obj):  # pandas NaN, NaT, etc.
        return None
    elif isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_for_json(item) for item in obj]
    else:
        return obj

def store_jobs_in_supabase(**context) -> Dict[str, int]:
    """Store processed jobs in Supabase database"""
    # Pull processed jobs from XCom directly
    processed_jobs = context['ti'].xcom_pull(task_ids='process_jobs')
    
    if not processed_jobs:
        return {'created': 0, 'errors': 0}
    
    supabase = get_supabase_client()
    
    created_count = 0
    error_count = 0
    
    # Insert jobs in batches to avoid request size limits
    batch_size = 50
    total_batches = (len(processed_jobs) + batch_size - 1) // batch_size
    
    for i in range(0, len(processed_jobs), batch_size):
        batch = processed_jobs[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        
        try:
            print(f"📤 Inserting batch {batch_num}/{total_batches} ({len(batch)} jobs)")
            
            # Clean and serialize the batch
            clean_batch = []
            for job in batch:
                # Remove fields that don't exist in the database
                clean_job = {k: v for k, v in job.items() if k != 'job_category'}
                
                # Serialize all values to ensure JSON compatibility
                serialized_job = {}
                for key, value in clean_job.items():
                    try:
                        serialized_job[key] = serialize_for_json(value)
                    except Exception as serialize_error:
                        print(f"⚠️ Error serializing field '{key}': {serialize_error}")
                        # Set to None if serialization fails
                        serialized_job[key] = None
                
                clean_batch.append(serialized_job)
            
            result = supabase.table('jobs_job').insert(clean_batch).execute()
            created_count += len(batch)
            print(f"✅ Successfully inserted batch {batch_num}")
            
        except Exception as e:
            print(f"❌ Error inserting batch {batch_num}: {e}")
            # Try to get more details about the error
            if "JSON" in str(e) or "serializable" in str(e):
                print(f"🔍 JSON serialization error. Checking first job in batch:")
                if batch:
                    first_job = batch[0]
                    for key, value in first_job.items():
                        print(f"   {key}: {type(value)} = {str(value)[:100]}...")
            error_count += len(batch)
    
    print(f"💾 Database storage summary:")
    print(f"   - Created: {created_count} jobs")
    print(f"   - Errors: {error_count} jobs")
    
    return {'created': created_count, 'errors': error_count}

def log_scraper_run(**context) -> None:
    """Log the scraper run statistics"""
    ti = context['ti']
    
    # Get results from previous tasks
    scraped_jobs = ti.xcom_pull(task_ids='scrape_jobs') or []
    processed_jobs = ti.xcom_pull(task_ids='process_jobs') or []
    storage_result = ti.xcom_pull(task_ids='store_jobs') or {'created': 0, 'errors': 0}
    
    supabase = get_supabase_client()
    
    try:
        # Get first source for logging
        sources = supabase.table('jobs_source').select('id').limit(1).execute()
        source_id = sources.data[0]['id'] if sources.data else str(uuid.uuid4())
        
        scraper_run = {
            'id': str(uuid.uuid4()),
            'source_id': source_id,
            'start_time': context['data_interval_start'].isoformat(),
            'end_time': datetime.now().isoformat(),
            'status': 'COMPLETED',
            'jobs_fetched': len(scraped_jobs),
            'jobs_created': storage_result['created'],
            'jobs_updated': 0,
            'jobs_errored': storage_result['errors'],
            'params': {'searches': len(JOB_SEARCHES), 'locations': ['Canada', 'United States']}
        }
        
        supabase.table('jobs_scraperrun').insert(scraper_run).execute()
        print("✅ Logged scraper run successfully")
        
    except Exception as e:
        print(f"❌ Error logging scraper run: {e}")
    
    # Final summary
    print(f"""
    🎉 SCRAPER RUN COMPLETED 🎉
    ===============================
    📊 Jobs Scraped: {len(scraped_jobs)}
    🔄 Jobs Processed: {len(processed_jobs)}
    💾 Jobs Stored: {storage_result['created']}
    ❌ Errors: {storage_result['errors']}
    🌍 Locations: Canada, United States
    🔍 Search Terms: {len(set(search['search_term'] for search in JOB_SEARCHES))} unique terms
    ⏰ Execution Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """)

# TASK DEFINITIONS - AFTER ALL FUNCTIONS
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
    task_id='process_jobs',
    python_callable=process_and_deduplicate_jobs,
    dag=dag,
)

store_jobs_task = PythonOperator(
    task_id='store_jobs',
    python_callable=store_jobs_in_supabase,
    dag=dag,
)

log_run_task = PythonOperator(
    task_id='log_scraper_run',
    python_callable=log_scraper_run,
    dag=dag,
)

# Set task dependencies
setup_sources_task >> scrape_jobs_task >> process_jobs_task >> store_jobs_task >> log_run_task