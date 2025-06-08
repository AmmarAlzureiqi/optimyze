import React from 'react';
import { BookmarkIcon, ExternalLinkIcon, MapPinIcon, BriefcaseIcon, CalendarIcon } from 'lucide-react';

interface JobCardProps {
  job: any; // More flexible type to handle both mock and API data
  saved?: boolean;
  onSave?: () => void;
}

const JobCard = ({
  job,
  saved = false,
  onSave
}: JobCardProps) => {
  // Safe access to job properties with fallbacks - updated for Django API
  const {
    // Django API fields
    title = 'No title',
    company = 'Unknown company',
    location = 'Location not specified',
    job_type = 'Not specified',
    description = 'No description available',
    salary_min,
    salary_max,
    salary_disclosed = true,
    url,
    posted_date,
    is_remote,
    city,
    state,
    country,
    source,
    categories = [],
    tags = [],
    
    // Fallback to original mock data fields
    type = job_type,
    salary = formatSalaryFromApi(),
    logo,
    logo_photo_url, // From Indeed via JobSpy
    company_logo,   // From Naukri via JobSpy
    posted,
    requirements = [],
    daysAgo
  } = job || {};

  // Format salary from Django API fields
  function formatSalaryFromApi(): string {
    if (!salary_disclosed) return 'Salary not disclosed';
    if (!salary_min && !salary_max) return 'Salary not specified';
    
    const formatNumber = (num: number): string => {
      if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
      return `$${num.toLocaleString()}`;
    };
    
    if (salary_min && salary_max) {
      return `${formatNumber(salary_min)} - ${formatNumber(salary_max)}`;
    } else if (salary_min) {
      return `${formatNumber(salary_min)}+`;
    } else if (salary_max) {
      return `Up to ${formatNumber(salary_max)}`;
    }
    
    return 'Salary not specified';
  }

  // Get location display with Django API fields
  const getLocationDisplay = () => {
    if (is_remote) {
      return location ? `${location} (Remote)` : 'Remote';
    }
    
    // Build location string from available parts
    const locationParts = [];
    if (city) locationParts.push(city);
    if (state) locationParts.push(state);
    if (country && country !== 'US') locationParts.push(country);
    
    return locationParts.length > 0 ? locationParts.join(', ') : location || 'Location not specified';
  };

  // Generate a logo URL - prioritize real logos from JobSpy
  const hasRealLogo = logo_photo_url || company_logo || logo;
  
  // Function to generate initials
  const getCompanyInitials = (companyName) => {
    if (!companyName) return 'C';
    return companyName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Function to get consistent background color
  const getBackgroundColor = (companyName: string) => {
    if (!companyName) return 'bg-gray-500';
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
      'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500'
    ];
    let hash = 0;
    for (let i = 0; i < companyName.length; i++) {
      hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getCompanyInitials(company);
  const bgColor = getBackgroundColor(company);
  
  // Calculate precise posting time - updated for Django API
  const getPostedTime = () => {
    // First check Django API posted_date field
    if (posted_date) {
      const postedDate = new Date(posted_date);
      const now = new Date();
      const diffMs = now - postedDate;
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const diffWeeks = diffDays / 7;

      if (diffHours < 1) {
        return 'Just posted';
      } else if (diffHours < 24) {
        // Show hours with 1 decimal place
        return `${diffHours.toFixed(1)} hours ago`;
      } else if (diffDays < 7) {
        // Show days
        const days = Math.floor(diffDays);
        return days === 1 ? '1 day ago' : `${days} days ago`;
      } else if (diffWeeks < 4) {
        // Show weeks
        const weeks = Math.floor(diffWeeks);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      } else {
        // Show months for very old posts
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
      }
    }
    
    // Fallback: check if we have a specific posted date from mock data
    if (job.postedDate) {
      const postedDate = new Date(job.postedDate);
      const now = new Date();
      const diffMs = now - postedDate;
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const diffWeeks = diffDays / 7;

      if (diffHours < 24) {
        return `${diffHours.toFixed(1)} hours ago`;
      } else if (diffDays < 7) {
        const days = Math.floor(diffDays);
        return days === 1 ? '1 day ago' : `${days} days ago`;
      } else if (diffWeeks < 4) {
        const weeks = Math.floor(diffWeeks);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      } else {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
      }
    }
    
    // Fallback: parse the daysAgo or posted text if available
    if (daysAgo && typeof daysAgo === 'string') {
      // Try to extract numbers from strings like "2 days ago", "5 hours ago", etc.
      const hourMatch = daysAgo.match(/(\d+\.?\d*)\s*hours?\s*ago/i);
      const dayMatch = daysAgo.match(/(\d+)\s*days?\s*ago/i);
      const weekMatch = daysAgo.match(/(\d+)\s*weeks?\s*ago/i);
      
      if (hourMatch) {
        const hours = parseFloat(hourMatch[1]);
        return `${hours.toFixed(1)} hours ago`;
      } else if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        return days === 1 ? '1 day ago' : `${days} days ago`;
      } else if (weekMatch) {
        const weeks = parseInt(weekMatch[1]);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      }
      
      // If it already says "today", convert to hours
      if (daysAgo.toLowerCase().includes('today')) {
        return '0.5 hours ago'; // Assume recent if just says "today"
      }
    }
    
    // Final fallback
    return posted || daysAgo || 'Recently posted';
  };

  const postedText = getPostedTime();
  
  // Combine requirements from mock data with categories/tags from Django API
  const getAllRequirements = () => {
    const reqs: string[] = [];
    
    // Add original requirements if they exist
    if (Array.isArray(requirements)) {
      reqs.push(...requirements);
    }
    
    // Add categories from Django API
    if (Array.isArray(categories)) {
      categories.forEach(cat => {
        const categoryName = typeof cat === 'object' ? cat.name : cat;
        if (categoryName && !reqs.includes(categoryName)) {
          reqs.push(categoryName);
        }
      });
    }
    
    // Add tags from Django API
    if (Array.isArray(tags)) {
      tags.slice(0, 3).forEach(tag => {
        const tagName = typeof tag === 'object' ? tag.name : tag;
        if (tagName && !reqs.includes(tagName)) {
          reqs.push(tagName);
        }
      });
    }
    
    return reqs;
  };

  const safeRequirements = getAllRequirements();

  const handleViewDetails = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Get source name for display
  const getSourceName = () => {
    if (source) {
      return typeof source === 'object' ? source.name : source;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          {hasRealLogo ? (
            <img 
              src={logo_photo_url || company_logo || logo} 
              alt={`${company} logo`} 
              className="w-12 h-12 rounded-md object-cover mr-4" 
              onError={(e) => {
                // Hide the image and show the fallback div
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          
          {/* Fallback logo div - always present but hidden if real logo exists */}
          <div 
            className={`w-12 h-12 rounded-md ${bgColor} text-white font-bold text-lg flex items-center justify-center mr-4`}
            style={{ display: hasRealLogo ? 'none' : 'flex' }}
          >
            {initials}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600">{company}</p>
          </div>
        </div>
        {onSave && (
          <button 
            onClick={onSave} 
            className={`p-2 rounded-full ${saved ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <BookmarkIcon className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex items-center text-sm text-gray-500">
          <MapPinIcon className="w-4 h-4 mr-1" />
          {getLocationDisplay()}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <BriefcaseIcon className="w-4 h-4 mr-1" />
          {job_type || type}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="w-4 h-4 mr-1" />
          Posted {postedText}
        </div>
        {getSourceName() && (
          <div className="flex items-center text-sm text-gray-500">
            <span>via {getSourceName()}</span>
          </div>
        )}
      </div>
      
      <p className="mt-3 text-gray-600 line-clamp-2">{description}</p>
      
      {/* Requirements/Categories/Tags section */}
      {safeRequirements.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {safeRequirements.slice(0, 3).map((req, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
              {req}
            </span>
          ))}
          {safeRequirements.length > 3 && (
            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
              +{safeRequirements.length - 3} more
            </span>
          )}
        </div>
      )}
      
      <div className="mt-5 flex justify-between items-center">
        <span className="font-medium text-gray-900">
          {formatSalaryFromApi()}
        </span>
        <button 
          onClick={handleViewDetails}
          disabled={!url}
          className={`flex items-center ${
            url 
              ? 'text-blue-600 hover:text-blue-800' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          {url ? 'View Details' : 'No Link Available'}
          <ExternalLinkIcon className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default JobCard;