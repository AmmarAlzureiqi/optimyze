import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import JobSearch from './pages/JobSearch';
import Profile from './pages/Profile';
import ResumeBuilder from './pages/ResumeBuilder';
import JobTracker from './pages/JobTracker';
import Analytics from './pages/Analytics';
import UnderDevelopment from './components/UnderDevelopment'

export function App() {
  return <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="jobs" element={<JobSearch />} />
          <Route path="profile" element={<Profile />} />
          {/* <Route path="resume-builder" element={<ResumeBuilder />} /> */}
          <Route path="resume-builder" element={<UnderDevelopment />} />
          {/* <Route path="job-tracker" element={<JobTracker />} /> */}
          <Route path="job-tracker" element={<UnderDevelopment />} />
          {/* <Route path="analytics" element={<Analytics />} /> */}
          <Route path="analytics" element={<UnderDevelopment />} />
        </Route>
      </Routes>
    </BrowserRouter>;
}