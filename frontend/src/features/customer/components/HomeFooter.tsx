import React from 'react';
import type { DisplayFacility } from '../hooks/useFacilityDirectory';
import { CustomerFooter } from './CustomerFooter';

interface HomeFooterProps {
  facilities: DisplayFacility[];
  onScrollToId: (id: string) => void;
}

/**
 * Footer Trang chủ dùng chung component CustomerFooter 4 cột chuẩn Enterprise.
 */
export const HomeFooter: React.FC<HomeFooterProps> = ({ facilities, onScrollToId }) => {
  return <CustomerFooter facilities={facilities} onScrollToId={onScrollToId} />;
};
