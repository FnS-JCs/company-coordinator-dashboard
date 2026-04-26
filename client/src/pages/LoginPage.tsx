import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
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
        console.error('Backend verification failed:', err);
        await signOut(auth);
        if (err.response?.status === 403) {
          setError('Access denied. Contact the administrator.');
        } else {
          setError('Authentication failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
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
    <div className="min-h-screen bg-grey-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-navy rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">SRCC</span>
          </div>
          <h1 className="text-2xl font-bold text-grey-900">The Placement Cell</h1>
          <p className="text-grey-500 mt-1">Company Coordinator Dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
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
            onClick={() => handleDevLogin('admin', 'srcc.pc.jc.fns2526@gmail.com', 'Dev Admin')}
            disabled={loading}
          >
            Dev: Login as Admin
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleDevLogin('senior_coordinator', 'seyanthegoat@gmail.com', 'Nayes')}
            disabled={loading}
          >
            Dev: Login as SC
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleDevLogin('junior_coordinator', 'seyan.sonone@gmail.com', 'Seyan')}
            disabled={loading}
          >
            Dev: Login as JC
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
