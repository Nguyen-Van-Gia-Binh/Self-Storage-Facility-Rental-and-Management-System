import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { HomePage } from './pages/HomePage';
import { UnitPickerPage } from './pages/UnitPickerPage';
import { BookingPage } from './pages/BookingPage';
import { MyUnitsPage } from './pages/MyUnitsPage';
import { RenewalPage } from './pages/RenewalPage';

export const CustomerRoutes: React.FC = () => {
  return (
    <CustomerLayout>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="units" element={<UnitPickerPage />} />
        <Route path="booking" element={<BookingPage />} />
        <Route path="my-units" element={<MyUnitsPage />} />
        <Route path="renew/:contractId" element={<RenewalPage />} />
      </Routes>
    </CustomerLayout>
  );
};
