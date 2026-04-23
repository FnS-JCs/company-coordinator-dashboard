import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { companyService, settingsService } from '../services/api';
import type { Company } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [academicYear, setAcademicYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState<'placement' | 'internship'>('placement');
  const [rounds, setRounds] = useState<{ name: string; date: string }[]>([{ name: '', date: '' }]);
  const [creating, setCreating] = useState(false);

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
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <p className="text-grey-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 flex">
      <Sidebar onCreateCompany={() => setShowCreateModal(true)} />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-grey-900">My Companies</h1>
            <Badge>{academicYear}</Badge>
          </div>

          {placementCompanies.length === 0 && internshipCompanies.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-grey-500">No companies assigned yet. Contact your coordinator.</p>
            </Card>
          ) : (
            <>
              {placementCompanies.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-grey-900 mb-4">Placement Companies</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {placementCompanies.map((company) => (
                      <Card
                        key={company.id}
                        onClick={() => navigate(`/dashboard/company/${company.id}`)}
                        className="relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-grey-900">{company.name}</h3>
                          <Badge variant="success">Placement</Badge>
                        </div>
                        <p className="text-sm text-grey-500">{company.rounds.length} rounds</p>
                        {company.delegatedToJcEmail && (
                          <p className="text-xs text-grey-500 mt-1">
                            Delegated to JC
                          </p>
                        )}
                        <p className="text-navy text-sm font-medium mt-3">Open</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {internshipCompanies.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-grey-900 mb-4">Internship Companies</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {internshipCompanies.map((company) => (
                      <Card
                        key={company.id}
                        onClick={() => navigate(`/dashboard/company/${company.id}`)}
                        className="relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-grey-900">{company.name}</h3>
                          <Badge variant="warning">Internship</Badge>
                        </div>
                        <p className="text-sm text-grey-500">{company.rounds.length} rounds</p>
                        <p className="text-navy text-sm font-medium mt-3">Open</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Company"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-grey-900 mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-900 mb-1">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={companyType === 'placement'}
                  onChange={() => setCompanyType('placement')}
                  className="mr-2"
                />
                Placement
              </label>
              <label className="flex items-center">
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
            <label className="block text-sm font-medium text-grey-900 mb-1">Rounds</label>
            {rounds.map((round, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={round.name}
                  onChange={(e) => updateRound(index, 'name', e.target.value)}
                  placeholder="Round name"
                  className="flex-1 px-3 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
                />
                <input
                  type="date"
                  value={round.date}
                  onChange={(e) => updateRound(index, 'date', e.target.value)}
                  className="flex-1 px-3 py-2 border border-grey-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy"
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
              className="text-navy text-sm hover:underline mt-2"
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
