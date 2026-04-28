import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, Clipboard } from 'lucide-react';

type Tab = 'paste' | 'list';
type OutputType = 'ZIP' | 'PDF Merge';

const KEY_PATTERN = /^\d{2}[A-Z]{2}\d{3}( [A-Z])?$/;

const inputCls =
  'w-full h-10 px-3 border border-grey-200 dark:border-[#243D6A] rounded-lg bg-white dark:bg-[#0D1B2E] text-grey-900 dark:text-[#F0F4FA] placeholder-grey-400 dark:placeholder-[#6B7E95] text-sm focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-[#4A7FBF]';

const CVSorterTool: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('paste');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [outputType, setOutputType] = useState<OutputType>('ZIP');

  const validation = useMemo(() => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const seen = new Map<string, number>();
    lines.forEach((line) => seen.set(line, (seen.get(line) ?? 0) + 1));

    let valid = 0;
    let duplicates = 0;
    let invalid = 0;

    seen.forEach((count, key) => {
      if (!KEY_PATTERN.test(key)) {
        invalid += count;
      } else if (count > 1) {
        duplicates += count;
      } else {
        valid += 1;
      }
    });

    return { valid, duplicates, invalid };
  }, [rawText]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawText((prev) => (prev ? prev + '\n' + text : text));
    } catch {
      /* clipboard access denied */
    }
  };

  const downloadLabel =
    validation.valid === 0
      ? 'No valid entries'
      : `Download ${validation.valid} CV${validation.valid === 1 ? '' : 's'}`;

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 p-1.5 rounded-lg text-grey-400 dark:text-[#6B7E95] hover:text-grey-700 dark:hover:text-[#A8B8CC] hover:bg-grey-100 dark:hover:bg-[#1B3055] transition-all"
            aria-label="Go back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-grey-900 dark:text-[#F0F4FA]">CV Sorter</h1>
            <p className="text-sm text-grey-400 dark:text-[#6B7E95] mt-0.5">
              Select and export CVs in bulk.
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-grey-500 dark:text-[#A8B8CC] border border-grey-200 dark:border-[#243D6A] rounded-lg bg-white dark:bg-[#122240] hover:bg-grey-50 dark:hover:bg-[#1B3055] transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-[#122240] rounded-xl border border-grey-200 dark:border-[#243D6A] overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-grey-200 dark:border-[#243D6A]">
          {(
            [
              { key: 'paste', label: 'Paste Keys' },
              { key: 'list', label: 'Select from List' },
            ] as { key: Tab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all duration-150 -mb-px ${
                activeTab === key
                  ? 'border-navy dark:border-[#4A7FBF] text-navy dark:text-[#4A7FBF]'
                  : 'border-transparent text-grey-400 dark:text-[#6B7E95] hover:text-grey-700 dark:hover:text-[#A8B8CC]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === 'paste' ? (
            <div className="flex gap-5">
              {/* Left — 60% */}
              <div className="flex-[3] min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-medium text-grey-700 dark:text-[#A8B8CC]">
                    Paste Keys (one per line)
                  </label>
                  <button
                    onClick={handlePasteFromClipboard}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-lg border border-grey-200 dark:border-[#243D6A] text-grey-500 dark:text-[#A8B8CC] bg-white dark:bg-[#0D1B2E] hover:border-navy dark:hover:border-[#4A7FBF] hover:text-navy dark:hover:text-[#4A7FBF] transition-all"
                  >
                    <Clipboard className="w-3 h-3" />
                    Paste
                  </button>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={"24BC581 A\n23BC501 B\n22CS123..."}
                  className="w-full rounded-lg border border-grey-200 dark:border-[#243D6A] bg-grey-50 dark:bg-[#0D1B2E] text-sm text-grey-900 dark:text-[#F0F4FA] placeholder-grey-400 dark:placeholder-[#6B7E95] px-3 py-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-[#4A7FBF] focus:border-transparent font-mono"
                  style={{ minHeight: 400 }}
                />
              </div>

              {/* Right — 40% */}
              <div className="flex-[2] min-w-0">
                <div className="rounded-xl border border-grey-200 dark:border-[#243D6A] bg-grey-50 dark:bg-[#0D1B2E] p-4">
                  <h3 className="text-[13px] font-semibold text-grey-700 dark:text-[#A8B8CC] mb-4">
                    Validation Status
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                      <span className="text-sm text-grey-700 dark:text-[#A8B8CC]">
                        <span className="font-semibold text-grey-900 dark:text-[#F0F4FA]">
                          {validation.valid}
                        </span>{' '}
                        valid {validation.valid === 1 ? 'entry' : 'entries'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                      <span className="text-sm text-grey-700 dark:text-[#A8B8CC]">
                        <span className="font-semibold text-grey-900 dark:text-[#F0F4FA]">
                          {validation.duplicates}
                        </span>{' '}
                        duplicate{validation.duplicates === 1 ? '' : 's'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-danger flex-shrink-0" />
                      <span className="text-sm text-grey-700 dark:text-[#A8B8CC]">
                        <span className="font-semibold text-grey-900 dark:text-[#F0F4FA]">
                          {validation.invalid}
                        </span>{' '}
                        invalid
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-grey-400 dark:text-[#6B7E95]">
                Candidate list integration coming soon.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Below-tab controls */}
      <div className="mt-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[12px] font-medium text-grey-500 dark:text-[#A8B8CC] mb-1">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="CVs_Export"
              className={inputCls}
            />
          </div>
          <div className="w-44">
            <label className="block text-[12px] font-medium text-grey-500 dark:text-[#A8B8CC] mb-1">
              Output Type
            </label>
            <select
              value={outputType}
              onChange={(e) => setOutputType(e.target.value as OutputType)}
              className={inputCls}
            >
              <option value="ZIP">ZIP</option>
              <option value="PDF Merge">PDF Merge</option>
            </select>
          </div>
        </div>

        <button
          disabled={validation.valid === 0}
          className="w-full h-10 flex items-center justify-center rounded-lg text-sm font-semibold text-white transition-all duration-150 bg-navy hover:bg-navy-hover disabled:opacity-40 disabled:cursor-not-allowed dark:bg-[#4A7FBF] dark:hover:bg-[#5A90D0]"
        >
          {downloadLabel}
        </button>
      </div>
    </div>
  );
};

export default CVSorterTool;
