import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Building2,
  FileText,
  Contact,
  Table,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  LogOut,
  Plus,
  Shield,
  Wrench,
  MoreHorizontal,
} from 'lucide-react';

interface SidebarProps {
  onCreateCompany?: () => void;
}

const NavLink: React.FC<{
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  indent?: boolean;
}> = ({ to, icon: Icon, label, active, indent = false }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 ${
      indent ? 'h-9 pl-9 pr-4' : 'h-11 px-4'
    } ${
      active
        ? 'bg-white/10 text-white'
        : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
    }`}
  >
    <Icon className={`flex-shrink-0 ${indent ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
    <span>{label}</span>
  </Link>
);

const NavButton: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon: Icon, label, onClick, danger = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 h-11 px-4 rounded-lg text-sm font-medium transition-all duration-150 ${
      danger
        ? 'text-white/65 hover:bg-red-500/20 hover:text-red-300'
        : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
    }`}
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span>{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ onCreateCompany }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [toolsOpen, setToolsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isToolActive = () => location.pathname.startsWith('/tools');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = () => {
    if (!user?.role) return null;
    if (user.role === 'admin') return 'Admin';
    if (user.role === 'senior_coordinator') return 'SC';
    if (user.role === 'junior_coordinator') return 'JC';
    return user.role;
  };

  return (
    <aside className="hidden md:flex w-[260px] flex-shrink-0 flex-col h-full bg-navy dark:bg-[#0D1B2E]">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
        <div>
          <p className="text-white font-semibold text-sm leading-tight">SRCC Placement Cell</p>
          <p className="text-white/45 text-[11px] mt-0.5">Company Coordinator</p>
        </div>
      </div>

      {/* User card */}
      <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
        <p className="text-white text-sm font-semibold truncate">{user?.name || 'User'}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {roleLabel() && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[11px] font-medium">
              {roleLabel()}
            </span>
          )}
        </div>
        <p className="text-white/40 text-[11px] mt-1.5 truncate">{user?.email || ''}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        <NavLink
          to="/dashboard"
          icon={Building2}
          label="My Companies"
          active={isActive('/dashboard')}
        />

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            icon={Shield}
            label="Admin Panel"
            active={isActive('/admin')}
          />
        )}

        {user?.role === 'senior_coordinator' && onCreateCompany && (
          <button
            onClick={onCreateCompany}
            className="w-full flex items-center gap-3 h-11 px-4 rounded-lg text-sm font-medium text-white/65 hover:bg-white/[0.06] hover:text-white transition-all duration-150"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Create Company</span>
          </button>
        )}

        {/* Tools section */}
        <div className="pt-1">
          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className={`w-full flex items-center justify-between h-11 px-4 rounded-lg text-sm font-medium transition-all duration-150 ${
              isToolActive() && !toolsOpen
                ? 'bg-white/10 text-white'
                : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-4 h-4 flex-shrink-0" />
              <span>Tools</span>
            </div>
            {toolsOpen ? (
              <ChevronUp className="w-3.5 h-3.5 opacity-60" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            )}
          </button>

          {toolsOpen && (
            <div className="mt-1 space-y-0.5">
              <NavLink
                to="/tools/cv-sorter"
                icon={FileText}
                label="CV Sorter"
                active={isActive('/tools/cv-sorter')}
                indent
              />
              <NavLink
                to="/tools/vcf-generator"
                icon={Contact}
                label="VCF Generator"
                active={isActive('/tools/vcf-generator')}
                indent
              />
              <NavLink
                to="/tools/excel-formatter"
                icon={Table}
                label="Excel Formatter"
                active={isActive('/tools/excel-formatter')}
                indent
              />
              <NavLink
                to="/tools/tool-four"
                icon={MoreHorizontal}
                label="More Tools"
                active={isActive('/tools/tool-four')}
                indent
              />
            </div>
          )}
        </div>
      </nav>

      {/* Bottom controls */}
      <div className="px-3 py-3 border-t border-white/10 space-y-0.5 flex-shrink-0">
        <NavButton
          icon={isDark ? Sun : Moon}
          label={isDark ? 'Light Mode' : 'Dark Mode'}
          onClick={toggleTheme}
        />
        <NavButton icon={LogOut} label="Log out" onClick={handleLogout} danger />
      </div>
    </aside>
  );
};
