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

  it('StaffCheckInDetailView có bố cục 2 cột cân xứng, không còn hộp tiêu đề lặp lại thông tin phía trên', () => {
    const content = fs.readFileSync(staffCheckInViewPath, 'utf-8');
    expect(content).not.toMatch(/Tiếp đón & Bàn giao ô kho/);
    expect(content).toMatch(/grid grid-cols-1 lg:grid-cols-12/);
    expect(content).toMatch(/CustomerVerificationCard/);
    expect(content).toMatch(/HandoverInspectionForm/);
    expect(content).toMatch(/AccessCodePinModal/);
  });

  it('StaffReturnDetailView có bố cục 2 cột cân xứng và tích hợp ReturnInspectionForm', () => {
    const content = fs.readFileSync(staffReturnViewPath, 'utf-8');
    expect(content).toMatch(/grid grid-cols-1 lg:grid-cols-12/);
    expect(content).toMatch(/ReturnInspectionForm/);
    expect(content).toMatch(/ReturnSuccessModal/);
  });

  it('StaffIncidentDetailView có bố cục 2 cột cân xứng, phân định trách nhiệm BR-SUP-02 và biểu giá BOM', () => {
    const content = fs.readFileSync(staffIncidentViewPath, 'utf-8');
    expect(content).toMatch(/grid grid-cols-1 lg:grid-cols-12/);
    expect(content).toMatch(/Lỗi do Công ty \(Hạ tầng\)/);
    expect(content).toMatch(/Lỗi do Khách hàng/);
    expect(content).toMatch(/1\. Phân định trách nhiệm/);
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

  it('DashboardLayout bỏ chữ Staff Desk, cho phép bấm vào Nhiệm vụ ca trực và hiển thị cấp > đi sâu khi mở chi tiết nhiệm vụ', () => {
    const layoutPath = path.resolve(
      process.cwd(),
      'src/layouts/DashboardLayout.tsx'
    );
    const navConfigPath = path.resolve(
      process.cwd(),
      'src/layouts/navigationConfig.ts'
    );
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    const navConfigContent = fs.readFileSync(navConfigPath, 'utf-8');

    expect(layoutContent).not.toMatch(/Staff Desk/);
    expect(navConfigContent).not.toMatch(/Staff Desk/);
    expect(layoutContent).toMatch(/staff-sub-breadcrumb/);
    expect(layoutContent).toMatch(/staff-reset-task-view/);
    expect(layoutContent).not.toMatch(/text-right hidden sm:block/);
    expect(layoutContent).toMatch(/text-left hidden sm:block/);
  });

  it('Rút gọn luồng xử lý về đúng 1 bước xác nhận duy nhất, loại bỏ bước trung gian Bắt đầu xử lý / Tiếp nhận xử lý', () => {
    const incidentViewContent = fs.readFileSync(staffIncidentViewPath, 'utf-8');
    const overviewContent = fs.readFileSync(dailyTasksOverviewPath, 'utf-8');
    const staffIncidentPagePath = path.resolve(
      process.cwd(),
      'src/features/staff/pages/StaffIncidentPage.tsx'
    );
    const staffResolveModalPath = path.resolve(
      process.cwd(),
      'src/features/staff/components/StaffResolveIncidentModal.tsx'
    );
    const incidentPageContent = fs.existsSync(staffIncidentPagePath) ? fs.readFileSync(staffIncidentPagePath, 'utf-8') : '';
    const resolveModalContent = fs.readFileSync(staffResolveModalPath, 'utf-8');

    expect(incidentViewContent).not.toMatch(/startStaffIncident/);
    expect(incidentViewContent).not.toMatch(/Bước 1: Tiếp nhận xử lý/);
    expect(incidentViewContent).not.toMatch(/Tiếp nhận xử lý tại hiện trường/);
    expect(overviewContent).not.toMatch(/<span>Cập nhật<\/span>/);
    expect(incidentPageContent).not.toMatch(/startStaffIncident/);
    expect(incidentPageContent).not.toMatch(/Bắt đầu xử lý/);
    expect(resolveModalContent).not.toMatch(/startStaffIncident/);
  });

  it('Tích hợp component chụp ảnh trực tiếp bằng Camera (EvidencePhotoCapture) cho cả 3 luồng Tiếp đón, Nghiệm thu trả kho và Sự cố, xóa bỏ ô dán link https thủ công', () => {
    const photoCapturePath = path.resolve(
      process.cwd(),
      'src/features/staff/components/EvidencePhotoCapture.tsx'
    );
    const handoverFormPath = path.resolve(
      process.cwd(),
      'src/features/staff/components/HandoverInspectionForm.tsx'
    );
    const returnFormPath = path.resolve(
      process.cwd(),
      'src/features/staff/components/ReturnInspectionForm.tsx'
    );

    const photoCaptureContent = fs.readFileSync(photoCapturePath, 'utf-8');
    const handoverFormContent = fs.readFileSync(handoverFormPath, 'utf-8');
    const returnFormContent = fs.readFileSync(returnFormPath, 'utf-8');
    const incidentViewContent = fs.readFileSync(staffIncidentViewPath, 'utf-8');

    expect(photoCaptureContent).toMatch(/getUserMedia/);
    expect(photoCaptureContent).toMatch(/facingMode/);
    expect(handoverFormContent).toMatch(/EvidencePhotoCapture/);
    expect(handoverFormContent).not.toMatch(/Bấm để thêm ảnh mẫu/);
    expect(returnFormContent).toMatch(/EvidencePhotoCapture/);
    expect(returnFormContent).not.toMatch(/Đường dẫn ảnh bằng chứng/);
    expect(incidentViewContent).toMatch(/EvidencePhotoCapture/);
    expect(incidentViewContent).not.toMatch(/Dán đường dẫn ảnh hiện trường/);
  });

  it('Giữ nhiệm vụ tiếp đón check-in hiển thị xuyên suốt 10 ngày ân hạn (BR-CHK-05) cho đến khi khách hoàn tất hoặc quá hạn hủy No-show', async () => {
    const { isWithinCheckInGraceWindow } = await import('../../../../api/staff');

    // Hợp đồng bắt đầu 2026-10-12:
    // - Trước ngày bắt đầu (2026-10-11): false
    // - Ngày bắt đầu (2026-10-12): true
    // - Ngày hôm sau (2026-10-13): true
    // - Ngày ân hạn cuối cùng D+10 (2026-10-22): true
    // - Quá hạn 10 ngày -> No-show D+11 (2026-10-23): false
    expect(isWithinCheckInGraceWindow('2026-10-12', '2026-10-11', 10)).toBe(false);
    expect(isWithinCheckInGraceWindow('2026-10-12', '2026-10-12', 10)).toBe(true);
    expect(isWithinCheckInGraceWindow('2026-10-12', '2026-10-13', 10)).toBe(true);
    expect(isWithinCheckInGraceWindow('2026-10-12', '2026-10-22', 10)).toBe(true);
    expect(isWithinCheckInGraceWindow('2026-10-12', '2026-10-23', 10)).toBe(false);
  });

  it('Xóa sạch toàn bộ dữ liệu mock fallback cứng trong phân hệ Staff và kết nối trực tiếp API Backend thực tế', () => {
    const checkInViewContent = fs.readFileSync(staffCheckInViewPath, 'utf-8');
    const returnViewContent = fs.readFileSync(staffReturnViewPath, 'utf-8');
    const incidentViewContent = fs.readFileSync(staffIncidentViewPath, 'utf-8');
    const checkInPagePath = path.resolve(
      process.cwd(),
      'src/features/staff/pages/StaffCheckInPage.tsx'
    );
    const returnFormPath = path.resolve(
      process.cwd(),
      'src/features/staff/components/ReturnInspectionForm.tsx'
    );
    const resolveModalPath = path.resolve(
      process.cwd(),
      'src/features/staff/components/StaffResolveIncidentModal.tsx'
    );
    const contractApiPath = path.resolve(process.cwd(), 'src/api/contract.ts');

    const checkInPageContent = fs.readFileSync(checkInPagePath, 'utf-8');
    const returnFormContent = fs.readFileSync(returnFormPath, 'utf-8');
    const resolveModalContent = fs.readFileSync(resolveModalPath, 'utf-8');
    const contractApiContent = fs.readFileSync(contractApiPath, 'utf-8');

    // Không còn dữ liệu hợp đồng giả hay mã PIN cứng
    expect(checkInViewContent).not.toMatch(/079201004829/);
    expect(checkInViewContent).not.toMatch(/482019/);
    expect(checkInViewContent).not.toMatch(/839201/);
    expect(checkInViewContent).not.toMatch(/Trần Thị Nhân Viên/);
    expect(checkInViewContent).toMatch(/getContractById/);

    expect(checkInPageContent).not.toMatch(/482019/);

    // Không còn đối tượng ReturnContractDetail giả trong catch block và lấy preview quyết toán từ Backend
    expect(returnViewContent).not.toMatch(/unitType: 'Standard'/);
    expect(returnFormContent).toMatch(/getSettlementPreview/);

    // Không còn giá cơ sở giả 1_000_000 khi tính phụ phí % và gọi chi tiết sự cố từ Backend
    expect(incidentViewContent).not.toMatch(/1_000_000/);
    expect(incidentViewContent).toMatch(/getStaffIncidentDetail/);
    expect(incidentViewContent).toMatch(/getContractById/);
    expect(incidentViewContent).toMatch(/catalogLineAmount/);

    expect(resolveModalContent).not.toMatch(/1_000_000/);
    expect(resolveModalContent).toMatch(/getStaffIncidentDetail/);
    expect(resolveModalContent).toMatch(/getContractById/);

    // Không còn chuỗi kích thước giả định theo tên loại kho trong contract.ts
    expect(contractApiContent).not.toMatch(/1\.0m x 1\.0m x 1\.5m/);
    expect(contractApiContent).not.toMatch(/3\.0m x 3\.0m x 2\.5m/);
  });
});

