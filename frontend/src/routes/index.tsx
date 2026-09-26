// frontend/src/routes/index.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerRoutes } from '@/features/customer/CustomerRoutes';
import { StaffRoutes } from '@/features/staff/StaffRoutes';
import { BomRoutes } from '@/features/bom/BomRoutes';
import { ManagerRoutes } from '@/features/manager/ManagerRoutes';
import { AdminRoutes } from '@/features/admin/AdminRoutes';
import { AuthRoutes } from '@/features/auth/AuthRoutes';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UnauthorizedPage } from '@/components/auth/UnauthorizedPage';

import { SandboxCheckoutPage } from '@/features/customer/pages/SandboxCheckoutPage';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Cổng giả lập thanh toán VietQR Sandbox (Mobile-friendly checkout) */}
        <Route path="/payment/checkout" element={<SandboxCheckoutPage />} />

        {/* Trang chủ và Portal Khách hàng (WS1) - Công khai */}
        <Route path="/*" element={<CustomerRoutes />} />
        <Route path="/customer/*" element={<CustomerRoutes />} />

        {/* Portal Nhân viên cơ sở (WS2) - Yêu cầu role STAFF hoặc ADMIN */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
              <StaffRoutes />
            </ProtectedRoute>
          }
        />

        {/* Portal Quản lý kinh doanh BOM (WS3) - Yêu cầu role BOM hoặc ADMIN */}
        <Route
          path="/bom/*"
          element={
            <ProtectedRoute allowedRoles={['BOM', 'ADMIN']}>
              <BomRoutes />
            </ProtectedRoute>
          }
        />

        {/* Portal Quản lý cơ sở (WS4) - Yêu cầu role MANAGER hoặc ADMIN */}
        <Route
          path="/manager/*"
          element={
            <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
              <ManagerRoutes />
            </ProtectedRoute>
          }
        />

        {/* Portal Quản trị hệ thống (WS4) - Yêu cầu role ADMIN */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminRoutes />
            </ProtectedRoute>
          }
        />

        {/* Luồng đăng nhập / xác thực */}
        <Route path="/auth/*" element={<AuthRoutes />} />

        {/* Màn hình 403 khi truy cập trái vai trò */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
