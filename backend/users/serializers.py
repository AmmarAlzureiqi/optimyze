# users/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'phone', 'title', 'city', 'state', 'country',
            'professional_summary', 'skills', 'experience', 'education',
            'linkedin_url', 'github_url', 'portfolio_url'
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'profile')
        read_only_fields = ('id', 'date_joined')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    # Profile fields for registration
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, default='United States')
    
    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm', 
            'first_name', 'last_name',
            'phone', 'title', 'city', 'state', 'country'
        )
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        # Extract profile data
        profile_data = {
            'phone': validated_data.pop('phone', ''),
            'title': validated_data.pop('title', ''),
            'city': validated_data.pop('city', ''),
            'state': validated_data.pop('state', ''),
            'country': validated_data.pop('country', 'United States'),
        }
        
        # Remove password_confirm
        validated_data.pop('password_confirm')
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Update profile (created automatically by signal)
        for key, value in profile_data.items():
            setattr(user.profile, key, value)
        user.profile.save()
        
        return user

class UpdateProfileSerializer(serializers.ModelSerializer):
    # User fields
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'email',
            'phone', 'title', 'city', 'state', 'country',
            'professional_summary', 'skills', 'experience', 'education',
            'linkedin_url', 'github_url', 'portfolio_url'
        ]
    
    def update(self, instance, validated_data):
        # Update user fields
        user_data = validated_data.pop('user', {})
        for key, value in user_data.items():
            setattr(instance.user, key, value)