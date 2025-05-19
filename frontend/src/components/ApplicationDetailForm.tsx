import React from 'react';
import { JobApplication } from '../utils/mockData';
import { FileTextIcon, LinkIcon, MapPinIcon, CalendarIcon, UserIcon, MessageSquareIcon } from 'lucide-react';
interface ApplicationDetailFormProps {
  application: JobApplication;
  onUpdate: (application: JobApplication) => void;
}
const ApplicationDetailForm = ({
  application,
  onUpdate
}: ApplicationDetailFormProps) => {
  return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Position
          </label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={application.position} onChange={e => onUpdate({
          ...application,
          position: e.target.value
        })} />
        </div>
        {/* Apply Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Apply Date
          </label>
          <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={application.applyDate} onChange={e => onUpdate({
          ...application,
          applyDate: e.target.value
        })} />
        </div>
        {/* Resume */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Resume
          </label>
          <div className="mt-1 flex items-center space-x-2">
            <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <input type="checkbox" checked={application.resume.isTailored} onChange={e => onUpdate({
            ...application,
            resume: {
              ...application.resume,
              isTailored: e.target.checked
            }
          })} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-500">Tailored</span>
          </div>
        </div>
        {/* Cover Letter */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cover Letter
          </label>
          <div className="mt-1 flex items-center space-x-2">
            <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <input type="checkbox" checked={application.coverLetter.isTailored} onChange={e => onUpdate({
            ...application,
            coverLetter: {
              ...application.coverLetter,
              isTailored: e.target.checked
            }
          })} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-500">Tailored</span>
          </div>
        </div>
        {/* Application Site */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Application Site
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={application.applicationSite} onChange={e => onUpdate({
            ...application,
            applicationSite: e.target.value
          })} />
          </div>
        </div>
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={application.location} onChange={e => onUpdate({
            ...application,
            location: e.target.value
          })} />
          </div>
        </div>
        {/* Referral Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Referral Status
          </label>
          <div className="mt-1 flex items-center space-x-2">
            <input type="checkbox" checked={application.referralStatus} onChange={e => onUpdate({
            ...application,
            referralStatus: e.target.checked
          })} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-500">Has Referral</span>
          </div>
        </div>
        {/* Response Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Response Date
          </label>
          <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={application.responseDate || ''} onChange={e => onUpdate({
          ...application,
          responseDate: e.target.value
        })} />
        </div>
        {/* Stage */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stage
          </label>
          <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={application.stage} onChange={e => onUpdate({
          ...application,
          stage: e.target.value
        })}>
            <option value="Applied">Applied</option>
            <option value="Phone Screen">Phone Screen</option>
            <option value="Technical Interview">Technical Interview</option>
            <option value="Onsite">Onsite</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        {/* Connections Sent */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Connections Sent
          </label>
          <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={application.connectionsSent} onChange={e => onUpdate({
          ...application,
          connectionsSent: parseInt(e.target.value)
        })} />
        </div>
      </div>
      {/* Job Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Job Description
        </label>
        <textarea rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={application.jobDescription} onChange={e => onUpdate({
        ...application,
        jobDescription: e.target.value
      })} />
      </div>
      {/* AI Generated Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          AI Generated Text
        </label>
        <textarea rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={application.aiGeneratedText || ''} onChange={e => onUpdate({
        ...application,
        aiGeneratedText: e.target.value
      })} />
      </div>
      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={application.notes} onChange={e => onUpdate({
        ...application,
        notes: e.target.value
      })} />
      </div>
    </div>;
};
export default ApplicationDetailForm;