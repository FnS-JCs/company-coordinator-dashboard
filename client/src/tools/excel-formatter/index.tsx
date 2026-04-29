import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

interface ApplicantRow {
  sNo: number;
  name: string;
  rollNo: string;
  program: string;
  course: string;
  rawRow: Record<string, any>;
}

const COURSE_ORDER: Record<string, number> = {
  'Bachelors in Commerce - Commerce': 1,
  'Bachelors in Economics - Economics': 2,
};

const COURSE_TO_PROGRAM: Record<string, string> = {
  'Bachelors in Commerce - Commerce': 'B.Com. (Hons.)',
  'Bachelors in Economics - Economics': 'B.A. (Hons.) Economics',
};

function normalizeProgram(course: string, rawProgram: string): string {
  const c = course.toLowerCase();
  if (c.includes('commerce')) return 'B.Com. (Hons.)';
  if (c.includes('economics')) return 'B.A. (Hons.) Economics';
  
  const rp = rawProgram.toLowerCase();
  if (/b\.?com/i.test(rp)) return 'B.Com. (Hons.)';
  if (/ba|b\.a/i.test(rp)) return 'B.A. (Hons.) Economics';
  return rawProgram;
}

function toTitleCase(word: string): string {
  return word.split('/').map(part =>
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join('/');
}

const ROLE_KEYWORDS = new Set([
  'intern', 'analyst', 'associate', 'executive', 'manager', 'consultant',
  'trainee', 'officer', 'engineer', 'developer', 'designer', 'coordinator',
  'assistant', 'director', 'head', 'lead', 'senior', 'junior', 'summer',
  'operations', 'finance', 'marketing', 'sales', 'hr', 'human', 'resources',
  'business', 'development', 'product', 'data', 'research', 'strategy',
  'growth', 'content', 'brand', 'digital', 'technical', 'software', 'it',
  'management', 'supply', 'chain', 'logistics', 'campus', 'graduate',
  'specialist', 'advisor', 'representative', 'lead', 'principal',
]);

function extractTitle(raw: string): string {
  // 1. Remove "LIST OF APPLICANTS FOR" prefix
  let cleaned = raw.replace(/LIST OF APPLICANTS FOR/i, '').trim();
  
  // 2. Remove common suffixes like "INTERNSHIP SEASON ...", "PLACEMENT SEASON ...", or just "INTERNSHIP/PLACEMENT"
  cleaned = cleaned.replace(/(?:INTERNSHIP|PLACEMENT)(?:\s+SEASON.*)?$/i, '').trim();
  
  if (!cleaned) return 'Applicant List';

  const words = cleaned.split(/\s+/);
  if (words.length < 2) return `Applicant List II ${toTitleCase(cleaned)}`;

  // Find splitting point (Keyword based)
  let splitIdx = -1;
  for (let i = words.length - 1; i >= 0; i--) {
    if (ROLE_KEYWORDS.has(words[i].toLowerCase())) {
      splitIdx = i + 1;
      break;
    }
  }

  // If no keyword found, check for "AT"
  if (splitIdx === -1 || splitIdx === words.length) {
    const atIdx = words.findIndex(w => w.toLowerCase() === 'at');
    if (atIdx !== -1) {
      splitIdx = atIdx + 1;
    }
  }
  
  // If still no split, try to guess: last word is usually company
  if (splitIdx === -1 || splitIdx === words.length) {
    splitIdx = words.length - 1;
  }

  let roleWords = words.slice(0, splitIdx);
  let companyWords = words.slice(splitIdx);

  // Clean up "AT" from role or company
  if (roleWords[roleWords.length - 1]?.toLowerCase() === 'at') {
    roleWords.pop();
  } else if (companyWords[0]?.toLowerCase() === 'at') {
    companyWords.shift();
  }

  const role = roleWords.map(toTitleCase).join(' ');
  const company = companyWords.map(toTitleCase).join(' ');

  return company
    ? `Applicant List II ${company} II ${role}`
    : `Applicant List II ${role}`;
}

function parseFile(buffer: ArrayBuffer): { title: string; applicants: ApplicantRow[]; allHeaders: string[] } {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

  // Find header row first to know where the table starts
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = (rows[i] as unknown[] || []).map(h => String(h).toLowerCase());
    if (row.includes('name') && (row.includes('roll no') || row.includes('roll number'))) {
      headerRowIdx = i;
      break;
    }
  }

  // Try to find title in rows ABOVE the header row
  let rawTitle = '';
  const searchLimit = headerRowIdx !== -1 ? headerRowIdx : 10;
  for (let i = 0; i < searchLimit; i++) {
    const row = rows[i] as unknown[];
    if (!row) continue;
    
    const potentialTitle = row.find(cell => {
      const s = String(cell).toUpperCase();
      return (s.includes('LIST') || s.includes('FOR')) && 
             (s.includes('INTERN') || s.includes('PLACEMENT') || s.includes('ROLE'));
    });
    
    if (potentialTitle) {
      rawTitle = String(potentialTitle);
      break;
    }
  }
  
  // Fallback to rows[1][1] if no title found with keywords
  if (!rawTitle && rows[1]) {
    rawTitle = String((rows[1] as unknown[])?.[1] ?? '');
  }

  const title = rawTitle ? extractTitle(rawTitle) : 'Applicant List';

  if (headerRowIdx === -1) {
    throw new Error('Could not find header row with "Name" and "Roll No"');
  }

  const headerRow = (rows[headerRowIdx] as unknown[]).map(h => String(h).trim());
  const allHeaders = headerRow.filter(h => h !== '');

  const findIdx = (name: string) =>
    headerRow.findIndex(h => h.trim().toLowerCase() === name.toLowerCase() || 
                           (name === 'Roll No' && h.trim().toLowerCase() === 'roll number'));

  const sNoIdx = findIdx('S.No.');
  const nameIdx = findIdx('Name');
  const rollIdx = findIdx('Roll No');
  const courseIdx = findIdx('Course');
  const programIdx = findIdx('Program');

  const applicants: ApplicantRow[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const sNoRaw = row[sNoIdx];
    const nameRaw = row[nameIdx];
    
    // Skip if S.No is missing or not a number, but check if name exists to be sure
    if ((sNoRaw === '' || sNoRaw === null || sNoRaw === undefined || isNaN(Number(sNoRaw))) && !nameRaw) continue;

    const course = String(row[courseIdx] ?? '').trim();
    
    // Create a map of header to value for rawRow
    const rawRow: Record<string, any> = {};
    headerRow.forEach((header, idx) => {
      if (header) rawRow[header] = row[idx];
    });

    applicants.push({
      sNo: Number(sNoRaw) || 0,
      name: String(nameRaw ?? '').trim(),
      rollNo: String(row[rollIdx] ?? '').trim(),
      program: normalizeProgram(course, String(row[programIdx] ?? '').trim()),
      course,
      rawRow,
    });
  }

  applicants.sort((a, b) => {
    const ac = a.course.toLowerCase();
    const bc = b.course.toLowerCase();
    
    let ao = 99;
    if (ac.includes('commerce')) ao = 1;
    else if (ac.includes('economics')) ao = 2;
    
    let bo = 99;
    if (bc.includes('commerce')) bo = 1;
    else if (bc.includes('economics')) bo = 2;

    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });

  applicants.forEach((ap, i) => { ap.sNo = i + 1; });

  return { title, applicants, allHeaders };
}

