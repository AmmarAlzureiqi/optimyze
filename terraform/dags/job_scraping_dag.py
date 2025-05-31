from datetime import datetime, timedelta
import json
import uuid
import pandas as pd
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.amazon.aws.hooks.secrets_manager import SecretsManagerHook
from supabase import create_client, Client


def get_supabase_client():
    """Get Supabase client using credentials from AWS Secrets Manager"""
    secrets_hook = SecretsManagerHook(aws_conn_id='aws_default')
    secret = secrets_hook.get_secret('optimyze-dev-supabase-credentials-8df5242f')
    credentials = json.loads(secret)
    
    supabase_url = credentials.get('supabase_url')
    supabase_key = credentials.get('supabase_key')
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing supabase_url or supabase_key in secrets")
    
    supabase: Client = create_client(supabase_url, supabase_key)
    return supabase

def prepare_job_data(job, source_id):
    """Prepare job data for Supabase insertion with comprehensive field handling"""
    
    def safe_get(field_name, default=''):
        """Safely get field value handling all edge cases"""
        try:
            if hasattr(job, 'get'):
                value = job.get(field_name, default)
            else:
                value = getattr(job, field_name, default)
            
            if pd.isna(value):
                return default
            return str(value).strip() if value else default
        except:
            return default
    
    def safe_get_numeric(field_name, default=None):
        """Safely get numeric field value"""
        try:
            if hasattr(job, 'get'):
                value = job.get(field_name, default)
            else:
                value = getattr(job, field_name, default)
            
            if pd.isna(value) or value is None or value == '':
                return default
            return float(value) if value else default
        except:
            return default
    
    # Create location string
    location_parts = []
    city = safe_get('city')
    state = safe_get('state')
    country = safe_get('country')
    
    if city: location_parts.append(city)
    if state: location_parts.append(state)
    if country: location_parts.append(country)
    location = ', '.join(location_parts) if location_parts else 'Not specified'
    
    # Handle date_posted
    posted_date = None
    try:
        if hasattr(job, 'get'):
            posted_date = job.get('date_posted')
        else:
            posted_date = getattr(job, 'date_posted', None)
        
        if pd.isna(posted_date) or not posted_date:
            posted_date = datetime.now()
    except:
        posted_date = datetime.now()
    
    # Extract external ID from URL
    job_url = safe_get('job_url')
    external_id = job_url.split('/')[-1] if job_url else str(uuid.uuid4())
    if not external_id or external_id == '':
        external_id = str(uuid.uuid4())
    
    # Create salary range
    salary_min = safe_get_numeric('min_amount')
    salary_max = safe_get_numeric('max_amount')
    salary_interval = safe_get('interval')
    salary_currency = safe_get('currency')
    
    salary_range = ""
    if salary_min and salary_max:
        salary_range = f"${salary_min:,.0f} - ${salary_max:,.0f}"
        if salary_interval:
            salary_range += f" {salary_interval}"
    elif salary_min:
        salary_range = f"${salary_min:,.0f}+"
        if salary_interval:
            salary_range += f" {salary_interval}"
    elif salary_max:
        salary_range = f"Up to ${salary_max:,.0f}"
        if salary_interval:
            salary_range += f" {salary_interval}"
    
    if not salary_range:
        salary_range = "Not specified"
    
    # Prepare details JSON
    try:
        if hasattr(job, 'to_dict'):
            details = job.to_dict()
        else:
            details = dict(job)
        
        # Convert non-serializable types for JSON storage
        for key, value in details.items():
            if pd.isna(value):
                details[key] = None
            elif hasattr(value, 'isoformat'):  # datetime objects
                details[key] = value.isoformat()
    except Exception as e:
        print(f"Warning: Could not prepare job details: {e}")
        details = {}
    
    # Handle timestamps
    now_iso = datetime.now().isoformat()
    posted_date_iso = posted_date.isoformat() if hasattr(posted_date, 'isoformat') else now_iso
    
    # Return comprehensive job data with all required fields
    return {
        'id': str(uuid.uuid4()),
        'source_id': source_id,
        'external_id': external_id,
        'title': safe_get('title') or 'Untitled',
        'company': safe_get('company') or 'Unknown Company',
        'location': location,
        'city': city or '',
        'state': state or '',
        'country': country or '',
        'company_url': safe_get('company_url') or '',
        'is_remote': bool(safe_get('is_remote', False)),
        'job_type': safe_get('job_type') or '',
        'job_function': safe_get('job_function') or '',
        'salary_range': salary_range,
        'salary_min': salary_min,
        'salary_max': salary_max,
        'salary_interval': salary_interval or '',
        'salary_currency': salary_currency or '',
        'posted_date': posted_date_iso,
        'expiry_date': None,
        'description': safe_get('description') or 'No description available',
        'url': job_url or '',
        'details': details,
        'skills': [],
        'date_scraped': now_iso,
        'created_at': now_iso,
        'updated_at': now_iso,
        'is_archived': False,
        'archived_at': None,
        'indexed_in_opensearch': False,
        'last_indexed': None
    }

