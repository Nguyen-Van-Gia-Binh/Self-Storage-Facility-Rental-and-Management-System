import { describe, it, expect, vi } from 'vitest';
import * as clientModule from '../client';
import { getSystemRevenueReport } from '../report';

describe('getSystemRevenueReport - Giữ nguyên mrr, activeContractCount và totalDepositLiability', () => {
  it('map đúng mrr, activeContractCount và totalDepositLiability từ Backend payload', async () => {
    const backendResponse = {
      success: true,
      data: {
        from: '2026-10-01',
        to: '2026-10-31',
        totalRevenue: 15000000,
        rentalRevenue: 10000000,
        surchargeRevenue: 1000000,
        overdueFeeRevenue: 500000,
        renewalRevenue: 3500000,
        depositBalance: 5000000,
        totalRefundAmount: 2000000,
        mrr: 4500000,
        activeContractCount: 3,
        totalDepositLiability: 4800000,
        byFacility: [
          {
            facilityId: 1,
            facilityName: 'Cơ sở Cầu Giấy',
            totalRevenue: 15000000,
            rentalRevenue: 10000000,
            surchargeRevenue: 1000000,
            overdueFeeRevenue: 500000,
            renewalRevenue: 3500000,
            depositBalance: 5000000,
            refundAmount: 2000000,
            mrr: 4500000,
            activeContractCount: 3,
            depositLiability: 4800000,
          },
        ],
      },
    };

    vi.spyOn(clientModule, 'apiClient').mockResolvedValue(backendResponse as any);

    const report = await getSystemRevenueReport({ from: '2026-10-01', to: '2026-10-31' });

    expect(report.totalRevenue).toBe(15000000);
    expect(report.mrr).toBe(4500000);
    expect(report.activeContractCount).toBe(3);
    expect(report.totalDepositLiability).toBe(4800000);

    expect(report.byFacility).toHaveLength(1);
    expect(report.byFacility[0].mrr).toBe(4500000);
    expect(report.byFacility[0].activeContractCount).toBe(3);
    expect(report.byFacility[0].depositLiability).toBe(4800000);
  });
});

