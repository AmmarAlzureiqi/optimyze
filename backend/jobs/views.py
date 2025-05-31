# jobs/views.py
from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import Job, JobCategory, JobTag
from .serializers import JobListSerializer, JobDetailSerializer


class JobPagination(PageNumberPagination):
    """Custom pagination for job listings"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class JobListView(generics.ListAPIView):
    """
    API endpoint for listing jobs with filtering and search
    """
    serializer_class = JobListSerializer
    pagination_class = JobPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Fields that can be filtered
    filterset_fields = {
        'job_type': ['exact', 'icontains'],
        'is_remote': ['exact'],
        'company': ['exact', 'icontains'],
        'location': ['icontains'],
        'city': ['exact', 'icontains'],
        'state': ['exact', 'icontains'],
        'country': ['exact', 'icontains'],
        'posted_date': ['gte', 'lte'],
        'salary_min': ['gte', 'lte'],
        'salary_max': ['gte', 'lte'],
    }
    
    # Fields that can be searched
    search_fields = ['title', 'company', 'description']
    
    # Default ordering
    ordering_fields = ['posted_date', 'created_at', 'salary_min', 'salary_max']
    ordering = ['-posted_date']  # Default: newest first
    
    def get_queryset(self):
        """
        Return jobs from the last month, excluding archived jobs
        """
        one_month_ago = timezone.now() - timedelta(days=30)
        
        return Job.objects.filter(
            posted_date__gte=one_month_ago,
            is_archived=False
        ).select_related('source').prefetch_related('categories', 'tags')


class JobDetailView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving individual job details
    """
    queryset = Job.objects.filter(is_archived=False)
    serializer_class = JobDetailSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        return Job.objects.filter(
            is_archived=False
        ).select_related('source').prefetch_related('categories', 'tags')


class FilterOptionsView(generics.GenericAPIView):
    """
    API endpoint to get available filter options
    """
    def get(self, request):
        """
        Return available filter options for the frontend
        """
        one_month_ago = timezone.now() - timedelta(days=30)
        
        # Get jobs from last month for filter options
        jobs = Job.objects.filter(
            posted_date__gte=one_month_ago,
            is_archived=False
        )
        
        # Extract unique values for filters
        job_types = jobs.values_list('job_type', flat=True).distinct().exclude(job_type='')
        companies = jobs.values_list('company', flat=True).distinct().order_by('company')[:100]  # Limit to top 100
        locations = jobs.values_list('location', flat=True).distinct().order_by('location')[:100]
        cities = jobs.values_list('city', flat=True).distinct().exclude(city='').order_by('city')[:50]
        states = jobs.values_list('state', flat=True).distinct().exclude(state='').order_by('state')
        countries = jobs.values_list('country', flat=True).distinct().exclude(country='').order_by('country')
        
        # Get categories and tags
        categories = JobCategory.objects.all().values_list('name', flat=True)
        tags = JobTag.objects.all().values_list('name', flat=True)[:50]  # Limit popular tags
        
        return Response({
            'job_types': list(job_types),
            'companies': list(companies),
            'locations': list(locations),
            'cities': list(cities),
            'states': list(states),
            'countries': list(countries),
            'categories': list(categories),
            'tags': list(tags),
            'remote_options': [
                {'value': True, 'label': 'Remote'},
                {'value': False, 'label': 'On-site'}
            ]
        })