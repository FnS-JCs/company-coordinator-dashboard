import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

type ToolState = 'idle' | 'preview' | 'done';

interface Contact {
  name: string;
  role: string;
  company: string;
  number: string;
}

const VCFGeneratorTool: React.FC = () => {
  const navigate = useNavigate();
  const [toolState, setToolState] = useState<ToolState>('idle');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [specifyRole, setSpecifyRole] = useState(false);

  const [gridData, setGridData] = useState<Contact[]>(
    Array(5).fill({ name: '', role: '', company: '', number: '' })
  );

  const handleGridChange = (index: number, field: keyof Contact, value: string) => {
    const newData = [...gridData];
    newData[index] = { ...newData[index], [field]: value };
    setGridData(newData);
  };

  const addRow = () => {
    setGridData([...gridData, { name: '', role: '', company: '', number: '' }]);
  };

  const removeRow = (index: number) => {
    if (gridData.length <= 1) return;
    const newData = gridData.filter((_, i) => i !== index);
    setGridData(newData);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const lines = pastedData.split(/\r?\n/);

    const newRows: Contact[] = lines
      .map(line => {
        if (!line.trim()) return null;
        const parts = line.split('\t');

        if (specifyRole) {
          return {
            name: parts[0]?.trim() || '',
            role: parts[1]?.trim() || '',
            company: parts[2]?.trim() || '',
            number: parts[3]?.trim() || '',
          };
        } else {
          return {
            name: parts[0]?.trim() || '',
            role: '',
            company: parts[1]?.trim() || '',
            number: parts[2]?.trim() || '',
          };
        }
      })
      .filter((row): row is Contact => row !== null);

    if (newRows.length > 0) {
      if (gridData.length === 5 && gridData.every(r => !r.name && !r.role && !r.company && !r.number)) {
        setGridData(newRows);
      } else {
        setGridData([...gridData, ...newRows]);
      }
    }
  };

  const processContacts = useCallback(() => {
    setError(null);
    const validContacts = gridData.filter(c => c.name.trim() || c.company.trim() || c.number.trim());

    if (validContacts.length === 0) {
      setError('Please enter at least one contact.');
      return;
    }

    setContacts(validContacts);
    setToolState('preview');
  }, [gridData]);

  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    contacts.forEach(contact => {
      const companyKey = contact.company.trim() || 'Unknown Details';
      if (!groups[companyKey]) {
        groups[companyKey] = [];
      }
      groups[companyKey].push(contact);
    });
    return groups;
  }, [contacts]);

  const companyCount = Object.keys(groupedContacts).length;

  const handleDownload = useCallback(async () => {
    const companies = Object.keys(groupedContacts);

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const companyContacts = groupedContacts[company];

      let vcfContent = '';
      companyContacts.forEach(contact => {
        const displayName = specifyRole
          ? `${contact.name} | ${contact.role} | ${contact.company}`
          : `${contact.name} | ${contact.company}`;

        vcfContent += `BEGIN:VCARD\n`;
        vcfContent += `VERSION:3.0\n`;
        vcfContent += `FN:${displayName}\n`;
        vcfContent += `N:${displayName};;;;\n`;
        vcfContent += `ORG:${contact.company}\n`;
        vcfContent += `TITLE:${contact.role}\n`;
        vcfContent += `TEL;TYPE=CELL,VOICE:${contact.number}\n`;
        vcfContent += `END:VCARD\n`;
      });

      const blob = new Blob([vcfContent], { type: 'text/vcard' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${company}.vcf`;
      document.body.appendChild(link);

      await new Promise(resolve => setTimeout(resolve, 100));
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setToolState('done');
  }, [groupedContacts, specifyRole]);

  const reset = () => {
    setToolState('idle');
    setContacts([]);
    setError(null);
    setGridData(Array(5).fill({ name: '', role: '', company: '', number: '' }));
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={() => navigate(-1)}
          className="text-grey-500 dark:text-gray-400 hover:text-grey-900 dark:hover:text-gray-100 transition-colors"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-grey-900 dark:text-gray-100">VCF Generator</h1>
      </div>
      <p className="text-sm text-grey-500 dark:text-gray-400 mb-6 ml-8">
        Enter contact details in the sheet below to generate VCF files.
      </p>

      {toolState === 'idle' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-grey-700 dark:text-gray-300 uppercase tracking-wider">Contact Sheet</h2>
              <p className="text-xs text-grey-400 dark:text-gray-500 italic">Tip: You can paste data directly from Excel or Google Sheets</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-grey-200 dark:border-gray-700">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-grey-50 dark:bg-gray-700/50 border-b border-grey-200 dark:border-gray-700">
                    <th className="w-12 py-2 px-3 text-xs font-bold text-grey-400 dark:text-gray-500 text-center border-r border-grey-200 dark:border-gray-700">#</th>
                    <th className="py-2 px-3 text-left text-xs font-bold text-grey-600 dark:text-gray-400 uppercase border-r border-grey-200 dark:border-gray-700">Name</th>
                    {specifyRole && <th className="py-2 px-3 text-left text-xs font-bold text-grey-600 dark:text-gray-400 uppercase border-r border-grey-200 dark:border-gray-700">Role</th>}
                    <th className="py-2 px-3 text-left text-xs font-bold text-grey-600 dark:text-gray-400 uppercase border-r border-grey-200 dark:border-gray-700">Details</th>
                    <th className="py-2 px-3 text-left text-xs font-bold text-grey-600 dark:text-gray-400 uppercase border-r border-grey-200 dark:border-gray-700">Number</th>
                    <th className="w-10 py-2 px-3 border-grey-200 dark:border-gray-700"></th>
                  </tr>
                </thead>
                <tbody onPaste={handlePaste}>
                  {gridData.map((row, idx) => (
                    <tr key={idx} className="border-b border-grey-100 dark:border-gray-700 last:border-0 hover:bg-navy/5 dark:hover:bg-blue-900/10 transition-colors">
                      <td className="py-1 px-3 text-xs text-grey-400 dark:text-gray-500 text-center border-r border-grey-100 dark:border-gray-700 bg-grey-50/50 dark:bg-gray-700/30">{idx + 1}</td>
                      <td className="p-0 border-r border-grey-100 dark:border-gray-700">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleGridChange(idx, 'name', e.target.value)}
                          className="w-full py-2 px-3 text-sm border-none focus:ring-1 focus:ring-inset focus:ring-navy dark:focus:ring-blue-500 outline-none bg-transparent text-grey-900 dark:text-gray-100 placeholder-grey-400 dark:placeholder-gray-500"
                          placeholder="Full Name"
                        />
                      </td>
                      {specifyRole && (
                        <td className="p-0 border-r border-grey-100 dark:border-gray-700">
                          <input
                            type="text"
                            value={row.role}
                            onChange={(e) => handleGridChange(idx, 'role', e.target.value)}
                            className="w-full py-2 px-3 text-sm border-none focus:ring-1 focus:ring-inset focus:ring-navy dark:focus:ring-blue-500 outline-none bg-transparent text-grey-900 dark:text-gray-100 placeholder-grey-400 dark:placeholder-gray-500"
                            placeholder="e.g. HR Manager"
                          />
                        </td>
                      )}
                      <td className="p-0 border-r border-grey-100 dark:border-gray-700">
                        <input
                          type="text"
                          value={row.company}
                          onChange={(e) => handleGridChange(idx, 'company', e.target.value)}
                          className="w-full py-2 px-3 text-sm border-none focus:ring-1 focus:ring-inset focus:ring-navy dark:focus:ring-blue-500 outline-none bg-transparent text-grey-900 dark:text-gray-100 placeholder-grey-400 dark:placeholder-gray-500"
                          placeholder="Extra Details"
                        />
                      </td>
                      <td className="p-0 border-r border-grey-100 dark:border-gray-700">
                        <input
                          type="text"
                          value={row.number}
                          onChange={(e) => handleGridChange(idx, 'number', e.target.value)}
                          className="w-full py-2 px-3 text-sm border-none focus:ring-1 focus:ring-inset focus:ring-navy dark:focus:ring-blue-500 outline-none bg-transparent text-grey-900 dark:text-gray-100 placeholder-grey-400 dark:placeholder-gray-500"
                          placeholder="+91..."
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <button
                          onClick={() => removeRow(idx)}
                          className="text-grey-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Remove row"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={addRow}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-navy dark:text-blue-400 hover:text-navy-light dark:hover:text-blue-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Row
            </button>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={specifyRole}
                  onChange={(e) => setSpecifyRole(e.target.checked)}
                  className="w-4 h-4 text-navy border-grey-300 dark:border-gray-600 rounded focus:ring-navy dark:focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-grey-900 dark:text-gray-100 group-hover:text-navy dark:group-hover:text-blue-400 transition-colors">Specify Role</p>
                  <p className="text-xs text-grey-500 dark:text-gray-400">Include role in contact name (e.g. "Name | Role | Details")</p>
                </div>
              </label>

              <div className="flex flex-col items-end">
                <Button onClick={processContacts} className="px-8">
                  Generate VCF Files
                </Button>
                {error && <p className="mt-2 text-red-500 dark:text-red-400 text-xs font-medium">{error}</p>}
              </div>
            </div>
          </Card>
        </div>
      )}

      {toolState === 'preview' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-grey-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Contacts</p>
                  <p className="text-navy dark:text-blue-400 font-bold text-2xl">{contacts.length}</p>
                </div>
                <div className="h-10 w-px bg-grey-200 dark:bg-gray-700" />
                <div>
                  <p className="text-xs text-grey-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Details</p>
                  <p className="text-navy dark:text-blue-400 font-bold text-2xl">{companyCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setToolState('idle')}>Edit Sheet</Button>
                <Button onClick={handleDownload}>Download {companyCount} VCF Files</Button>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-xs text-grey-400 dark:text-gray-500 uppercase tracking-wide mb-3">
              Preview — Ready to generate
            </p>
            <div className="overflow-x-auto rounded-lg border border-grey-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#1B3055', color: '#FFFFFF' }}>
                    <th className="px-3 py-2 text-center font-semibold w-16 border-r border-white/20">#</th>
                    <th className="px-3 py-2 text-left font-semibold border-r border-white/20">Name</th>
                    {specifyRole && <th className="px-3 py-2 text-left font-semibold border-r border-white/20">Role</th>}
                    <th className="px-3 py-2 text-left font-semibold border-r border-white/20">Details</th>
                    <th className="px-3 py-2 text-left font-semibold">Number</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, idx) => (
                    <tr key={idx} className="border-t border-grey-100 dark:border-gray-700 even:bg-grey-50 dark:even:bg-gray-700/30">
                      <td className="px-3 py-2 text-center text-grey-500 dark:text-gray-400 border-r border-grey-100 dark:border-gray-700">{idx + 1}</td>
                      <td className="px-3 py-2 text-left text-grey-900 dark:text-gray-100 border-r border-grey-100 dark:border-gray-700">{contact.name}</td>
                      {specifyRole && <td className="px-3 py-2 text-left text-grey-600 dark:text-gray-400 border-r border-grey-100 dark:border-gray-700">{contact.role}</td>}
                      <td className="px-3 py-2 text-left text-grey-600 dark:text-gray-400 border-r border-grey-100 dark:border-gray-700">{contact.company}</td>
                      <td className="px-3 py-2 text-left text-grey-600 dark:text-gray-400 font-mono">{contact.number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {toolState === 'done' && (
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-grey-900 dark:text-gray-100 mb-2">Downloads Started</h3>
            <p className="text-grey-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              Your VCF files are being generated and downloaded. Check your browser's download folder.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={handleDownload}>Download Again</Button>
              <Button onClick={reset}>Go Again</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VCFGeneratorTool;
