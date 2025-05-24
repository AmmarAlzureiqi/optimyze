# jobs/scrapers/core/job_source.py
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional


class JobSource(ABC):
    """Abstract base class for all job sources."""
    
    @abstractmethod
    def fetch_jobs(self) -> List[Dict[str, Any]]:
        """
        Fetch raw job data from the source.
        
        Returns:
            List[Dict[str, Any]]: List of raw job data dictionaries
        """
        pass
    
    @abstractmethod
    def transform_jobs(self, raw_jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Transform raw job data into standardized format.
        
        Args:
            raw_jobs (List[Dict[str, Any]]): Raw job data from fetch_jobs
            
        Returns:
            List[Dict[str, Any]]: Transformed job data ready for database
        """
        pass
    
    @abstractmethod
    def validate_jobs(self, transformed_jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Validate transformed job data.
        
        Args:
            transformed_jobs (List[Dict[str, Any]]): Transformed job data
            
        Returns:
            List[Dict[str, Any]]: Validated job data
        """
        pass
    
    @abstractmethod
    def get_source_metadata(self) -> Dict[str, Any]:
        """
        Get metadata about this source.
        
        Returns:
            Dict[str, Any]: Source metadata including name, url, etc.
        """
        pass
    
    def process(self) -> List[Dict[str, Any]]:
        """
        Execute the full ETL process for this source.
        
        Returns:
            List[Dict[str, Any]]: Processed job data ready for database
        """
        raw_jobs = self.fetch_jobs()
        transformed_jobs = self.transform_jobs(raw_jobs)
        validated_jobs = self.validate_jobs(transformed_jobs)
        return validated_jobs