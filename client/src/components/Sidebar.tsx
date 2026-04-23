import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  onCreateCompany?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCreateCompany }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-60 bg-navy text-white flex flex-col h-full">
      <div className="p-4 border-b border-navy-light">
        <h1 className="text-lg font-bold">SRCC Placement Cell</h1>
        <p className="text-xs text-grey-200 mt-1">Company Coordinator</p>
      </div>

      <div className="p-4 border-b border-navy-light">
        <p className="text-sm font-medium">{user?.name || 'User'}</p>
        <p className="text-xs text-grey-200 capitalize">
          {user?.role?.replace('_', ' ') || 'Unknown'}
        </p>
        <p className="text-xs text-grey-200 truncate">{user?.email || ''}</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-2">
          <Link
            to="/dashboard"
            className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard') ? 'bg-navy-light text-white' : 'text-grey-200 hover:bg-navy-light'
            }`}
          >
            My Companies
          </Link>

          {user?.role === 'senior_coordinator' && (
            <button
              onClick={onCreateCompany}
              className="w-full text-left px-4 py-2 mt-2 rounded-lg text-sm font-medium bg-white text-navy hover:bg-grey-50 transition-colors"
            >
              + Create Company
            </button>
          )}

          <div className="mt-6">
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className="w-full flex justify-between items-center px-4 py-2 text-sm font-medium text-grey-200 hover:text-white transition-colors"
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
                    isActive('/tools/cv-sorter') ? 'text-white' : 'text-grey-200 hover:text-white'
                  }`}
                >
                  CV Sorter
                </Link>
                <Link
                  to="/tools/vcf-generator"
                  className={`block px-6 py-2 text-sm transition-colors ${
                    isActive('/tools/vcf-generator') ? 'text-white' : 'text-grey-200 hover:text-white'
                  }`}
                >
                  VCF Generator
                </Link>
                <Link
                  to="/tools/excel-formatter"
                  className={`block px-6 py-2 text-sm transition-colors ${
                    isActive('/tools/excel-formatter') ? 'text-white' : 'text-grey-200 hover:text-white'
                  }`}
                >
                  Excel Auto-formatter
                </Link>
                <Link
                  to="/tools/tool-four"
                  className={`block px-6 py-2 text-sm transition-colors ${
                    isActive('/tools/tool-four') ? 'text-white' : 'text-grey-200 hover:text-white'
                  }`}
                >
                  Tool 4
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-navy-light">
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="w-full px-4 py-2 text-sm font-medium text-grey-200 hover:text-white hover:bg-navy-light rounded-lg transition-colors text-left"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};
