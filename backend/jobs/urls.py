from django.urls import path
from . import views 

app_name = 'jobs'

urlpatterns = [
    path('', views.JobListView.as_view(), name='job_list'),
    path('<uuid:id>/', views.JobDetailView.as_view(), name='job_detail'),
    path('filters/', views.FilterOptionsView.as_view(), name='filter_options'),
    path('search/status/', views.SearchStatusView.as_view(), name='search_status'),
]