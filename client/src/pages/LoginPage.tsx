import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { authService } from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setDevUser, setAuthUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      try {
        const userData = await authService.verifyToken(idToken);
        setAuthUser(userData, idToken);
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } catch (err: any) {
        await signOut(auth);
        if (err.response?.status === 403) {
          setError('Access denied. Contact the administrator.');
        } else {
          setError('Authentication failed. Please try again.');
        }
      }
    } catch {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = (role: string, email: string, name: string) => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('userData');
    localStorage.setItem('devRole', role);
    localStorage.setItem('devEmail', email);
    localStorage.setItem('devName', name);
    setDevUser(role);
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — navy branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative text-center">
          {/* Crest placeholder */}
          <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-2xl tracking-tight">SRCC</span>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">The Placement Cell</h1>
          <p className="text-white/50 text-sm">Shri Ram College of Commerce</p>
          <p className="text-white/30 text-xs mt-6 max-w-xs leading-relaxed">
            Coordinating placements and internships with precision and care.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 bg-white dark:bg-[#0D1B2E] flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-sm">SRCC</span>
            </div>
            <p className="text-grey-900 dark:text-[#F0F4FA] font-semibold text-sm">The Placement Cell</p>
          </div>

          <h2 className="text-2xl font-bold text-grey-900 dark:text-[#F0F4FA] mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-grey-400 dark:text-[#6B7E95] mb-8">
            Sign in to continue to the dashboard.
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-danger dark:text-[#EF4444] text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-10 flex items-center justify-center gap-3 border border-grey-200 dark:border-[#243D6A] rounded-lg text-sm font-medium text-grey-900 dark:text-[#F0F4FA] bg-white dark:bg-[#122240] hover:bg-grey-50 dark:hover:bg-[#1B3055] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Google "G" icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Dev section */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-grey-200 dark:border-[#243D6A]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white dark:bg-[#0D1B2E] text-[11px] font-medium text-grey-400 dark:text-[#6B7E95] uppercase tracking-widest">
                  Development
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {[
                {
                  label: 'Admin',
                  role: 'admin',
                  email: 'srcc.pc.jc.fns2526@gmail.com',
                  name: 'Dev Admin',
                },
                {
                  label: 'Senior Coordinator',
                  role: 'senior_coordinator',
                  email: 'seyanthegoat@gmail.com',
                  name: 'Nayes',
                },
                {
                  label: 'Junior Coordinator',
                  role: 'junior_coordinator',
                  email: 'seyan.sonone@gmail.com',
                  name: 'Seyan',
                },
              ].map((dev) => (
                <button
                  key={dev.role}
                  onClick={() => handleDevLogin(dev.role, dev.email, dev.name)}
                  disabled={loading}
                  className="w-full h-9 flex items-center justify-center rounded-lg text-[12px] font-medium text-grey-500 dark:text-[#6B7E95] border border-grey-200 dark:border-[#243D6A] hover:bg-grey-50 dark:hover:bg-[#122240] transition-all duration-150 disabled:opacity-40"
                >
                  {dev.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
