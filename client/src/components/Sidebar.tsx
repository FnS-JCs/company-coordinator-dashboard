import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  onCreateCompany?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCreateCompany }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [toolsOpen, setToolsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 bg-white dark:bg-gray-900 text-grey-900 dark:text-white flex flex-col h-full border-r border-grey-200 dark:border-gray-700">
      <div className="p-4 border-b border-grey-200 dark:border-gray-700">
        <h1 className="text-lg font-bold text-navy dark:text-white">SRCC Placement Cell</h1>
        <p className="text-xs text-grey-500 dark:text-gray-400 mt-1">Company Coordinator</p>
      </div>

      <div className="p-4 border-b border-grey-200 dark:border-gray-700">
        <p className="text-sm font-medium">{user?.name || 'User'}</p>
        <p className="text-xs text-grey-500 dark:text-gray-400 capitalize">
          {user?.role?.replace('_', ' ') || 'Unknown'}
        </p>
        <p className="text-xs text-grey-500 dark:text-gray-400 truncate">{user?.email || ''}</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-2">
          <Link
            to="/dashboard"
            className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-grey-100 dark:bg-gray-700 text-navy dark:text-white'
                : 'text-grey-600 dark:text-gray-400 hover:bg-grey-50 dark:hover:bg-gray-700 hover:text-navy dark:hover:text-white'
            }`}
          >
            My Companies
          </Link>

          {user?.role === 'senior_coordinator' && (
            <button
              onClick={onCreateCompany}
              className="w-full text-left px-4 py-2 mt-2 rounded-lg text-sm font-medium bg-navy dark:bg-gray-700 text-white dark:text-gray-100 hover:bg-navy-light dark:hover:bg-gray-600 transition-colors"
            >
              + Create Company
            </button>
          )}

          <div className="mt-6">
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className="w-full flex justify-between items-center px-4 py-2 text-sm font-medium text-grey-600 dark:text-gray-400 hover:text-navy dark:hover:text-white transition-colors"
            >
              <span>Tools</span>
              <svg
                className={`w-4 h-4 transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {toolsOpen && (
              <div className="mt-2 space-y-1">
                <Link
                  to="/tools/cv-sorter"
                  className={`block px-6 py-2 text-sm transition-colors ${
                    isActive('/tools/cv-sorter') ? 'text-navy dark:text-white font-medium' : 'text-grey-600 dark:text-gray-400 hover:text-navy dark:hover:text-white'
                  }`}
                >
                  CV Sorter
                </Link>
                <Link
                  to="/tools/vcf-generator"
                  className={`block px-6 py-2 text-sm transition-colors ${
                    isActive('/tools/vcf-generator') ? 'text-navy dark:text-white font-medium' : 'text-grey-600 dark:text-gray-400 hover:text-navy dark:hover:text-white'
                  }`}
                >
                  VCF Generator
                </Link>
                <Link
                  to="/tools/excel-formatter"
                  className={`block px-6 py-2 text-sm transition-colors ${
                    isActive('/tools/excel-formatter') ? 'text-navy dark:text-white font-medium' : 'text-grey-600 dark:text-gray-400 hover:text-navy dark:hover:text-white'
                  }`}
                >
                  Excel Auto-formatter
                </Link>
                <Link
                  to="/tools/tool-four"
                  className={`block px-6 py-2 text-sm transition-colors ${
                    isActive('/tools/tool-four') ? 'text-navy dark:text-white font-medium' : 'text-grey-600 dark:text-gray-400 hover:text-navy dark:hover:text-white'
                  }`}
                >
                  Tool 4
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-grey-200 dark:border-gray-700 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-grey-600 dark:text-gray-400 hover:bg-grey-50 dark:hover:bg-gray-700 hover:text-navy dark:hover:text-white transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-sm font-medium text-grey-600 dark:text-gray-400 hover:bg-grey-50 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors text-left flex items-center gap-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
};
