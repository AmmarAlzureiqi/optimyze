// src/pages/PublicJobSearch.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import JobCard from '../components/JobCard';
import jobsApiService from '../utils/jobsApi';
import { Search, Filter, X, Loader } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  salary_disclosed?: boolean;
  url?: string;
  posted_date: string;
  is_remote: boolean;
  city?: string;
  state?: string;
  country?: string;
  source?: any;
  categories?: any[];
  tags?: any[];
}

interface FilterOptions {
  job_types: string[];
  job_titles: string[];
  companies: string[];
  locations: string[];
  cities: string[];
  states: string[];
  countries: string[];
  categories: string[];
  tags: string[];
  remote_options: Array<{value: boolean; label: string}>;
  search_available: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalJobs: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const PublicJobSearch = () => {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isRemote, setIsRemote] = useState<string>('');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  
  // UI state
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [filtersVisible, setFiltersVisible] = useState<boolean>(false);
  
  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    job_types: [],
    job_titles: [],
    companies: [],
    locations: [],
    cities: [],
    states: [],
    countries: [],
    categories: [],
    tags: [],
    remote_options: [],
    search_available: false
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
    hasNext: false,
    hasPrevious: false
  });

  // Fetch filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Fetch jobs when search parameters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadJobs(1); // Reset to page 1 when filters change
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [
    searchTerm, selectedIndustries, selectedTypes, selectedTitles, selectedLocations,
    selectedCities, selectedStates, selectedCountries,
    isRemote, salaryMin, salaryMax
  ]);

  const loadFilterOptions = async (): Promise<void> => {
    const result = await jobsApiService.fetchFilterOptions();
    if (result.success) {
      setFilterOptions(result.data);
    } else {
      console.error('Failed to load filter options:', result.error);
    }
  };

  const buildSearchParams = (page: number = 1) => {
    return {
      page,
      search: searchTerm.trim(),
      jobTypes: selectedTypes,
      jobTitles: selectedTitles,
      locations: selectedLocations,
      cities: selectedCities,
      states: selectedStates,
      countries: selectedCountries,
      companies: selectedCompanies,
      isRemote: isRemote !== '' ? isRemote === 'true' : undefined,
      salaryMin: salaryMin || undefined,
      salaryMax: salaryMax || undefined,
      ordering: '-posted_date'
    };
  };

  const loadJobs = async (page: number = 1): Promise<void> => {
    setLoading(true);
    setError(null);
    
    const searchParams = buildSearchParams(page);
    const result = await jobsApiService.fetchJobs(searchParams);
    
    if (result.success) {
      setJobs(result.data.jobs);
      setPagination({
        currentPage: page,
        totalPages: result.data.pagination.totalPages,
        totalJobs: result.data.pagination.count,
        hasNext: result.data.pagination.hasNext,
        hasPrevious: result.data.pagination.hasPrevious
      });
    } else {
      setError(result.error);
      setJobs([]);
    }
    
    setLoading(false);
  };

  const toggleSaveJob = (jobId: string): void => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter(id => id !== jobId));
    } else {
      setSavedJobs([...savedJobs, jobId]);
    }
  };

  const toggleFilter = (
    value: string, 
    setter: React.Dispatch<React.SetStateAction<string[]>>, 
    current: string[]
  ): void => {
    if (current.includes(value)) {
      setter(current.filter(item => item !== value));
    } else {
      setter([...current, value]);
    }
  };

  const clearFilters = (): void => {
    setSelectedIndustries([]);
    setSelectedTypes([]);
    setSelectedTitles([]);
    setSelectedLocations([]);
    setSelectedCities([]);
    setSelectedStates([]);
    setSelectedCountries([]);
    setSelectedCompanies([]);
    setIsRemote('');
    setSalaryMin('');
    setSalaryMax('');
  };

  const handlePageChange = (newPage: number): void => {
    loadJobs(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
        <p className="text-gray-600 mt-2">
          Find your next opportunity from thousands of available positions
        </p>
      </div>

      {/* CTA Banner */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-blue-600 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            🚀 Get More Features
          </h3>
          <p className="mb-4">
            Create an account to save jobs, track applications, and get personalized recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              to="/register"
              className="bg-white text-blue-600 px-6 py-3 rounded-md hover:bg-gray-50 font-semibold transition-colors text-center"
            >
              Create Account
            </Link>
            <Link 
              to="/login"
              className="border border-white text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Search Jobs</h2>
          <button 
            className="mt-4 md:mt-0 flex items-center text-blue-600 hover:text-blue-800"
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <Filter className="w-5 h-5 mr-2" />
            {filtersVisible ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search jobs by title, company, or keyword"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        {filtersVisible && (
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={clearFilters}
              >
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Job Title Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Job Title</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filterOptions.job_titles?.map(title => (
                    <label key={title} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedTitles.includes(title)}
                        onChange={() => toggleFilter(title, setSelectedTitles, selectedTitles)}
                      />
                      <span className="ml-2 text-gray-700">{title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Job Type Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Job Type</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filterOptions.job_types?.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleFilter(type, setSelectedTypes, selectedTypes)}
                      />
                      <span className="ml-2 text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filterOptions.locations?.map(location => (
                    <label key={location} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedLocations.includes(location)}
                        onChange={() => toggleFilter(location, setSelectedLocations, selectedLocations)}
                      />
                      <span className="ml-2 text-gray-700">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Company Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Company</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filterOptions.companies?.slice(0, 20).map(company => (
                    <label key={company} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedCompanies.includes(company)}
                        onChange={() => toggleFilter(company, setSelectedCompanies, selectedCompanies)}
                      />
                      <span className="ml-2 text-gray-700">{company}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Remote/On-site Filter */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Work Type</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="remote"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      checked={isRemote === ''}
                      onChange={() => setIsRemote('')}
                    />
                    <span className="ml-2 text-gray-700">All</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="remote"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      checked={isRemote === 'true'}
                      onChange={() => setIsRemote('true')}
                    />
                    <span className="ml-2 text-gray-700">Remote</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="remote"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      checked={isRemote === 'false'}
                      onChange={() => setIsRemote('false')}
                    />
                    <span className="ml-2 text-gray-700">On-site</span>
                  </label>
                </div>
              </div>

              {/* Salary Range */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Salary Range</h4>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Min salary"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Max salary"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Filters Tags */}
            <div className="mt-6 flex flex-wrap gap-2">
              {selectedTitles.map(title => (
                <div key={title} className="bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm flex items-center">
                  {title}
                  <button
                    onClick={() => toggleFilter(title, setSelectedTitles, selectedTitles)}
                    className="ml-1 text-indigo-800 hover:text-indigo-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {selectedTypes.map(type => (
                <div key={type} className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center">
                  {type}
                  <button
                    onClick={() => toggleFilter(type, setSelectedTypes, selectedTypes)}
                    className="ml-1 text-blue-800 hover:text-blue-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {selectedLocations.map(location => (
                <div key={location} className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm flex items-center">
                  {location}
                  <button
                    onClick={() => toggleFilter(location, setSelectedLocations, selectedLocations)}
                    className="ml-1 text-green-800 hover:text-green-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {selectedCompanies.map(company => (
                <div key={company} className="bg-purple-100 text-purple-800 rounded-full px-3 py-1 text-sm flex items-center">
                  {company}
                  <button
                    onClick={() => toggleFilter(company, setSelectedCompanies, selectedCompanies)}
                    className="ml-1 text-purple-800 hover:text-purple-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {isRemote && (
                <div className="bg-yellow-100 text-yellow-800 rounded-full px-3 py-1 text-sm flex items-center">
                  {isRemote === 'true' ? 'Remote' : 'On-site'}
                  <button
                    onClick={() => setIsRemote('')}
                    className="ml-1 text-yellow-800 hover:text-yellow-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Job Results Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Available Jobs</h2>
          <p className="text-gray-600">
            {loading ? (
              <span className="flex items-center">
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Loading jobs...
              </span>
            ) : (
              `Showing ${pagination.totalJobs} jobs`
            )}
          </p>
        </div>

        {/* Job List */}
        <div className="space-y-6">
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              saved={savedJobs.includes(job.id)}
              onSave={() => toggleSaveJob(job.id)}
            />
          ))}
          
          {jobs.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No jobs match your search criteria.
              </p>
              <p className="text-gray-500">
                Try adjusting your filters or search term.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="inline-flex rounded-md shadow">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevious}
                className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 border-t border-b border-r border-gray-300 text-sm font-medium ${
                      pageNum === pagination.currentPage
                        ? 'bg-blue-50 text-blue-600 border-blue-500'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 rounded-r-md border-t border-r border-b border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-gray-900 text-white p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Take the Next Step?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Join thousands of job seekers who have found their dream careers. 
            Create an account to apply to jobs, save your favorites, and get personalized recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold transition-colors"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="border border-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-800 font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicJobSearch;