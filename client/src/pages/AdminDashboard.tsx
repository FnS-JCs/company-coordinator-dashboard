import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { userService, gmailService, settingsService } from '../services/api';
import type { User } from '../types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'grc' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; email?: string }>({ connected: false });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: 'junior_coordinator' as const });
  const [adminEmail, setAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [usersData, gmailData, emailData] = await Promise.all([
        userService.getUsers(),
        gmailService.getGmailStatus(),
        settingsService.getAdminEmail(),
      ]);

      // Deduplicate users by email
      const uniqueUsers = usersData.reduce((acc: User[], current: User) => {
        const x = acc.find(item => item.email === current.email);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);

      setUsers(uniqueUsers);
      setGmailStatus(gmailData);
      setAdminEmail(emailData.email);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const { url } = await gmailService.getConnectUrl();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to get connect URL:', error);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm('Disconnecting will stop all email syncing across the dashboard.')) return;
    try {
      await gmailService.disconnectGmail();
      loadData();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, userForm);
      } else {
        await userService.createUser(userForm);
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ name: '', email: '', phone: '', role: 'junior_coordinator' });
      loadData();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, phone: user.phone || '', role: user.role });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id: string) => {
    const userToDelete = users.find((u) => u.id === id);
    if (!confirm(`Remove ${userToDelete?.name}? This will revoke their access immediately.`)) return;
    try {
      await userService.deleteUser(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleUpdateAdminEmail = async () => {
    const newEmail = adminEmail;
    if (!confirm(`Transferring admin to ${newEmail}. You will lose admin access.`)) return;
    try {
      await settingsService.updateAdminEmail(newEmail);
      alert('Admin email updated. Please log in again.');
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to update admin email:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <p className="text-grey-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50">
      <header className="bg-white border-b border-grey-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-grey-900">Admin Dashboard</h1>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex gap-4 border-b border-grey-200 mb-6">
          {['users', 'grc', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`pb-3 px-1 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-navy border-b-2 border-navy'
                  : 'text-grey-500 hover:text-grey-900'
              }`}
            >
              {tab === 'grc' ? 'GRC Inbox' : tab === 'users' ? 'Users' : 'Admin Settings'}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-grey-900">Users</h2>
              <Button variant="primary" onClick={() => { setEditingUser(null); setUserForm({ name: '', email: '', phone: '', role: 'junior_coordinator' }); setShowUserModal(true); }}>
                + Add User
              </Button>
            </div>

            <Card>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-grey-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-grey-500">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-grey-500">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-grey-500">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-grey-500">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-grey-500">Added On</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-grey-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.email === user?.email;
                    return (
                      <tr key={u.id} className="border-b border-grey-100 last:border-0">
                        <td className="py-3 px-4 text-sm text-grey-900">{u.name}</td>
                        <td className="py-3 px-4 text-sm text-grey-500">{u.email}</td>
                        <td className="py-3 px-4 text-sm text-grey-500">{u.phone || '-'}</td>
                        <td className="py-3 px-4">
                          <Badge variant={u.role === 'admin' ? 'warning' : u.role === 'senior_coordinator' ? 'success' : 'default'}>
                            {u.role?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-grey-500">
                          {u.createdAt ? (
                            (() => {
                              const date = (u.createdAt as any).toDate ? (u.createdAt as any).toDate() : new Date(u.createdAt);
                              return date.toLocaleDateString();
                            })()
                          ) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleEditUser(u)} className="text-navy hover:underline text-sm mr-3">
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)} 
                            className={`${isSelf ? 'text-grey-300 cursor-not-allowed' : 'text-red-500 hover:underline'} text-sm`}
                            disabled={isSelf}
                            title={isSelf ? 'Cannot remove your own account' : ''}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'grc' && (
          <div>
            <h2 className="text-lg font-semibold text-grey-900 mb-4">GRC Inbox Connection</h2>
            <Card>
              {gmailStatus.connected ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Connected</span>
                  </div>
                  <p className="text-grey-500 mb-4">Connected as: {gmailStatus.email}</p>
                  <Button variant="danger" onClick={handleDisconnectGmail}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-grey-500 mb-4">Connect your GRC Gmail account to sync company emails.</p>
                  <Button variant="primary" onClick={handleConnectGmail}>
                    Connect GRC Gmail Account
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-lg font-semibold text-grey-900 mb-4">Admin Settings</h2>
            <Card>
              <div>
                <label className="block text-sm font-medium text-grey-900 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy mb-4"
                />
                <Button variant="primary" onClick={handleUpdateAdminEmail}>
                  Save
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? 'Edit User' : 'Add User'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-grey-900 mb-1">Name</label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-grey-900 mb-1">Email</label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-grey-900 mb-1">Phone</label>
            <input
              type="tel"
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-grey-900 mb-1">Role</label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="admin">Admin</option>
              <option value="senior_coordinator">Senior Coordinator</option>
              <option value="junior_coordinator">Junior Coordinator</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveUser}>
              {editingUser ? 'Save Changes' : 'Add User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
