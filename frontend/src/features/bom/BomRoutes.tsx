// frontend/src/features/bom/BomRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { BomFacilityManagementPage } from './pages/BomFacilityManagementPage';
import { BomPricingManagementPage } from './pages/BomPricingManagementPage';
import { BomDashboardPage } from './pages/BomDashboardPage';

const navItems = [
  { label: 'Danh mục cơ sở', href: '/bom/facilities' },
  { label: 'Bảng giá & Phụ phí', href: '/bom/pricing' },
  { label: 'Doanh thu toàn hệ thống', href: '/bom/revenue' },
  { label: 'Báo cáo tổng hợp', href: '/bom/reports' },
];

export const BomRoutes: React.FC = () => {
  return (
    <DashboardLayout portalTitle="BOM Operations" navItems={navItems}>
      <Routes>
        <Route index element={<Navigate to="/bom/facilities" replace />} />
        <Route path="facilities" element={<BomFacilityManagementPage />} />
        <Route path="pricing" element={<BomPricingManagementPage />} />
        <Route path="revenue" element={<BomDashboardPage />} />
        <Route path="reports" element={<BomDashboardPage initialOpenExport={true} />} />
        {/* Route tương thích */}
        <Route path="policies" element={<Navigate to="/bom/pricing" replace />} />
      </Routes>
    </DashboardLayout>
  );
};
