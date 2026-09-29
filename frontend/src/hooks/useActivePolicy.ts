import { useEffect, useState } from 'react';
import { fetchActivePolicy } from '@/api/pricing';
import type { ActivePolicyInfo } from '@/types';

export function useActivePolicy(): ActivePolicyInfo | null {
  const [policy, setPolicy] = useState<ActivePolicyInfo | null>(null);

  useEffect(() => {
    let alive = true;
    fetchActivePolicy()
      .then((next) => {
        if (alive) setPolicy(next);
      })
      .catch(() => {
        if (alive) setPolicy(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  return policy;
}
