import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';

const navItems = [
  { label: 'Quản lý tài khoản', href: '/admin' },
  { label: 'Phân quyền vai trò', href: '/admin/roles' },
  { label: 'Gán cơ sở nhân sự', href: '/admin/facility-assignments' },
  { label: 'Nhật ký hoạt động (SA-04)', href: '/admin/activity-logs' },
];

export const AdminRoutes: React.FC = () => {
  return (
    <DashboardLayout portalTitle="System Admin" navItems={navItems}>
      <Routes>
        <Route index element={<AdminUsersPage key="all" />} />
        <Route path="users" element={<AdminUsersPage key="users" />} />
        <Route path="roles" element={<AdminUsersPage key="roles" defaultRoleFilter="FACILITY_MANAGER" />} />
        <Route path="facility-assignments" element={<AdminUsersPage key="facility" defaultRoleFilter="FACILITY_STAFF" />} />
        <Route path="activity-logs" element={<AdminAuditLogsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>

    </DashboardLayout>
  );
};

