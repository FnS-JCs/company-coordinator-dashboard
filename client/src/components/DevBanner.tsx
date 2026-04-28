import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DevBanner: React.FC = () => {
  const navigate = useNavigate();
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

  const roles = [
    { key: 'admin', label: 'Admin' },
    { key: 'senior_coordinator', label: 'SC' },
    { key: 'junior_coordinator', label: 'JC' },
  ];

  return (
    <div
      className="flex-shrink-0 flex items-center justify-between px-4"
      style={{ height: 40, backgroundColor: '#D97706' }}
    >
      <span className="text-white text-[11px] font-semibold tracking-widest uppercase">
        DEV MODE — Auth bypassed &nbsp;&middot;&nbsp; Role: {devRole}
      </span>
      <div className="flex items-center gap-1">
        {roles.map((r) => (
          <button
            key={r.key}
            onClick={() => handleRoleSwitch(r.key)}
            className={`h-6 px-3 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-all ${
              devRole === r.key
                ? 'bg-white text-[#D97706]'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
};
