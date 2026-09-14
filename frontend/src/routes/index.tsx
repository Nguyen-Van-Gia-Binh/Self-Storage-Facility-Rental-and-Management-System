import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { HomePage } from '@/features/customer/pages/HomePage';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <CustomerLayout>
              <HomePage />
            </CustomerLayout>
          }
        />
        {/* Redirect mọi route không hợp lệ về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
