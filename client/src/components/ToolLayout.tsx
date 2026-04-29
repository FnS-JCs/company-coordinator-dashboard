import React from 'react';
import { Sidebar } from './Sidebar';
import { DevBanner } from './DevBanner';

export const ToolLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-grey-50 dark:bg-[#0D1B2E]">
      <DevBanner />
      <Sidebar />
      <main className="ml-[260px] overflow-y-auto bg-grey-50 dark:bg-[#0D1B2E]">
        {children}
      </main>
    </div>
  );
};
