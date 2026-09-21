import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { HomePage } from './pages/HomePage';
import { FacilityCatalogPage } from './pages/FacilityCatalogPage';
import { FacilityDetailPage } from './pages/FacilityDetailPage';
import { UnitPickerPage } from './pages/UnitPickerPage';
import { BookingPage } from './pages/BookingPage';
import { PaymentPage } from './pages/PaymentPage';
import { MyUnitsPage } from './pages/MyUnitsPage';
import { RenewalPage } from './pages/RenewalPage';

export const CustomerRoutes: React.FC = () => {
  return (
    <CustomerLayout>
      <Routes>
        <Route index element={<HomePage />} />
        {/* T2.16 — Public Catalog (SC-01) - Phân hệ Cơ sở WS2 */}
        <Route path="facilities" element={<FacilityCatalogPage />} />
        <Route path="facilities/:facilityId" element={<FacilityDetailPage />} />
        {/* WS1 — Customer Booking & Rentals Hub */}
        <Route path="units" element={<UnitPickerPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="my-units" element={<MyUnitsPage />} />
        <Route path="renew/:contractId" element={<RenewalPage />} />
      </Routes>
    </CustomerLayout>
  );
};

