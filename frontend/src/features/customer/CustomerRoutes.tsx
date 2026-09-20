import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { HomePage } from './pages/HomePage';
import { FacilityCatalogPage } from './pages/FacilityCatalogPage';
import { FacilityDetailPage } from './pages/FacilityDetailPage';

export const CustomerRoutes: React.FC = () => (
  <CustomerLayout>
    <Routes>
      <Route index element={<HomePage />} />
      {/* T2.16 — Public Catalog (SC-01) */}
      <Route path="facilities" element={<FacilityCatalogPage />} />
      <Route path="facilities/:facilityId" element={<FacilityDetailPage />} />
      {/* WS1 teammates will add sub-routes here: unit-picker, booking, my-units */}
    </Routes>
  </CustomerLayout>
);
