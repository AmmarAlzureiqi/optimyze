import uuid
from django.db import models
from django.db.models import JSONField
from django.utils import timezone


class Source(models.Model):
    """Model representing a job source."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    url = models.URLField()
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    config = JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Add JobSpy site mapping
    jobspy_site_name = models.CharField(
        max_length=50, 
        blank=True,
        help_text="Corresponding site name in JobSpy (e.g., 'linkedin', 'indeed')"
    )
    
    def __str__(self):
        return self.name


class JobCategory(models.Model):
    """Model representing a job category."""
    name = models.CharField(max_length=100, unique=True)
    
    class Meta:
        verbose_name_plural = "Job categories"
    
    def __str__(self):
        return self.name


class JobTag(models.Model):
    """Model representing a job skill/tag."""
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name


class Job(models.Model):
    """Model representing a job listing."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='jobs')
    external_id = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    
    # Enhanced location fields to match JobSpy output
    location = models.CharField(max_length=255)  # Keep this as main field
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True) 
    country = models.CharField(max_length=100, blank=True)
    
    # Additional JobSpy fields
    company_url = models.URLField(blank=True)
    is_remote = models.BooleanField(default=False)
    job_type = models.CharField(max_length=50, blank=True)  # fulltime, parttime, etc.
    job_function = models.CharField(max_length=100, blank=True)
    
    # Enhanced salary fields
    salary_range = models.CharField(max_length=255, blank=True)  # Keep for backward compatibility
    salary_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_interval = models.CharField(max_length=20, blank=True)  # yearly, monthly, hourly
    salary_currency = models.CharField(max_length=10, blank=True)
    
    # Dates
    posted_date = models.DateTimeField()
    expiry_date = models.DateTimeField(null=True, blank=True)
    date_scraped = models.DateTimeField(default=timezone.now)
    
    # Content
    description = models.TextField()
    url = models.URLField()
    
    # Relationships
    categories = models.ManyToManyField(JobCategory, related_name='jobs', blank=True)
    tags = models.ManyToManyField(JobTag, related_name='jobs', blank=True)
    
    # Metadata
    details = JSONField(default=dict, blank=True)  # Store raw JobSpy data here
    skills = JSONField(default=list, blank=True)   # Extracted skills list
    
    # System fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    
    # OpenSearch integration fields
    indexed_in_opensearch = models.BooleanField(default=False)
    last_indexed = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('source', 'external_id')
        indexes = [
            models.Index(fields=['posted_date']),
            models.Index(fields=['is_archived']),
            models.Index(fields=['company']),
            models.Index(fields=['job_type']),
            models.Index(fields=['is_remote']),
            models.Index(fields=['date_scraped']),
        ]
    
    def __str__(self):
        return f"{self.title} at {self.company}"


class ScraperRun(models.Model):
    """Model to track scraper execution runs."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='runs')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('RUNNING', 'Running'),
            ('COMPLETED', 'Completed'),
            ('FAILED', 'Failed'),
        ],
        default='PENDING'
    )
    jobs_fetched = models.IntegerField(default=0)
    jobs_created = models.IntegerField(default=0)
    jobs_updated = models.IntegerField(default=0)
    jobs_errored = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    # Add parameters used for this run
    params = JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.source.name} - {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}"
    
    @property
    def duration(self):
        """Calculate run duration if completed"""
        if self.end_time and self.start_time:
            return self.end_time - self.start_time
        return None