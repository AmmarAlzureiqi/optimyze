from django.urls import path
from .views import JobListView, JobDetailView, FilterOptionsView

app_name = 'jobs'

urlpatterns = [
    path('', JobListView.as_view(), name='job-list'),
    path('<uuid:id>/', JobDetailView.as_view(), name='job-detail'),
    path('filters/', FilterOptionsView.as_view(), name='filter-options'),
]