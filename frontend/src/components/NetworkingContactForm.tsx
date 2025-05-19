import React from 'react';
import { NetworkContact } from '../utils/mockData';
import { UserIcon, BuildingIcon, LinkedinIcon, MessageSquareIcon, CheckIcon, BriefcaseIcon } from 'lucide-react';
interface NetworkingContactFormProps {
  contact: NetworkContact;
  onUpdate: (contact: NetworkContact) => void;
}
const NetworkingContactForm = ({
  contact,
  onUpdate
}: NetworkingContactFormProps) => {
  return <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={contact.name} onChange={e => onUpdate({
          ...contact,
          name: e.target.value
        })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Position
          </label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={contact.position} onChange={e => onUpdate({
          ...contact,
          position: e.target.value
        })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Company
          </label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={contact.company} onChange={e => onUpdate({
          ...contact,
          company: e.target.value
        })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            LinkedIn URL
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkedinIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={contact.linkedinUrl} onChange={e => onUpdate({
            ...contact,
            linkedinUrl: e.target.value
          })} />
          </div>
        </div>
        {/* Connection Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Connection Status
          </label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={contact.connectionSent} onChange={e => onUpdate({
              ...contact,
              connectionSent: e.target.checked
            })} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Connection Sent</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={contact.connectionAccepted} onChange={e => onUpdate({
              ...contact,
              connectionAccepted: e.target.checked
            })} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Connection Accepted</span>
            </div>
          </div>
        </div>
        {/* Referral Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Referral Status
          </label>
          <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={contact.referralStatus} onChange={e => onUpdate({
          ...contact,
          referralStatus: e.target.value as NetworkContact['referralStatus']
        })}>
            <option value="None">None</option>
            <option value="Requested">Requested</option>
            <option value="Received">Received</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
        {/* Interaction Metrics */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total DMs Sent
          </label>
          <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={contact.totalDMSent} onChange={e => onUpdate({
          ...contact,
          totalDMSent: parseInt(e.target.value)
        })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Replies
          </label>
          <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={contact.totalReplies} onChange={e => onUpdate({
          ...contact,
          totalReplies: parseInt(e.target.value)
        })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Referrals
          </label>
          <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={contact.totalReferrals} onChange={e => onUpdate({
          ...contact,
          totalReferrals: parseInt(e.target.value)
        })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Jobs Applied Through Contact
          </label>
          <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={contact.jobsApplied} onChange={e => onUpdate({
          ...contact,
          jobsApplied: parseInt(e.target.value)
        })} />
        </div>
      </div>
      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" value={contact.notes} onChange={e => onUpdate({
        ...contact,
        notes: e.target.value
      })} />
      </div>
    </div>;
};
export default NetworkingContactForm;