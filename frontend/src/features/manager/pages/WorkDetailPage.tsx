// frontend/src/features/manager/pages/WorkDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  User,
  Box,
  CheckCircle2,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import type { DailyDispatchTaskItem } from '../types/staffAssignment';
import { Breadcrumb } from '../components/Breadcrumb';
import { CheckinChecklist } from '../components/CheckinChecklist';
import { IncidentFaultDetermination } from '../components/IncidentFaultDetermination';
import { ReturnInspectionForm } from '../components/ReturnInspectionForm';
import { ImageGallery } from '../components/ImageGallery';

export const WorkDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const [task, setTask] = useState<DailyDispatchTaskItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Giả lập/lấy dữ liệu chi tiết công việc từ task ID
      const tId = Number(assignmentId) || 1;
      let mockTask: DailyDispatchTaskItem;

      if (tId % 3 === 1) {
        // Case A: Check-in
        mockTask = {
          id: tId,
          taskType: 'CHECK_IN',
          title: 'Bàn giao nhận kho khách mới',
          facilityId: 1,
          facilityName: 'Cơ sở SmartStorage Cầu Giấy',
          unitCode: 'S-101',
          customerName: 'Nguyễn Văn A',
          customerPhone: '0901234567',
          scheduledDate: '2026-11-16',
          scheduledTime: '08:00',
          priority: 'NORMAL',
          isUrgent: false,
          assignedStaffId: 101,
          assignedStaffName: 'Nguyễn Văn M',
          status: 'COMPLETED',
          notes: 'Khách đến đúng hẹn, hướng dẫn sử dụng mã PIN 123456 và khóa cơ an toàn.',
          referenceCode: 'HD-001',
        };
      } else if (tId % 3 === 0) {
        // Case B: Sự cố (Incident)
        mockTask = {
          id: tId,
          taskType: 'INCIDENT',
          title: 'Kẹt chốt khóa điện tử cửa kho',
          facilityId: 1,
          facilityName: 'Cơ sở SmartStorage Cầu Giấy',
          unitCode: 'S-108',
          customerName: 'Lê Văn C',
          customerPhone: '0923456789',
          scheduledDate: '2026-11-16',
          scheduledTime: '11:15',
          priority: 'HIGH',
          isUrgent: true,
          assignedStaffId: 105,
          assignedStaffName: 'Hoàng Văn E',
          status: 'IN_PROGRESS',
          notes: 'Đã kiểm tra sơ bộ, cần thợ khóa đến sáng T7 để thay lõi số.',
          referenceCode: '#SC-007',
        };
      } else {
        // Case C: Trả kho (Return)
        mockTask = {
          id: tId,
          taskType: 'RETURN',
          title: 'Nghiệm thu trả kho & hoàn tất hợp đồng',
          facilityId: 1,
          facilityName: 'Cơ sở SmartStorage Cầu Giấy',
          unitCode: 'S-105',
          customerName: 'Trần Thị B',
          customerPhone: '0912345678',
          scheduledDate: '2026-11-16',
          scheduledTime: '10:00',
          priority: 'NORMAL',
          isUrgent: false,
          assignedStaffId: 103,
          assignedStaffName: 'Lê Văn C',
          status: 'IN_PROGRESS',
          notes: 'Khách yêu cầu nghiệm thu bàn giao trả kho.',
          referenceCode: 'HD-005',
        };
      }

      setTask(mockTask);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Đang tải chi tiết công việc...</p>
      </div>
    );
  }

  if (!task) return null;

  const breadcrumbItems = [
    { label: 'Phân công nhân sự', href: '/manager/staff-schedule' },
    {
      label: task.facilityName,
      href: `/manager/staff-schedule/facilities/${task.facilityId}`,
    },
    {
      label: `Công việc (${task.scheduledDate})`,
      href: `/manager/staff-schedule/facilities/${task.facilityId}/shifts?date=${task.scheduledDate}`,
    },
    { label: task.referenceCode || `Task #${task.id}` },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbItems} />

      {/* Thông báo thao tác */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Công việc & Trạng thái */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-brand-600 bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Cấp 4 — Chi tiết Công việc
              </span>
              <span className="text-xs font-bold text-slate-700 px-2 py-0.5 rounded-md bg-slate-100">
                {task.referenceCode}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{task.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thời gian hẹn: {task.scheduledDate} · {task.scheduledTime} · Cơ sở: {task.facilityName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                task.status === 'COMPLETED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : task.status === 'IN_PROGRESS'
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {task.status === 'COMPLETED'
                ? '✓ ĐÃ HOÀN THÀNH'
                : task.status === 'IN_PROGRESS'
                ? '⚠️ ĐANG XỬ LÝ'
                : '⏳ CHỜ TIẾP NHẬN'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid 4 Thẻ Thông tin Cốt lõi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thẻ Hợp đồng / Tham chiếu */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3 text-xs font-bold uppercase text-slate-800">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>Thông tin Hợp đồng / Tham chiếu</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã tham chiếu:</span>
              <span className="font-bold text-slate-800">{task.referenceCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày yêu cầu:</span>
              <span className="font-medium text-slate-700">{task.scheduledDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Giờ thực hiện:</span>
              <span className="font-medium text-slate-700">{task.scheduledTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ghi chú nghiệp vụ:</span>
              <span className="font-medium text-slate-700 text-right">{task.notes}</span>
            </div>
          </div>
        </div>

        {/* Thẻ Khách hàng */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3 text-xs font-bold uppercase text-slate-800">
            <User className="w-4 h-4 text-brand-600" />
            <span>Khách hàng</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Họ và tên:</span>
              <span className="font-bold text-slate-800">{task.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Số điện thoại:</span>
              <span className="font-medium text-slate-700">{task.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CCCD / Định danh:</span>
              <span className="font-mono text-slate-700">001234567890</span>
            </div>
          </div>
        </div>

        {/* Thẻ Ô kho */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3 text-xs font-bold uppercase text-slate-800">
            <Box className="w-4 h-4 text-brand-600" />
            <span>Ô kho thực hiện</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã ô kho:</span>
              <span className="font-bold text-slate-800">{task.unitCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Loại ô kho:</span>
              <span className="font-medium text-slate-700">Kho Nhỏ (S · 4m²)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vị trí:</span>
              <span className="font-medium text-slate-700">Tầng 1 · Khu vực A</span>
            </div>
          </div>
        </div>

        {/* Thẻ Nhân viên phụ trách */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3 text-xs font-bold uppercase text-slate-800">
            <UserCheck className="w-4 h-4 text-brand-600" />
            <span>Nhân viên phụ trách</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Họ tên nhân viên:</span>
              <span className="font-bold text-indigo-700">
                {task.assignedStaffName || 'Chưa phân công'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ca làm việc:</span>
              <span className="font-medium text-slate-700">Ca Sáng (06:00 - 14:00)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SĐT liên hệ:</span>
              <span className="font-medium text-slate-700">0912345678</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hiển thị Nội dung Đặc thù theo từng Case */}
      {task.taskType === 'CHECK_IN' && (
        <CheckinChecklist
          pinCode="123456"
          isSigned={task.status === 'COMPLETED'}
          onViewContract={() => showNotification('Đang mở bản xem trước Hợp đồng điện tử...')}
          onPrintHandover={() => showNotification('Lệnh in biên bản bàn giao đã được gửi đi.')}
        />
      )}

      {task.taskType === 'INCIDENT' && (
        <div className="space-y-6">
          <IncidentFaultDetermination
            onConfirmFault={(data) => {
              showNotification(
                `Đã xác nhận phân định: ${data.faultType === 'COMPANY' ? 'Lỗi công ty (0đ)' : 'Lỗi khách hàng'}`
              );
            }}
          />
          <ImageGallery title="Hình ảnh bằng chứng sự cố" />
        </div>
      )}

      {task.taskType === 'RETURN' && (
        <div className="space-y-6">
          <ReturnInspectionForm
            depositAmount={1500000}
            onConfirmSettlement={(data) => {
              showNotification(
                `Đã duyệt quyết toán hoàn cọc: ${new Intl.NumberFormat('vi-VN').format(data.refundAmount)} đ`
              );
            }}
            onRequestRecheck={() => showNotification('Đã gửi thông báo yêu cầu khách xác nhận kết quả nghiệm thu.')}
          />
          <ImageGallery title="Hình ảnh nghiệm thu ô kho trả" />
        </div>
      )}
    </div>
  );
};
