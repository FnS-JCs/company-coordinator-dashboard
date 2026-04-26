import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { companyService, gmailService, userService } from '../services/api';
import type { Company, GmailEmail, User } from '../types';

type EmailFilter = 'all' | 'unread' | 'read';

const AUTO_REFRESH_MS = 5 * 60 * 1000;

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [jcUsers, setJcUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [selectedJc, setSelectedJc] = useState('');
  const [delegating, setDelegating] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [selectedEmailDetail, setSelectedEmailDetail] = useState<any>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const [emailFilter, setEmailFilter] = useState<EmailFilter>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [, setRefreshTick] = useState(0);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getLastRefreshedText = () => {
    if (!lastRefreshed) return '';
    const mins = Math.floor((Date.now() - lastRefreshed.getTime()) / 60000);
    if (mins === 0) return 'just now';
    return `${mins} min${mins === 1 ? '' : 's'} ago`;
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Auto-refresh every 5 minutes — only updates email list
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const emailsData = await gmailService.getEmails(id);
        setEmails(emailsData);
        setLastRefreshed(new Date());
      } catch {
        // silent failure for background refresh
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [id]);

  // Tick every minute to update "Last refreshed X mins ago" display
  useEffect(() => {
    const interval = setInterval(() => setRefreshTick(t => t + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    if (!id) return;
    try {
      try {
        const companyData = await companyService.getCompany(id);
        setCompany(companyData);
      } catch (err) {
        console.error('Failed to load company:', err);
        setLoading(false);
        return;
      }

    const [emailsData, usersData] = await Promise.allSettled([
      gmailService.getEmails(id),
      userService.getUsers(),
    ]);

    if (emailsData.status === 'fulfilled') setEmails(emailsData.value);
    if (usersData.status === 'fulfilled') {
      setJcUsers(usersData.value.filter((u: User) => u.role === 'junior_coordinator'));
    } else {
      console.error('Failed to load users:', usersData.reason);
    }
      setLastRefreshed(new Date());
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
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = (emailId: string) => {
    setReadMessageIds(prev => new Set([...prev, emailId]));
  };

  const handleEmailClick = async (email: GmailEmail) => {
    setSelectedEmail(email);
    setLoadingEmail(true);
    handleMarkAsRead(email.id);
    try {
      const detail = await gmailService.getEmail(email.id);
      setSelectedEmailDetail(detail);
    } catch (error) {
      console.error('Failed to fetch email detail:', error);
    } finally {
      setLoadingEmail(false);
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

  const filteredEmails = emails.filter(email => {
    if (emailFilter === 'all') return true;
    if (emailFilter === 'unread') return !readMessageIds.has(email.id);
    return readMessageIds.has(email.id);
  });

  const unreadCount = emails.length - readMessageIds.size;

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 dark:bg-gray-900 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-grey-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-grey-50 dark:bg-gray-900 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-grey-500 dark:text-gray-400">Company not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-gray-900 flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/dashboard')} className="text-grey-500 dark:text-gray-400 hover:text-grey-900 dark:hover:text-gray-100 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-grey-900 dark:text-gray-100">{company.name}</h1>
              <div className="flex gap-2 mt-1">
                <Badge variant={company.type === 'placement' ? 'success' : 'warning'}>
                  {company.type}
                </Badge>
                {company.delegatedToJcEmail && (
                  <Badge variant="danger">Delegated to JC</Badge>
                )}
              </div>
            </div>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <h3 className="text-sm font-medium text-grey-500 dark:text-gray-400 mb-1">Company Type</h3>
              <p className="text-lg font-semibold text-grey-900 dark:text-gray-100 capitalize">{company.type}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-grey-500 dark:text-gray-400 mb-1">SC Email</h3>
              <p className="text-lg font-semibold text-grey-900 dark:text-gray-100">{company.seniorCoordinatorEmail}</p>
            </Card>
            <Card>
              <h3 className="text-sm font-medium text-grey-500 dark:text-gray-400 mb-1">Delegated To</h3>
              {company.delegatedToJcEmail ? (
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-grey-900 dark:text-gray-100">{company.delegatedToJcEmail}</p>
                  <button onClick={handleRevertDelegation} className="text-red-500 text-sm hover:underline">
                    Revert
                  </button>
                </div>
              ) : (
                <Button variant="ghost" className="text-navy dark:text-blue-400" onClick={() => setShowDelegateModal(true)}>
                  + Delegate to JC
                </Button>
              )}
            </Card>
          </div>

          {company.rounds.length > 0 && (
            <Card className="mb-8">
              <h2 className="text-lg font-semibold text-grey-900 dark:text-gray-100 mb-4">Rounds</h2>
              <div className="space-y-3">
                {company.rounds.map((round, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-grey-100 dark:border-gray-700 last:border-0">
                    <span className="font-medium text-grey-900 dark:text-gray-100">{round.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-grey-500 dark:text-gray-400">{round.date}</span>
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
            {/* Inbox header with refresh controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-grey-900 dark:text-gray-100">Inbox</h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {lastRefreshed && (
                  <span className="text-xs text-grey-400 dark:text-gray-500">
                    Last refreshed: {getLastRefreshedText()}
                  </span>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-grey-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-grey-200 dark:border-gray-600 rounded-lg hover:bg-grey-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {refreshing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Read/Unread filter bar */}
            <div className="flex gap-1 mb-4 p-1 bg-grey-100 dark:bg-gray-800 rounded-lg w-fit">
              {(['all', 'unread', 'read'] as EmailFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setEmailFilter(filter)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                    emailFilter === filter
                      ? 'bg-white dark:bg-gray-700 text-grey-900 dark:text-gray-100 shadow-sm'
                      : 'text-grey-500 dark:text-gray-400 hover:text-grey-700 dark:hover:text-gray-200'
                  }`}
                >
                  {filter}
                  {filter === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filteredEmails.length === 0 ? (
              <Card className="text-center py-12">
                {emails.length === 0 ? (
                  <>
                    <p className="text-grey-500 dark:text-gray-400">No emails in this company's inbox.</p>
                    <p className="text-sm text-grey-400 dark:text-gray-500 mt-1">
                      Emails labeled with both &ldquo;{company.labelCompany}&rdquo; and &ldquo;{company.labelSc}&rdquo; in the GRC inbox will appear here.
                    </p>
                  </>
                ) : (
                  <p className="text-grey-500 dark:text-gray-400">No {emailFilter} emails.</p>
                )}
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredEmails.map((email) => {
                  const isUnread = !readMessageIds.has(email.id);
                  return (
                    <Card
                      key={email.id}
                      className={`cursor-pointer hover:border-navy dark:hover:border-blue-500 transition-colors ${isUnread ? 'border-l-4 border-l-blue-500 dark:border-l-blue-400' : ''}`}
                      onClick={() => handleEmailClick(email)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2 flex-1">
                          {isUnread && (
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className={`font-medium text-grey-900 dark:text-gray-100 ${isUnread ? 'font-semibold' : ''}`}>{email.from}</p>
                            <p className="text-sm text-grey-500 dark:text-gray-400 mt-0.5">{email.subject}</p>
                            <p className="text-sm text-grey-400 dark:text-gray-500 mt-1 line-clamp-2">{email.snippet}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-grey-400 dark:text-gray-500">
                            {new Date(email.date).toLocaleDateString()}
                          </p>
                          {email.year && (
                            <Badge className="mt-1">{email.year}</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
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
            <label className="block text-sm font-medium text-grey-900 dark:text-gray-200 mb-1">Select JC</label>
            <select
              value={selectedJc}
              onChange={(e) => setSelectedJc(e.target.value)}
              className="w-full px-3 py-2 border border-grey-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-grey-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue-500"
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
          <p className="text-grey-700 dark:text-gray-300">
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
        onClose={() => { setSelectedEmail(null); setSelectedEmailDetail(null); }}
        title="Email Details"
        maxWidth="max-w-4xl"
      >
        {selectedEmail && (
          <div className="flex flex-col h-[75vh]">
            <div className="space-y-3 mb-6 flex-shrink-0 bg-grey-50 dark:bg-gray-700/50 p-4 rounded-lg border border-grey-100 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-grey-500 dark:text-gray-400 uppercase tracking-wider mb-1">From</label>
                  <p className="text-grey-900 dark:text-gray-100 font-medium break-all">{selectedEmail.from}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-grey-500 dark:text-gray-400 uppercase tracking-wider mb-1">Date</label>
                  <p className="text-grey-900 dark:text-gray-100">{new Date(selectedEmail.date).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-grey-500 dark:text-gray-400 uppercase tracking-wider mb-1">Subject</label>
                <p className="text-grey-900 dark:text-gray-100 font-bold text-lg">{selectedEmail.subject}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-grey-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-inner">
              {loadingEmail ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-grey-500 dark:text-gray-400 font-medium">Fetching full email content...</p>
                </div>
              ) : selectedEmailDetail ? (
                <div
                  className="p-6 email-body-container"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(selectedEmailDetail.body, {
                      ADD_TAGS: ['iframe'],
                      ADD_ATTR: ['target']
                    })
                  }}
                />
              ) : (
                <div className="p-6">
                  <p className="text-grey-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedEmail.snippet}</p>
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded text-sm">
                    Full content could not be loaded. Showing snippet only.
                  </div>
                </div>
              )}
            </div>

            {selectedEmailDetail?.attachments?.length > 0 && (
              <div className="mt-6 flex-shrink-0">
                <label className="block text-xs font-semibold text-grey-500 dark:text-gray-400 uppercase tracking-wider mb-2">Attachments ({selectedEmailDetail.attachments.length})</label>
                <div className="flex flex-wrap gap-3">
                  {selectedEmailDetail.attachments.map((att: any) => (
                    <a
                      key={att.attachmentId}
                      href={gmailService.getAttachmentUrl(selectedEmail.id, att.attachmentId, att.filename, att.mimeType)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-grey-50 dark:bg-gray-700 border border-grey-200 dark:border-gray-600 rounded-lg hover:bg-grey-100 dark:hover:bg-gray-600 hover:border-navy dark:hover:border-blue-500 transition-all group"
                    >
                      <div className="w-10 h-10 bg-white dark:bg-gray-600 border border-grey-200 dark:border-gray-500 rounded flex items-center justify-center group-hover:border-navy dark:group-hover:border-blue-400">
                        <svg className="w-6 h-6 text-grey-400 dark:text-gray-400 group-hover:text-navy dark:group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-grey-900 dark:text-gray-100 line-clamp-1 max-w-[200px]">{att.filename}</span>
                        <span className="text-xs text-grey-500 dark:text-gray-400">{formatFileSize(att.size)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 flex-shrink-0 pt-4 border-t border-grey-100 dark:border-gray-700">
              <Button variant="secondary" onClick={() => { setSelectedEmail(null); setSelectedEmailDetail(null); }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CompanyDetail;
