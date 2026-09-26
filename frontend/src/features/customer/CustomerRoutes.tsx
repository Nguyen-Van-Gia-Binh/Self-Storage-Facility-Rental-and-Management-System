import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { HomePage } from './pages/HomePage';
import { UnitPickerPage } from './pages/UnitPickerPage';
import { BookingPage } from './pages/BookingPage';
import { PaymentPage } from './pages/PaymentPage';
import { MyUnitsPage } from './pages/MyUnitsPage';
import { RenewalPage } from './pages/RenewalPage';
import { SupportPage } from './pages/SupportPage';

import { SandboxCheckoutPage } from './pages/SandboxCheckoutPage';

export const CustomerRoutes: React.FC = () => {
  return (
    <CustomerLayout>
      <Routes>
        <Route index element={<HomePage />} />
        {/* Chuyển hướng các đường dẫn facilities cũ về Trang chủ */}
        <Route path="facilities" element={<Navigate to="/customer" replace />} />
        <Route path="facilities/*" element={<Navigate to="/customer" replace />} />
        {/* WS1 — Customer Booking & Rentals Hub */}
        <Route path="units" element={<UnitPickerPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="payment/checkout" element={<SandboxCheckoutPage />} />
        <Route path="my-units" element={<MyUnitsPage />} />
        <Route path="renew/:contractId" element={<RenewalPage />} />
        {/* T4.12 — Support Tickets Hub (SC-06) */}
        <Route path="support" element={<SupportPage />} />
      </Routes>
    </CustomerLayout>
  );
};

