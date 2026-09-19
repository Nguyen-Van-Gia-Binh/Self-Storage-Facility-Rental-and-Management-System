import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CustomerLayout } from '@/layouts/CustomerLayout';
import { HomePage } from './pages/HomePage';

export const CustomerRoutes: React.FC = () => {
  return (
    <CustomerLayout>
      <Routes>
        <Route index element={<HomePage />} />
        {/* WS1 teammates will add sub-routes here: unit-picker, booking, my-units */}
      </Routes>
    </CustomerLayout>
  );
};
