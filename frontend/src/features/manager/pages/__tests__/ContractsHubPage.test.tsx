/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

describe('ContractsHubPage & ContractDetailPage Handover Defect & Relocation Integration', () => {
  const resolveSource = (relativePath: string) => {
    const p1 = path.resolve(process.cwd(), relativePath);
    if (fs.existsSync(p1)) return p1;
    return path.resolve(process.cwd(), 'frontend', relativePath);
  };
  const hubPagePath = resolveSource('src/features/manager/pages/ContractsHubPage.tsx');
  const detailPagePath = resolveSource('src/features/manager/pages/ContractDetailPage.tsx');

  it('ContractsHubPage hỗ trợ Tab 5 Đã chấm dứt / Hủy và hiển thị số lượng hợp đồng terminated/closed', () => {
    const content = fs.readFileSync(hubPagePath, 'utf-8');
    expect(content).toMatch(/TabKey\s*=\s*'ACTIVE'\s*\|\s*'PENDING_CHECK_IN'\s*\|\s*'RETURN'\s*\|\s*'OVERDUE'\s*\|\s*'TERMINATED'/);
    expect(content).toMatch(/5\.\s*Đã chấm dứt \/ Hủy/);
    expect(content).toMatch(/c\.status === 'TERMINATED'\s*\|\|\s*c\.status === 'CLOSED'/);
  });

  it('ContractsHubPage mở trực tiếp sơ đồ 2D (FacilityFloorPlanMapModal) khi FM bấm Đổi ô kho', () => {
    const content = fs.readFileSync(hubPagePath, 'utf-8');
    expect(content).toMatch(/setFloorPlanReassignContract\(contract\)/);
    expect(content).toMatch(/Đổi ô kho \(Sơ đồ 2D\)/);
    expect(content).toMatch(/handleFloorPlanReassignSelect/);
    expect(content).toMatch(/FacilityFloorPlanMapModal/);
  });

  it('ContractsHubPage cho phép FM Duyệt hoàn tiền 100% cho hợp đồng TERMINATED do sự cố tiếp đón', () => {
    const content = fs.readFileSync(hubPagePath, 'utf-8');
    expect(content).toMatch(/Duyệt hoàn tiền 100%/);
    expect(content).toMatch(/setSelectedForSettlement\(contract\)/);
    expect(content).toMatch(/SettlementApprovalModal/);
  });

  it('ContractDetailPage hiển thị banner sự cố bàn giao, ngày kết thúc chốt tại ngày check-in và nút Duyệt quyết toán hoàn tiền 100%', () => {
    const content = fs.readFileSync(detailPagePath, 'utf-8');
    expect(content).toMatch(/isTerminated/);
    expect(content).toMatch(/Hợp đồng đã chấm dứt do sự cố bàn giao \/ khách từ chối nhận/);
    expect(content).toMatch(/Chờ hoàn tiền 100%/);
    expect(content).toMatch(/Duyệt quyết toán & Hoàn tiền 100%/);
    expect(content).toMatch(/allowedUnitTypeId=\{canRelocate \? contract\.unitTypeId : undefined\}/);
  });
});
