from django.shortcuts import render
# search/views.py or search/admin_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.management import call_command
from io import StringIO
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def rebuild_search_index(request):
    """API endpoint to trigger search index rebuild"""
    try:
        logger.info("Search index rebuild triggered via API")
        
        out = StringIO()
        err = StringIO()
        
        # Run your Django management command
        call_command('build_search_index', force=True, verbosity=2, stdout=out, stderr=err)
        
        output = out.getvalue()
        errors = err.getvalue()
        
        logger.info(f"Search index rebuild completed. Output: {output}")
        
        return JsonResponse({
            'status': 'success',
            'message': 'Search index rebuild completed successfully',
            'output': output,
            'errors': errors if errors else None
        })
        
    except Exception as e:
        logger.error(f"Search index rebuild failed: {str(e)}")
        return JsonResponse({
            'status': 'error', 
            'message': f'Search index rebuild failed: {str(e)}'
        }, status=500)

def search_status(request):
    """Check if search functionality is available"""
    try:
        # Add your search availability check here
        # This depends on your search implementation (Elasticsearch, PostgreSQL FTS, etc.)
        search_available = True  # Replace with actual check
        
        return JsonResponse({
            'search_available': search_available,
            'status': 'available' if search_available else 'unavailable'
        })
    except Exception as e:
        return JsonResponse({
            'search_available': False,
            'error': str(e),
            'status': 'error'
        })
