// frontend/src/features/manager/pages/WorkDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  User,
  Box,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  UserPlus,
  AlertTriangle,
  Phone,
  Wrench,
  PackageOpen,
  CheckCircle,
} from 'lucide-react';
import type {
  DailyDispatchTaskItem,
  StaffWorkloadItem,
  AssignTaskPayload,
  ManagementSupportTicket,
} from '../types/staffAssignment';
import { Breadcrumb } from '../components/Breadcrumb';
import { ImageGallery } from '../components/ImageGallery';
import { AssignStaffModal } from '../components/AssignStaffModal';
import {
  getDailyDispatchTasks,
  getStaffWorkload,
  assignStaffToTask,
  getSupportRequestDetail,
} from '../api/staffAssignmentApi';

export const WorkDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const facilityIdParam = searchParams.get('facilityId');
  const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const tId = Number(assignmentId) || 0;

  const [task, setTask] = useState<DailyDispatchTaskItem | null>(null);
  const [staffList, setStaffList] = useState<StaffWorkloadItem[]>([]);
  const [supportTicket, setSupportTicket] = useState<ManagementSupportTicket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let currentFacilityId = facilityIdParam ? Number(facilityIdParam) : 0;
      let matchedTask: DailyDispatchTaskItem | null = null;

      // 1. Nếu là ticket sự cố (ID < 100000), gọi Real API lấy chi tiết sự cố
      if (tId > 0 && tId < 100000) {
        try {
          const ticket = await getSupportRequestDetail(tId);
          if (ticket) {
            setSupportTicket(ticket);
            currentFacilityId = ticket.facilityId || currentFacilityId;
            matchedTask = {
              id: ticket.id,
              taskType: 'INCIDENT',
              title: `[Sự cố] ${ticket.categoryDisplayName} - Ô kho ${ticket.storageUnitCode}`,
              facilityId: ticket.facilityId,
              facilityName: ticket.facilityName,
              unitCode: ticket.storageUnitCode,
              customerName: ticket.customerName,
              customerPhone: ticket.customerPhone,
              scheduledDate: ticket.createdAt
                ? ticket.createdAt.split('T')[0]
                : dateParam,
              scheduledTime: ticket.createdAt
                ? ticket.createdAt.substring(11, 16)
                : 'Hôm nay',
              slaDeadline: ticket.slaDueAt,
              priority: ticket.isUrgent ? 'URGENT' : 'NORMAL',
              isUrgent: ticket.isUrgent,
              assignedStaffId: ticket.assignedStaffId,
              assignedStaffName: ticket.assignedStaffName,
              status:
                ticket.status === 'NEW' || ticket.status === 'OPEN'
                  ? 'UNASSIGNED'
                  : ticket.status === 'CLOSED' ||
                    (ticket.status as string) === 'AUTO_CLOSED' ||
                    ticket.status === 'RESOLVED'
                  ? 'COMPLETED'
                  : 'ASSIGNED',
              notes: ticket.description,
              referenceId: ticket.id,
              referenceCode: ticket.code,
            };
          }
        } catch (e) {
          console.warn('Lỗi lấy chi tiết support request:', e);
        }
      }

      // 2. Nếu chưa có matchedTask và có facilityId, tìm trong danh sách dispatch tasks
      if (!matchedTask && currentFacilityId > 0) {
        const allTasks = await getDailyDispatchTasks(currentFacilityId, dateParam);
        matchedTask = allTasks.find((t) => t.id === tId) || null;
      }

      // 3. Nếu chưa có currentFacilityId nhưng task đã có, cập nhật facilityId
      if (matchedTask && !currentFacilityId) {
        currentFacilityId = matchedTask.facilityId;
      }

      // 4. Tải danh sách nhân viên của cơ sở để phục vụ phân công
      if (currentFacilityId > 0) {
        const workload = await getStaffWorkload(currentFacilityId);
        setStaffList(workload);
      }

      // 5. Nếu vẫn chưa tìm thấy (fallback an toàn)
      if (!matchedTask) {
        matchedTask = {
          id: tId,
          taskType:
            tId >= 200000 ? 'RETURN' : tId >= 100000 ? 'CHECK_IN' : 'INCIDENT',
          title: `Công việc điều phối #${tId}`,
          facilityId: currentFacilityId || 1,
          facilityName: 'Cơ sở lưu trữ SmartStorage',
          unitCode: 'Chưa xác định',
          customerName: 'Khách hàng',
          customerPhone: 'Chưa cập nhật',
          scheduledDate: dateParam,
          scheduledTime: 'Hôm nay',
          priority: 'NORMAL',
          isUrgent: false,
          status: 'UNASSIGNED',
          notes: 'Nhiệm vụ đang chờ tiếp nhận và phân công nhân viên.',
          referenceCode: `TASK-${tId}`,
        };
      }

      setTask(matchedTask);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu công việc:', err);
    } finally {
      setLoading(false);
    }
  }, [tId, facilityIdParam, dateParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Xử lý phân công nhân viên
  const handleAssign = async (payload: AssignTaskPayload) => {
    try {
      const res = await assignStaffToTask(payload);
      showNotification(res.message || 'Phân công nhân sự thành công!');

      // Cập nhật state trực tiếp
      const assignedStaff = staffList.find((s) => s.staffId === payload.staffId);
      if (task) {
        setTask({
          ...task,
          assignedStaffId: payload.staffId,
          assignedStaffName:
            assignedStaff?.staffName ||
            res.updatedTask.assignedStaffName ||
            'Nhân viên trực ca',
          status: 'ASSIGNED',
          notes: payload.notes || task.notes,
        });
      }
    } catch (err: unknown) {
      showNotification(
        err instanceof Error ? err.message : 'Có lỗi khi phân công nhân viên.'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">
          Đang tải dữ liệu công việc thực tế...
        </p>
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

  const isAssigned = Boolean(task.assignedStaffId);

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumb items={breadcrumbItems} />

      {/* Thông báo thao tác */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Công việc & Nút Phân công nhân sự */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-brand-600 bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Cấp 4 — Chi tiết Công việc
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 px-2 py-0.5 rounded-md bg-slate-100">
                {task.referenceCode}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{task.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thời gian hẹn: {task.scheduledDate} · {task.scheduledTime} · Cơ sở: {task.facilityName}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Status Badge */}
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                task.status === 'COMPLETED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isAssigned
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {task.status === 'COMPLETED'
                ? '✓ ĐÃ HOÀN THÀNH'
                : isAssigned
                ? '👤 ĐÃ PHÂN CÔNG'
                : '⏳ CHƯA PHÂN CÔNG'}
            </span>

            {/* Nút Phân công / Điều chuyển Nhân sự (Chức năng cốt lõi của Manager) */}
            <button
              type="button"
              onClick={() => setAssignModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                isAssigned
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {isAssigned ? (
                <>
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>Điều chuyển nhân sự</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Phân công nhân viên</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid 4 Thẻ Thông tin Cốt lõi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thẻ 1: Thông tin Hợp đồng / Tham chiếu */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3 text-xs font-bold uppercase text-slate-800">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>Thông tin Hợp đồng / Tham chiếu</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã tham chiếu:</span>
              <span className="font-mono font-bold text-slate-800">{task.referenceCode}</span>
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
              <span className="text-slate-500">Mức độ ưu tiên:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  task.isUrgent
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {task.isUrgent ? 'Khẩn cấp' : 'Bình thường'}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-100">
              <span className="text-slate-500">Ghi chú yêu cầu:</span>
              <span className="font-medium text-slate-700 text-right max-w-xs">{task.notes}</span>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Khách hàng */}
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
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {task.customerPhone}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cơ sở lưu trữ:</span>
              <span className="font-medium text-slate-700">{task.facilityName}</span>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Ô kho thực hiện */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3 text-xs font-bold uppercase text-slate-800">
            <Box className="w-4 h-4 text-brand-600" />
            <span>Ô kho thực hiện</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Mã ô kho:</span>
              <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {task.unitCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Loại công việc:</span>
              <span className="font-semibold text-slate-800">
                {task.taskType === 'CHECK_IN'
                  ? 'Bàn giao nhận kho (Check-in)'
                  : task.taskType === 'RETURN'
                  ? 'Nghiệm thu trả kho (Return)'
                  : 'Sự cố kỹ thuật (Incident)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng thái ô kho:</span>
              <span className="font-medium text-slate-700">Đang phục vụ hợp đồng</span>
            </div>
          </div>
        </div>

        {/* Thẻ 4: Nhân viên phụ trách (Nơi Manager kiểm soát & Gán việc) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 text-xs font-bold uppercase text-slate-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-600" />
              <span>Nhân viên phụ trách ca</span>
            </div>
            {isAssigned && (
              <button
                type="button"
                onClick={() => setAssignModalOpen(true)}
                className="text-xs text-brand-600 hover:text-brand-700 font-bold lowercase underline cursor-pointer"
              >
                đổi người
              </button>
            )}
          </div>

          {isAssigned ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Họ tên nhân viên:</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                  {task.assignedStaffName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái tiếp nhận:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Đã gán nhiệm vụ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nhiệm vụ trực tiếp:</span>
                <span className="text-slate-700">Thực hiện tại hiện trường theo ca</span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Nhiệm vụ chưa được phân công nhân viên</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Chỉ định nhân viên ca trực để tiến hành tiếp đón hoặc hỗ trợ hiện trường.
              </p>
              <button
                type="button"
                onClick={() => setAssignModalOpen(true)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                + Chọn & Gán nhân viên ngay
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thông tin Chi tiết Theo Từng Loại Việc (Góc nhìn Quản lý & Giám sát) */}
      {task.taskType === 'INCIDENT' && (
        <div className="space-y-6">
          {/* Thông tin sự cố & Bằng chứng hiện trường */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Wrench className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Chi tiết phản ánh sự cố kỹ thuật
              </h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <p>
                <strong className="text-slate-900">Mô tả sự cố:</strong> {task.notes || 'Không có mô tả chi tiết'}
              </p>
              {supportTicket?.assignmentNotes && (
                <p>
                  <strong className="text-slate-900">Ghi chú điều phối trước:</strong>{' '}
                  {supportTicket.assignmentNotes}
                </p>
              )}
            </div>

            {/* Bằng chứng hình ảnh khách hàng gửi */}
            {supportTicket?.attachments && supportTicket.attachments.length > 0 ? (
              <ImageGallery
                title="Hình ảnh bằng chứng sự cố do khách hàng gửi"
                images={supportTicket.attachments.map((a) => a.fileUrl)}
              />
            ) : (
              <ImageGallery title="Hình ảnh bằng chứng sự cố do khách hàng gửi" />
            )}

            {/* Kết quả nghiệm thu của Staff (nếu nhân viên đã xử lý xong) */}
            {supportTicket?.resolutionNotes && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Biên bản nghiệm thu hiện trường của Nhân viên</span>
                </div>
                <p className="text-slate-700">{supportTicket.resolutionNotes}</p>
                {supportTicket.resolutionAttachments &&
                  supportTicket.resolutionAttachments.length > 0 && (
                    <div className="pt-2">
                      <ImageGallery
                        title="Hình ảnh sau khi nhân viên xử lý hoàn tất"
                        images={supportTicket.resolutionAttachments.map((a) => a.fileUrl)}
                      />
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {task.taskType === 'CHECK_IN' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Quy trình đón tiếp & Bàn giao nhận kho (Check-in)
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Nhiệm vụ này dành cho nhân viên trực ca thực hiện đón tiếp khách hàng tại quầy lễ tân hoặc trực tiếp tại kho.
            Nhân viên sẽ hướng dẫn khách hàng kiểm tra tình trạng ô kho, hướng dẫn thao tác mã PIN và lập biên bản bàn giao điện tử.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/manager/contracts')}
              className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl border border-brand-200 transition-colors cursor-pointer"
            >
              Xem danh mục Hợp đồng
            </button>
          </div>
        </div>
      )}

      {task.taskType === 'RETURN' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PackageOpen className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Quy trình nghiệm thu trả kho & Tất toán cọc
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Khách hàng đã nộp yêu cầu trả kho. Nhân viên được phân công sẽ đến kiểm tra hiện trường ô kho
            (tình trạng vệ sinh, hỏng hóc, thiết bị). Sau khi nhân viên nộp biên bản nghiệm thu, Quản lý cơ sở sẽ tiến hành duyệt quyết toán và hoàn cọc tại màn hình Giám sát Hợp đồng.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/manager/contracts')}
              className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl border border-brand-200 transition-colors cursor-pointer"
            >
              Chuyển tới Giám sát Hợp đồng để duyệt quyết toán
            </button>
          </div>
        </div>
      )}

      {/* Modal Phân công / Điều chuyển Nhân viên */}
      <AssignStaffModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        task={task}
        staffList={staffList}
        onAssign={handleAssign}
      />
    </div>
  );
};
