# search/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('admin/rebuild-search-index/', views.rebuild_search_index, name='rebuild-search-index'),
    path('search-status/', views.search_status, name='search-status'),
]