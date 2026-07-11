import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../pages/Dashboard';
import WorkspaceCreate from '../pages/WorkspaceCreate';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workspaces/new" element={<WorkspaceCreate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
