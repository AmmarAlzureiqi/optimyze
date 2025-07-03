// src/pages/PublicJobSearch.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import JobCard from '../components/JobCard';
import jobsApiService from '../utils/jobsApi';
import { Search, Filter, X, Loader, MapPin, Briefcase, Building2, DollarSign } from 'lucide-react';

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

  const getActiveFilterCount = () => {
    return selectedTypes.length + selectedTitles.length + selectedLocations.length + 
           selectedCities.length + selectedStates.length + selectedCountries.length + 
           selectedCompanies.length + (isRemote ? 1 : 0) + 
           (salaryMin ? 1 : 0) + (salaryMax ? 1 : 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find Your Dream Job
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Discover thousands of opportunities from top companies. Start your career journey today.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                to="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Create Free Account
              </Link>
              <Link 
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 font-semibold transition-all duration-200"
              >
                Sign In
              </Link>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-lg text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Job title, keywords, or company"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    className="lg:w-auto w-full bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={() => setFiltersVisible(!filtersVisible)}
                  >
                    <Filter className="w-5 h-5" />
                    Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters Section */}
        {filtersVisible && (
          <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter Jobs
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{getActiveFilterCount()} filters active</span>
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={clearFilters}
                  >
                    Clear All
                  </button>
                  <button
                    className="lg:hidden text-gray-400 hover:text-gray-600"
                    onClick={() => setFiltersVisible(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Job Title Filter */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900">Job Title</h4>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {filterOptions.job_titles?.slice(0, 10).map(title => (
                      <label key={title} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedTitles.includes(title)}
                          onChange={() => toggleFilter(title, setSelectedTitles, selectedTitles)}
                        />
                        <span className="text-sm text-gray-700 truncate">{title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Job Type Filter */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900">Job Type</h4>
                  </div>
                  <div className="space-y-2">
                    {filterOptions.job_types?.map(type => (
                      <label key={type} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleFilter(type, setSelectedTypes, selectedTypes)}
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900">Location</h4>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {filterOptions.locations?.slice(0, 10).map(location => (
                      <label key={location} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedLocations.includes(location)}
                          onChange={() => toggleFilter(location, setSelectedLocations, selectedLocations)}
                        />
                        <span className="text-sm text-gray-700 truncate">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Salary & Remote */}
                <div className="space-y-4">
                  {/* Salary Range */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <h4 className="font-medium text-gray-900">Salary Range</h4>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min salary"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Max salary"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Remote Options */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Work Type</h4>
                    <div className="space-y-2">
                      {[
                        { value: '', label: 'All' },
                        { value: 'true', label: 'Remote' },
                        { value: 'false', label: 'On-site' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                          <input
                            type="radio"
                            name="remote"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            checked={isRemote === option.value}
                            onChange={() => setIsRemote(option.value)}
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Filter Tags */}
              {getActiveFilterCount() > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {selectedTitles.map(title => (
                      <span key={title} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium">
                        {title}
                        <button
                          onClick={() => toggleFilter(title, setSelectedTitles, selectedTitles)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {selectedTypes.map(type => (
                      <span key={type} className="inline-flex items-center gap-1 bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium">
                        {type}
                        <button
                          onClick={() => toggleFilter(type, setSelectedTypes, selectedTypes)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {selectedLocations.map(location => (
                      <span key={location} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 rounded-full px-3 py-1 text-sm font-medium">
                        {location}
                        <button
                          onClick={() => toggleFilter(location, setSelectedLocations, selectedLocations)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {isRemote && (
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-sm font-medium">
                        {isRemote === 'true' ? 'Remote' : 'On-site'}
                        <button
                          onClick={() => setIsRemote('')}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Results Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Searching jobs...
                  </span>
                ) : (
                  `${pagination.totalJobs.toLocaleString()} jobs found`
                )}
              </h2>
              <div className="mt-2 sm:mt-0 text-sm text-gray-500">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            </div>
          </div>

          {/* Job List */}
          <div className="divide-y divide-gray-200">
            {jobs.map(job => (
              <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                <JobCard
                  job={job}
                  saved={savedJobs.includes(job.id)}
                  onSave={() => toggleSaveJob(job.id)}
                />
              </div>
            ))}
            
            {jobs.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                  <Search className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-500 mb-4">
                  We couldn't find any jobs matching your search criteria.
                </p>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <nav className="inline-flex rounded-lg shadow-sm">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevious}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className={`px-4 py-2 text-sm font-medium border-t border-b border-r border-gray-300 ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-50 text-blue-600 border-blue-300'
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
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Take the Next Step?</h2>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
            Join thousands of professionals who have found their dream careers. 
            Create an account to apply to jobs, save your favorites, and get personalized recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-50 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 font-semibold transition-all duration-200"
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