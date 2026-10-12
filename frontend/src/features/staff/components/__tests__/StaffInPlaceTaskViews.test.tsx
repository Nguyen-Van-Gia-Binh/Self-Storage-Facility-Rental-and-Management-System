/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

describe('Staff In-Place Task Views & Full-Screen Detail View Integration', () => {
  const staffCheckInViewPath = path.resolve(
    process.cwd(),
    'src/features/staff/components/StaffCheckInDetailView.tsx'
  );
  const staffReturnViewPath = path.resolve(
    process.cwd(),
    'src/features/staff/components/StaffReturnDetailView.tsx'
  );
  const staffIncidentViewPath = path.resolve(
    process.cwd(),
    'src/features/staff/components/StaffIncidentDetailView.tsx'
  );
  const dailyTasksOverviewPath = path.resolve(
    process.cwd(),
    'src/features/staff/components/DailyTasksOverview.tsx'
  );

  it('StaffCheckInDetailView có nút quay lại ca trực và bố cục 2 cột gọn gàng', () => {
    const content = fs.readFileSync(staffCheckInViewPath, 'utf-8');
    expect(content).toMatch(/Quay lại danh sách ca trực/);
    expect(content).toMatch(/grid grid-cols-1 lg:grid-cols-12/);
    expect(content).toMatch(/CustomerVerificationCard/);
    expect(content).toMatch(/HandoverInspectionForm/);
    expect(content).toMatch(/AccessCodePinModal/);
  });

  it('StaffReturnDetailView có nút quay lại ca trực và tích hợp ReturnInspectionForm', () => {
    const content = fs.readFileSync(staffReturnViewPath, 'utf-8');
    expect(content).toMatch(/Quay lại danh sách ca trực/);
    expect(content).toMatch(/grid grid-cols-1 lg:grid-cols-12/);
    expect(content).toMatch(/Nghiệm thu trả kho & Quyết toán cọc/);
    expect(content).toMatch(/ReturnInspectionForm/);
    expect(content).toMatch(/ReturnSuccessModal/);
  });

  it('StaffIncidentDetailView có nút quay lại ca trực, phân định trách nhiệm BR-SUP-02 và biểu giá BOM', () => {
    const content = fs.readFileSync(staffIncidentViewPath, 'utf-8');
    expect(content).toMatch(/Quay lại danh sách ca trực/);
    expect(content).toMatch(/grid grid-cols-1 lg:grid-cols-12/);
    expect(content).toMatch(/Lỗi do Công ty \(Hạ tầng\)/);
    expect(content).toMatch(/Lỗi do Khách hàng/);
    expect(content).toMatch(/Phân định trách nhiệm \(BR-SUP-02\)/);
    expect(content).toMatch(/Hoàn tất giải quyết sự cố/);
  });

  it('DailyTasksOverview hiển thị tràn in-place khi bấm thao tác thay vì mở popup modal', () => {
    const content = fs.readFileSync(dailyTasksOverviewPath, 'utf-8');
    expect(content).toMatch(/activeTaskView/);
    expect(content).toMatch(/StaffCheckInDetailView/);
    expect(content).toMatch(/StaffReturnDetailView/);
    expect(content).toMatch(/StaffIncidentDetailView/);
    expect(content).not.toMatch(/StaffResolveIncidentModal/);
  });

  it('StaffDashboardPage và DailyTasksOverview đã xóa bỏ ô chọn ngày dư thừa, tab Tất cả nhiệm vụ và nút lọc Tất cả trạng thái', () => {
    const staffDashboardPath = path.resolve(
      process.cwd(),
      'src/features/staff/pages/StaffDashboardPage.tsx'
    );
    const dashboardContent = fs.readFileSync(staffDashboardPath, 'utf-8');
    const overviewContent = fs.readFileSync(dailyTasksOverviewPath, 'utf-8');

    expect(dashboardContent).not.toMatch(/type="date"/);
    expect(overviewContent).not.toMatch(/Tất cả nhiệm vụ/);
    expect(overviewContent).not.toMatch(/Tất cả \(\{currentTotal\}\)/);
    expect(overviewContent).toMatch(/Chờ xử lý \(\{currentPending\}\)/);
    expect(overviewContent).toMatch(/Đã xong \(\{currentDone\}\)/);
  });

  it('DailyTasksOverview rút gọn thẻ nhiệm vụ tối giản, loại bỏ tiêu đề phụ lặp lại và đẩy thông tin chi tiết vào bên trong view', () => {
    const overviewContent = fs.readFileSync(dailyTasksOverviewPath, 'utf-8');
    const incidentViewContent = fs.readFileSync(staffIncidentViewPath, 'utf-8');

    expect(overviewContent).not.toMatch(/1\. Lịch tiếp đón nhận kho/);
    expect(overviewContent).not.toMatch(/2\. Lịch trả kho & Nghiệm thu phòng/);
    expect(overviewContent).not.toMatch(/3\. Sự cố kỹ thuật & Vận hành thực địa/);
    expect(overviewContent).not.toMatch(/Tiền cọc:/);
    expect(incidentViewContent).toMatch(/detailDescription/);
  });
});


