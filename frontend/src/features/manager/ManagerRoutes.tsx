import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';

const navItems = [
  { label: 'Tổng quan cơ sở', href: '/manager' },
  { label: 'Quản lý ô kho', href: '/manager/units' },
  { label: 'Hợp đồng & Khách thuê', href: '/manager/contracts' },
  { label: 'Phân công nhân viên', href: '/manager/staff-assignment' },
  { label: 'Xử lý sự cố (Ticket)', href: '/manager/incidents' },
  { label: 'Báo cáo cơ sở', href: '/manager/reports' },
];

export const ManagerRoutes: React.FC = () => {
  return (
    <DashboardLayout portalTitle="Facility Manager" navItems={navItems}>
      <Routes>
        <Route index element={<ManagerDashboardPage />} />
      </Routes>
    </DashboardLayout>
  );
};
