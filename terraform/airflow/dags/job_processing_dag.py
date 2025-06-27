from datetime import datetime, timedelta
import json
import re
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.amazon.aws.hooks.secrets_manager import SecretsManagerHook
from supabase import create_client, Client

load_dotenv('/home/airflow/.env') 

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def get_supabase_client():
    # """Get Supabase client using credentials from AWS Secrets Manager"""
    # secrets_hook = SecretsManagerHook(aws_conn_id='aws_default')
    # secret = secrets_hook.get_secret('optimyze-dev-supabase-credentials-8df5242f')
    # credentials = json.loads(secret)
    
    # supabase_url = credentials.get('supabase_url')
    # supabase_key = credentials.get('supabase_key')
    
    # if not supabase_url or not supabase_key:
    #     raise ValueError("Missing supabase_url or supabase_key in secrets")
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase

def extract_skills_from_description(description):
    """Extract skills from job description using simple keyword matching"""
    # Expanded tech skills list
    tech_skills = [
        # Programming languages
        'python', 'javascript', 'java', 'typescript', 'c++', 'c#', 'go', 'rust', 'kotlin', 'swift',
        'php', 'ruby', 'scala', 'r', 'matlab', 'shell', 'bash', 'powershell',
        
        # Frontend frameworks/libraries
        'react', 'vue.js', 'angular', 'svelte', 'jquery', 'bootstrap', 'tailwind', 'sass', 'less',
        
        # Backend frameworks
        'node.js', 'express.js', 'django', 'flask', 'fastapi', 'spring', 'spring boot', 'laravel',
        'rails', 'asp.net', 'gin', 'fiber',
        
        # Databases
        'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb',
        'sqlite', 'oracle', 'sql server', 'mariadb', 'neo4j',
        
        # Cloud platforms
        'aws', 'azure', 'gcp', 'google cloud', 'digital ocean', 'heroku', 'vercel', 'netlify',
        
        # DevOps/Infrastructure
        'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'gitlab ci', 'github actions',
        'circleci', 'travis ci', 'nginx', 'apache', 'linux', 'unix',
        
        # Version control
        'git', 'github', 'gitlab', 'bitbucket', 'svn',
        
        # Data science/ML
        'machine learning', 'deep learning', 'data science', 'pandas', 'numpy', 'tensorflow',
        'pytorch', 'scikit-learn', 'keras', 'opencv', 'matplotlib', 'seaborn', 'jupyter',
        
        # Other tools/technologies
        'rest api', 'graphql', 'microservices', 'agile', 'scrum', 'jira', 'confluence',
        'slack', 'figma', 'adobe', 'photoshop', 'sketch', 'airflow', 'kafka', 'rabbitmq',
        
        # Web technologies
        'html', 'css', 'json', 'xml', 'websockets', 'oauth', 'jwt', 'grpc'
    ]
    
    found_skills = []
    description_lower = description.lower()
    
    for skill in tech_skills:
        # Use word boundaries to avoid partial matches
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, description_lower):
            found_skills.append(skill)
    
    return list(set(found_skills))  # Remove duplicates

def process_unprocessed_jobs():
    """Process jobs that haven't been processed yet using Supabase"""
    supabase = get_supabase_client()
    
    try:
        print("🔍 Starting skill extraction process...")
        
        # Get jobs that haven't been processed (empty skills array)
        result = supabase.table('jobs_job').select('id, description, details').eq('skills', '[]').limit(1000).execute()
        
        jobs_to_process = result.data
        processed_count = 0
        batch_size = 50
        
        print(f"📊 Found {len(jobs_to_process)} jobs to process")
        
        # Process in batches
        for i in range(0, len(jobs_to_process), batch_size):
            batch = jobs_to_process[i:i + batch_size]
            
            for job in batch:
                try:
                    job_id = job['id']
                    description = job.get('description', '') or ''
                    
                    # Extract skills
                    extracted_skills = extract_skills_from_description(description)
                    
                    # Update job with extracted skills
                    supabase.table('jobs_job').update({
                        'skills': extracted_skills,
                        'updated_at': datetime.now().isoformat()
                    }).eq('id', job_id).execute()
                    
                    processed_count += 1
                    
                    if extracted_skills:
                        print(f"  ✅ Job {job_id}: Found {len(extracted_skills)} skills")
                    
                except Exception as job_error:
                    print(f"  ❌ Error processing job {job.get('id', 'unknown')}: {job_error}")
                    continue
            
            print(f"📈 Processed batch {i//batch_size + 1}, total: {processed_count} jobs")
        
        print(f"🎉 Skill extraction completed. Processed {processed_count} jobs.")
        
    except Exception as e:
        print(f"❌ Error in skill extraction: {str(e)}")
        raise

