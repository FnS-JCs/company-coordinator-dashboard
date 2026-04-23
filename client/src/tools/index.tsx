import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

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
      <React.Suspense fallback={<div>Loading...</div>}>
        <Component />
      </React.Suspense>
    }
  />
));
