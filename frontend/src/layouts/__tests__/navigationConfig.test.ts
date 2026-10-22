import { describe, it, expect } from 'vitest';
import { getNavigationForRole } from '../navigationConfig';

describe('navigationConfig for BOM role', () => {
  it('does not contain redundant /bom/policies item in BOM navigation', () => {
    const bomNav = getNavigationForRole('BOM');
    const policyItem = bomNav.navItems.find((item) => item.href === '/bom/policies');
    expect(policyItem).toBeUndefined();
    expect(bomNav.navItems.some((item) => item.href === '/bom/pricing')).toBe(true);
  });
});
