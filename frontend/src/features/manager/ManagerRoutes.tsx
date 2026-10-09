import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { FacilityListPage } from './pages/FacilityListPage';
import { UnitTypeListPage } from './pages/UnitTypeListPage';
import { StorageUnitListPage } from './pages/StorageUnitListPage';
import { StorageUnitDetailPage } from './pages/StorageUnitDetailPage';
import { ContractDashboardPage } from './pages/ContractDashboardPage';
import { ContractListPage } from './pages/ContractListPage';
import { ContractDetailPage } from './pages/ContractDetailPage';
import { StaffSchedulePage } from './pages/StaffSchedulePage';
import { ShiftCalendarPage } from './pages/ShiftCalendarPage';
import { WorkListPage } from './pages/WorkListPage';
import { WorkDetailPage } from './pages/WorkDetailPage';
import { IncidentDashboardPage } from './pages/IncidentDashboardPage';
import { IncidentListPage } from './pages/IncidentListPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { FacilityReportsPage } from './pages/FacilityReportsPage';

export const ManagerRoutes: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<ManagerDashboardPage />} />

        {/* 4 Cấp độ Drill-down Quản lý ô kho (FM-01) */}
        <Route path="facilities" element={<FacilityListPage />} />
        <Route path="facilities/:facilityId" element={<UnitTypeListPage />} />
        <Route
          path="facilities/:facilityId/unit-types/:typeId"
          element={<StorageUnitListPage />}
        />
        <Route
          path="facilities/:facilityId/unit-types/:typeId/units/:unitId"
          element={<StorageUnitDetailPage />}
        />

        {/* Alias chuyển hướng /manager/units sang Cấp 1 */}
        <Route path="units" element={<Navigate to="/manager/facilities" replace />} />

        {/* 3 Cấp độ Drill-down Giám sát hợp đồng (FM-02) */}
        <Route path="contracts" element={<ContractDashboardPage />} />
        <Route path="contracts/facilities/:facilityId" element={<ContractListPage />} />
        <Route path="contracts/:contractId" element={<ContractDetailPage />} />

        {/* 4 Cấp độ Drill-down Phân công nhân sự & Ca trực (FM-05) */}
        <Route path="staff-schedule" element={<StaffSchedulePage />} />
        <Route path="staff-schedule/facilities/:facilityId" element={<ShiftCalendarPage />} />
        <Route path="staff-schedule/facilities/:facilityId/shifts" element={<WorkListPage />} />
        <Route path="staff-schedule/assignments/:assignmentId" element={<WorkDetailPage />} />

        {/* Alias chuyển hướng /manager/staff-assignment sang Cấp 1 */}
        <Route path="staff-assignment" element={<Navigate to="/manager/staff-schedule" replace />} />

        {/* 3 Cấp độ Drill-down Xử lý sự cố kỹ thuật (FM-05, Flow 7) */}
        <Route path="incidents" element={<IncidentDashboardPage />} />
        <Route path="incidents/facilities/:facilityId" element={<IncidentListPage />} />
        <Route path="incidents/:incidentId" element={<IncidentDetailPage />} />

        {/* Báo cáo thống kê */}
        <Route path="reports" element={<FacilityReportsPage />} />
      </Routes>
    </DashboardLayout>
  );
};
