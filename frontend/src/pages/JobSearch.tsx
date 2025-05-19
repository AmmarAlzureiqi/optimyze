import React, { useState } from 'react';
import { jobs, industries, jobTypes, locations } from '../utils/mockData';
import JobCard from '../components/JobCard';
import { SearchIcon, FilterIcon, XIcon } from 'lucide-react';
const JobSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter(job => {
    // Search term filter
    const matchesSearch = searchTerm === '' || job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase()) || job.description.toLowerCase().includes(searchTerm.toLowerCase());
    // Industry filter
    const matchesIndustry = selectedIndustries.length === 0 || selectedIndustries.includes(job.industry);
    // Job type filter
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.type);
    // Location filter
    const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(job.location);
    return matchesSearch && matchesIndustry && matchesType && matchesLocation;
  });
  const toggleSaveJob = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter(id => id !== jobId));
    } else {
      setSavedJobs([...savedJobs, jobId]);
    }
  };
  const toggleFilter = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[]) => {
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
  return <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
          <p className="text-gray-600 mt-2">Find your next opportunity</p>
        </div>
        <button className="mt-4 md:mt-0 flex items-center text-blue-600 hover:text-blue-800" onClick={() => setFiltersVisible(!filtersVisible)}>
          <FilterIcon className="w-5 h-5 mr-2" />
          {filtersVisible ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input type="text" className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Search jobs by title, company, or keyword" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>
      {/* Filters */}
      {filtersVisible && <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            <button className="text-sm text-gray-500 hover:text-gray-700" onClick={clearFilters}>
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Industry Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Industry
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {industries.map(industry => <label key={industry} className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" checked={selectedIndustries.includes(industry)} onChange={() => toggleFilter(industry, setSelectedIndustries, selectedIndustries)} />
                    <span className="ml-2 text-gray-700">{industry}</span>
                  </label>)}
              </div>
            </div>
            {/* Job Type Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Job Type
              </h3>
              <div className="space-y-2">
                {jobTypes.map(type => <label key={type} className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" checked={selectedTypes.includes(type)} onChange={() => toggleFilter(type, setSelectedTypes, selectedTypes)} />
                    <span className="ml-2 text-gray-700">{type}</span>
                  </label>)}
              </div>
            </div>
            {/* Location Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Location
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {locations.map(location => <label key={location} className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" checked={selectedLocations.includes(location)} onChange={() => toggleFilter(location, setSelectedLocations, selectedLocations)} />
                    <span className="ml-2 text-gray-700">{location}</span>
                  </label>)}
              </div>
            </div>
          </div>
          {/* Selected Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedIndustries.map(industry => <div key={industry} className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center">
                {industry}
                <button onClick={() => toggleFilter(industry, setSelectedIndustries, selectedIndustries)} className="ml-1 text-blue-800 hover:text-blue-900">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>)}
            {selectedTypes.map(type => <div key={type} className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm flex items-center">
                {type}
                <button onClick={() => toggleFilter(type, setSelectedTypes, selectedTypes)} className="ml-1 text-green-800 hover:text-green-900">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>)}
            {selectedLocations.map(location => <div key={location} className="bg-purple-100 text-purple-800 rounded-full px-3 py-1 text-sm flex items-center">
                {location}
                <button onClick={() => toggleFilter(location, setSelectedLocations, selectedLocations)} className="ml-1 text-purple-800 hover:text-purple-900">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>)}
          </div>
        </div>}
      {/* Results count */}
      <p className="text-gray-600 mb-4">Showing {filteredJobs.length} jobs</p>
      {/* Job List */}
      <div className="space-y-6">
        {filteredJobs.map(job => <JobCard key={job.id} job={job} saved={savedJobs.includes(job.id)} onSave={() => toggleSaveJob(job.id)} />)}
        {filteredJobs.length === 0 && <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No jobs match your search criteria.
            </p>
            <p className="text-gray-500">
              Try adjusting your filters or search term.
            </p>
          </div>}
      </div>
    </div>;
};
export default JobSearch;