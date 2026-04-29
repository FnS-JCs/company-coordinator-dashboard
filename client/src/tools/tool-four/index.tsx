import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Card } from '../../components/Card';

const ToolFour: React.FC = () => {
  const navigate = useNavigate();

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
        <h1 className="text-xl font-bold text-grey-900 dark:text-[#F0F4FA]">
          More Tools
        </h1>
      </div>
      <p className="text-sm text-grey-400 dark:text-[#6B7E95] mb-6 ml-10">
        Coming soon.
      </p>
      <Card className="flex items-center gap-3">
        <MoreHorizontal className="w-4 h-4 text-grey-400 dark:text-[#6B7E95]" />
        <p className="text-sm text-grey-500 dark:text-[#A8B8CC]">
          Additional tools are in development. Check back later.
        </p>
      </Card>
    </div>
  );
};

export default ToolFour;
