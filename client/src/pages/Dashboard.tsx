import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { companyService, settingsService } from '../services/api';
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
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const placementCompanies = companies.filter((c) => c.type === 'placement');
  const internshipCompanies = companies.filter((c) => c.type === 'internship');

  const displayedCompanies = activeTab === 'placement' ? placementCompanies : internshipCompanies;

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

  const addRound = () => {
    setRounds([...rounds, { name: '', date: '' }]);
  };

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
      <div className="min-h-screen bg-grey-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-grey-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-gray-900 flex">
      <Sidebar onCreateCompany={() => setShowCreateModal(true)} />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-grey-900 dark:text-gray-100">My Companies</h1>
            <Badge>{academicYear}</Badge>
          </div>

          <div className="flex border-b border-grey-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab('placement')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'placement'
                  ? 'text-navy dark:text-blue-400 border-b-2 border-navy dark:border-blue-400'
                  : 'text-grey-500 dark:text-gray-400 hover:text-grey-700 dark:hover:text-gray-200'
              }`}
            >
              Placement ({placementCompanies.length})
            </button>
            <button
              onClick={() => setActiveTab('internship')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'internship'
                  ? 'text-navy dark:text-blue-400 border-b-2 border-navy dark:border-blue-400'
                  : 'text-grey-500 dark:text-gray-400 hover:text-grey-700 dark:hover:text-gray-200'
              }`}
            >
              Internship ({internshipCompanies.length})
            </button>
          </div>

          {displayedCompanies.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-grey-500 dark:text-gray-400">No {activeTab} companies assigned yet. Contact your coordinator.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCompanies.map((company) => (
                <Card
                  key={company.id}
                  onClick={() => navigate(`/dashboard/company/${company.id}`)}
                  className="relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-grey-900 dark:text-gray-100">{company.name}</h3>
                    <Badge variant={company.type === 'placement' ? 'success' : 'warning'}>
                      {company.type === 'placement' ? 'Placement' : 'Internship'}
                    </Badge>
                  </div>
                  <p className="text-sm text-grey-500 dark:text-gray-400">{company.rounds.length} rounds</p>
                  {company.delegatedToJcEmail && (
                    <p className="text-xs text-grey-500 dark:text-gray-400 mt-1">
                      Delegated to JC
                    </p>
                  )}
                  <p className="text-navy dark:text-blue-400 text-sm font-medium mt-3">Open</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {createdLabels && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 shadow-lg rounded-xl p-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-semibold text-grey-900 dark:text-gray-100 mb-2">
                Company created. Ask GRC to apply these two labels to relevant emails:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm font-mono text-grey-800 dark:text-gray-300">
                <li>{createdLabels.labelSc}</li>
                <li>{createdLabels.labelCompany}</li>
              </ol>
            </div>
            <button
              onClick={() => setCreatedLabels(null)}
              className="text-grey-400 dark:text-gray-500 hover:text-grey-700 dark:hover:text-gray-300 shrink-0 text-lg leading-none"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Company"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-grey-900 dark:text-gray-200 mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-grey-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-grey-900 dark:text-gray-100 placeholder-grey-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue-500"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-900 dark:text-gray-200 mb-1">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center text-grey-900 dark:text-gray-200">
                <input
                  type="radio"
                  checked={companyType === 'placement'}
                  onChange={() => setCompanyType('placement')}
                  className="mr-2"
                />
                Placement
              </label>
              <label className="flex items-center text-grey-900 dark:text-gray-200">
                <input
                  type="radio"
                  checked={companyType === 'internship'}
                  onChange={() => setCompanyType('internship')}
                  className="mr-2"
                />
                Internship
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-900 dark:text-gray-200 mb-1">Rounds</label>
            {rounds.map((round, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={round.name}
                  onChange={(e) => updateRound(index, 'name', e.target.value)}
                  placeholder="Round name"
                  className="flex-1 px-3 py-2 border border-grey-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-grey-900 dark:text-gray-100 placeholder-grey-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={round.date}
                  onChange={(e) => updateRound(index, 'date', e.target.value)}
                  className="flex-1 px-3 py-2 border border-grey-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-grey-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-blue-500"
                />
                {rounds.length > 1 && (
                  <button
                    onClick={() => removeRound(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addRound}
              className="text-navy dark:text-blue-400 text-sm hover:underline mt-2"
            >
              + Add Round
            </button>
          </div>

          <div className="flex justify-end gap-3 mt-6">
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
