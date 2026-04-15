import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getHeaders = async () => {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

export interface GmailEmail {
  id: string;
  sender: string;
  subject: string;
  date: string;
  snippet: string;
}

export const gmailService = {
  async getStatus(): Promise<{ connected: boolean }> {
    const headers = await getHeaders();
    const response = await axios.get(`${API_BASE_URL}/gmail/status`, { headers });
    return response.data;
  },

  async getAuthUrl(): Promise<{ url: string }> {
    const headers = await getHeaders();
    const response = await axios.get(`${API_BASE_URL}/gmail/auth-url`, { headers });
    return response.data;
  },

  async getWithdrawals(): Promise<GmailEmail[]> {
    const headers = await getHeaders();
    const response = await axios.get(`${API_BASE_URL}/gmail/withdrawals`, { headers });
    return response.data;
  },
};
