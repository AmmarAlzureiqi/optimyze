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
  // Safe access to job properties with fallbacks
  const {
    title = 'No title',
    company = 'Unknown company',
    location = 'Location not specified',
    type = 'Not specified',
    description = 'No description available',
    salary = 'Salary not specified',
    url,
    logo,
    logo_photo_url, // From Indeed via JobSpy
    company_logo,   // From Naukri via JobSpy
    posted,
    requirements = [],
    daysAgo,
    source
  } = job || {};

  // Generate a logo URL - prioritize real logos from JobSpy
  const hasRealLogo = logo_photo_url || company_logo || logo;
  
  // Function to generate initials
  const getCompanyInitials = (companyName: string) => {
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
  
  // Use posted or daysAgo, whichever is available
  const postedText = posted || daysAgo || 'Recently posted';
  
  // Ensure requirements is an array and has safe slice operation
  const safeRequirements = Array.isArray(requirements) ? requirements : [];

  const handleViewDetails = () => {
    if (url) {
      window.open(url, '_blank');
    }
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
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
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
            <BookmarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex items-center text-sm text-gray-500">
          <MapPinIcon className="w-4 h-4 mr-1" />
          {location}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <BriefcaseIcon className="w-4 h-4 mr-1" />
          {type}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="w-4 h-4 mr-1" />
          Posted {postedText}
        </div>
        {source && (
          <div className="flex items-center text-sm text-gray-500">
            <span>via {source}</span>
          </div>
        )}
      </div>
      
      <p className="mt-3 text-gray-600 line-clamp-2">{description}</p>
      
      {/* Requirements section - only show if we have requirements */}
      {safeRequirements.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {safeRequirements.slice(0, 2).map((req, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
              {req}
            </span>
          ))}
          {safeRequirements.length > 2 && (
            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
              +{safeRequirements.length - 2} more
            </span>
          )}
        </div>
      )}
      
      <div className="mt-5 flex justify-between items-center">
        <span className="font-medium text-gray-900">{salary}</span>
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