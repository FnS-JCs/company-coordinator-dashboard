import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { authService } from '../services/api';
import srccBuilding from '../assets/srcc-building.jpg';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();
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

  return (
    <div className="min-h-screen flex">
      {/* Left panel — navy branding with building photo */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          backgroundImage: `url(${srccBuilding})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Navy overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: '#1B3055', opacity: 0.72 }}
        />

        <div className="relative z-10 text-center">
          <h1
            className="text-white mb-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '56px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              lineHeight: 1.1,
            }}
          >
            The Placement Cell
          </h1>
          <p className="text-white/60 text-lg font-light tracking-wide">Shri Ram College of Commerce</p>
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

          {/* Company Coordinator Dashboard label */}
          <p
            className="mb-2 font-semibold uppercase text-[#1B3055] dark:text-[#4A7FBF] whitespace-nowrap"
            style={{ fontSize: '17px', letterSpacing: '0.06em' }}
          >
            Company Coordinator Dashboard
          </p>

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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
