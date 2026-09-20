import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { StaffCheckInPage } from './pages/StaffCheckInPage';

const navItems = [
  { label: 'Tổng quan công việc', href: '/staff' },
  { label: 'Bàn giao kho (Check-in)', href: '/staff/checkin' },
  { label: 'Nghiệm thu trả kho', href: '/staff/return' },
  { label: 'Sự cố hiện trường', href: '/staff/incidents' },
];

export const StaffRoutes: React.FC = () => {
  return (
    <DashboardLayout portalTitle="Staff Portal" navItems={navItems}>
      <Routes>
        <Route index element={<StaffDashboardPage />} />
        <Route path="checkin" element={<StaffCheckInPage />} />
      </Routes>
    </DashboardLayout>
  );
};
