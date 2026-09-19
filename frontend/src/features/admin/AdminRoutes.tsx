import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const navItems = [
  { label: 'Quản lý tài khoản', href: '/admin' },
  { label: 'Phân quyền vai trò', href: '/admin/roles' },
  { label: 'Gán cơ sở nhân sự', href: '/admin/facility-assignments' },
  { label: 'Nhật ký hoạt động', href: '/admin/activity-logs' },
];

export const AdminRoutes: React.FC = () => {
  return (
    <DashboardLayout portalTitle="System Admin" navItems={navItems}>
      <Routes>
        <Route index element={<AdminDashboardPage />} />
      </Routes>
    </DashboardLayout>
  );
};
