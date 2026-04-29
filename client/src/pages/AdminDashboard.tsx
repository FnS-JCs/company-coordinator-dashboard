import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { userService, gmailService, settingsService } from '../services/api';
import type { User } from '../types';

const inputCls =
  'w-full h-10 px-3 border border-grey-200 dark:border-[#243D6A] rounded-lg bg-white dark:bg-[#0D1B2E] text-grey-900 dark:text-[#F0F4FA] placeholder-grey-400 dark:placeholder-[#6B7E95] text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-[#4A7FBF]';

const formatDate = (timestamp: any): string | null => {
  if (!timestamp) return null;
  if (timestamp?.toDate) return timestamp.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (timestamp?.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return null;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'grc' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; email?: string }>({ connected: false });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<{
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'senior_coordinator' | 'junior_coordinator';
  }>({
    name: '',
    email: '',
    phone: '',
    role: 'junior_coordinator',
  });
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

      const uniqueUsers = usersData.reduce((acc: User[], current: User) => {
        const x = acc.find((item) => item.email === current.email);
        return x ? acc : acc.concat([current]);
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

  const handleEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role });
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
    if (!confirm(`Transferring admin to ${adminEmail}. You will lose admin access.`)) return;
    try {
      await settingsService.updateAdminEmail(adminEmail);
      alert('Admin email updated. Please log in again.');
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to update admin email:', error);
    }
  };

  const tabs = [
    { key: 'users', label: 'Users' },
    { key: 'grc', label: 'GRC Inbox' },
    { key: 'settings', label: 'Admin Settings' },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 dark:bg-[#0D1B2E] flex items-center justify-center">
        <p className="text-grey-400 dark:text-[#6B7E95] text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-[#0D1B2E]">
      {/* Header */}
      <header className="bg-white dark:bg-[#122240] border-b border-grey-200 dark:border-[#243D6A] px-8 py-0">
        <div className="max-w-[1400px] mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-grey-400 dark:text-[#6B7E95]" />
            <h1 className="text-sm font-semibold text-grey-900 dark:text-[#F0F4FA]">
              Admin Panel
            </h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm font-medium text-grey-400 dark:text-[#6B7E95] hover:text-grey-700 dark:hover:text-[#A8B8CC] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 py-6">
        {/* Underline tab bar */}
        <div className="flex border-b border-grey-200 dark:border-[#243D6A] mb-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 px-1 mr-6 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
                activeTab === key
                  ? 'border-navy dark:border-[#4A7FBF] text-navy dark:text-[#4A7FBF]'
                  : 'border-transparent text-grey-400 dark:text-[#6B7E95] hover:text-grey-900 dark:hover:text-[#A8B8CC]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-sm font-semibold text-grey-900 dark:text-[#F0F4FA]">Users</h2>
                <p className="text-[12px] text-grey-400 dark:text-[#6B7E95] mt-0.5">
                  {users.length} member{users.length !== 1 ? 's' : ''} with access
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: '', email: '', phone: '', role: 'junior_coordinator' });
                  setShowUserModal(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add User
              </Button>
            </div>

            <div className="bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-grey-200 dark:border-[#243D6A]">
                    {['Name', 'Email', 'Phone', 'Role', 'Added On', ''].map((h) => (
                      <th
                        key={h}
                        className={`py-3 px-4 text-[11px] font-semibold text-grey-400 dark:text-[#6B7E95] uppercase tracking-wide ${
                          h === '' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.email === user?.email;
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-grey-100 dark:border-[#243D6A]/40 last:border-0 hover:bg-grey-50 dark:hover:bg-[#1B3055]/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-[14px] font-medium text-grey-900 dark:text-[#F0F4FA]">
                          {u.name}
                        </td>
                        <td className="py-3.5 px-4 text-[14px] text-grey-500 dark:text-[#A8B8CC]">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-4 text-[14px] text-grey-500 dark:text-[#A8B8CC]">
                          {u.phone || <span className="text-grey-300 dark:text-[#6B7E95]">—</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              u.role === 'admin'
                                ? 'warning'
                                : u.role === 'senior_coordinator'
                                ? 'navy'
                                : 'default'
                            }
                          >
                            {u.role?.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-[14px] text-grey-400 dark:text-[#6B7E95]">
                          {formatDate(u.createdAt) ?? <span className="text-grey-300 dark:text-[#6B7E95]">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditUser(u)}
                              className="flex items-center gap-1 h-7 px-2.5 rounded text-[12px] font-medium text-grey-500 dark:text-[#A8B8CC] hover:bg-grey-100 dark:hover:bg-[#1B3055] transition-colors"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={isSelf}
                              title={isSelf ? 'Cannot remove your own account' : ''}
                              className={`flex items-center gap-1 h-7 px-2.5 rounded text-[12px] font-medium transition-colors ${
                                isSelf
                                  ? 'text-grey-300 dark:text-[#6B7E95] cursor-not-allowed'
                                  : 'text-danger dark:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GRC tab */}
        {activeTab === 'grc' && (
          <div className="max-w-lg">
            <h2 className="text-sm font-semibold text-grey-900 dark:text-[#F0F4FA] mb-4">
              GRC Inbox Connection
            </h2>
            <div className="bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] p-5">
              {gmailStatus.connected ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-sm font-medium text-success dark:text-[#10B981]">
                      Connected
                    </span>
                  </div>
                  <p className="text-sm text-grey-500 dark:text-[#A8B8CC] mb-4">
                    {gmailStatus.email}
                  </p>
                  <Button variant="danger" onClick={handleDisconnectGmail}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-grey-500 dark:text-[#A8B8CC] mb-4">
                    Connect your GRC Gmail account to sync company emails.
                  </p>
                  <Button variant="primary" onClick={handleConnectGmail}>
                    Connect GRC Gmail
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div className="max-w-lg">
            <h2 className="text-sm font-semibold text-grey-900 dark:text-[#F0F4FA] mb-4">
              Admin Settings
            </h2>
            <div className="bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] p-5">
              <div>
                <label className="block text-[13px] font-medium text-grey-700 dark:text-[#A8B8CC] mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={inputCls + ' max-w-sm mb-4'}
                />
                <br />
                <Button variant="primary" onClick={handleUpdateAdminEmail}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? 'Edit User' : 'Add User'}
        maxWidth="max-w-[480px]"
      >
        <div className="space-y-4">
          {[
            { label: 'Name', type: 'text', key: 'name', placeholder: 'Full name' },
            { label: 'Email', type: 'email', key: 'email', placeholder: 'user@srcc.du.ac.in' },
            { label: 'Phone', type: 'tel', key: 'phone', placeholder: '+91 ...' },
          ].map(({ label, type, key, placeholder }) => (
            <div key={key}>
              <label className="block text-[13px] font-medium text-grey-700 dark:text-[#A8B8CC] mb-1">
                {label}
              </label>
              <input
                type={type}
                value={(userForm as any)[key]}
                onChange={(e) => setUserForm({ ...userForm, [key]: e.target.value })}
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          ))}

          <div>
            <label className="block text-[13px] font-medium text-grey-700 dark:text-[#A8B8CC] mb-1">
              Role
            </label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
              className={inputCls}
            >
              <option value="admin">Admin</option>
              <option value="senior_coordinator">Senior Coordinator</option>
              <option value="junior_coordinator">Junior Coordinator</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
