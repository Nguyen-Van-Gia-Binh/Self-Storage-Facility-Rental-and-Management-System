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
import { StaffAssignmentPage } from './pages/StaffAssignmentPage';
import { IncidentManagementPage } from './pages/IncidentManagementPage';
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

        {/* Các trang quản trị khác */}
        <Route path="staff-assignment" element={<StaffAssignmentPage />} />
        <Route path="incidents" element={<IncidentManagementPage />} />
        <Route path="reports" element={<FacilityReportsPage />} />
      </Routes>
    </DashboardLayout>
  );
};
