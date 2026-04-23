import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

interface ApplicantRow {
  sNo: number;
  name: string;
  rollNo: string;
  program: string;
  course: string;
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
  if (COURSE_TO_PROGRAM[course]) return COURSE_TO_PROGRAM[course];
  if (/B\.?Com/i.test(rawProgram)) return 'B.Com. (Hons.)';
  if (/BA|B\.A/i.test(rawProgram)) return 'B.A. (Hons.) Economics';
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
  'management', 'supply', 'chain', 'logistics', 'campus',
]);

function extractTitle(raw: string): string {
  const match = raw.match(/FOR\s+(.+?)\s+(?:INTERNSHIP|PLACEMENT)/i);
  if (!match) return `Applicant List || ${raw}`;

  const words = match[1].trim().split(/\s+/);
  if (words.length < 2) return `Applicant List || ${toTitleCase(words[0] ?? raw)}`;

  // Scan from end: find last role keyword — company name starts right after it
  let splitIdx = words.length - 1;
  for (let i = words.length - 1; i >= 0; i--) {
    if (ROLE_KEYWORDS.has(words[i].toLowerCase())) {
      splitIdx = i + 1;
      break;
    }
    splitIdx = i;
  }
  if (splitIdx === 0) splitIdx = 1;

  const role = words.slice(0, splitIdx).map(toTitleCase).join(' ');
  const company = words.slice(splitIdx).map(toTitleCase).join(' ');

  return company
    ? `Applicant List || ${role} || ${company}`
    : `Applicant List || ${role}`;
}

function parseFile(buffer: ArrayBuffer): { title: string; applicants: ApplicantRow[] } {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

  const rawTitle = String((rows[1] as unknown[])?.[1] ?? '');
  const title = rawTitle ? extractTitle(rawTitle) : 'Applicant List';

  const headerRow = (rows[3] as unknown[]).map(h => String(h));
  const findIdx = (name: string) =>
    headerRow.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());

  const sNoIdx = findIdx('S.No.');
  const nameIdx = findIdx('Name');
  const rollIdx = findIdx('Roll No');
  const courseIdx = findIdx('Course');
  const programIdx = findIdx('Program');

  const applicants: ApplicantRow[] = [];
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const sNoRaw = row[sNoIdx];
    if (sNoRaw === '' || sNoRaw === null || sNoRaw === undefined) continue;
    if (isNaN(Number(sNoRaw))) continue;

    const course = String(row[courseIdx] ?? '').trim();
    applicants.push({
      sNo: Number(sNoRaw),
      name: String(row[nameIdx] ?? '').trim(),
      rollNo: String(row[rollIdx] ?? '').trim(),
      program: normalizeProgram(course, String(row[programIdx] ?? '').trim()),
      course,
    });
  }

  applicants.sort((a, b) => {
    const ao = COURSE_ORDER[a.course] ?? 99;
    const bo = COURSE_ORDER[b.course] ?? 99;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });

  applicants.forEach((ap, i) => { ap.sNo = i + 1; });

  return { title, applicants };
}

