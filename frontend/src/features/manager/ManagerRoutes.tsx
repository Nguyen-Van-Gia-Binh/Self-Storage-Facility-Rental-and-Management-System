import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { UnitCatalogPage } from './pages/UnitCatalogPage';
import { ContractsHubPage } from './pages/ContractsHubPage';
import { StaffAssignmentPage } from './pages/StaffAssignmentPage';
import { IncidentManagementPage } from './pages/IncidentManagementPage';
import { FacilityReportsPage } from './pages/FacilityReportsPage';

export const ManagerRoutes: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<ManagerDashboardPage />} />
        <Route path="units" element={<UnitCatalogPage />} />
        <Route path="contracts" element={<ContractsHubPage />} />
        <Route path="staff-assignment" element={<StaffAssignmentPage />} />
        <Route path="incidents" element={<IncidentManagementPage />} />
        <Route path="reports" element={<FacilityReportsPage />} />
      </Routes>
    </DashboardLayout>
  );
};
