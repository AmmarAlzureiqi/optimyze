import React from 'react';
import { jobs, jobApplications, networkContacts, analyticsData } from '../utils/mockData';
import JobCard from '../components/JobCard';
import { BarChartIcon, BriefcaseIcon, ClipboardListIcon, UserIcon, TrendingUpIcon } from 'lucide-react';
const Dashboard = () => {
  // Get recommended jobs (just using the first few jobs from mock data)
  const recommendedJobs = jobs.slice(0, 3);
  // Get application stats
  const applicationStats = {
    total: jobApplications.length,
    interviews: jobApplications.filter(app => app.status === 'Interview').length,
    offers: jobApplications.filter(app => app.status === 'Offer').length,
    saved: jobApplications.filter(app => app.status === 'Saved').length
  };
  return <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's an overview of your job search.
        </p>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <BriefcaseIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Applications
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {applicationStats.total}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <ClipboardListIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Interviews</p>
              <p className="text-2xl font-semibold text-gray-900">
                {applicationStats.interviews}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <TrendingUpIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Offers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {applicationStats.offers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <UserIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Network Contacts
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {networkContacts.length}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* AI Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            AI Job Recommendations
          </h2>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Based on your profile and preferences, we recommend these jobs:
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recommendedJobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      </div>
      {/* Network Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recommended Connections
          </h2>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          AI-suggested people who might help with your job search:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networkContacts.map(contact => <div key={contact.id} className="border border-gray-200 rounded-lg p-4 flex items-start">
              <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover mr-4" />
              <div>
                <h3 className="font-medium text-gray-900">{contact.name}</h3>
                <p className="text-gray-600 text-sm">{contact.position}</p>
                <p className="text-gray-600 text-sm">{contact.company}</p>
                <div className="mt-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {contact.connectionType}
                  </span>
                </div>
              </div>
            </div>)}
        </div>
      </div>
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Activity
          </h2>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <p className="font-medium text-gray-900">Interview scheduled</p>
            <p className="text-gray-600">
              TechCorp - Senior Frontend Developer
            </p>
            <p className="text-sm text-gray-500">June 20, 2023 at 2:00 PM</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-medium text-gray-900">Application submitted</p>
            <p className="text-gray-600">DataInsight - Data Scientist</p>
            <p className="text-sm text-gray-500">June 21, 2023</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <p className="font-medium text-gray-900">New connection</p>
            <p className="text-gray-600">
              Connected with Sarah Johnson on LinkedIn
            </p>
            <p className="text-sm text-gray-500">June 18, 2023</p>
          </div>
        </div>
      </div>
    </div>;
};
export default Dashboard;