from datetime import datetime, timedelta
import json
import psycopg2
import psycopg2.extras
import re
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

def extract_skills_from_description(description):
    """Extract skills from job description using simple keyword matching"""
    # Common tech skills - expand this list as needed
    tech_skills = [
        'python', 'javascript', 'java', 'react', 'node.js', 'django', 'flask',
        'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'docker', 'kubernetes',
        'aws', 'azure', 'gcp', 'terraform', 'git', 'jenkins', 'airflow',
        'machine learning', 'data science', 'pandas', 'numpy', 'tensorflow',
        'pytorch', 'scikit-learn', 'html', 'css', 'typescript', 'vue.js',
        'angular', 'express.js', 'spring', 'hibernate', 'rest api', 'graphql'
    ]
    
    found_skills = []
    description_lower = description.lower()
    
    for skill in tech_skills:
        if skill.lower() in description_lower:
            found_skills.append(skill)
    
    return found_skills

def process_unprocessed_jobs():
    """Process jobs that haven't been processed yet"""
    conn = get_database_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get jobs that haven't been processed (no skills extracted)
        cursor.execute("""
            SELECT id, description, details 
            FROM jobs_job 
            WHERE skills = '[]' OR skills IS NULL
            LIMIT 1000
        """)
        
        jobs_to_process = cursor.fetchall()
        processed_count = 0
        
        for job in jobs_to_process:
            job_id = job['id']
            description = job['description'] or ''
            
            # Extract skills
            extracted_skills = extract_skills_from_description(description)
            
            # Update job with extracted skills
            cursor.execute(
                "UPDATE jobs_job SET skills = %s WHERE id = %s",
                (json.dumps(extracted_skills), job_id)
            )
            
            processed_count += 1
            
            # Commit every 100 jobs
            if processed_count % 100 == 0:
                conn.commit()
                print(f"Processed {processed_count} jobs...")
        
        conn.commit()
        print(f"Skill extraction completed. Processed {processed_count} jobs.")
        
    except Exception as e:
        print(f"Error in skill extraction: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

def normalize_salary_data():
    """Normalize and clean salary data"""
    conn = get_database_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get jobs with salary range but no min/max values
        cursor.execute("""
            SELECT id, salary_range 
            FROM jobs_job 
            WHERE salary_range IS NOT NULL 
            AND salary_range != '' 
            AND (salary_min IS NULL OR salary_max IS NULL)
            LIMIT 1000
        """)
        
        jobs_to_process = cursor.fetchall()
        processed_count = 0
        
        for job in jobs_to_process:
            job_id = job['id']
            salary_range = job['salary_range']
            
            # Try to extract salary numbers from salary_range
            salary_min, salary_max = parse_salary_range(salary_range)
            
            if salary_min or salary_max:
                cursor.execute(
                    "UPDATE jobs_job SET salary_min = %s, salary_max = %s WHERE id = %s",
                    (salary_min, salary_max, job_id)
                )
                processed_count += 1
        
        conn.commit()
        print(f"Salary normalization completed. Processed {processed_count} jobs.")
        
    except Exception as e:
        print(f"Error in salary normalization: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

def parse_salary_range(salary_range):
    """Parse salary range string to extract min and max values"""
    if not salary_range:
        return None, None
    
    # Remove common currency symbols and words
    clean_range = re.sub(r'[,$]', '', salary_range.lower())
    clean_range = re.sub(r'\b(per|year|annual|yearly|hour|hourly|k|thousand)\b', '', clean_range)
    
    # Find numbers
    numbers = re.findall(r'\d+\.?\d*', clean_range)
    
    if len(numbers) >= 2:
        try:
            min_val = float(numbers[0])
            max_val = float(numbers[1])
            
            # Handle 'k' notation (e.g., "80k-120k")
            if 'k' in salary_range.lower():
                min_val *= 1000
                max_val *= 1000
            
            return min_val, max_val
        except ValueError:
            return None, None
    elif len(numbers) == 1:
        try:
            val = float(numbers[0])
            if 'k' in salary_range.lower():
                val *= 1000
            return val, val
        except ValueError:
            return None, None
    
    return None, None

def update_job_categories():
    """Automatically categorize jobs based on title and description"""
    conn = get_database_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Define category mappings
        category_keywords = {
            'Software Engineering': ['software engineer', 'developer', 'programmer', 'coding'],
            'Data Science': ['data scientist', 'data analyst', 'machine learning', 'ai engineer'],
            'Product Management': ['product manager', 'product owner', 'pm '],
            'Design': ['designer', 'ux', 'ui', 'graphic design'],
            'DevOps': ['devops', 'site reliability', 'infrastructure', 'platform engineer'],
            'Sales': ['sales', 'account manager', 'business development'],
            'Marketing': ['marketing', 'digital marketing', 'content marketing'],
        }
        
        # Get or create categories
        category_ids = {}
        for category_name in category_keywords.keys():
            cursor.execute(
                "INSERT INTO jobs_jobcategory (name) VALUES (%s) ON CONFLICT (name) DO NOTHING RETURNING id",
                (category_name,)
            )
            result = cursor.fetchone()
            if result:
                category_ids[category_name] = result['id']
            else:
                cursor.execute("SELECT id FROM jobs_jobcategory WHERE name = %s", (category_name,))
                category_ids[category_name] = cursor.fetchone()['id']
        
        # Get jobs without categories
        cursor.execute("""
            SELECT j.id, j.title, j.description 
            FROM jobs_job j
            LEFT JOIN jobs_job_categories jc ON j.id = jc.job_id
            WHERE jc.job_id IS NULL
            LIMIT 1000
        """)
        
        jobs_to_categorize = cursor.fetchall()
        categorized_count = 0
        
        for job in jobs_to_categorize:
            job_id = job['id']
            title = (job['title'] or '').lower()
            description = (job['description'] or '').lower()
            job_text = f"{title} {description}"
            
            # Find matching categories
            for category_name, keywords in category_keywords.items():
                if any(keyword in job_text for keyword in keywords):
                    cursor.execute(
                        "INSERT INTO jobs_job_categories (job_id, jobcategory_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (job_id, category_ids[category_name])
                    )
                    categorized_count += 1
                    break  # Only assign one category for simplicity
        
        conn.commit()
        print(f"Job categorization completed. Categorized {categorized_count} jobs.")
        
    except Exception as e:
        print(f"Error in job categorization: {str(e)}")
        raise
    finally:
        cursor.close()
        conn.close()

# Job Processing DAG
with DAG(
    'job_processing_dag',
    default_args={
        'owner': 'airflow',
        'depends_on_past': False,
        'email_on_failure': False,
        'email_on_retry': False,
        'retries': 2,
        'retry_delay': timedelta(minutes=5),
    },
    description='Process and enrich job data',
    schedule_interval='0 6 * * *',  # Run at 6 AM daily, after scraping
    start_date=datetime(2025, 5, 22),
    catchup=False,
    tags=['jobs', 'processing'],
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