import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  ChevronLeft,
  RefreshCw,
  UserPlus,
  Undo2,
  Trash2,
  Paperclip,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { companyService, gmailService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Company, GmailEmail, User } from '../types';

type EmailFilter = 'all' | 'unread' | 'read';

const AUTO_REFRESH_MS = 5 * 60 * 1000;

const inputCls =
  'w-full h-10 px-3 border border-grey-200 dark:border-[#243D6A] rounded-lg bg-white dark:bg-[#0D1B2E] text-grey-900 dark:text-[#F0F4FA] placeholder-grey-400 dark:placeholder-[#6B7E95] text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-[#4A7FBF]';

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isJC = user?.role === 'junior_coordinator';
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
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getLastRefreshedText = () => {
    if (!lastRefreshed) return '';
    const mins = Math.floor((Date.now() - lastRefreshed.getTime()) / 60000);
    if (mins === 0) return 'just now';
    return `${mins}m ago`;
  };

  useEffect(() => { loadData(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const emailsData = await gmailService.getEmails(id);
        setEmails(emailsData);
        setLastRefreshed(new Date());
      } catch { /* silent */ }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => setRefreshTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    if (!id) return;
    try {
      try {
        const companyData = await companyService.getCompany(id);
        setCompany(companyData);
      } catch {
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
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = (emailId: string) => {
    setReadMessageIds((prev) => new Set([...prev, emailId]));
  };

  const handleEmailClick = async (email: GmailEmail) => {
    setSelectedEmail(email);
    setLoadingEmail(true);
    handleMarkAsRead(email.id);
    try {
      const detail = await gmailService.getEmail(email.id);
      setSelectedEmailDetail(detail);
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
    } catch {
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

  const filteredEmails = emails.filter((email) => {
    if (emailFilter === 'all') return true;
    if (emailFilter === 'unread') return !readMessageIds.has(email.id);
    return readMessageIds.has(email.id);
  });

  const unreadCount = emails.filter((e) => !readMessageIds.has(e.id)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 dark:bg-[#0D1B2E]">
        <Sidebar />
        <div className="ml-[260px] min-h-screen flex items-center justify-center">
          <p className="text-grey-400 dark:text-[#6B7E95] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-grey-50 dark:bg-[#0D1B2E]">
        <Sidebar />
        <div className="ml-[260px] min-h-screen flex items-center justify-center">
          <p className="text-grey-400 dark:text-[#6B7E95] text-sm">Company not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-[#0D1B2E]">
      <Sidebar />

      <main className="ml-[260px] overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          {/* Page header */}
          <div className="flex items-start gap-4 mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-0.5 p-1.5 rounded-lg text-grey-400 dark:text-[#6B7E95] hover:text-grey-700 dark:hover:text-[#A8B8CC] hover:bg-grey-100 dark:hover:bg-[#1B3055] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-grey-900 dark:text-[#F0F4FA] truncate">
                {company.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant={company.type === 'placement' ? 'navy' : 'teal'}>
                  {company.type}
                </Badge>
                {company.delegatedToJcEmail && (
                  <Badge variant="warning">Delegated</Badge>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-danger dark:text-[#EF4444] border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>

          {/* Info cards row */}
          <div className={`grid grid-cols-1 ${isJC ? 'lg:grid-cols-1 max-w-xs' : 'lg:grid-cols-3'} gap-4 mb-6`}>
            {/* Company Type — always visible */}
            <div className="bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] px-5 py-4">
              <p className="text-[11px] font-medium text-grey-400 dark:text-[#6B7E95] uppercase tracking-wide mb-1">
                Company Type
              </p>
              <p className="text-sm font-semibold text-grey-900 dark:text-[#F0F4FA] capitalize truncate">
                {company.type}
              </p>
            </div>

            {/* SC Email — SC/Admin only */}
            {!isJC && (
              <div className="bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] px-5 py-4">
                <p className="text-[11px] font-medium text-grey-400 dark:text-[#6B7E95] uppercase tracking-wide mb-1">
                  SC Email
                </p>
                <p className="text-sm font-semibold text-grey-900 dark:text-[#F0F4FA] truncate">
                  {company.seniorCoordinatorEmail}
                </p>
              </div>
            )}

            {/* Delegated To — SC/Admin only */}
            {!isJC && (
              <div className="bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] px-5 py-4">
                <p className="text-[11px] font-medium text-grey-400 dark:text-[#6B7E95] uppercase tracking-wide mb-1">
                  Delegated To
                </p>
                {company.delegatedToJcEmail ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-grey-900 dark:text-[#F0F4FA] truncate">
                      {company.delegatedToJcEmail}
                    </p>
                    <button
                      onClick={handleRevertDelegation}
                      className="flex items-center gap-1 text-[12px] font-medium text-warning dark:text-[#F59E0B] hover:underline shrink-0"
                    >
                      <Undo2 className="w-3 h-3" /> Revert
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDelegateModal(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-navy dark:text-[#4A7FBF] hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Delegate to JC
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Rounds */}
          {company.rounds.length > 0 && (
            <div className="bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] mb-6 overflow-hidden">
              <div className="px-5 py-4 border-b border-grey-200 dark:border-[#243D6A]">
                <h2 className="text-sm font-semibold text-grey-900 dark:text-[#F0F4FA]">Rounds</h2>
              </div>
              <div>
                {company.rounds.map((round, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center px-5 py-3.5 border-b border-grey-100 dark:border-[#243D6A]/50 last:border-0 hover:bg-grey-50 dark:hover:bg-[#1B3055]/30 transition-colors"
                  >
                    <span className="text-sm font-medium text-grey-900 dark:text-[#F0F4FA]">
                      {round.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-grey-400 dark:text-[#6B7E95]">{round.date}</span>
                      <Badge
                        variant={
                          round.status === 'completed'
                            ? 'success'
                            : round.status === 'cancelled'
                            ? 'danger'
                            : 'default'
                        }
                      >
                        {round.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inbox */}
          <div>
            {/* Inbox header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-grey-900 dark:text-[#F0F4FA]">Inbox</h2>
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center px-2 py-0.5 text-[11px] font-bold text-white bg-danger rounded-full">
                    {unreadCount} unread
                  </span>
                )}
                {lastRefreshed && (
                  <span className="text-[11px] text-grey-400 dark:text-[#6B7E95]">
                    {getLastRefreshedText()}
                  </span>
                )}
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-grey-500 dark:text-[#A8B8CC] border border-grey-200 dark:border-[#243D6A] rounded-lg bg-white dark:bg-[#122240] hover:bg-grey-50 dark:hover:bg-[#1B3055] disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1 mb-4 p-1 bg-grey-100 dark:bg-[#1B3055] rounded-lg w-fit">
              {(['all', 'unread', 'read'] as EmailFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setEmailFilter(filter)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md capitalize transition-all duration-150 ${
                    emailFilter === filter
                      ? 'bg-white dark:bg-[#122240] text-grey-900 dark:text-[#F0F4FA] shadow-sm'
                      : 'text-grey-400 dark:text-[#6B7E95] hover:text-grey-700 dark:hover:text-[#A8B8CC]'
                  }`}
                >
                  {filter}
                  {filter === 'unread' && unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-danger rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Email list */}
            {filteredEmails.length === 0 ? (
              <div className="bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] py-16 text-center">
                {emails.length === 0 ? (
                  <>
                    <p className="text-sm font-medium text-grey-500 dark:text-[#A8B8CC]">
                      No emails in this inbox.
                    </p>
                    <p className="text-[12px] text-grey-400 dark:text-[#6B7E95] mt-1 max-w-sm mx-auto">
                      Emails labeled with both &ldquo;{company.labelCompany}&rdquo; and &ldquo;{company.labelSc}&rdquo; in the GRC inbox will appear here.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-grey-400 dark:text-[#6B7E95]">
                    No {emailFilter} emails.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] overflow-hidden">
                {filteredEmails.map((email) => {
                  const isUnread = !readMessageIds.has(email.id);
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={`flex items-center gap-4 px-4 cursor-pointer transition-all duration-150 border-b dark:border-[#243D6A]/50 last:border-0 ${
                        isUnread
                          ? 'border-l-[3px] border-l-navy dark:border-l-[#4A7FBF] bg-grey-50 dark:bg-[#1B3055]/40 hover:bg-grey-100 dark:hover:bg-[#1B3055]/60'
                          : 'border-l-[3px] border-l-transparent bg-white dark:bg-[#122240] hover:bg-grey-50 dark:hover:bg-[#1B3055]/20'
                      }`}
                      style={{ height: 56 }}
                    >
                      {/* Unread dot */}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isUnread ? 'bg-navy dark:bg-[#4A7FBF]' : 'bg-transparent'}`} />

                      {/* Sender */}
                      <span
                        className={`text-[15px] flex-shrink-0 truncate ${
                          isUnread
                            ? 'font-semibold text-grey-900 dark:text-[#F0F4FA]'
                            : 'font-medium text-grey-500 dark:text-[#A8B8CC]'
                        }`}
                        style={{ width: 200 }}
                      >
                        {email.from}
                      </span>

                      {/* Subject */}
                      <span className="flex-1 text-[15px] text-grey-500 dark:text-[#A8B8CC] truncate min-w-0">
                        {email.subject}
                      </span>

                      {/* Year badge + date */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {email.year && (
                          <Badge variant="default">{email.year}</Badge>
                        )}
                        <span className="text-[13px] text-grey-400 dark:text-[#6B7E95] min-w-[80px] text-right">
                          {new Date(email.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delegate Modal */}
      <Modal
        isOpen={showDelegateModal}
        onClose={() => setShowDelegateModal(false)}
        title="Delegate to Junior Coordinator"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-grey-700 dark:text-[#A8B8CC] mb-1">
              Select JC
            </label>
            <select
              value={selectedJc}
              onChange={(e) => setSelectedJc(e.target.value)}
              className={inputCls}
            >
              <option value="">Select a JC...</option>
              {jcUsers.map((jc) => (
                <option key={jc.uid} value={jc.email}>
                  {jc.name} ({jc.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowDelegateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDelegate} disabled={!selectedJc || delegating}>
              {delegating ? 'Delegating...' : 'Delegate'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Company"
      >
        <div className="space-y-4">
          <p className="text-sm text-grey-700 dark:text-[#A8B8CC]">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-grey-900 dark:text-[#F0F4FA]">{company.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCompany} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Company'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Email Detail Modal */}
      <Modal
        isOpen={!!selectedEmail}
        onClose={() => { setSelectedEmail(null); setSelectedEmailDetail(null); }}
        title="Email"
        maxWidth="max-w-4xl"
      >
        {selectedEmail && (
          <div className="flex flex-col" style={{ height: '75vh' }}>
            {/* Email metadata */}
            <div className="flex-shrink-0 mb-4 pb-4 border-b border-grey-200 dark:border-[#243D6A]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-grey-900 dark:text-[#F0F4FA]">
                    {selectedEmail.from}
                  </p>
                  <p className="text-[12px] text-grey-400 dark:text-[#6B7E95] mt-0.5">
                    {new Date(selectedEmail.date).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <h3 className="text-[16px] font-semibold text-grey-900 dark:text-[#F0F4FA] mt-3 leading-snug">
                {selectedEmail.subject}
              </h3>
            </div>

            {/* Email body */}
            <div className="flex-1 overflow-y-auto rounded-lg border border-grey-200 dark:border-[#243D6A] bg-white dark:bg-[#0D1B2E]">
              {loadingEmail ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-7 h-7 border-2 border-navy dark:border-[#4A7FBF] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-grey-400 dark:text-[#6B7E95]">Loading email...</p>
                </div>
              ) : selectedEmailDetail ? (
                <div
                  className="p-6 email-body-container"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(selectedEmailDetail.body, {
                      ADD_TAGS: ['iframe'],
                      ADD_ATTR: ['target'],
                    }),
                  }}
                />
              ) : (
                <div className="p-6">
                  <p className="text-sm text-grey-700 dark:text-[#A8B8CC] whitespace-pre-wrap leading-relaxed">
                    {selectedEmail.snippet}
                  </p>
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-warning dark:text-[#F59E0B] rounded-lg text-sm">
                    Full content could not be loaded. Showing snippet only.
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            {selectedEmailDetail?.attachments?.length > 0 && (
              <div className="flex-shrink-0 mt-4">
                <p className="text-[11px] font-medium text-grey-400 dark:text-[#6B7E95] uppercase tracking-wide mb-2">
                  <Paperclip className="w-3 h-3 inline mr-1" />
                  Attachments ({selectedEmailDetail.attachments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedEmailDetail.attachments.map((att: any) => (
                    <a
                      key={att.attachmentId}
                      href={gmailService.getAttachmentUrl(selectedEmail.id, att.attachmentId, att.filename, att.mimeType)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-grey-50 dark:bg-[#1B3055] border border-grey-200 dark:border-[#243D6A] rounded-lg hover:border-navy dark:hover:border-[#4A7FBF] transition-all text-sm"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-grey-400 dark:text-[#6B7E95]" />
                      <span className="text-grey-900 dark:text-[#F0F4FA] font-medium truncate max-w-[160px]">
                        {att.filename}
                      </span>
                      <span className="text-grey-400 dark:text-[#6B7E95] text-[11px]">
                        {formatFileSize(att.size)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex-shrink-0 flex justify-end gap-3 mt-4 pt-4 border-t border-grey-200 dark:border-[#243D6A]">
              <Button
                variant="secondary"
                onClick={() => { setSelectedEmail(null); setSelectedEmailDetail(null); }}
              >
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
