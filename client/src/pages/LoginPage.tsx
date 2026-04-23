import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setDevUser } = useAuth();

  const handleDevLogin = (role: string) => {
    setDevUser(role);
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-grey-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">SRCC</span>
          </div>
          <h1 className="text-2xl font-bold text-grey-900">The Placement Cell</h1>
          <p className="text-grey-500 mt-1">Company Coordinator Dashboard</p>
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => window.location.href = '/api/auth/google'}
          >
            Sign in with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-grey-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-grey-500">Development</span>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleDevLogin('admin')}
          >
            Dev: Login as Admin
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleDevLogin('senior_coordinator')}
          >
            Dev: Login as SC
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleDevLogin('junior_coordinator')}
          >
            Dev: Login as JC
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
