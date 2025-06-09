# jobs/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Job, Source, JobCategory, JobTag, ScraperRun


class SourceSerializer(serializers.ModelSerializer):
    """Serializer for job source information"""
    class Meta:
        model = Source
        fields = ['id', 'name', 'url']


class JobCategorySerializer(serializers.ModelSerializer):
    """Serializer for job categories"""
    class Meta:
        model = JobCategory
        fields = ['name']


class JobTagSerializer(serializers.ModelSerializer):
    """Serializer for job tags"""
    class Meta:
        model = JobTag
        fields = ['name']


class PublicJobListSerializer(serializers.ModelSerializer):
    """
    Limited serializer for public (unauthenticated) users
    Shows basic job info but hides sensitive details like salary and company URLs
    """
    source = SourceSerializer(read_only=True)
    categories = JobCategorySerializer(many=True, read_only=True)
    days_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'company',
            'location',
            'city',
            'state',
            'country',
            'is_remote',
            'job_type',
            'job_function',
            'posted_date',
            'days_ago',
            'source',
            'categories',
            'description'  # Will be truncated in to_representation
        ]
    
    def get_days_ago(self, obj):
        """Calculate how many days ago the job was posted"""
        if obj.posted_date:
            delta = timezone.now() - obj.posted_date
            days = delta.days
            if days == 0:
                return "Today"
            elif days == 1:
                return "1 day ago"
            else:
                return f"{days} days ago"
        return "Unknown"
    
    def to_representation(self, instance):
        """Customize the output for public users"""
        data = super().to_representation(instance)
        
        # Truncate description for public users
        if data.get('description'):
            description = data['description']
            if len(description) > 250:
                data['description'] = description[:250] + '... [Sign up to read more]'
        
        return data


class JobListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for job listings (authenticated users)
    Only includes essential fields for list view
    """
    source = SourceSerializer(read_only=True)
    categories = JobCategorySerializer(many=True, read_only=True)
    days_ago = serializers.SerializerMethodField()
    salary_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'company',
            'company_url',
            'location',
            'city',
            'state',
            'country',
            'is_remote',
            'job_type',
            'job_function',
            'posted_date',
            'days_ago',
            'url',
            'source',
            'categories',
            'salary_range',
            'salary_display',
            'salary_min',
            'salary_max',
            'salary_currency',
        ]
    
    def get_days_ago(self, obj):
        """Calculate how many days ago the job was posted"""
        if obj.posted_date:
            delta = timezone.now() - obj.posted_date
            days = delta.days
            if days == 0:
                return "Today"
            elif days == 1:
                return "1 day ago"
            else:
                return f"{days} days ago"
        return "Unknown"
    
    def get_salary_display(self, obj):
        """Return formatted salary for display"""
        if obj.salary_min and obj.salary_max:
            currency = obj.salary_currency or 'USD'
            interval = obj.salary_interval or 'yearly'
            
            # Format based on currency
            if currency == 'USD':
                min_sal = f"${obj.salary_min:,.0f}"
                max_sal = f"${obj.salary_max:,.0f}"
            else:
                min_sal = f"{obj.salary_min:,.0f} {currency}"
                max_sal = f"{obj.salary_max:,.0f} {currency}"
            
            # Add interval
            interval_suffix = ""
            if interval == "yearly":
                interval_suffix = "/year"
            elif interval == "monthly":
                interval_suffix = "/month"
            elif interval == "hourly":
                interval_suffix = "/hour"
            
            return f"{min_sal} - {max_sal}{interval_suffix}"
        
        elif obj.salary_range:
            return obj.salary_range
        
        return "Salary not specified"


class JobDetailSerializer(serializers.ModelSerializer):
    """
    Complete serializer for individual job details
    Includes all fields for detailed view
    """
    source = SourceSerializer(read_only=True)
    categories = JobCategorySerializer(many=True, read_only=True)
    tags = JobTagSerializer(many=True, read_only=True)
    days_ago = serializers.SerializerMethodField()
    salary_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id',
            'external_id',
            'title',
            'company',
            'company_url',
            'location',
            'city',
            'state',
            'country',
            'is_remote',
            'job_type',
            'job_function',
            'description',
            'posted_date',
            'expiry_date',
            'days_ago',
            'url',
            'source',
            'categories',
            'tags',
            'salary_range',
            'salary_display',
            'salary_min',
            'salary_max',
            'salary_interval',
            'salary_currency',
            'skills',
            'details',
            'created_at',
            'updated_at',
        ]
    
    def get_days_ago(self, obj):
        """Calculate how many days ago the job was posted"""
        if obj.posted_date:
            delta = timezone.now() - obj.posted_date
            days = delta.days
            if days == 0:
                return "Today"
            elif days == 1:
                return "1 day ago"
            else:
                return f"{days} days ago"
        return "Unknown"
    
    def get_salary_display(self, obj):
        """Return formatted salary for display"""
        if obj.salary_min and obj.salary_max:
            currency = obj.salary_currency or 'USD'
            interval = obj.salary_interval or 'yearly'
            
            # Format based on currency
            if currency == 'USD':
                min_sal = f"${obj.salary_min:,.0f}"
                max_sal = f"${obj.salary_max:,.0f}"
            else:
                min_sal = f"{obj.salary_min:,.0f} {currency}"
                max_sal = f"{obj.salary_max:,.0f} {currency}"
            
            # Add interval
            interval_suffix = ""
            if interval == "yearly":
                interval_suffix = "/year"
            elif interval == "monthly":
                interval_suffix = "/month"
            elif interval == "hourly":
                interval_suffix = "/hour"
            
            return f"{min_sal} - {max_sal}{interval_suffix}"
        
        elif obj.salary_range:
            return obj.salary_range
        
        return "Salary not specified"