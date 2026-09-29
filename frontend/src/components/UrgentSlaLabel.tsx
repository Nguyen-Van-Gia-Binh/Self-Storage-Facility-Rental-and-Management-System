import React from 'react';
import { useActivePolicy } from '@/hooks/useActivePolicy';

export const UrgentSlaLabel: React.FC<{ lead?: string }> = ({ lead = 'SLA' }) => {
  const policy = useActivePolicy();
  const hours = policy?.supportUrgentSlaHours;
  return <>{hours ? `${lead} ${hours} giờ` : `${lead} khẩn`}</>;
};
