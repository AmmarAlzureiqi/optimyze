import React, { useState } from 'react';
import { jobApplications, jobs, networkContacts } from '../utils/mockData';
import { PlusIcon, ChevronDownIcon, MessageSquareIcon, CalendarIcon, CheckIcon, XIcon } from 'lucide-react';
import ApplicationModal from '../components/ApplicationModal';
import NetworkingContactModal from '../components/NetworkingContactModal';
const JobTracker = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | undefined>();
  const [selectedContact, setSelectedContact] = useState<NetworkContact | undefined>();
  // Combine job application data with job details
  const applicationData = jobApplications.map(app => {
    const jobDetails = jobs.find(job => job.id === app.jobId);
    return {
      ...app,
      job: jobDetails
    };
  });
  // Group applications by status
  const applicationsByStatus = {
    Applied: applicationData.filter(app => app.status === 'Applied'),
    Interview: applicationData.filter(app => app.status === 'Interview'),
    Offer: applicationData.filter(app => app.status === 'Offer'),
    Rejected: applicationData.filter(app => app.status === 'Rejected'),
    Saved: applicationData.filter(app => app.status === 'Saved')
  };
  const handleSaveApplication = (application: JobApplication) => {
    // In a real app, this would update the backend
    console.log('Saving application:', application);
    setIsApplicationModalOpen(false);
    setSelectedApplication(undefined);
  };
  const handleSaveContact = (contact: NetworkContact) => {
    // In a real app, this would update the backend
    console.log('Saving contact:', contact);
    setIsContactModalOpen(false);
    setSelectedContact(undefined);
  };
  const openApplicationModal = (application?: JobApplication) => {
    setSelectedApplication(application);
    setIsApplicationModalOpen(true);
  };
  const openContactModal = (contact?: NetworkContact) => {
    setSelectedContact(contact);
    setIsContactModalOpen(true);
  };
  return <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Tracker</h1>
          <p className="text-gray-600 mt-2">
            Track your applications and networking activities
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" onClick={() => openApplicationModal()}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Application
          </button>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('applications')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'applications' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Applications
          </button>
          <button onClick={() => setActiveTab('networking')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'networking' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Networking
          </button>
        </nav>
      </div>
      {/* Applications Tab */}
      {activeTab === 'applications' && <div className="space-y-6">
          {/* Status columns */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Applied */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">Applied</h3>
                <div className="mt-1 text-sm text-gray-500">
                  {applicationsByStatus.Applied.length} applications
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {applicationsByStatus.Applied.length > 0 ? applicationsByStatus.Applied.map(app => <div key={app.id} className="bg-white border rounded-md p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openApplicationModal(app)}>
                      <h4 className="font-medium text-gray-900">
                        {app.job?.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {app.job?.company}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {app.dateApplied}
                      </p>
                    </div>) : <p className="text-sm text-gray-500 text-center py-4">
                    No applications
                  </p>}
                <button className="w-full py-2 flex justify-center items-center text-sm text-gray-500 hover:bg-gray-50 rounded-md">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add application
                </button>
              </div>
            </div>
            {/* Interview */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 bg-blue-50">
                <h3 className="text-sm font-medium text-blue-900">Interview</h3>
                <div className="mt-1 text-sm text-blue-700">
                  {applicationsByStatus.Interview.length} applications
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {applicationsByStatus.Interview.length > 0 ? applicationsByStatus.Interview.map(app => <div key={app.id} className="bg-white border rounded-md p-3 hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-gray-900">
                        {app.job?.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {app.job?.company}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {app.dateApplied}
                      </p>
                      <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {app.notes}
                      </div>
                    </div>) : <p className="text-sm text-gray-500 text-center py-4">
                    No interviews
                  </p>}
                <button className="w-full py-2 flex justify-center items-center text-sm text-gray-500 hover:bg-gray-50 rounded-md">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add interview
                </button>
              </div>
            </div>
            {/* Offer */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 bg-green-50">
                <h3 className="text-sm font-medium text-green-900">Offer</h3>
                <div className="mt-1 text-sm text-green-700">
                  {applicationsByStatus.Offer.length} applications
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {applicationsByStatus.Offer.length > 0 ? applicationsByStatus.Offer.map(app => <div key={app.id} className="bg-white border rounded-md p-3 hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-gray-900">
                        {app.job?.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {app.job?.company}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {app.dateApplied}
                      </p>
                    </div>) : <p className="text-sm text-gray-500 text-center py-4">
                    No offers yet
                  </p>}
                <button className="w-full py-2 flex justify-center items-center text-sm text-gray-500 hover:bg-gray-50 rounded-md">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add offer
                </button>
              </div>
            </div>
            {/* Rejected */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 bg-red-50">
                <h3 className="text-sm font-medium text-red-900">Rejected</h3>
                <div className="mt-1 text-sm text-red-700">
                  {applicationsByStatus.Rejected.length} applications
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {applicationsByStatus.Rejected.length > 0 ? applicationsByStatus.Rejected.map(app => <div key={app.id} className="bg-white border rounded-md p-3 hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-gray-900">
                        {app.job?.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {app.job?.company}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {app.dateApplied}
                      </p>
                    </div>) : <p className="text-sm text-gray-500 text-center py-4">
                    No rejections
                  </p>}
              </div>
            </div>
            {/* Saved */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 bg-purple-50">
                <h3 className="text-sm font-medium text-purple-900">Saved</h3>
                <div className="mt-1 text-sm text-purple-700">
                  {applicationsByStatus.Saved.length} applications
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {applicationsByStatus.Saved.length > 0 ? applicationsByStatus.Saved.map(app => <div key={app.id} className="bg-white border rounded-md p-3 hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-gray-900">
                        {app.job?.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {app.job?.company}
                      </p>
                      <div className="mt-2 flex justify-between">
                        <button className="text-xs text-blue-600 hover:text-blue-800">
                          Apply Now
                        </button>
                        <button className="text-xs text-gray-500 hover:text-gray-700">
                          Remove
                        </button>
                      </div>
                    </div>) : <p className="text-sm text-gray-500 text-center py-4">
                    No saved jobs
                  </p>}
              </div>
            </div>
          </div>
          {/* Activity Timeline */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-6">
                <li className="relative flex gap-x-4">
                  <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                    <div className="w-px bg-gray-200"></div>
                  </div>
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300"></div>
                  </div>
                  <p className="flex-auto py-0.5 text-sm leading-5 text-gray-500">
                    <span className="font-medium text-gray-900">
                      Application submitted
                    </span>{' '}
                    for
                    <span className="font-medium text-gray-900">
                      {' '}
                      Senior Frontend Developer
                    </span>{' '}
                    at TechCorp
                  </p>
                  <time className="flex-none py-0.5 text-sm leading-5 text-gray-500">
                    2d ago
                  </time>
                </li>
                <li className="relative flex gap-x-4">
                  <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                    <div className="w-px bg-gray-200"></div>
                  </div>
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300"></div>
                  </div>
                  <p className="flex-auto py-0.5 text-sm leading-5 text-gray-500">
                    <span className="font-medium text-gray-900">
                      Phone interview scheduled
                    </span>{' '}
                    for
                    <span className="font-medium text-gray-900">
                      {' '}
                      Senior Frontend Developer
                    </span>{' '}
                    at TechCorp
                  </p>
                  <time className="flex-none py-0.5 text-sm leading-5 text-gray-500">
                    1d ago
                  </time>
                </li>
                <li className="relative flex gap-x-4">
                  <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                    <div className="w-px bg-gray-200"></div>
                  </div>
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300"></div>
                  </div>
                  <p className="flex-auto py-0.5 text-sm leading-5 text-gray-500">
                    <span className="font-medium text-gray-900">
                      You sent a follow-up email
                    </span>{' '}
                    to Sarah Johnson at TechCorp
                  </p>
                  <time className="flex-none py-0.5 text-sm leading-5 text-gray-500">
                    1d ago
                  </time>
                </li>
                <li className="relative flex gap-x-4">
                  <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300"></div>
                  </div>
                  <p className="flex-auto py-0.5 text-sm leading-5 text-gray-500">
                    <span className="font-medium text-gray-900">
                      Application submitted
                    </span>{' '}
                    for
                    <span className="font-medium text-gray-900">
                      {' '}
                      Data Scientist
                    </span>{' '}
                    at DataInsight
                  </p>
                  <time className="flex-none py-0.5 text-sm leading-5 text-gray-500">
                    3h ago
                  </time>
                </li>
              </ul>
            </div>
          </div>
        </div>}
      {/* Networking Tab */}
      {activeTab === 'networking' && <div className="space-y-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">My Network</h3>
              <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50" onClick={() => openContactModal()}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Contact
              </button>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {networkContacts.map(contact => <tr key={contact.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openContactModal(contact)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={contact.avatar} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.position}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.company}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {contact.connectionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <MessageSquareIcon className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <CalendarIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Networking Tasks
              </h3>
            </div>
            <div className="p-6">
              <ul className="divide-y divide-gray-200">
                <li className="py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="task-1" name="task-1" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="task-1" className="ml-3 block text-gray-900">
                      <span className="font-medium">
                        Follow up with Sarah Johnson
                      </span>
                      <span className="text-gray-500 text-sm block">
                        Send a thank you email after the informational interview
                      </span>
                    </label>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="text-sm text-gray-500">Due today</span>
                  </div>
                </li>
                <li className="py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="task-2" name="task-2" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="task-2" className="ml-3 block text-gray-900">
                      <span className="font-medium">
                        Connect with Michael Chen on LinkedIn
                      </span>
                      <span className="text-gray-500 text-sm block">
                        Send a personalized connection request
                      </span>
                    </label>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="text-sm text-gray-500">Due tomorrow</span>
                  </div>
                </li>
                <li className="py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="task-3" name="task-3" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="task-3" className="ml-3 block text-gray-900">
                      <span className="font-medium">
                        Schedule coffee chat with Emily Rodriguez
                      </span>
                      <span className="text-gray-500 text-sm block">
                        Discuss potential referral opportunities at DataInsight
                      </span>
                    </label>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="text-sm text-gray-500">Due in 3 days</span>
                  </div>
                </li>
              </ul>
              <div className="mt-4">
                <button className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add networking task
                </button>
              </div>
            </div>
          </div>
        </div>}
      {/* Add modal components */}
      <ApplicationModal isOpen={isApplicationModalOpen} onClose={() => setIsApplicationModalOpen(false)} application={selectedApplication} onSave={handleSaveApplication} />
      <NetworkingContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} contact={selectedContact} onSave={handleSaveContact} />
    </div>;
};
export default JobTracker;