import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';

const tools = [
  {
    path: '/tools/cv-sorter',
    component: lazy(() => import('./cv-sorter')),
  },
  {
    path: '/tools/vcf-generator',
    component: lazy(() => import('./vcf-generator')),
  },
  {
    path: '/tools/excel-formatter',
    component: lazy(() => import('./excel-formatter')),
  },
  {
    path: '/tools/tool-four',
    component: lazy(() => import('./tool-four')),
  },
];

export const toolRoutes = tools.map(({ path, component: Component }) => (
  <Route
    key={path}
    path={path}
    element={
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-grey-50 dark:bg-[#0D1B2E]"><span className="text-sm text-grey-400 dark:text-[#6B7E95]">Loading...</span></div>}>
        <ToolLayout>
          <Component />
        </ToolLayout>
      </React.Suspense>
    }
  />
));