def normalize_salary_data():
    """Normalize and clean salary data using Supabase"""
    supabase = get_supabase_client()
    
    try:
        print("💰 Starting salary normalization process...")
        
        # Get jobs with salary range but no min/max values
        result = supabase.table('jobs_job').select('id, salary_range').neq('salary_range', '').neq('salary_range', 'Not specified').is_('salary_min', 'null').limit(1000).execute()
        
        jobs_to_process = result.data
        processed_count = 0
        
        print(f"📊 Found {len(jobs_to_process)} jobs to normalize")
        
        for job in jobs_to_process:
            try:
                job_id = job['id']
                salary_range = job.get('salary_range', '')
                
                if not salary_range or salary_range == 'Not specified':
                    continue
                
                # Try to extract salary numbers from salary_range
                salary_min, salary_max = parse_salary_range(salary_range)
                
                if salary_min or salary_max:
                    supabase.table('jobs_job').update({
                        'salary_min': salary_min,
                        'salary_max': salary_max,
                        'updated_at': datetime.now().isoformat()
                    }).eq('id', job_id).execute()
                    
                    processed_count += 1
                    print(f"  ✅ Job {job_id}: ${salary_min:,.0f} - ${salary_max:,.0f}")
                
            except Exception as job_error:
                print(f"  ❌ Error processing job {job.get('id', 'unknown')}: {job_error}")
                continue
        
        print(f"🎉 Salary normalization completed. Processed {processed_count} jobs.")
        
    except Exception as e:
        print(f"❌ Error in salary normalization: {str(e)}")
        raise

