import React, { useState, useEffect } from 'react';
import JobCard from '../components/JobCard';
import { SearchIcon, FilterIcon, XIcon, LoaderIcon } from 'lucide-react';

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Available filter options (extracted from API data)
  const [industries, setIndustries] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [locations, setLocations] = useState([]);

  // Fetch jobs from API - SIMPLIFIED DEBUG VERSION
  useEffect(() => {
    const fetchJobsData = async () => {
      try {
        setLoading(true);
        console.log('🔍 Starting to fetch jobs...');
        
        const response = await fetch('http://127.0.0.1:8000/api/jobs/');
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Raw API data:', data);
        console.log('📊 Number of results:', data.results?.length || 0);

        // Check if we have results
        if (!data.results || data.results.length === 0) {
          console.log('⚠️ No jobs found in API response');
          setJobs([]);
          return;
        }

        // Transform API data to match JobCard component's expected format
        const transformedJobs = data.results.map((job, index) => {
          console.log(`🔄 Transforming job ${index + 1}:`, job.title);
          return {
            id: job.id || `temp-id-${index}`,
            title: job.title || 'No title',
            company: job.company || 'Unknown company',
            location: job.location || (job.is_remote ? 'Remote' : 'Not specified'),
            type: job.job_type || 'Not specified',
            industry: job.job_function || job.categories?.[0] || 'General',
            description: job.title ? `${job.title} at ${job.company || 'this company'}` : 'No description available',
            salary: job.salary_display || job.salary_range || 'Salary not specified',
            url: job.url || null,
            postedDate: job.posted_date || null,
            daysAgo: job.days_ago || 'Recently posted',
            isRemote: Boolean(job.is_remote),
            source: job.source?.name || 'Unknown source',
            
            // JobCard specific fields that don't exist in API - provide defaults
            logo: `https://via.placeholder.com/48x48?text=${(job.company || 'C').charAt(0)}`, // Placeholder logo
            posted: job.days_ago || 'recently',
            requirements: job.categories || ['No requirements listed'], // Use categories as requirements or empty array
          };
        });

        console.log('✅ Transformed jobs:', transformedJobs);
        setJobs(transformedJobs);

        // Extract unique values for filters
        const uniqueIndustries = [...new Set(transformedJobs.map(job => job.industry).filter(Boolean))];
        const uniqueTypes = [...new Set(transformedJobs.map(job => job.type).filter(Boolean))];
        const uniqueLocations = [...new Set(transformedJobs.map(job => job.location).filter(Boolean))];

        console.log('🏷️ Unique industries:', uniqueIndustries);
        console.log('🏷️ Unique types:', uniqueTypes);
        console.log('🏷️ Unique locations:', uniqueLocations);

        setIndustries(uniqueIndustries);
        setJobTypes(uniqueTypes);
        setLocations(uniqueLocations);

      } catch (err) {
        console.error('❌ Error fetching jobs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        console.log('🏁 Finished fetching jobs');
      }
    };

    fetchJobsData();
  }, []);

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndustry = selectedIndustries.length === 0 || 
      selectedIndustries.includes(job.industry);

    const matchesType = selectedTypes.length === 0 || 
      selectedTypes.includes(job.type);

    const matchesLocation = selectedLocations.length === 0 || 
      selectedLocations.includes(job.location);

    return matchesSearch && matchesIndustry && matchesType && matchesLocation;
  });

  console.log('🔍 Filtered jobs count:', filteredJobs.length);

  const toggleSaveJob = (jobId) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter(id => id !== jobId));
    } else {
      setSavedJobs([...savedJobs, jobId]);
    }
  };

  const toggleFilter = (value, setter, current) => {
    if (current.includes(value)) {
      setter(current.filter(item => item !== value));
    } else {
      setter([...current, value]);
    }
  };

  const clearFilters = () => {
    setSelectedIndustries([]);
    setSelectedTypes([]);
    setSelectedLocations([]);
  };

  // Debug info in the UI
  console.log('🎨 Rendering with:', { 
    loading, 
    error, 
    jobsCount: jobs.length, 
    filteredJobsCount: filteredJobs.length 
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoaderIcon className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading jobs...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">Error loading jobs: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Debug Info */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p className="text-sm">
          Debug: {jobs.length} total jobs, {filteredJobs.length} filtered jobs
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
          <p className="text-gray-600 mt-2">Find your next opportunity</p>
        </div>
        <button 
          className="mt-4 md:mt-0 flex items-center text-blue-600 hover:text-blue-800"
          onClick={() => setFiltersVisible(!filtersVisible)}
        >
          <FilterIcon className="w-5 h-5 mr-2" />
          {filtersVisible ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search jobs by title, company, or keyword"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Results count */}
      <p className="text-gray-600 mb-4">Showing {filteredJobs.length} jobs</p>

      {/* Job List */}
      <div className="space-y-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={savedJobs.includes(job.id)}
              onSave={() => toggleSaveJob(job.id)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No jobs found.
            </p>
            <p className="text-gray-500">
              {jobs.length === 0 ? 'No jobs in database' : 'Try adjusting your search criteria'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearch;