import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { companyService, gmailService, userService } from '../services/api';
import type { Company, GmailEmail, User } from '../types';

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [jcUsers, setJcUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [selectedJc, setSelectedJc] = useState('');
  const [delegating, setDelegating] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [companyData, emailsData, usersData] = await Promise.all([
        companyService.getCompany(id),
        gmailService.getEmails(id),
        userService.getUsers(),
      ]);
      setCompany(companyData);
      setEmails(emailsData);
      setJcUsers(usersData.filter((u: User) => u.role === 'junior_coordinator'));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const emailsData = await gmailService.getEmails(id);
      setEmails(emailsData);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (email: GmailEmail) => {
    if (!id) return;
    try {
      await gmailService.markAsRead(email.id, id);
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...email } : e))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelegate = async () => {
    if (!id || !selectedJc) return;
    setDelegating(true);
    try {
      const updated = await companyService.delegateToJc(id, selectedJc);
      setCompany(updated);
      setShowDelegateModal(false);
    } catch (error) {
      console.error('Failed to delegate:', error);
    } finally {
      setDelegating(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await companyService.deleteCompany(id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete company:', error);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRevertDelegation = async () => {
    if (!id) return;
    try {
      const updated = await companyService.revertDelegation(id);
      setCompany(updated);
    } catch (error) {
      console.error('Failed to revert:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-grey-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-grey-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-grey-500">Company not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/dashboard')} className="text-grey-500 hover:text-grey-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-grey-900">{company.name}</h1>
              <div className="flex gap-2 mt-1">
                <Badge variant={company.type === 'placement' ? 'success' : 'warning'}>
                  {company.type}
                </Badge>
                {company.delegatedToJcEmail && (
                  <Badge variant="danger">Delegated to JC</Badge>
                )}
              </div>
            </div>
            <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <h3 className="text-sm font-medium text-grey-500 mb-1">Company Type</h3>
              <p className="text-lg font-semibold text-grey-900 capitalize">{company.type}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-grey-500 mb-1">SC Email</h3>
              <p className="text-lg font-semibold text-grey-900">{company.seniorCoordinatorEmail}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-grey-500 mb-1">Delegated To</h3>
              {company.delegatedToJcEmail ? (
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-grey-900">{company.delegatedToJcEmail}</p>
                  <button onClick={handleRevertDelegation} className="text-red-500 text-sm hover:underline">
                    Revert
                  </button>
                </div>
              ) : (
                <Button variant="ghost" className="text-navy" onClick={() => setShowDelegateModal(true)}>
                  + Delegate to JC
                </Button>
              )}
            </Card>
          </div>

          {company.rounds.length > 0 && (
            <Card className="mb-8">
              <h2 className="text-lg font-semibold text-grey-900 mb-4">Rounds</h2>
              <div className="space-y-3">
                {company.rounds.map((round, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-grey-100 last:border-0">
                    <span className="font-medium text-grey-900">{round.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-grey-500">{round.date}</span>
                      <Badge variant={round.status === 'completed' ? 'success' : round.status === 'cancelled' ? 'danger' : 'default'}>
                        {round.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div>
            <h2 className="text-lg font-semibold text-grey-900 mb-4">Inbox</h2>
            {emails.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-grey-500">No emails in this company's inbox.</p>
                <p className="text-sm text-grey-400 mt-1">
                  Emails labeled with both &ldquo;{company.labelCompany}&rdquo; and &ldquo;{company.labelSc}&rdquo; in the GRC inbox will appear here.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {emails.map((email) => (
                  <Card key={email.id} className="cursor-pointer" onClick={() => setSelectedEmail(email)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-grey-900">{email.from}</p>
                        <p className="text-sm text-grey-500 mt-0.5">{email.subject}</p>
                        <p className="text-sm text-grey-400 mt-1 line-clamp-2">{email.snippet}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-grey-400">
                          {new Date(email.date).toLocaleDateString()}
                        </p>
                        {email.year && (
                          <Badge className="mt-1">{email.year}</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={showDelegateModal}
        onClose={() => setShowDelegateModal(false)}
        title="Delegate to Junior Coordinator"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-grey-900 mb-1">Select JC</label>
            <select
              value={selectedJc}
              onChange={(e) => setSelectedJc(e.target.value)}
              className="w-full px-3 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">Select a JC...</option>
              {jcUsers.map((jc) => (
                <option key={jc.uid} value={jc.email}>
                  {jc.name} ({jc.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowDelegateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDelegate} disabled={!selectedJc || delegating}>
              {delegating ? 'Delegating...' : 'Delegate'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Company"
      >
        <div className="space-y-4">
          <p className="text-grey-700">
            Are you sure you want to delete <span className="font-semibold">{company.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCompany} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Company'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
        title="Email Details"
      >
        {selectedEmail && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-grey-500">From</label>
              <p className="text-grey-900">{selectedEmail.from}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-500">Subject</label>
              <p className="text-grey-900">{selectedEmail.subject}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-500">Date</label>
              <p className="text-grey-900">{new Date(selectedEmail.date).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-500">Snippet</label>
              <p className="text-grey-700">{selectedEmail.snippet}</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setSelectedEmail(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => { handleMarkAsRead(selectedEmail); setSelectedEmail(null); }}>
                Mark as Read
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompanyDetail;
