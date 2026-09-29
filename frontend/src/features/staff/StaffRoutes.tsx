import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { StaffCheckInPage } from './pages/StaffCheckInPage';
import { StaffReturnInspectionPage } from './pages/StaffReturnInspectionPage';
import { StaffIncidentPage } from './pages/StaffIncidentPage';

export const StaffRoutes: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<StaffDashboardPage />} />
        <Route path="tasks" element={<Navigate to="/staff" replace />} />
        <Route path="checkin" element={<Navigate to="/staff/check-in" replace />} />
        <Route path="check-in" element={<StaffCheckInPage />} />
        <Route path="return" element={<StaffReturnInspectionPage />} />
        <Route path="return/:contractId" element={<StaffReturnInspectionPage />} />
        <Route path="incidents" element={<StaffIncidentPage />} />
      </Routes>
    </DashboardLayout>
  );
};