def parse_salary_range(salary_range):
    """Parse salary range string to extract min and max values"""
    if not salary_range:
        return None, None
    
    # Clean the salary range string
    clean_range = salary_range.lower().strip()
    
    # Remove common words and symbols
    clean_range = re.sub(r'[,$]', '', clean_range)
    clean_range = re.sub(r'\b(per|year|annual|yearly|hour|hourly|month|monthly|week|weekly)\b', '', clean_range)
    clean_range = re.sub(r'\b(usd|dollars|euro|eur)\b', '', clean_range)
    
    # Handle different patterns
    patterns = [
        # Range patterns: "80k-120k", "80000-120000", "80 - 120"
        r'(\d+\.?\d*)\s*k?\s*[-–—to]\s*(\d+\.?\d*)\s*k?',
        # Up to patterns: "up to 120k"
        r'up\s+to\s+(\d+\.?\d*)\s*k?',
        # From patterns: "from 80k"
        r'from\s+(\d+\.?\d*)\s*k?',
        # Single number with k: "100k"
        r'(\d+\.?\d*)\s*k\b',
        # Plain numbers: "100000"
        r'(\d{5,})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, clean_range)
        if match:
            try:
                if len(match.groups()) == 2:  # Range pattern
                    min_val = float(match.group(1))
                    max_val = float(match.group(2))
                    
                    # Handle 'k' notation
                    if 'k' in salary_range.lower():
                        min_val *= 1000
                        max_val *= 1000
                    
                    return min_val, max_val
                    
                else:  # Single value pattern
                    val = float(match.group(1))
                    
                    # Handle 'k' notation
                    if 'k' in salary_range.lower() or val < 1000:
                        val *= 1000
                    
                    # For "up to" patterns, set min to None
                    if 'up to' in clean_range:
                        return None, val
                    # For "from" patterns, set max to None  
                    elif 'from' in clean_range:
                        return val, None
                    # For single values, use as both min and max
                    else:
                        return val, val
                        
            except ValueError:
                continue
    
    return None, None

def update_job_categories():
    """Automatically categorize jobs based on title and description using Supabase"""
    supabase = get_supabase_client()
    
    try:
        print("🏷️ Starting job categorization process...")
        
        # Define category mappings with more comprehensive keywords
        category_keywords = {
            'Software Engineering': [
                'software engineer', 'developer', 'programmer', 'coding', 'full stack', 
                'backend', 'frontend', 'web developer', 'mobile developer', 'ios developer',
                'android developer', 'react developer', 'python developer'
            ],
            'Data Science': [
                'data scientist', 'data analyst', 'machine learning', 'ai engineer',
                'data engineer', 'ml engineer', 'analytics', 'data mining', 'statistician',
                'business intelligence', 'data visualization'
            ],
            'Product Management': [
                'product manager', 'product owner', 'pm ', 'product lead', 'product director',
                'product strategy', 'product marketing'
            ],
            'Design': [
                'designer', 'ux', 'ui', 'graphic design', 'visual design', 'product design',
                'user experience', 'user interface', 'creative director', 'art director'
            ],
            'DevOps': [
                'devops', 'site reliability', 'infrastructure', 'platform engineer',
                'cloud engineer', 'systems engineer', 'sre', 'deployment', 'ci/cd'
            ],
            'Sales': [
                'sales', 'account manager', 'business development', 'sales representative',
                'account executive', 'sales engineer', 'sales director'
            ],
            'Marketing': [
                'marketing', 'digital marketing', 'content marketing', 'marketing manager',
                'growth marketing', 'performance marketing', 'brand marketing'
            ],
            'Quality Assurance': [
                'qa', 'quality assurance', 'test engineer', 'qa engineer', 'testing',
                'automation testing', 'manual testing'
            ],
            'Security': [
                'security', 'cybersecurity', 'information security', 'security engineer',
                'penetration testing', 'security analyst'
            ]
        }
        
        # Get or create categories
        category_ids = {}
        for category_name in category_keywords.keys():
            try:
                # Try to get existing category
                result = supabase.table('jobs_jobcategory').select('id').eq('name', category_name).execute()
                
                if result.data:
                    category_ids[category_name] = result.data[0]['id']
                else:
                    # Create new category
                    result = supabase.table('jobs_jobcategory').insert({'name': category_name}).execute()
                    category_ids[category_name] = result.data[0]['id']
                    
            except Exception as e:
                print(f"  ⚠️ Error handling category {category_name}: {e}")
                continue
        
        print(f"📋 Found/created {len(category_ids)} categories")
        
        # Get jobs without categories (using a simpler approach)
        # First get all jobs, then filter those without categories
        all_jobs_result = supabase.table('jobs_job').select('id, title, description').limit(1000).execute()
        all_jobs = all_jobs_result.data
        
        # Get jobs that already have categories
        categorized_jobs_result = supabase.table('jobs_job_categories').select('job_id').execute()
        categorized_job_ids = {row['job_id'] for row in categorized_jobs_result.data}
        
        # Filter to get uncategorized jobs
        jobs_to_categorize = [job for job in all_jobs if job['id'] not in categorized_job_ids]
        
        print(f"📊 Found {len(jobs_to_categorize)} jobs to categorize")
        
        categorized_count = 0
        
        for job in jobs_to_categorize:
            try:
                job_id = job['id']
                title = (job.get('title', '') or '').lower()
                description = (job.get('description', '') or '').lower()
                job_text = f"{title} {description}"
                
                # Find matching categories
                matched_categories = []
                for category_name, keywords in category_keywords.items():
                    if category_name in category_ids:
                        # Use word boundaries for better matching
                        for keyword in keywords:
                            pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
                            if re.search(pattern, job_text):
                                matched_categories.append(category_name)
                                break
                
                # Insert category relationships
                for category_name in matched_categories[:2]:  # Limit to 2 categories max
                    try:
                        supabase.table('jobs_job_categories').insert({
                            'job_id': job_id,
                            'jobcategory_id': category_ids[category_name]
                        }).execute()
                        categorized_count += 1
                        print(f"  ✅ Job {job_id}: Categorized as {category_name}")
                    except Exception as insert_error:
                        # Handle duplicate key errors gracefully
                        if 'duplicate key' not in str(insert_error).lower():
                            print(f"  ⚠️ Error categorizing job {job_id}: {insert_error}")
                
            except Exception as job_error:
                print(f"  ❌ Error processing job {job.get('id', 'unknown')}: {job_error}")
                continue
        
        print(f"🎉 Job categorization completed. Categorized {categorized_count} jobs.")
        
    except Exception as e:
        print(f"❌ Error in job categorization: {str(e)}")
        raise

# Job Processing DAG
with DAG(
    'job_processing_supabase_dag',
    default_args={
        'owner': 'airflow',
        'depends_on_past': False,
        'email_on_failure': False,
        'email_on_retry': False,
        'retries': 2,
        'retry_delay': timedelta(minutes=5),
    },
    description='Process and enrich job data using Supabase',
    schedule_interval='0 6 * * *',  # Run at 6 AM daily, after scraping
    start_date=datetime(2025, 5, 22),
    catchup=False,
    tags=['jobs', 'processing', 'supabase'],
) as dag:
    
    # Extract skills from job descriptions
    extract_skills_task = PythonOperator(
        task_id='extract_skills',
        python_callable=process_unprocessed_jobs,
    )
    
    # Normalize salary data
    normalize_salary_task = PythonOperator(
        task_id='normalize_salary',
        python_callable=normalize_salary_data,
    )
    
    # Categorize jobs
    categorize_jobs_task = PythonOperator(
        task_id='categorize_jobs',
        python_callable=update_job_categories,
    )
    
    # Set task dependencies - run in sequence
    extract_skills_task >> normalize_salary_task >> categorize_jobs_task