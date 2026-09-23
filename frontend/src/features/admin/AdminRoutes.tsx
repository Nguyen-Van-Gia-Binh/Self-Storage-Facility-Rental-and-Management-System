import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';

export const AdminRoutes: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<AdminUsersPage key="all" />} />
        <Route path="users" element={<AdminUsersPage key="users" />} />
        <Route path="roles" element={<AdminUsersPage key="roles" defaultRoleFilter="FACILITY_MANAGER" />} />
        <Route path="facility-assignments" element={<AdminUsersPage key="facility" defaultRoleFilter="FACILITY_STAFF" />} />
        <Route path="activity-logs" element={<AdminAuditLogsPage />} />
        <Route path="logs" element={<Navigate to="/admin/activity-logs" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>

    </DashboardLayout>
  );
};

