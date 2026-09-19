import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { BomDashboardPage } from './pages/BomDashboardPage';

const navItems = [
  { label: 'Giám sát doanh thu', href: '/bom' },
  { label: 'Cấu hình khung giá', href: '/bom/pricing' },
  { label: 'Chính sách cọc & gia hạn', href: '/bom/policies' },
  { label: 'Báo cáo toàn hệ thống', href: '/bom/reports' },
];

export const BomRoutes: React.FC = () => {
  return (
    <DashboardLayout portalTitle="BOM Portal" navItems={navItems}>
      <Routes>
        <Route index element={<BomDashboardPage />} />
      </Routes>
    </DashboardLayout>
  );
};
