import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { UnitCatalogPage } from './pages/UnitCatalogPage';

const navItems = [
  { label: 'Tong quan co so', href: '/manager' },
  { label: 'Quan ly o kho', href: '/manager/units' },
  { label: 'Hop dong & Khach thue', href: '/manager/contracts' },
  { label: 'Phan cong nhan vien', href: '/manager/staff-assignment' },
  { label: 'Xu ly su co (Ticket)', href: '/manager/incidents' },
  { label: 'Bao cao co so', href: '/manager/reports' },
];

export const ManagerRoutes: React.FC = () => {
  return (
    <DashboardLayout portalTitle="Facility Manager" navItems={navItems}>
      <Routes>
        <Route index element={<ManagerDashboardPage />} />
        <Route path="units" element={<UnitCatalogPage />} />
      </Routes>
    </DashboardLayout>
  );
};
