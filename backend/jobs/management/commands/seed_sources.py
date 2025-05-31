from django.core.management.base import BaseCommand
from jobs.models import Source, JobCategory

class Command(BaseCommand):
    help = 'Seed initial job sources and categories'

    def handle(self, *args, **options):
        # Job sources with JobSpy mappings
        sources_data = [
            {
                'name': 'Indeed',
                'jobspy_site_name': 'indeed',
                'url': 'https://indeed.com',
                'description': 'One of the largest job boards'
            },
            {
                'name': 'LinkedIn',
                'jobspy_site_name': 'linkedin', 
                'url': 'https://linkedin.com',
                'description': 'Professional networking and job platform'
            },
            {
                'name': 'Glassdoor',
                'jobspy_site_name': 'glassdoor',
                'url': 'https://glassdoor.com', 
                'description': 'Job board with company reviews and salaries'
            },
            {
                'name': 'ZipRecruiter',
                'jobspy_site_name': 'zip_recruiter',
                'url': 'https://ziprecruiter.com',
                'description': 'Job matching platform'
            },
            {
                'name': 'Google Jobs',
                'jobspy_site_name': 'google',
                'url': 'https://jobs.google.com',
                'description': 'Google job search aggregator'
            }
        ]

        # Create sources
        for source_data in sources_data:
            source, created = Source.objects.get_or_create(
                name=source_data['name'],
                defaults=source_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created source: {source.name}')
                )
            else:
                self.stdout.write(f'Source already exists: {source.name}')

        # Job categories
        categories = [
            'Software Engineering',
            'Data Science', 
            'Product Management',
            'Design',
            'DevOps',
            'Sales',
            'Marketing',
            'Customer Success',
            'Finance',
            'Operations'
        ]

        for category_name in categories:
            category, created = JobCategory.objects.get_or_create(name=category_name)
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS('Successfully seeded sources and categories!')
        )