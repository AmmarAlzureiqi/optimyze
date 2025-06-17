// pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PencilIcon, DownloadIcon, PlusIcon } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile: {
    phone: string;
    title: string;
    city: string;
    state: string;
    country: string;
    professional_summary: string;
    skills: string[];
    experience: any[];
    education: any[];
    linkedin_url: string;
    github_url: string;
    portfolio_url: string;
  };
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile) {
    return <div>No profile data available</div>;
  }

  const getInitials = () => {
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    return profile.username[0].toUpperCase();
  };

  const getDisplayName = () => {
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return profile.username;
  };

  const getLocation = () => {
    const parts = [profile.profile?.city, profile.profile?.state, profile.profile?.country];
    return parts.filter(Boolean).join(', ') || 'Location not specified';
  };

  return (
    <div className="space-y-8">
      {/* Rest of your component using the real profile data */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your professional information
          </p>
        </div>
        {/* Action buttons */}
      </div>

      {/* Basic Info */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                {getInitials()}
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {getDisplayName()}
                </h2>
                <p className="text-gray-600">{profile.profile?.title || 'Job title not specified'}</p>
                <p className="text-gray-600">{getLocation()}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-500">
              <PencilIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-gray-900">{profile.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <p className="mt-1 text-gray-900">{profile.profile?.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
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
          <p className="text-gray-700">
            {profile.profile?.professional_summary || 'Add a professional summary to showcase your experience and goals.'}
          </p>
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
            {profile.profile?.skills?.map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {skill}
              </span>
            ))}
            <button className="border border-dashed border-gray-300 text-gray-500 text-sm px-3 py-1 rounded-full flex items-center hover:bg-gray-50">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Skill
            </button>
          </div>
        </div>
      </div>

      {/* Experience and Education sections would follow similar pattern */}
    </div>
  );
};

export default Profile;