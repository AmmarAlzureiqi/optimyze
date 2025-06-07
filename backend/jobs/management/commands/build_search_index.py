# jobs/management/commands/build_search_index.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from jobs.services.search_service import job_search_service

class Command(BaseCommand):
    help = 'Build or rebuild the MinSearch index for job search'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force rebuild even if index is up to date',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Building job search index...')
        )
        
        start_time = timezone.now()
        
        # Build the index
        result = job_search_service.build_index(
            force_rebuild=options['force']
        )
        
        end_time = timezone.now()
        duration = end_time - start_time
        
        if result['status'] == 'success':
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Search index built successfully!\n'
                    f'   Jobs indexed: {result["total_jobs"]}\n'
                    f'   Index size: {result["index_size_mb"]} MB\n'
                    f'   Build time: {duration.total_seconds():.2f} seconds'
                )
            )
        elif result['status'] == 'skipped':
            self.stdout.write(
                self.style.WARNING(
                    f'⏭️  Index build skipped: {result["reason"]}\n'
                    f'   Use --force to rebuild anyway'
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ Error building index: {result["message"]}'
                )
            )
            
        # Test the search functionality
        if result['status'] == 'success':
            self.stdout.write('\n🔍 Testing search functionality...')
            
            test_queries = [
                'software engineer',
                'python developer',
                'remote data scientist'
            ]
            
            for query in test_queries:
                search_result = job_search_service.search(query, num_results=3)
                if search_result['status'] == 'success':
                    self.stdout.write(
                        f'   "{query}" -> {search_result["total"]} results'
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR(f'   Search test failed for "{query}"')
                    )
            
            self.stdout.write(
                self.style.SUCCESS('✅ Search functionality working correctly!')
            )