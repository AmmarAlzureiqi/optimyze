# jobs/services/search_service.py
import os
import pickle
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

import minsearch
from sklearn.feature_extraction.text import TfidfVectorizer

from ..models import Job

logger = logging.getLogger(__name__)

class JobSearchService:
    """
    Service for managing MinSearch index and performing job searches
    """
    
    def __init__(self):
        # Create search directory in Django project root
        if hasattr(settings, 'SEARCH_INDEX_PATH'):
            self.search_path = Path(settings.SEARCH_INDEX_PATH)
        else:
            self.search_path = Path(settings.BASE_DIR) / 'search_index'
        
        self.search_path.mkdir(exist_ok=True)
        
        self.index_file = self.search_path / 'jobs_index.pkl'
        self.vectorizer_file = self.search_path / 'vectorizer.pkl'
        self.metadata_file = self.search_path / 'index_metadata.pkl'
        
        self._index = None
        self._vectorizer = None
        self._last_loaded = None
    
    def _load_index(self):
        """Load the search index if it exists and is not already loaded"""
        try:
            if not self.index_file.exists():
                logger.warning("Search index file does not exist")
                return False
            
            # Check if we need to reload
            index_mtime = self.index_file.stat().st_mtime
            if self._last_loaded and self._last_loaded >= index_mtime:
                return True  # Already loaded and up to date
            
            with open(self.index_file, 'rb') as f:
                self._index = pickle.load(f)
            
            if self.vectorizer_file.exists():
                with open(self.vectorizer_file, 'rb') as f:
                    self._vectorizer = pickle.load(f)
            
            self._last_loaded = index_mtime
            logger.info("Search index loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading search index: {e}")
            self._index = None
            self._vectorizer = None
            return False
    
    def is_index_available(self) -> bool:
        """Check if search index is available"""
        return self._load_index() and self._index is not None
    
    def get_index_metadata(self) -> Optional[Dict]:
        """Get metadata about the search index"""
        try:
            if self.metadata_file.exists():
                with open(self.metadata_file, 'rb') as f:
                    return pickle.load(f)
        except Exception as e:
            logger.error(f"Error loading index metadata: {e}")
        return None
    
    def build_index(self, force_rebuild: bool = False) -> Dict[str, Any]:
        """
        Build or rebuild the search index from database
        """
        try:
            metadata = self.get_index_metadata()
            
            # Check if we need to rebuild
            if not force_rebuild and metadata:
                last_build = metadata.get('last_build')
                if last_build:
                    # Only rebuild if we have new jobs since last build
                    latest_job = Job.objects.filter(
                        is_archived=False
                    ).order_by('-created_at').first()
                    
                    if latest_job and latest_job.created_at <= last_build:
                        logger.info("Index is up to date, skipping rebuild")
                        return {
                            'status': 'skipped',
                            'reason': 'Index is up to date',
                            'last_build': last_build
                        }
            
            # Fetch jobs from database
            jobs_queryset = Job.objects.filter(
                is_archived=False
            ).select_related('source').prefetch_related('categories', 'tags')
            
            if not jobs_queryset.exists():
                logger.warning("No jobs found in database")
                return {
                    'status': 'error',
                    'message': 'No jobs found in database'
                }
            
            # Prepare documents for MinSearch
            documents = []
            for job in jobs_queryset:
                # Create searchable text
                searchable_parts = [
                    job.title or '',
                    job.company or '',
                    job.location or '',
                    job.description or '',
                    job.job_function or '',
                ]
                
                # Add skills if available
                if job.skills:
                    if isinstance(job.skills, list):
                        searchable_parts.extend(job.skills)
                    elif isinstance(job.skills, str):
                        searchable_parts.append(job.skills)
                
                # Add categories and tags
                categories = list(job.categories.values_list('name', flat=True))
                tags = list(job.tags.values_list('name', flat=True))
                searchable_parts.extend(categories)
                searchable_parts.extend(tags)
                
                searchable_text = ' '.join(filter(None, searchable_parts))
                
                # Convert to document format
                doc = {
                    'id': str(job.id),
                    'title': job.title or '',
                    'company': job.company or '',
                    'location': job.location or '',
                    'city': job.city or '',
                    'state': job.state or '',
                    'country': job.country or '',
                    'description': (job.description or '')[:1000],  # Truncate for index
                    'job_type': job.job_type or '',
                    'job_function': job.job_function or '',
                    'is_remote': job.is_remote,
                    'salary_min': float(job.salary_min) if job.salary_min else 0,
                    'salary_max': float(job.salary_max) if job.salary_max else 0,
                    'salary_min_str': str(int(job.salary_min)) if job.salary_min else '0',
                    'salary_max_str': str(int(job.salary_max)) if job.salary_max else '0',
                    'salary_currency': job.salary_currency or '',
                    'posted_date': job.posted_date.isoformat() if job.posted_date else '',
                    'created_at': job.created_at.isoformat(),
                    'url': job.url or '',
                    'source_name': job.source.name if job.source else '',
                    'skills': job.skills if isinstance(job.skills, list) else [],
                    'categories': categories,
                    'tags': tags,
                    'text': searchable_text  # Combined searchable text
                }
                documents.append(doc)
            
            logger.info(f"Preparing to index {len(documents)} jobs")
            
            # Create MinSearch index (compatible with older versions)
            index = minsearch.Index(
                text_fields=[
                    'title', 'company', 'location', 'description', 
                    'job_function', 'text'
                ],
                keyword_fields=[
                    'job_type', 'city', 'state', 'country', 
                    'salary_currency', 'source_name', 'skills', 
                    'categories', 'tags', 'salary_min_str', 'salary_max_str'
                ]
            )
            
            # Fit the index
            index.fit(documents)
            
            # Create TF-IDF vectorizer for advanced search capabilities
            vectorizer = TfidfVectorizer(
                max_features=5000,
                stop_words='english',
                ngram_range=(1, 2),
                min_df=2,
                max_df=0.95
            )
            
            # Fit vectorizer on searchable text
            job_texts = [doc['text'] for doc in documents if doc['text']]
            if job_texts:
                vectorizer.fit(job_texts)
            
            # Save index and vectorizer
            with open(self.index_file, 'wb') as f:
                pickle.dump(index, f)
            
            with open(self.vectorizer_file, 'wb') as f:
                pickle.dump(vectorizer, f)
            
            # Save metadata
            metadata = {
                'last_build': timezone.now(),
                'total_jobs': len(documents),
                'index_version': '1.0'
            }
            
            with open(self.metadata_file, 'wb') as f:
                pickle.dump(metadata, f)
            
            # Update instance variables
            self._index = index
            self._vectorizer = vectorizer
            self._last_loaded = timezone.now().timestamp()
            
            logger.info(f"Search index built successfully with {len(documents)} jobs")
            
            return {
                'status': 'success',
                'total_jobs': len(documents),
                'build_time': timezone.now(),
                'index_size_mb': round(self.index_file.stat().st_size / (1024 * 1024), 2)
            }
            
        except Exception as e:
            logger.error(f"Error building search index: {e}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def search(
        self, 
        query: str = '',
        filters: Optional[Dict] = None,
        num_results: int = 20,
        boost_fields: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Search jobs using the MinSearch index
        """
        if not self.is_index_available():
            return {
                'status': 'error',
                'message': 'Search index not available',
                'results': [],
                'total': 0
            }
        
        try:
            # Prepare filters
            filter_dict = {}
            if filters:
                # Location filters
                if filters.get('location'):
                    filter_dict['location'] = filters['location']
                if filters.get('city'):
                    filter_dict['city'] = filters['city']
                if filters.get('state'):
                    filter_dict['state'] = filters['state']
                if filters.get('country'):
                    filter_dict['country'] = filters['country']
                
                # Job type filters
                if filters.get('job_type'):
                    filter_dict['job_type'] = filters['job_type']
                if filters.get('is_remote') is not None:
                    filter_dict['is_remote'] = filters['is_remote']
                
                # Salary filters (convert to string comparison for older minsearch)
                if filters.get('min_salary'):
                    min_sal = str(int(float(filters['min_salary'])))
                    # For older minsearch, we'll do post-filtering
                    pass  # We'll handle this in post-processing
                if filters.get('max_salary'):
                    max_sal = str(int(float(filters['max_salary'])))
                    # For older minsearch, we'll do post-filtering
                    pass  # We'll handle this in post-processing
                
                # Skills filter
                if filters.get('skills'):
                    skills = filters['skills']
                    if isinstance(skills, str):
                        skills = [skills]
                    filter_dict['skills'] = skills
                
                # Company filter
                if filters.get('company'):
                    filter_dict['company'] = filters['company']
            
            # Apply boost fields if provided
            boost_dict = boost_fields or {
                'title': 3.0,
                'company': 2.0,
                'job_function': 1.5,
                'description': 1.0
            }
            
            # Perform search
            results = self._index.search(
                query=query,
                filter_dict=filter_dict,
                boost_dict=boost_dict,
                num_results=num_results
            )
            
            # Post-process salary filtering for older minsearch versions
            if filters and (filters.get('min_salary') or filters.get('max_salary')):
                filtered_results = []
                min_salary = float(filters.get('min_salary', 0))
                max_salary = float(filters.get('max_salary', float('inf')))
                
                for result in results:
                    job_min = result.get('salary_min', 0)
                    job_max = result.get('salary_max', 0)
                    
                    # If job has salary info, check if it meets criteria
                    if job_min > 0 or job_max > 0:
                        if job_min >= min_salary and (max_salary == float('inf') or job_max <= max_salary):
                            filtered_results.append(result)
                    else:
                        # Include jobs without salary info
                        filtered_results.append(result)
                
                results = filtered_results
            
            return {
                'status': 'success',
                'query': query,
                'filters': filters,
                'results': results,
                'total': len(results),
                'max_results': num_results
            }
            
        except Exception as e:
            logger.error(f"Error performing search: {e}")
            return {
                'status': 'error',
                'message': str(e),
                'results': [],
                'total': 0
            }

# Global instance
job_search_service = JobSearchService()