const TITLE_STYLE = {
  font: { name: 'Trebuchet MS', sz: 12, bold: true, color: { rgb: '000000' } },
  fill: { fgColor: { rgb: 'B8CCE4' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  }
};

const HEADER_STYLE = {
  font: { name: 'Trebuchet MS', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '1B3055' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  }
};

const DATA_STYLE = {
  font: { name: 'Trebuchet MS', sz: 9, bold: false, color: { rgb: '000000' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  }
};

function styleCell(ws: XLSX.WorkSheet, addr: string, style: object) {
  if (!ws[addr]) ws[addr] = { v: '', t: 's' };
  ws[addr].s = style;
}

function buildWorkbook(title: string, applicants: ApplicantRow[], customColumns: string[] = []): XLSX.WorkBook {
  const headers = ['S.No.', 'Name', 'Roll No', 'Program', ...customColumns];
  const totalCols = headers.length + 2; // Col A (left) + Data + Col (right)
  
  const aoa: unknown[][] = [
    Array(totalCols).fill(''), // Row 1: Top padding
    ['', title, ...Array(totalCols - 2).fill('')], // Row 2: Title
    ['', ...headers, ''], // Row 3: Headers + Right padding cell
    ...applicants.map(ap => [ // Data rows
      '', 
      ap.sNo, 
      ap.name, 
      ap.rollNo, 
      ap.program,
      ...customColumns.map(col => ap.rawRow[col] ?? ''),
      '' // Right padding cell
    ]),
    Array(totalCols).fill(''), // Bottom padding row
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // AutoFit calculation for data columns
  const wscols = headers.map((header, i) => {
    let maxLen = header.length;
    
    // Check all data rows for this column
    applicants.forEach(ap => {
      let val = '';
      if (header === 'S.No.') val = String(ap.sNo);
      else if (header === 'Name') val = ap.name;
      else if (header === 'Roll No') val = ap.rollNo;
      else if (header === 'Program') val = ap.program;
      else val = String(ap.rawRow[header] ?? '');
      
      if (val.length > maxLen) maxLen = val.length;
    });

    // Padding and constraints
    return { wch: Math.min(Math.max(maxLen + 4, 10), 50) };
  });

  // Setup column widths
  const finalCols: XLSX.ColInfo[] = [];
  finalCols[0] = { wch: 3.71 }; // Column A: Left padding
  wscols.forEach((wc, i) => {
    finalCols[i + 1] = wc; // Data columns B, C, ...
  });
  finalCols[headers.length + 1] = { wch: 3.71 }; // Right padding column
  ws['!cols'] = finalCols;

  // Merges
  ws['!merges'] = [{ s: { r: 1, c: 1 }, e: { r: 1, c: headers.length } }];

  // Hide gridlines
  ws['!views'] = [{ showGridLines: false }];

  // Styling
  const colLetters = headers.map((_, i) => String.fromCharCode(66 + i)); // B, C, D, ...
  
  // Title row styling
  colLetters.forEach(col => {
    styleCell(ws, `${col}2`, TITLE_STYLE);
  });

  // Header row styling
  colLetters.forEach(col => {
    styleCell(ws, `${col}3`, HEADER_STYLE);
  });

  // Data rows styling
  for (let i = 0; i < applicants.length; i++) {
    const rowNum = i + 4;
    colLetters.forEach(col => {
      styleCell(ws, `${col}${rowNum}`, DATA_STYLE);
    });
  }

  const workbook = XLSX.utils.book_new();
  workbook.Workbook = {
    Views: [{ showGridLines: false }]
  };
  XLSX.utils.book_append_sheet(workbook, ws, 'Applicant List');
  return workbook;
}

type ToolState = 'idle' | 'preview' | 'done';

const ExcelFormatterTool: React.FC = () => {
  const navigate = useNavigate();
  const [toolState, setToolState] = useState<ToolState>('idle');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [allHeaders, setAllHeaders] = useState<string[]>([]);
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputFileName, setInputFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Please upload an .xlsx file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { title, applicants, allHeaders } = parseFile(e.target!.result as ArrayBuffer);
        setTitle(title);
        setApplicants(applicants);
        setAllHeaders(allHeaders);
        setInputFileName(file.name);
        setToolState('preview');
      } catch (err) {
        setError(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDownload = () => {
    const wb = buildWorkbook(title, applicants, selectedHeaders);
    const outName = `${title}.xlsx`;
    XLSX.writeFile(wb, outName, { bookType: 'xlsx', cellStyles: true });
    setToolState('done');
  };

  const reset = () => {
    setToolState('idle');
    setTitle('');
    setApplicants([]);
    setAllHeaders([]);
    setSelectedHeaders([]);
    setInputFileName('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const availableHeaders = allHeaders.filter(h => 
    !['s.no.', 'name', 'roll no', 'roll number', 'course', 'program'].includes(h.toLowerCase())
  );

  const toggleHeader = (header: string) => {
    setSelectedHeaders(prev => 
      prev.includes(header) ? prev.filter(h => h !== header) : [...prev, header]
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-1.5 rounded-lg text-grey-400 dark:text-[#6B7E95] hover:text-grey-700 dark:hover:text-[#A8B8CC] hover:bg-grey-100 dark:hover:bg-[#1B3055] transition-all"
          aria-label="Go back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-grey-900 dark:text-[#F0F4FA]">Excel Auto-formatter</h1>
      </div>
      <p className="text-sm text-grey-500 dark:text-[#6B7E95] mb-6 ml-8">
        Formats Superset applicant export files into a clean applicant list.
      </p>

      {toolState === 'idle' && (
        <Card>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-navy bg-navy/5 dark:bg-blue-900/10'
                : 'border-grey-300 dark:border-[#243D6A] hover:border-navy hover:bg-grey-50 dark:hover:bg-[#1B3055]/30'
            }`}
          >
            <svg
              className="mx-auto mb-3 w-10 h-10 text-grey-400 dark:text-[#6B7E95]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-grey-700 dark:text-[#A8B8CC] font-medium">Drop your Superset export here</p>
            <p className="text-grey-400 dark:text-[#6B7E95] text-sm mt-1">or click to browse (.xlsx files only)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              className="hidden"
            />
          </div>
          {error && <p className="mt-3 text-red-500 dark:text-red-400 text-sm">{error}</p>}
        </Card>
      )}

      {toolState === 'preview' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-grey-400 dark:text-[#6B7E95] uppercase tracking-wide mb-0.5">File</p>
                <p className="text-grey-900 dark:text-[#F0F4FA] font-medium text-sm">{inputFileName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-grey-400 dark:text-[#6B7E95] uppercase tracking-wide mb-0.5">Applicants</p>
                <p className="text-navy dark:text-[#4A7FBF] font-bold text-2xl">{applicants.length}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-grey-400 dark:text-[#6B7E95] uppercase tracking-wide mb-1">Output Title</p>
              <p className="text-grey-900 dark:text-[#F0F4FA] text-sm font-medium bg-grey-50 dark:bg-[#1B3055] rounded px-3 py-2 border border-grey-200 dark:border-[#243D6A]">
                {title}
              </p>
            </div>
          </Card>

          <Card>
            <p className="text-xs text-grey-400 dark:text-[#6B7E95] uppercase tracking-wide mb-3">
              Preview: first 5 rows (sorted)
            </p>
            <div className="overflow-x-auto rounded-lg border border-grey-200 dark:border-[#243D6A]">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#1B3055', color: '#FFFFFF' }}>
                    <th className="px-3 py-2 text-center font-semibold w-16 border-r border-white/20">S.No.</th>
                    <th className="px-3 py-2 text-center font-semibold border-r border-white/20">Name</th>
                    <th className="px-3 py-2 text-center font-semibold w-28 border-r border-white/20">Roll No</th>
                    <th className="px-3 py-2 text-center font-semibold w-44 border-r border-white/20">Program</th>
                    {selectedHeaders.map(header => (
                      <th key={header} className="px-3 py-2 text-center font-semibold border-r border-white/20 min-w-[120px]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applicants.slice(0, 5).map((ap) => (
                    <tr key={ap.sNo} className="border-t border-grey-100 dark:border-[#243D6A] even:bg-grey-50 dark:even:bg-gray-700/30">
                      <td className="px-3 py-2 text-center text-grey-500 dark:text-[#6B7E95] border-r border-grey-100 dark:border-[#243D6A]">{ap.sNo}</td>
                      <td className="px-3 py-2 text-center text-grey-900 dark:text-[#F0F4FA] border-r border-grey-100 dark:border-[#243D6A]">{ap.name}</td>
                      <td className="px-3 py-2 text-center text-grey-600 dark:text-[#6B7E95] border-r border-grey-100 dark:border-[#243D6A]">{ap.rollNo}</td>
                      <td className="px-3 py-2 text-center text-grey-600 dark:text-[#6B7E95] border-r border-grey-100 dark:border-[#243D6A]">{ap.program}</td>
                      {selectedHeaders.map(header => (
                        <td key={header} className="px-3 py-2 text-center text-grey-600 dark:text-[#6B7E95] border-r border-grey-100 dark:border-[#243D6A]">
                          {ap.rawRow[header] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {applicants.length > 5 && (
              <p className="text-xs text-grey-400 dark:text-[#6B7E95] mt-2 text-center">
                +{applicants.length - 5} more rows in the download
              </p>
            )}
          </Card>

          <div className="flex gap-3">
            <div className="inline-flex rounded-lg overflow-hidden shadow-sm">
              <Button
                onClick={handleDownload}
                className="rounded-r-none border-r border-white/10"
              >
                Download Formatted File
              </Button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-navy hover:bg-navy-hover text-white px-3 flex items-center transition-colors border-l border-white/10"
                title="Custom Columns"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <Button variant="ghost" onClick={reset}>Upload Another</Button>
          </div>
        </div>
      )}

      {toolState === 'done' && (
        <Card className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-grey-900 dark:text-[#F0F4FA] font-semibold text-lg">File downloaded!</p>
          <p className="text-grey-400 dark:text-[#6B7E95] text-sm mt-1">
            {inputFileName.replace(/\.xlsx$/i, '_formatted.xlsx')}
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="secondary" onClick={handleDownload}>Download Again</Button>
            <Button onClick={reset}>Format Another File</Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Customise Columns"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-grey-500 dark:text-[#6B7E95]">
            Select additional columns from the original file to include in the formatted export.
          </p>

          <div className="max-h-60 overflow-y-auto border border-grey-200 dark:border-[#243D6A] rounded-lg p-3 space-y-2">
            {availableHeaders.length > 0 ? (
              availableHeaders.map(header => (
                <label key={header} className="flex items-center gap-3 p-2 hover:bg-grey-50 dark:hover:bg-[#1B3055] rounded cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedHeaders.includes(header)}
                    onChange={() => toggleHeader(header)}
                    className="w-4 h-4 text-navy border-grey-300 dark:border-[#243D6A] rounded focus:ring-navy dark:focus:ring-[#4A7FBF]"
                  />
                  <span className="text-sm text-grey-700 dark:text-[#A8B8CC]">{header}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-grey-400 dark:text-[#6B7E95] text-center py-4">No additional columns found.</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsModalOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExcelFormatterTool;
