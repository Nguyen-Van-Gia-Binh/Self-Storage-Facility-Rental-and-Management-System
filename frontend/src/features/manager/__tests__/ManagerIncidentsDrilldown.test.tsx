import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StatusBadge } from '../components/StatusBadge';
import { TypeBadge } from '../components/TypeBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { IncidentSummaryCard, type IncidentFacilityStats } from '../components/IncidentSummaryCard';
import { IncidentTable } from '../components/IncidentTable';
import { IncidentDetailPanel } from '../components/IncidentDetailPanel';
import { StorageUnitMiniPanel } from '../components/StorageUnitMiniPanel';
import { ContractMiniPanel } from '../components/ContractMiniPanel';
import { StaffAssignmentSection } from '../components/StaffAssignmentSection';
import { IncidentTimeline } from '../components/IncidentTimeline';
import type { ManagementSupportTicket, StaffWorkloadItem } from '../types/staffAssignment';

const cleanHtml = (html: string) =>
  html
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&');

describe('Xử lý sự cố — Kiến trúc Drill-down 3 Cấp độ (FM-05, SCR-FM-05)', () => {
  const mockFacilityStats: IncidentFacilityStats = {
    facilityId: 1,
    facilityCode: 'FAC-CG',
    facilityName: 'Cơ sở Cầu Giấy',
    address: '123 Cầu Giấy, Hà Nội',
    city: 'Hà Nội',
    total: 5,
    pendingCount: 1,
    inProgressCount: 1,
    resolvedCount: 3,
    cancelledCount: 0,
  };

  const mockTicket: ManagementSupportTicket = {
    id: 7,
    code: 'SC-007',
    customerId: 15,
    customerName: 'Lê Văn C',
    customerPhone: '0923456789',
    contractId: 12,
    contractCode: 'HD-012',
    storageUnitId: 108,
    storageUnitCode: 'S-108',
    facilityId: 1,
    facilityName: 'Cơ sở Cầu Giấy',
    category: 'ACCESS_ISSUE',
    categoryDisplayName: 'Khóa cửa & PIN',
    description: 'Khóa cửa ô kho S-108 bị kẹt cơ, không mở được.',
    status: 'IN_PROGRESS',
    statusDisplayName: 'Đang xử lý',
    isUrgent: true,
    assignedStaffId: 201,
    assignedStaffName: 'Hoàng Văn E',
    assignedStaffPhone: '0987654321',
    slaDueAt: '2026-11-15T18:30:00Z',
    createdAt: '2026-11-15T14:30:00Z',
    updatedAt: '2026-11-15T15:00:00Z',
    assignmentNotes: 'Kiểm tra khóa, gọi thợ nếu cần',
    attachments: [
      { id: 1, fileUrl: 'https://storage.vn/door-locked.jpg', fileName: 'door-locked.jpg' },
    ],
  };

  const mockStaffList: StaffWorkloadItem[] = [
    {
      staffId: 201,
      staffName: 'Hoàng Văn E',
      staffEmail: 'e@smartstorage.vn',
      staffPhone: '0987654321',
      facilityId: 1,
      facilityName: 'Cơ sở Cầu Giấy',
      activeTaskCount: 2,
      completedTaskCount: 10,
      shift: 'Ca Đêm (22:00 - 06:00)',
      status: 'AVAILABLE',
    },
    {
      staffId: 202,
      staffName: 'Nguyễn Văn F',
      staffEmail: 'f@smartstorage.vn',
      staffPhone: '0912345678',
      facilityId: 1,
      facilityName: 'Cơ sở Cầu Giấy',
      activeTaskCount: 1,
      completedTaskCount: 8,
      shift: 'Ca Sáng (06:00 - 14:00)',
      status: 'AVAILABLE',
    },
  ];

  describe('Cấp 1 — Thẻ tổng quan cơ sở (IncidentSummaryCard)', () => {
    it('hiển thị đầy đủ thông tin cơ sở và các chỉ số mini-stats sự cố', () => {
      const html = cleanHtml(
        renderToString(
          <IncidentSummaryCard data={mockFacilityStats} onSelect={() => {}} />
        )
      );

      expect(html).toContain('FAC-CG');
      expect(html).toContain('Cơ sở Cầu Giấy');
      expect(html).toContain('123 Cầu Giấy, Hà Nội');
      expect(html).toContain('5'); // tổng số
      expect(html).toContain('Chờ nhận:');
      expect(html).toContain('Đang xử lý:');
      expect(html).toContain('Đã xử lý:');
      expect(html).toContain('Xem danh sách sự cố');
    });
  });

  describe('Cấp 2 — Bảng danh sách sự cố cơ sở (IncidentTable)', () => {
    it('hiển thị hàng dữ liệu với mã ticket, loại, ô kho, khách và mức độ ưu tiên', () => {
      const html = cleanHtml(
        renderToString(
          <IncidentTable
            tickets={[mockTicket]}
            sortField="createdAt"
            sortDirection="desc"
            onSort={() => {}}
            onViewDetail={() => {}}
          />
        )
      );

      expect(html).toContain('SC-007');
      expect(html).toContain('Khóa cửa & PIN');
      expect(html).toContain('S-108');
      expect(html).toContain('HD-012');
      expect(html).toContain('Lê Văn C');
      expect(html).toContain('Hoàng Văn E');
      expect(html).toContain('🔴 Khẩn cấp');
      expect(html).toContain('Chi tiết');
    });

    it('hiển thị trạng thái Chưa gán khi sự cố chưa có nhân viên phụ trách', () => {
      const unassignedTicket = { ...mockTicket, assignedStaffId: undefined, assignedStaffName: undefined };
      const html = cleanHtml(
        renderToString(
          <IncidentTable
            tickets={[unassignedTicket]}
            sortField="createdAt"
            sortDirection="desc"
            onSort={() => {}}
            onViewDetail={() => {}}
          />
        )
      );

      expect(html).toContain('Chưa gán');
    });
  });

  describe('Cấp 3 — Các panel chi tiết sự cố', () => {
    it('IncidentDetailPanel hiển thị mô tả, người báo cáo và SLA', () => {
      const html = cleanHtml(
        renderToString(<IncidentDetailPanel ticket={mockTicket} />)
      );

      expect(html).toContain('#SC-007');
      expect(html).toContain('Lê Văn C');
      expect(html).toContain('0923456789');
      expect(html).toContain('Khóa cửa ô kho S-108 bị kẹt cơ');
      expect(html).toContain('Ảnh hiện trường ban đầu');
    });

    it('StorageUnitMiniPanel và ContractMiniPanel hiển thị đúng thông tin liên kết', () => {
      const unitHtml = cleanHtml(
        renderToString(
          <StorageUnitMiniPanel
            unitCode="S-108"
            unitType="Kho Lớn (20m²)"
            floor={2}
            status="OCCUPIED"
          />
        )
      );
      expect(unitHtml).toContain('S-108');
      expect(unitHtml).toContain('Kho Lớn (20m²)');
      expect(unitHtml).toContain('Tầng 2');

      const contractHtml = cleanHtml(
        renderToString(
          <ContractMiniPanel
            contractCode="HD-012"
            startDate="2026-10-01"
            endDate="2027-03-31"
            status="ACTIVE"
          />
        )
      );
      expect(contractHtml).toContain('HD-012');
      expect(contractHtml).toContain('Đang hiệu lực');
    });

    it('StaffAssignmentSection hiển thị nhân viên đã phân công kèm nút đổi nhân viên', () => {
      const html = cleanHtml(
        renderToString(
          <StaffAssignmentSection
            assignedStaffId={mockTicket.assignedStaffId}
            assignedStaffName={mockTicket.assignedStaffName}
            assignedStaffPhone={mockTicket.assignedStaffPhone}
            assignmentNotes={mockTicket.assignmentNotes}
            staffList={mockStaffList}
            onAssign={async () => {}}
          />
        )
      );

      expect(html).toContain('Hoàng Văn E');
      expect(html).toContain('0987654321');
      expect(html).toContain('Kiểm tra khóa, gọi thợ nếu cần');
      expect(html).toContain('Đổi nhân viên');
    });

    it('StaffAssignmentSection hiển thị form chọn nhân viên khi chưa được gán', () => {
      const html = cleanHtml(
        renderToString(
          <StaffAssignmentSection
            assignedStaffId={null}
            staffList={mockStaffList}
            onAssign={async () => {}}
          />
        )
      );

      expect(html).toContain('Sự cố hiện chưa có nhân viên phụ trách');
      expect(html).toContain('Hoàng Văn E');
      expect(html).toContain('Nguyễn Văn F');
      expect(html).toContain('Xác nhận phân công');
    });

    it('IncidentTimeline hiển thị đầy đủ tiến trình xử lý', () => {
      const html = cleanHtml(
        renderToString(<IncidentTimeline ticket={mockTicket} />)
      );

      expect(html).toContain('Lê Văn C gửi báo cáo sự cố #SC-007');
      expect(html).toContain('Quản lý cơ sở tiếp nhận');
      expect(html).toContain('Phân công nhân viên Hoàng Văn E');
      expect(html).toContain('bắt đầu kiểm tra và xử lý hiện trường');
    });
  });

  describe('Badges phân loại & trạng thái', () => {
    it('TypeBadge hiển thị đúng tên danh mục', () => {
      const html = cleanHtml(renderToString(<TypeBadge category="ACCESS_ISSUE" />));
      expect(html).toContain('Khóa cửa & PIN');
    });

    it('PriorityBadge hiển thị đúng mức độ', () => {
      const urgentHtml = cleanHtml(renderToString(<PriorityBadge isUrgent={true} />));
      expect(urgentHtml).toContain('🔴 Khẩn cấp');

      const normalHtml = cleanHtml(renderToString(<PriorityBadge isUrgent={false} />));
      expect(normalHtml).toContain('🟡 Tiêu chuẩn');
    });

    it('StatusBadge hiển thị đúng trạng thái sự cố', () => {
      const openHtml = cleanHtml(renderToString(<StatusBadge status="OPEN" />));
      expect(openHtml).toContain('⏳ Chờ tiếp nhận');

      const inProgressHtml = cleanHtml(renderToString(<StatusBadge status="IN_PROGRESS" />));
      expect(inProgressHtml).toContain('⚠️ Đang xử lý');

      const resolvedHtml = cleanHtml(renderToString(<StatusBadge status="RESOLVED" />));
      expect(resolvedHtml).toContain('✓ Đã xử lý');
    });
  });
});
