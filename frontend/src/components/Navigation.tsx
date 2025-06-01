import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboardIcon, BriefcaseIcon, UserIcon, FileTextIcon, ClipboardListIcon, BarChartIcon, MenuIcon, XIcon } from 'lucide-react';
const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navItems = [{
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboardIcon className="w-5 h-5" />
  }, {
    name: 'Job Search',
    path: '/jobs',
    icon: <BriefcaseIcon className="w-5 h-5" />
  }, {
    name: 'Profile',
    path: '/profile',
    icon: <UserIcon className="w-5 h-5" />
  }, {
    name: 'Resume Builder',
    path: '/resume-builder',
    icon: <FileTextIcon className="w-5 h-5" />
  }, {
    name: 'Job Tracker',
    path: '/job-tracker',
    icon: <ClipboardListIcon className="w-5 h-5" />
  }, {
    name: 'Analytics',
    path: '/analytics',
    icon: <BarChartIcon className="w-5 h-5" />
  }];
  return <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BriefcaseIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                optimyze
              </span>
            </Link>
          </div>
          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map(item => <Link key={item.name} to={item.path} className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${location.pathname === item.path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'}`}>
                {item.icon}
                <span className="ml-1">{item.name}</span>
              </Link>)}
          </nav>
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button type="button" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100" aria-controls="mobile-menu" aria-expanded="false" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <XIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && <div className="md:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map(item => <Link key={item.name} to={item.path} className={`flex items-center px-3 py-2 text-base font-medium ${location.pathname === item.path ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:border-l-4 hover:border-gray-300'}`} onClick={() => setMobileMenuOpen(false)}>
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>)}
          </div>
        </div>}
    </header>;
};
export default Navigation;