import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';

const ToolFour: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-grey-500 dark:text-gray-400 hover:text-grey-900 dark:hover:text-gray-100 transition-colors"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-grey-900 dark:text-gray-100">Tool 4</h1>
      </div>
      <Card>
        <p className="text-grey-500 dark:text-gray-400">
          This tool is pending implementation. Check back later.
        </p>
        <p className="text-sm text-grey-400 dark:text-gray-500 mt-2">
          Drop implementation into /client/src/tools/tool-four/ and /server/src/tools/tool-four/
        </p>
      </Card>
    </div>
  );
};

export default ToolFour;
