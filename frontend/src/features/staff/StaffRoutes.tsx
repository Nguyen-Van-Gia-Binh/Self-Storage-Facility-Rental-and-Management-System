import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { StaffCheckInPage } from './pages/StaffCheckInPage';
import { StaffReturnInspectionPage } from './pages/StaffReturnInspectionPage';

export const StaffRoutes: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<StaffDashboardPage />} />
        <Route path="tasks" element={<StaffDashboardPage />} />
        <Route path="checkin" element={<StaffCheckInPage />} />
        <Route path="check-in" element={<StaffCheckInPage />} />
        <Route path="return" element={<StaffReturnInspectionPage />} />
        <Route path="return/:contractId" element={<StaffReturnInspectionPage />} />
      </Routes>
    </DashboardLayout>
  );
};

