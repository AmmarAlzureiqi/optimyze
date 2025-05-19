import React from 'react';
import { userProfile } from '../utils/mockData';
import { PencilIcon, DownloadIcon, PlusIcon } from 'lucide-react';
const Profile = () => {
  return <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your professional information
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download Resume
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </div>
      {/* Basic Info */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                {userProfile.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {userProfile.name}
                </h2>
                <p className="text-gray-600">{userProfile.title}</p>
                <p className="text-gray-600">{userProfile.location}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-500">
              <PencilIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-gray-900">{userProfile.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="mt-1 text-gray-900">{userProfile.phone}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Summary */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Professional Summary
            </h2>
            <button className="text-gray-400 hover:text-gray-500">
              <PencilIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700">{userProfile.summary}</p>
        </div>
      </div>
      {/* Skills */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Skills</h2>
            <button className="text-gray-400 hover:text-gray-500">
              <PencilIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {userProfile.skills.map((skill, index) => <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {skill}
              </span>)}
            <button className="border border-dashed border-gray-300 text-gray-500 text-sm px-3 py-1 rounded-full flex items-center hover:bg-gray-50">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Skill
            </button>
          </div>
        </div>
      </div>
      {/* Experience */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Experience</h2>
            <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {userProfile.experience.map((exp, index) => <div key={index} className="p-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {exp.title}
                  </h3>
                  <p className="text-gray-600">
                    {exp.company} • {exp.location}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {exp.startDate} - {exp.endDate}
                  </p>
                </div>
                <button className="text-gray-400 hover:text-gray-500">
                  <PencilIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-gray-700">{exp.description}</p>
            </div>)}
        </div>
      </div>
      {/* Education */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Education</h2>
            <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {userProfile.education.map((edu, index) => <div key={index} className="p-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {edu.degree}
                  </h3>
                  <p className="text-gray-600">
                    {edu.institution} • {edu.location}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Graduated: {edu.graduationDate}
                  </p>
                </div>
                <button className="text-gray-400 hover:text-gray-500">
                  <PencilIcon className="h-5 w-5" />
                </button>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default Profile;