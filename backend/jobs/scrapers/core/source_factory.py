# jobs/scrapers/core/factory.py
from typing import Dict, Type
from .job_source import JobSource


class JobSourceFactory:
    """Factory for creating job source instances."""
    
    _sources: Dict[str, Type[JobSource]] = {}
    
    @classmethod
    def register(cls, source_type: str, source_class: Type[JobSource]) -> None:
        """
        Register a job source class with the factory.
        
        Args:
            source_type (str): A unique identifier for the source
            source_class (Type[JobSource]): The source class to register
        """
        cls._sources[source_type] = source_class
    
    @classmethod
    def create_source(cls, source_type: str, **kwargs) -> JobSource:
        """
        Create an instance of a job source.
        
        Args:
            source_type (str): The type of source to create
            **kwargs: Arguments to pass to the source constructor
            
        Returns:
            JobSource: An instance of the requested job source
            
        Raises:
            ValueError: If the source_type is not registered
        """
        if source_type not in cls._sources:
            raise ValueError(f"Unknown job source type: {source_type}")
        
        source_class = cls._sources[source_type]
        return source_class(**kwargs)
    
    @classmethod
    def get_available_sources(cls) -> Dict[str, Type[JobSource]]:
        """
        Get all registered job sources.
        
        Returns:
            Dict[str, Type[JobSource]]: Dictionary of registered sources
        """
        return cls._sources.copy()