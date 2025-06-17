import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import Dashboard from './pages/Dashboard';
import JobSearch from './pages/JobSearch';
import PublicJobSearch from './pages/PublicJobSearch';
import Profile from './pages/Profile';
import ResumeBuilder from './pages/ResumeBuilder';
import JobTracker from './pages/JobTracker';
import Analytics from './pages/Analytics';
import UnderDevelopment from './components/UnderDevelopment';
import Login from './pages/Login';
import Register from './pages/Register';

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<PublicJobSearch />} />
          <Route path="jobs" element={<PublicJobSearch />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          {/* Redirect all other routes to public job search */}
          <Route path="*" element={<PublicJobSearch />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="jobs" element={<JobSearch />} />
        <Route path="profile" element={<Profile />} />
        <Route path="resume-builder" element={<UnderDevelopment />} />
        <Route path="job-tracker" element={<UnderDevelopment />} />
        <Route path="analytics" element={<UnderDevelopment />} />
      </Route>
    </Routes>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}