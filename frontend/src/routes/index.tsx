import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerRoutes } from '@/features/customer/CustomerRoutes';
import { StaffRoutes } from '@/features/staff/StaffRoutes';
import { BomRoutes } from '@/features/bom/BomRoutes';
import { ManagerRoutes } from '@/features/manager/ManagerRoutes';
import { AdminRoutes } from '@/features/admin/AdminRoutes';
import { AuthRoutes } from '@/features/auth/AuthRoutes';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang chủ và Portal Khách hàng (WS1) */}
        <Route path="/*" element={<CustomerRoutes />} />
        <Route path="/customer/*" element={<CustomerRoutes />} />

        {/* Portal Nhân viên cơ sở (WS2) */}
        <Route path="/staff/*" element={<StaffRoutes />} />

        {/* Portal Quản lý kinh doanh BOM (WS3) */}
        <Route path="/bom/*" element={<BomRoutes />} />

        {/* Portal Quản lý cơ sở & Quản trị hệ thống (WS4) */}
        <Route path="/manager/*" element={<ManagerRoutes />} />
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Luồng đăng nhập / xác thực */}
        <Route path="/auth/*" element={<AuthRoutes />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
