import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { UnitCatalogPage } from './pages/UnitCatalogPage';
import { ContractsHubPage } from './pages/ContractsHubPage';
import { StaffAssignmentPage } from './pages/StaffAssignmentPage';
import { IncidentManagementPage } from './pages/IncidentManagementPage';
import { FacilityReportsPage } from './pages/FacilityReportsPage';

const navItems = [
  { label: 'Tổng quan cơ sở', href: '/manager' },
  { label: 'Quản lý ô kho', href: '/manager/units' },
  { label: 'Hợp đồng & Khách thuê', href: '/manager/contracts' },
  { label: 'Phân công nhân viên', href: '/manager/staff-assignment' },
  { label: 'Xử lý sự cố (Ticket)', href: '/manager/incidents' },
  { label: 'Báo cáo cơ sở (FM-06)', href: '/manager/reports' },
];

export const ManagerRoutes: React.FC = () => {
  return (
    <DashboardLayout portalTitle="Facility Manager" navItems={navItems}>
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