def scrape_jobs_from_source(source_name, site_name):
    """Scrape jobs for a specific source using Supabase client"""
    from jobspy import scrape_jobs
    
    print(f"🚀 Starting scraping for {site_name}")
    
    # Get Supabase client
    supabase = get_supabase_client()
    
    try:
        # Get source ID
        result = supabase.table('jobs_source').select('id').eq('jobspy_site_name', site_name).execute()
        
        if not result.data:
            print(f"Source {site_name} not found in database")
            return
        
        source_id = result.data[0]['id']
        print(f"✅ Found source ID: {source_id}")
        
        # Create scraper run record
        run_id = str(uuid.uuid4())
        run_data = {
            'id': run_id,
            'source_id': source_id,
            'status': 'RUNNING',
            'start_time': datetime.now().isoformat(),
            'jobs_fetched': 0,
            'jobs_created': 0,
            'jobs_updated': 0,
            'jobs_errored': 0,
            'error_message': '',
            'params': {'search_terms': [], 'locations': []}
        }
        
        supabase.table('jobs_scraperrun').insert(run_data).execute()
        print(f"✅ Created scraper run: {run_id}")
        
        # Define search terms and locations - same as original
        search_terms = ["software engineer", "data scientist", "product manager", "backend developer", "frontend developer"]
        locations = ["New York, NY", "San Francisco, CA", "Los Angeles, CA", "Chicago, IL", "Austin, TX", "Remote"]
        
        total_jobs_found = 0
        total_jobs_created = 0
        total_jobs_updated = 0
        total_jobs_errored = 0
        
        for search_term in search_terms:
            for location in locations:
                try:
                    print(f"Scraping {site_name} for '{search_term}' in '{location}'")
                    
                    # Scrape with high limits - same as original
                    jobs = scrape_jobs(
                        site_name=site_name,
                        search_term=search_term,
                        location=location,
                        results_wanted=500,  # High limit
                        hours_old=168,       # Last week
                        country_indeed='USA' if site_name == 'indeed' else None
                    )
                    
                    if jobs.empty:
                        print(f"  📭 No jobs found for '{search_term}' in '{location}'")
                        continue
                        
                    print(f"  📊 Found {len(jobs)} jobs")
                    total_jobs_found += len(jobs)
                    
                    # Process each job
                    for idx, (_, job) in enumerate(jobs.iterrows()):
                        try:
                            job_data = prepare_job_data(job, source_id)
                            
                            # Check if job exists
                            existing = supabase.table('jobs_job').select('id').eq('source_id', source_id).eq('external_id', job_data['external_id']).execute()
                            
                            if existing.data:
                                # Update existing job
                                job_id = existing.data[0]['id']
                                update_data = {k: v for k, v in job_data.items() if k != 'id'}
                                update_data['updated_at'] = datetime.now().isoformat()  # Update timestamp
                                supabase.table('jobs_job').update(update_data).eq('id', job_id).execute()
                                total_jobs_updated += 1
                                
                                if idx == 0:  # Log first job of each batch
                                    print(f"    📝 Updated: {job_data['title']} at {job_data['company']}")
                            else:
                                # Create new job
                                supabase.table('jobs_job').insert(job_data).execute()
                                total_jobs_created += 1
                                
                                if idx == 0:  # Log first job of each batch
                                    print(f"    ✨ Created: {job_data['title']} at {job_data['company']}")
                        
                        except Exception as job_error:
                            total_jobs_errored += 1
                            print(f"    ❌ Error processing job {idx+1}: {job_error}")
                            continue
                    
                    print(f"  ✅ Processed {len(jobs)} jobs successfully")
                    
                except Exception as e:
                    print(f"❌ Error scraping {search_term} in {location}: {str(e)}")
                    continue
        
        # Update scraper run with completion stats
        update_data = {
            'status': 'COMPLETED',
            'end_time': datetime.now().isoformat(),
            'jobs_fetched': total_jobs_found,
            'jobs_created': total_jobs_created,
            'jobs_updated': total_jobs_updated,
            'jobs_errored': total_jobs_errored,
            'error_message': '',
            'params': {'search_terms': search_terms, 'locations': locations}
        }
        
        supabase.table('jobs_scraperrun').update(update_data).eq('id', run_id).execute()
        
        print(f"🎉 Completed {site_name}: Found {total_jobs_found}, Created {total_jobs_created}, Updated {total_jobs_updated}, Errored {total_jobs_errored}")
        
    except Exception as e:
        print(f"❌ Scraping failed for {site_name}: {str(e)}")
        
        # Update scraper run with error
        try:
            error_data = {
                'status': 'FAILED',
                'end_time': datetime.now().isoformat(),
                'error_message': str(e),
                'jobs_errored': total_jobs_errored + 1
            }
            supabase.table('jobs_scraperrun').update(error_data).eq('id', run_id).execute()
        except:
            print(f"Failed to update scraper run with error")
        
        raise

# Job Scraping DAG - same structure as original
with DAG(
    'job_scraping_supabase_dag',
    default_args={
        'owner': 'airflow',
        'depends_on_past': False,
        'email_on_failure': False,
        'email_on_retry': False,
        'retries': 2,
        'retry_delay': timedelta(minutes=5),
    },
    description='Scrape jobs from multiple sources using Supabase',
    schedule_interval='@daily',
    start_date=datetime(2025, 5, 22),
    catchup=False,
    tags=['jobs', 'scraping', 'supabase'],
) as dag:
    
    # Create tasks for each job source - same as original
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
    
    # Run tasks in parallel - same as original
    [scrape_indeed, scrape_linkedin, scrape_glassdoor]