const TITLE_STYLE = {
  font: { name: 'Trebuchet MS', sz: 10, bold: true, color: { rgb: 'FFFFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFF5F5F5' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: { bottom: { style: 'thin', color: { rgb: 'FF000000' } } },
};

const HEADER_STYLE = {
  font: { name: 'Trebuchet MS', sz: 10, bold: true, color: { rgb: 'FFFFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'FF1B3055' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const DATA_STYLE = {
  font: { name: 'Trebuchet MS', sz: 9, bold: false, color: { rgb: 'FF000000' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
};

function styleCell(ws: XLSX.WorkSheet, addr: string, style: object) {
  const cell = ws[addr];
  if (cell) (cell as Record<string, unknown>).s = style;
}

function buildWorkbook(title: string, applicants: ApplicantRow[]): XLSX.WorkBook {
  const aoa: unknown[][] = [
    ['', '', '', '', ''],
    ['', title, '', '', ''],
    ['', 'S.No.', 'Name', 'Roll No', 'Program'],
    ...applicants.map(ap => ['', ap.sNo, ap.name, ap.rollNo, ap.program]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = [
    { wch: 3.71 },
    { wch: 7.14 },
    { wch: 38.71 },
    { wch: 10.14 },
    { wch: 20.71 },
  ];

  ws['!merges'] = [{ s: { r: 1, c: 1 }, e: { r: 1, c: 4 } }];

  styleCell(ws, 'B2', TITLE_STYLE);

  for (const col of ['B', 'C', 'D', 'E']) {
    styleCell(ws, `${col}3`, HEADER_STYLE);
  }

  for (let i = 0; i < applicants.length; i++) {
    const rowNum = i + 4;
    for (const col of ['B', 'C', 'D', 'E']) {
      styleCell(ws, `${col}${rowNum}`, DATA_STYLE);
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, 'Applicant List');
  return workbook;
}

type ToolState = 'idle' | 'preview' | 'done';

const ExcelFormatterTool: React.FC = () => {
  const [toolState, setToolState] = useState<ToolState>('idle');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
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
        const { title, applicants } = parseFile(e.target!.result as ArrayBuffer);
        setTitle(title);
        setApplicants(applicants);
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
    const wb = buildWorkbook(title, applicants);
    const outName = inputFileName.replace(/\.xlsx$/i, '_formatted.xlsx');
    XLSX.writeFile(wb, outName, { bookType: 'xlsx', cellStyles: true });
    setToolState('done');
  };

  const reset = () => {
    setToolState('idle');
    setTitle('');
    setApplicants([]);
    setInputFileName('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-grey-900 mb-1">Excel Auto-formatter</h1>
      <p className="text-sm text-grey-500 mb-6">
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
                ? 'border-navy bg-navy/5'
                : 'border-grey-300 hover:border-navy hover:bg-grey-50'
            }`}
          >
            <svg
              className="mx-auto mb-3 w-10 h-10 text-grey-400"
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
            <p className="text-grey-700 font-medium">Drop your Superset export here</p>
            <p className="text-grey-400 text-sm mt-1">or click to browse — .xlsx files only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              className="hidden"
            />
          </div>
          {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
        </Card>
      )}

      {toolState === 'preview' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-grey-400 uppercase tracking-wide mb-0.5">File</p>
                <p className="text-grey-900 font-medium text-sm">{inputFileName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-grey-400 uppercase tracking-wide mb-0.5">Applicants</p>
                <p className="text-navy font-bold text-2xl">{applicants.length}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-grey-400 uppercase tracking-wide mb-1">Output Title</p>
              <p className="text-grey-900 text-sm font-medium bg-grey-50 rounded px-3 py-2 border border-grey-200">
                {title}
              </p>
            </div>
          </Card>

          <Card>
            <p className="text-xs text-grey-400 uppercase tracking-wide mb-3">
              Preview — first 5 rows (sorted)
            </p>
            <div className="overflow-x-auto rounded-lg border border-grey-200">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#1B3055', color: '#FFFFFF' }}>
                    <th className="px-3 py-2 text-center font-semibold w-16">S.No.</th>
                    <th className="px-3 py-2 text-center font-semibold">Name</th>
                    <th className="px-3 py-2 text-center font-semibold w-28">Roll No</th>
                    <th className="px-3 py-2 text-center font-semibold w-44">Program</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.slice(0, 5).map((ap) => (
                    <tr key={ap.sNo} className="border-t border-grey-100 even:bg-grey-50">
                      <td className="px-3 py-2 text-center text-grey-500">{ap.sNo}</td>
                      <td className="px-3 py-2 text-center text-grey-900">{ap.name}</td>
                      <td className="px-3 py-2 text-center text-grey-600">{ap.rollNo}</td>
                      <td className="px-3 py-2 text-center text-grey-600">{ap.program}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {applicants.length > 5 && (
              <p className="text-xs text-grey-400 mt-2 text-center">
                +{applicants.length - 5} more rows in the download
              </p>
            )}
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleDownload}>Download Formatted File</Button>
            <Button variant="ghost" onClick={reset}>Upload Another</Button>
          </div>
        </div>
      )}

      {toolState === 'done' && (
        <Card className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-grey-900 font-semibold text-lg">File downloaded!</p>
          <p className="text-grey-400 text-sm mt-1">
            {inputFileName.replace(/\.xlsx$/i, '_formatted.xlsx')}
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="secondary" onClick={handleDownload}>Download Again</Button>
            <Button onClick={reset}>Format Another File</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ExcelFormatterTool;
