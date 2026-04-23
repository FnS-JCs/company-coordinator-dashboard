import React from 'react';
import { Sidebar } from './Sidebar';
import { DevBanner } from './DevBanner';

export const ToolLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-grey-50 dark:bg-gray-900 flex flex-col">
      <DevBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-grey-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};
