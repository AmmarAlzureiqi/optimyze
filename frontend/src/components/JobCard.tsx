import React from 'react';
import { Job } from '../utils/mockData';
import { BookmarkIcon, ExternalLinkIcon, MapPinIcon, BriefcaseIcon, CalendarIcon } from 'lucide-react';
interface JobCardProps {
  job: Job;
  saved?: boolean;
  onSave?: () => void;
}
const JobCard = ({
  job,
  saved = false,
  onSave
}: JobCardProps) => {
  return <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <img src={job.logo} alt={`${job.company} logo`} className="w-12 h-12 rounded-md object-cover mr-4" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
            <p className="text-gray-600">{job.company}</p>
          </div>
        </div>
        <button onClick={onSave} className={`p-2 rounded-full ${saved ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}>
          <BookmarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex items-center text-sm text-gray-500">
          <MapPinIcon className="w-4 h-4 mr-1" />
          {job.location}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <BriefcaseIcon className="w-4 h-4 mr-1" />
          {job.type}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="w-4 h-4 mr-1" />
          Posted {job.posted}
        </div>
      </div>
      <p className="mt-3 text-gray-600 line-clamp-2">{job.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {job.requirements.slice(0, 2).map((req, index) => <span key={index} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
            {req}
          </span>)}
        {job.requirements.length > 2 && <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
            +{job.requirements.length - 2} more
          </span>}
      </div>
      <div className="mt-5 flex justify-between items-center">
        <span className="font-medium text-gray-900">{job.salary}</span>
        <button className="flex items-center text-blue-600 hover:text-blue-800">
          View Details
          <ExternalLinkIcon className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>;
};
export default JobCard;