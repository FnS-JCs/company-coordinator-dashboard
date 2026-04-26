import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, DevUser } from '../types';

interface AuthContextType {
  user: User | DevUser | null;
  devRole: string | null;
  loading: boolean;
  setDevUser: (role: string) => void;
  setAuthUser: (userData: any, idToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | DevUser | null>(null);
  const [devRole, setDevRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem('devRole');
    const storedEmail = localStorage.getItem('devEmail');
    const storedName = localStorage.getItem('devName');
    const idToken = localStorage.getItem('idToken');
    const userDataStr = localStorage.getItem('userData');

    if (storedRole && storedEmail) {
      setDevRole(storedRole);
      setUser({
        email: storedEmail,
        role: storedRole as 'admin' | 'senior_coordinator' | 'junior_coordinator',
        name: storedName || storedEmail,
        uid: 'dev-user',
      });
    } else if (idToken && userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUser(userData);
      } catch (e) {
        console.error('Failed to parse stored user data', e);
        localStorage.removeItem('idToken');
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  const setDevUser = (role: string) => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('userData');

    const devEmail = localStorage.getItem('devEmail') || 'dev@srcc.du.ac.in';
    const devName = localStorage.getItem('devName') || role;

    setDevRole(role);
    setUser({
      email: devEmail,
      role: role as 'admin' | 'senior_coordinator' | 'junior_coordinator',
      name: devName,
      uid: 'dev-user',
    });
  };

  const setAuthUser = (userData: any, idToken: string) => {
    localStorage.removeItem('devRole');
    localStorage.removeItem('devEmail');
    localStorage.removeItem('devName');
    setDevRole(null);

    localStorage.setItem('idToken', idToken);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('devRole');
    localStorage.removeItem('devEmail');
    localStorage.removeItem('devName');
    localStorage.removeItem('idToken');
    localStorage.removeItem('userData');
    setUser(null);
    setDevRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, devRole, loading, setDevUser, setAuthUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
