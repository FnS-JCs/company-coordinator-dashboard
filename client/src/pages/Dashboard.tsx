import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { companyService, settingsService, gmailService } from '../services/api';
import type { Company } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [academicYear, setAcademicYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState<'placement' | 'internship'>('placement');
  const [rounds, setRounds] = useState<{ name: string; date: string }[]>([{ name: '', date: '' }]);
  const [creating, setCreating] = useState(false);
  const [createdLabels, setCreatedLabels] = useState<{ labelSc: string; labelCompany: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'placement' | 'internship'>('placement');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [companiesData, yearData] = await Promise.all([
        companyService.getCompanies(),
        settingsService.getAcademicYear(),
      ]);
      setCompanies(companiesData);
      setAcademicYear(yearData.year);

      if (companiesData.length > 0) {
        const ids = companiesData.map((c: Company) => c.id);
        gmailService
          .getUnreadCounts(ids)
          .then((data) => setUnreadCounts(data.counts))
          .catch(() => {});
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const placementCompanies = companies.filter((c) => c.type === 'placement');
  const internshipCompanies = companies.filter((c) => c.type === 'internship');
  const displayedCompanies =
    activeTab === 'placement' ? placementCompanies : internshipCompanies;

  const handleCreateCompany = async () => {
    if (!companyName.trim()) return;
    setCreating(true);
    try {
      const company = await companyService.createCompany({
        name: companyName,
        type: companyType,
        rounds: rounds.filter((r) => r.name.trim() && r.date.trim()),
      });
      setShowCreateModal(false);
      setCompanyName('');
      setCompanyType('placement');
      setRounds([{ name: '', date: '' }]);
      setCreatedLabels({ labelSc: company.labelSc, labelCompany: company.labelCompany });
      setActiveTab(companyType);
      loadData();
    } catch (error) {
      console.error('Failed to create company:', error);
    } finally {
      setCreating(false);
    }
  };

  const addRound = () => setRounds([...rounds, { name: '', date: '' }]);

  const updateRound = (index: number, field: 'name' | 'date', value: string) => {
    const updated = [...rounds];
    updated[index][field] = value;
    setRounds(updated);
  };

  const removeRound = (index: number) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-grey-50 dark:bg-[#0D1B2E]">
        <Sidebar onCreateCompany={() => setShowCreateModal(true)} />
        <div className="ml-[260px] min-h-screen flex items-center justify-center">
          <p className="text-grey-400 dark:text-[#6B7E95] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-[#0D1B2E]">
      <Sidebar onCreateCompany={() => setShowCreateModal(true)} />

      <main className="ml-[260px] overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          {/* Page header */}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold text-grey-900 dark:text-[#F0F4FA]">My Companies</h1>
            {academicYear && (
              <span className="text-[11px] font-medium text-grey-400 dark:text-[#6B7E95] px-2.5 py-1 rounded-full border border-grey-200 dark:border-[#243D6A] uppercase tracking-wide">
                {academicYear}
              </span>
            )}
          </div>
          <p className="text-sm text-grey-400 dark:text-[#6B7E95] mb-6">
            {placementCompanies.length + internshipCompanies.length} companies assigned
          </p>

          {/* Tab bar */}
          <div className="flex border-b border-grey-200 dark:border-[#243D6A] mb-6">
            {(
              [
                { key: 'placement', count: placementCompanies.length },
                { key: 'internship', count: internshipCompanies.length },
              ] as const
            ).map(({ key, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`pb-3 px-1 mr-6 text-sm font-medium capitalize transition-all duration-150 border-b-2 -mb-px ${
                  activeTab === key
                    ? 'border-navy dark:border-[#4A7FBF] text-navy dark:text-[#4A7FBF]'
                    : 'border-transparent text-grey-400 dark:text-[#6B7E95] hover:text-grey-900 dark:hover:text-[#A8B8CC]'
                }`}
              >
                {key}
                <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full bg-grey-100 dark:bg-[#1B3055] text-grey-500 dark:text-[#A8B8CC]">
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Company grid */}
          {displayedCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 rounded-full bg-grey-100 dark:bg-[#1B3055] flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-grey-400 dark:text-[#6B7E95]" />
              </div>
              <p className="text-sm font-medium text-grey-500 dark:text-[#A8B8CC]">
                No {activeTab} companies assigned
              </p>
              <p className="text-xs text-grey-400 dark:text-[#6B7E95] mt-1">
                Contact your coordinator to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCompanies.map((company) => {
                const unread = unreadCounts[company.id] || 0;
                return (
                  <div
                    key={company.id}
                    onClick={() => navigate(`/dashboard/company/${company.id}`)}
                    className="relative bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] p-5 cursor-pointer transition-all duration-150 hover:shadow-sm hover:border-grey-400 dark:hover:border-[#4A7FBF]"
                  >
                    {/* Unread badge — absolute top right */}
                    {unread > 0 && (
                      <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-danger text-white text-[11px] font-semibold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}

                    {/* Company name */}
                    <h3 className="text-[17px] font-semibold text-grey-900 dark:text-[#F0F4FA] leading-tight pr-6">
                      {company.name}
                    </h3>

                    {/* Badges row */}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={company.type === 'placement' ? 'navy' : 'teal'}>
                        {company.type}
                      </Badge>
                      {company.delegatedToJcEmail && (
                        <Badge variant="warning">Delegated</Badge>
                      )}
                    </div>

                    {/* Round count */}
                    <div className="flex items-center gap-1.5 mt-3">
                      <Building2 className="w-3.5 h-3.5 text-grey-400 dark:text-[#6B7E95]" />
                      <span className="text-xs text-grey-400 dark:text-[#6B7E95]">
                        {company.rounds.length} round{company.rounds.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Open button — always visible */}
                    <div className="mt-4">
                      <div className="w-full h-8 flex items-center justify-center rounded-lg bg-navy dark:bg-[#4A7FBF] text-white text-[12px] font-semibold">
                        Open
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Created labels toast */}
      {createdLabels && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg bg-white dark:bg-[#122240] border border-grey-200 dark:border-[#243D6A] shadow-xl rounded-xl p-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-semibold text-grey-900 dark:text-[#F0F4FA] text-sm mb-2">
                Company created. Ask GRC to apply these labels to relevant emails:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm font-mono text-grey-700 dark:text-[#A8B8CC]">
                <li>{createdLabels.labelSc}</li>
                <li>{createdLabels.labelCompany}</li>
              </ol>
            </div>
            <button
              onClick={() => setCreatedLabels(null)}
              className="text-grey-400 hover:text-grey-700 dark:text-[#6B7E95] dark:hover:text-[#A8B8CC] shrink-0 text-lg leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Company"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-grey-700 dark:text-[#A8B8CC] mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full h-10 px-3 border border-grey-200 dark:border-[#243D6A] rounded-lg bg-white dark:bg-[#0D1B2E] text-grey-900 dark:text-[#F0F4FA] placeholder-grey-400 dark:placeholder-[#6B7E95] text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-[#4A7FBF]"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-grey-700 dark:text-[#A8B8CC] mb-2">
              Type
            </label>
            <div className="flex gap-4">
              {(['placement', 'internship'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={companyType === type}
                    onChange={() => setCompanyType(type)}
                    className="accent-navy"
                  />
                  <span className="text-sm text-grey-700 dark:text-[#A8B8CC] capitalize">
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-grey-700 dark:text-[#A8B8CC] mb-2">
              Rounds
            </label>
            <div className="space-y-2">
              {rounds.map((round, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={round.name}
                    onChange={(e) => updateRound(index, 'name', e.target.value)}
                    placeholder="Round name"
                    className="flex-1 h-10 px-3 border border-grey-200 dark:border-[#243D6A] rounded-lg bg-white dark:bg-[#0D1B2E] text-grey-900 dark:text-[#F0F4FA] placeholder-grey-400 dark:placeholder-[#6B7E95] text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-[#4A7FBF]"
                  />
                  <input
                    type="date"
                    value={round.date}
                    onChange={(e) => updateRound(index, 'date', e.target.value)}
                    className="flex-1 h-10 px-3 border border-grey-200 dark:border-[#243D6A] rounded-lg bg-white dark:bg-[#0D1B2E] text-grey-900 dark:text-[#F0F4FA] text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-[#4A7FBF]"
                  />
                  {rounds.length > 1 && (
                    <button
                      onClick={() => removeRound(index)}
                      className="p-2 text-grey-400 hover:text-danger transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addRound}
              className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-navy dark:text-[#4A7FBF] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Add Round
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCompany}
              disabled={!companyName.trim() || creating}
            >
              {creating ? 'Creating...' : 'Create Company'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
