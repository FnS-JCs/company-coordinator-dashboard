import React, { useState, useCallback, useMemo } from 'react';
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
  const [toolState, setToolState] = useState<ToolState>('idle');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [specifyRole, setSpecifyRole] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  const parsePastedContent = useCallback(() => {
    setError(null);
    if (!pasteContent.trim()) {
      setError('Please paste some contact data first.');
      return;
    }

    try {
      const lines = pasteContent.split('\n');
      const parsedContacts: Contact[] = [];
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;
        
        // Split by Tab or Comma (supporting both TSV from Excel/Sheets and CSV)
        const parts = trimmedLine.includes('\t') 
          ? trimmedLine.split('\t') 
          : trimmedLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          
        if (parts.length >= 4) {
          parsedContacts.push({
            name: parts[0].replace(/^"|"$/g, '').trim(),
            role: parts[1].replace(/^"|"$/g, '').trim(),
            company: parts[2].replace(/^"|"$/g, '').trim(),
            number: parts[3].replace(/^"|"$/g, '').trim(),
          });
        }
      });
      
      if (parsedContacts.length === 0) {
        throw new Error('No valid contacts found. Ensure you have 4 columns: Name, Role, Company, Number.');
      }
      
      setContacts(parsedContacts);
      setToolState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse the pasted content.');
    }
  }, [pasteContent]);

  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {};
    contacts.forEach(contact => {
      if (!groups[contact.company]) {
        groups[contact.company] = [];
      }
      groups[contact.company].push(contact);
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
      
      // Tick delay to avoid browser blocking multiple downloads
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
    setPasteContent('');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-grey-900 mb-1">VCF Generator</h1>
      <p className="text-sm text-grey-500 mb-6">
        Paste contacts to generate VCF files grouped by company.
      </p>

      {toolState === 'idle' && (
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-grey-700 mb-2">
                Paste Contact Data
              </label>
              <p className="text-xs text-grey-400 mb-3">
                Expected format: Name, Role, Company, Number (one per line). Supports Tab-separated (Excel) or CSV.
              </p>
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="John Doe	HR Manager	Google	+91 9876543210"
                className="w-full h-64 p-4 text-sm font-mono border border-grey-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-6 p-4 bg-grey-50 rounded-lg border border-grey-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={specifyRole}
                  onChange={(e) => setSpecifyRole(e.target.checked)}
                  className="w-4 h-4 text-navy border-grey-300 rounded focus:ring-navy"
                />
                <div>
                  <p className="text-sm font-medium text-grey-900">Specify Role</p>
                  <p className="text-xs text-grey-500">
                    Include the role in the contact name (e.g. "Name | Role | Company")
                  </p>
                </div>
              </label>
            </div>
            
            <div className="flex flex-col items-center">
              <Button 
                onClick={parsePastedContent} 
                className="w-full max-w-xs"
              >
                Process Contacts
              </Button>
              {error && (
                <p className="mt-3 text-red-500 text-sm">{error}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {toolState === 'preview' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-grey-400 uppercase tracking-wide mb-0.5">Contacts</p>
                  <p className="text-navy font-bold text-2xl">{contacts.length}</p>
                </div>
                <div className="h-10 w-px bg-grey-200" />
                <div>
                  <p className="text-xs text-grey-400 uppercase tracking-wide mb-0.5">Companies</p>
                  <p className="text-navy font-bold text-2xl">{companyCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleDownload}>
                  Download {companyCount} VCF Files
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-xs text-grey-400 uppercase tracking-wide mb-3">
              Preview — {contacts.length} contacts across {companyCount} companies
            </p>
            <div className="overflow-x-auto rounded-lg border border-grey-200">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#1B3055', color: '#FFFFFF' }}>
                    <th className="px-3 py-2 text-center font-semibold w-16 border-r border-white/20">#</th>
                    <th className="px-3 py-2 text-left font-semibold border-r border-white/20">Name</th>
                    <th className="px-3 py-2 text-left font-semibold border-r border-white/20">Role</th>
                    <th className="px-3 py-2 text-left font-semibold border-r border-white/20">Company</th>
                    <th className="px-3 py-2 text-left font-semibold">Number</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, idx) => (
                    <tr key={idx} className="border-t border-grey-100 even:bg-grey-50">
                      <td className="px-3 py-2 text-center text-grey-500 border-r border-grey-100">{idx + 1}</td>
                      <td className="px-3 py-2 text-left text-grey-900 border-r border-grey-100">{contact.name}</td>
                      <td className="px-3 py-2 text-left text-grey-600 border-r border-grey-100">{contact.role}</td>
                      <td className="px-3 py-2 text-left text-grey-600 border-r border-grey-100">{contact.company}</td>
                      <td className="px-3 py-2 text-left text-grey-600 font-mono">{contact.number}</td>
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
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-grey-900 mb-2">Downloads Started</h3>
            <p className="text-grey-500 text-sm mb-6 max-w-sm mx-auto">
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
