#!/usr/bin/env python3
"""
Simple Search Index Rebuild Script
Rebuilds the MinSearch index on your Django backend
"""

import os
import sys
import subprocess
import requests
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('search_index_rebuild.log')
    ]
)

logger = logging.getLogger(__name__)

class SearchIndexRebuilder:
    def __init__(self, django_host: str, ssh_key_path: str = None):
        """
        Initialize the search index rebuilder
        
        Args:
            django_host: Host/domain of the Django backend (e.g., optimyzeapi.com)
            ssh_key_path: Path to SSH private key (optional)
        """
        self.django_host = django_host
        self.ssh_key_path = ssh_key_path or "/home/ubuntu/.ssh/optimyze-key.pem"
        
        # Try both HTTP and HTTPS
        self.base_urls = [
            f"https://{django_host}",
            f"http://{django_host}"
        ]
        self.working_url = None
    
    def check_search_status(self) -> bool:
        """Check if search status endpoint is accessible"""
        logger.info("Checking search status endpoint...")
        
        for base_url in self.base_urls:
            try:
                url = f"{base_url}/api/jobs/search/status/"
                logger.info(f"Trying: {url}")
                response = requests.get(url, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✅ Search status endpoint accessible at {url}")
                    logger.info(f"Search available: {data.get('search_available', False)}")
                    logger.info(f"Message: {data.get('message', 'N/A')}")
                    
                    self.working_url = base_url
                    return True
                else:
                    logger.debug(f"Status check failed: {response.status_code}")
            except Exception as e:
                logger.debug(f"Failed to connect to {base_url}: {e}")
                continue
        
        logger.error("❌ Could not access search status endpoint")
        return False

    def rebuild_search_index(self) -> bool:
        """Execute search index rebuild via SSH"""
        try:
            logger.info("Rebuilding search index via SSH...")
            
            # SSH command to run the Django management command
            ssh_command = [
                "ssh",
                "-o", "StrictHostKeyChecking=no",
                "-i", self.ssh_key_path,
                f"ubuntu@{self.django_host}",
                "cd /opt/django/app && source /opt/django/venv/bin/activate && python manage.py build_search_index --force --verbosity=2"
            ]
            
            logger.info("Executing: " + " ".join(ssh_command))
            
            # Execute the command
            result = subprocess.run(
                ssh_command,
                capture_output=True,
                text=True,
                timeout=1800  # 30 minutes timeout
            )
            
            if result.returncode == 0:
                logger.info("✅ Search index rebuild completed successfully")
                if result.stdout:
                    logger.info(f"Output: {result.stdout}")
                return True
            else:
                logger.error(f"❌ Search index rebuild failed with return code: {result.returncode}")
                if result.stderr:
                    logger.error(f"Error output: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("❌ Search index rebuild timed out")
            return False
        except Exception as e:
            logger.error(f"❌ Error during search index rebuild: {e}")
            return False

    def verify_search_working(self) -> bool:
        """Test that search is working after rebuild"""
        if not self.working_url:
            logger.error("❌ No working URL found")
            return False
            
        try:
            logger.info("Verifying search functionality...")
            
            # Check search status again
            status_url = f"{self.working_url}/api/jobs/search/status/"
            response = requests.get(status_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('search_available'):
                    logger.info("✅ Search index is now available")
                    
                    # Try a simple search
                    search_url = f"{self.working_url}/api/jobs/"
                    test_response = requests.get(
                        search_url,
                        params={"search": "python", "page_size": 5},
                        timeout=30
                    )
                    
                    if test_response.status_code == 200:
                        search_data = test_response.json()
                        result_count = search_data.get('count', 0)
                        logger.info(f"✅ Search test successful: found {result_count} results for 'python'")
                        return True
                    else:
                        logger.warning(f"Search test failed: {test_response.status_code}")
                        return False
                else:
                    logger.error("❌ Search index still not available after rebuild")
                    return False
            else:
                logger.error(f"Search status check failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Search verification failed: {e}")
            return False

    def run(self) -> bool:
        """Execute the complete search index rebuild process"""
        logger.info("=== Starting Search Index Rebuild ===")
        logger.info(f"Django Host: {self.django_host}")
        logger.info(f"SSH Key: {self.ssh_key_path}")
        logger.info(f"Timestamp: {datetime.now()}")
        
        try:
            # Step 1: Check if we can access the Django app
            if not self.check_search_status():
                logger.error("❌ Cannot access Django app, aborting")
                return False
            
            # Step 2: Rebuild search index
            if not self.rebuild_search_index():
                logger.error("❌ Search index rebuild failed")
                return False
            
            # Step 3: Verify search is working
            if not self.verify_search_working():
                logger.warning("⚠️ Search rebuild completed but verification failed")
                return False
            
            logger.info("✅ Search index rebuild completed successfully!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Unexpected error during rebuild: {e}")
            return False
        finally:
            logger.info("=== Search Index Rebuild Process Completed ===")

def main():
    """Main function to run the script"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Rebuild search index on Django backend')
    parser.add_argument('--host', required=True, help='Django host (e.g., optimyzeapi.com)')
    parser.add_argument('--ssh-key', help='Path to SSH private key', 
                       default='/home/ubuntu/.ssh/optimyze-key.pem')
    parser.add_argument('--check-only', action='store_true', 
                       help='Only check search status, skip rebuild')
    
    args = parser.parse_args()
    
    # Create rebuilder instance
    rebuilder = SearchIndexRebuilder(args.host, args.ssh_key)
    
    if args.check_only:
        logger.info("🧪 Running status check only")
        success = rebuilder.check_search_status()
        if success and rebuilder.working_url:
            # Also check current search status
            rebuilder.verify_search_working()
        return success
    
    # Run the complete process
    success = rebuilder.run()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()