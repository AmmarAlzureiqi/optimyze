// services/jobsApi.ts

// Simple configuration - you can change this URL as needed
const API_BASE_URL = 'http://localhost:8000/api';

interface SearchParams {
  page?: number;
  search?: string;
  jobTypes?: string[];
  locations?: string[];
  cities?: string[];
  states?: string[];
  countries?: string[];
  companies?: string[];
  isRemote?: boolean;
  salaryMin?: string;
  salaryMax?: string;
  ordering?: string;
}

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

class JobsApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/jobs`;
  }

  // Build query parameters for job search
  private buildQueryParams(searchParams: SearchParams): string {
    const params = new URLSearchParams();
    
    if (searchParams.page) {
      params.append('page', searchParams.page.toString());
    }
    
    if (searchParams.search?.trim() && searchParams.search.trim().length >= 2) {
      params.append('search', searchParams.search.trim());
    }
    
    if (searchParams.jobTypes?.length) {
      searchParams.jobTypes.forEach(type => params.append('job_type', type));
    }
    
    if (searchParams.locations?.length) {
      searchParams.locations.forEach(location => params.append('location', location));
    }
    
    if (searchParams.cities?.length) {
      searchParams.cities.forEach(city => params.append('city', city));
    }
    
    if (searchParams.states?.length) {
      searchParams.states.forEach(state => params.append('state', state));
    }
    
    if (searchParams.countries?.length) {
      searchParams.countries.forEach(country => params.append('country', country));
    }
    
    if (searchParams.companies?.length) {
      searchParams.companies.forEach(company => params.append('company', company));
    }
    
    if (searchParams.isRemote !== undefined) {
      params.append('is_remote', searchParams.isRemote.toString());
    }
    
    if (searchParams.salaryMin) {
      params.append('salary_min__gte', searchParams.salaryMin);
    }
    
    if (searchParams.salaryMax) {
      params.append('salary_max__lte', searchParams.salaryMax);
    }
    
    params.append('ordering', searchParams.ordering || '-posted_date');
    
    return params.toString();
  }

  // Fetch jobs with filters and pagination
  async fetchJobs(searchParams: SearchParams = {}) {
    try {
      const queryString = this.buildQueryParams(searchParams);
      const url = `${this.baseURL}/?${queryString}`;
      
      // Debug logging
      console.log('🔍 Search params:', searchParams);
      console.log('🌐 Full URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Debug logging
      console.log('📊 API Response:', data);
      console.log('📋 Jobs count:', data.count);
      console.log('🔢 Results length:', data.results?.length);
      
      return {
        success: true,
        data: {
          jobs: data.results || [],
          pagination: {
            count: data.count || 0,
            totalPages: Math.ceil((data.count || 0) / 20),
            currentPage: searchParams.page || 1,
            hasNext: !!data.next,
            hasPrevious: !!data.previous,
          }
        }
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
        data: {
          jobs: [],
          pagination: {
            count: 0,
            totalPages: 0,
            currentPage: 1,
            hasNext: false,
            hasPrevious: false,
          }
        }
      };
    }
  }

  // Fetch filter options
  async fetchFilterOptions() {
    try {
      const response = await fetch(`${this.baseURL}/filters/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const options = await response.json();
      
      return {
        success: true,
        data: options
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch filter options',
        data: {
          job_types: [],
          companies: [],
          locations: [],
          cities: [],
          states: [],
          countries: [],
          categories: [],
          tags: [],
          remote_options: [],
          search_available: false
        }
      };
    }
  }

  // Fetch a single job by ID
  async fetchJobById(jobId: string) {
    try {
      const response = await fetch(`${this.baseURL}/${jobId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const job = await response.json();
      
      return {
        success: true,
        data: job
      };
    } catch (error) {
      console.error('Error fetching job:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job',
        data: null
      };
    }
  }
}

// Create a singleton instance
const jobsApiService = new JobsApiService();

export default jobsApiService;
export type { Job, SearchParams };