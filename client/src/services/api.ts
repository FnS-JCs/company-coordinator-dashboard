import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const devRole = localStorage.getItem('devRole');
  const devEmail = localStorage.getItem('devEmail');
  
  if (devRole) {
    config.headers['X-Dev-Role'] = devRole;
  }
  if (devEmail) {
    config.headers['X-Dev-Email'] = devEmail;
  }
  
  return config;
});

export const authService = {
  async getDevAuthUrl(role: string): Promise<{ url: string }> {
    const response = await api.get(`/auth/dev-url?role=${role}`);
    return response.data;
  },
};

export const userService = {
  async getUsers() {
    const response = await api.get('/users');
    return response.data;
  },
  async createUser(user: any) {
    const response = await api.post('/users', user);
    return response.data;
  },
  async updateUser(uid: string, user: any) {
    const response = await api.patch(`/users/${uid}`, user);
    return response.data;
  },
  async deleteUser(uid: string) {
    const response = await api.delete(`/users/${uid}`);
    return response.data;
  },
};

export const companyService = {
  async getCompanies() {
    const response = await api.get('/companies');
    return response.data;
  },
  async getCompany(id: string) {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },
  async createCompany(company: any) {
    const response = await api.post('/companies', company);
    return response.data;
  },
  async updateCompany(id: string, company: any) {
    const response = await api.patch(`/companies/${id}`, company);
    return response.data;
  },
  async delegateToJc(id: string, jcEmail: string) {
    const response = await api.post(`/companies/${id}/delegate`, { jcEmail });
    return response.data;
  },
  async revertDelegation(id: string) {
    const response = await api.post(`/companies/${id}/revert-delegation`);
    return response.data;
  },
};

export const gmailService = {
  async getConnectUrl(): Promise<{ url: string }> {
    const response = await api.get('/gmail/connect-url');
    return response.data;
  },
  async getGmailStatus(): Promise<{ connected: boolean; email?: string }> {
    const response = await api.get('/gmail/status');
    return response.data;
  },
  async disconnectGmail() {
    const response = await api.post('/gmail/disconnect');
    return response.data;
  },
  async getEmails(companyId: string) {
    const response = await api.get(`/gmail/emails?companyId=${companyId}`);
    return response.data;
  },
  async getEmail(messageId: string) {
    const response = await api.get(`/gmail/emails/${messageId}`);
    return response.data;
  },
  async markAsRead(messageId: string, companyId: string) {
    const response = await api.post('/gmail/mark-read', { messageId, companyId });
    return response.data;
  },
  async refreshEmails() {
    const response = await api.post('/gmail/refresh');
    return response.data;
  },
};

export const settingsService = {
  async getAdminEmail(): Promise<{ email: string }> {
    const response = await api.get('/settings/admin-email');
    return response.data;
  },
  async updateAdminEmail(newEmail: string) {
    const response = await api.post('/settings/admin-email', { newEmail });
    return response.data;
  },
  async getAcademicYear(): Promise<{ year: string }> {
    const response = await api.get('/settings/academic-year');
    return response.data;
  },
};

export default api;
