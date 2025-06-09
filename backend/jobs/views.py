# jobs/views.py
from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Case, When
from datetime import timedelta
from .models import Job, JobCategory, JobTag
from .serializers import JobListSerializer, JobDetailSerializer, PublicJobListSerializer
from .services.search_service import job_search_service


class JobPagination(PageNumberPagination):
    """Custom pagination for job listings"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class JobListView(generics.ListAPIView):
    """
    API endpoint for listing jobs with filtering and MinSearch-powered search
    """
    permission_classes = [AllowAny]  # Allow both authenticated and anonymous users
    pagination_class = JobPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]  # Removed SearchFilter
    
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
    
    # Default ordering
    ordering_fields = ['posted_date', 'created_at', 'salary_min', 'salary_max']
    ordering = ['-posted_date']  # Default: newest first
    
    def get_serializer_class(self):
        """Return different serializers based on authentication status"""
        if self.request.user.is_authenticated:
            return JobListSerializer  # Full job details for authenticated users
        return PublicJobListSerializer  # Limited details for public users
    
    def get_queryset(self):
        """
        Enhanced queryset with MinSearch integration for text search
        """
        one_month_ago = timezone.now() - timedelta(days=30)
        
        base_queryset = Job.objects.filter(
            posted_date__gte=one_month_ago,
            is_archived=False
        ).select_related('source').prefetch_related('categories', 'tags')
        
        # Check if there's a search query
        search_query = self.request.GET.get('search', '').strip()
        
        if search_query:
            # Use MinSearch for text search
            search_filters = self._build_search_filters()
            
            search_result = job_search_service.search(
                query=search_query,
                filters=search_filters,
                num_results=500  # Get more results than pagination needs
            )
            
            if search_result['status'] == 'success' and search_result['results']:
                # Get job IDs from search results
                job_ids = [result['id'] for result in search_result['results']]
                
                # Return queryset ordered by search relevance
                preserved_order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(job_ids)])
                return base_queryset.filter(id__in=job_ids).order_by(preserved_order)
            else:
                # If search fails or no results, return empty queryset
                return base_queryset.none()
        
        # No search query - return normal filtered results
        return base_queryset
    
    def _build_search_filters(self):
        """Build filters for MinSearch from request parameters"""
        filters = {}
        
        # Location filters
        if self.request.GET.get('location'):
            filters['location'] = self.request.GET.get('location')
        if self.request.GET.get('city'):
            filters['city'] = self.request.GET.get('city')
        if self.request.GET.get('state'):
            filters['state'] = self.request.GET.get('state')
        if self.request.GET.get('country'):
            filters['country'] = self.request.GET.get('country')
        
        # Job filters
        if self.request.GET.get('job_type'):
            filters['job_type'] = self.request.GET.get('job_type')
        if self.request.GET.get('is_remote'):
            filters['is_remote'] = self.request.GET.get('is_remote').lower() == 'true'
        if self.request.GET.get('company'):
            filters['company'] = self.request.GET.get('company')
        
        # Salary filters (using Django filter field names)
        if self.request.GET.get('salary_min__gte'):
            try:
                filters['min_salary'] = float(self.request.GET.get('salary_min__gte'))
            except ValueError:
                pass
        if self.request.GET.get('salary_max__lte'):
            try:
                filters['max_salary'] = float(self.request.GET.get('salary_max__lte'))
            except ValueError:
                pass
        
        # Skills filter
        skills = self.request.GET.getlist('skills')
        if skills:
            filters['skills'] = skills
        
        return filters


class JobDetailView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving individual job details
    """
    permission_classes = [AllowAny]  # Allow both authenticated and anonymous users
    lookup_field = 'id'
    
    def get_serializer_class(self):
        """Return different serializers based on authentication status"""
        if self.request.user.is_authenticated:
            return JobDetailSerializer  # Full job details
        return PublicJobListSerializer  # Limited details for public users
    
    def get_queryset(self):
        return Job.objects.filter(
            is_archived=False
        ).select_related('source').prefetch_related('categories', 'tags')


class FilterOptionsView(generics.GenericAPIView):
    """
    API endpoint to get available filter options
    """
    permission_classes = [AllowAny]  # Allow both authenticated and anonymous users
    
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
            ],
            'search_available': job_search_service.is_index_available(),
            'user_authenticated': request.user.is_authenticated
        })


class SearchStatusView(generics.GenericAPIView):
    """
    API endpoint to get search system status
    """
    permission_classes = [AllowAny]  # Allow both authenticated and anonymous users
    
    def get(self, request):
        """Get search index status and metadata"""
        is_available = job_search_service.is_index_available()
        metadata = job_search_service.get_index_metadata()
        
        return Response({
            'search_available': is_available,
            'index_metadata': metadata,
            'message': 'Search index ready' if is_available else 'Search index not available',
            'user_authenticated': request.user.is_authenticated
        })