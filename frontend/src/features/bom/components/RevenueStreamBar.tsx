import React from 'react';
import { RevenueStreamDonut, type RevenueStreamDonutProps } from './RevenueStreamDonut';

export type RevenueStreamBarProps = RevenueStreamDonutProps;

/**
 * Backward compatibility wrapper.
 * Chuyển tiếp tới RevenueStreamDonut để nâng cấp giao diện từ Stacked Bar sang Donut Chart.
 */
export const RevenueStreamBar: React.FC<RevenueStreamBarProps> = (props) => {
  return <RevenueStreamDonut {...props} />;
};

export default RevenueStreamBar;
