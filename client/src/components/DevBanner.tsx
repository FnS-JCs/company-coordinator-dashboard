import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DevBanner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { devRole } = useAuth();

  if (!devRole) return null;

  const handleRoleSwitch = (role: string) => {
    localStorage.setItem('devRole', role);
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
    window.location.reload();
  };

  return (
    <div className="bg-yellow-400 text-yellow-900 px-4 py-2 text-sm font-medium">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <span>DEV MODE — Auth bypassed. Current role: {devRole}</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleRoleSwitch('admin')}
            className={`underline ${devRole === 'admin' ? 'font-bold' : ''}`}
          >
            Admin
          </button>
          <span>|</span>
          <button
            onClick={() => handleRoleSwitch('senior_coordinator')}
            className={`underline ${devRole === 'senior_coordinator' ? 'font-bold' : ''}`}
          >
            SC
          </button>
          <span>|</span>
          <button
            onClick={() => handleRoleSwitch('junior_coordinator')}
            className={`underline ${devRole === 'junior_coordinator' ? 'font-bold' : ''}`}
          >
            JC
          </button>
        </div>
      </div>
    </div>
  );
};
