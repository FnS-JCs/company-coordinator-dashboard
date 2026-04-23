import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, DevUser } from '../types';

interface AuthContextType {
  user: User | DevUser | null;
  devRole: string | null;
  loading: boolean;
  setDevUser: (role: string) => void;
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

    if (storedRole && storedEmail) {
      setDevRole(storedRole);
      setUser({
        email: storedEmail,
        role: storedRole as 'admin' | 'senior_coordinator' | 'junior_coordinator',
        name: storedName || storedEmail,
        uid: 'dev-user',
      });
    }
    setLoading(false);
  }, []);

  const setDevUser = (role: string) => {
    const devEmail = 'srcc.pc.jc.fns2526@gmail.com';
    localStorage.setItem('devRole', role);
    localStorage.setItem('devEmail', devEmail);
    localStorage.setItem('devName', 'Dev User');

    setDevRole(role);
    setUser({
      email: devEmail,
      role: role as 'admin' | 'senior_coordinator' | 'junior_coordinator',
      name: 'Dev User',
      uid: 'dev-user',
    });
  };

  const logout = () => {
    localStorage.removeItem('devRole');
    localStorage.removeItem('devEmail');
    localStorage.removeItem('devName');
    setUser(null);
    setDevRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, devRole, loading, setDevUser, logout }}>
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
