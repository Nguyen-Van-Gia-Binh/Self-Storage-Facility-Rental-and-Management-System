// frontend/src/features/manager/components/WorkItemCard.tsx
import React from 'react';
import {
  CheckCircle,
  PackageOpen,
  Wrench,
  ArrowRight,
  UserPlus,
  RotateCcw,
  Lock,
  FileCheck,
} from 'lucide-react';
import type { DailyDispatchTaskItem, DispatchTaskType, DispatchTaskStatus } from '../types/staffAssignment';

interface WorkItemCardProps {
  task: DailyDispatchTaskItem;
  onViewDetails: (taskId: number) => void;
  onAssign?: (task: DailyDispatchTaskItem) => void;
  onDirectSettlement?: (contractId: number) => void;
}

export const WorkItemCard: React.FC<WorkItemCardProps> = ({
  task,
  onViewDetails,
  onAssign,
  onDirectSettlement,
}) => {
  const isAssigned = Boolean(task.assignedStaffId || task.assignedStaffName);

  const getTypeLabel = (type: DispatchTaskType) => {
    switch (type) {
      case 'CHECK_IN':
        return 'Check-in bàn giao';
      case 'RETURN':
        return 'Nghiệm thu trả kho';
      case 'INCIDENT':
      default:
        return 'Sự cố kỹ thuật';
    }
  };

  // Chỉ giữ lại 1 Badge Trạng thái chính duy nhất trên mỗi thẻ công việc
  const getStatusBadge = (status: DispatchTaskStatus) => {
    const effectiveStatus = status === 'UNASSIGNED' && isAssigned ? 'ASSIGNED' : status;
    switch (effectiveStatus) {
      case 'COMPLETED':
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đã hoàn thành
          </span>
        );
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Đang xử lý
          </span>
        );
      case 'UNASSIGNED':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Chờ xử lý
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            Hủy
          </span>
        );
    }
  };

  const getTypeIcon = (type: DispatchTaskType) => {
    switch (type) {
      case 'CHECK_IN':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
        );
      case 'RETURN':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <PackageOpen className="w-4 h-4" />
          </div>
        );
      case 'INCIDENT':
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs hover:border-brand-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Hàng 1: Icon loại việc + Tên loại việc + 1 Badge Trạng thái duy nhất */}
        <div className="flex flex-wrap items-center gap-2.5">
          {getTypeIcon(task.taskType)}
          <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
            {getTypeLabel(task.taskType)}
          </h4>
          {getStatusBadge(task.status)}
        </div>

        {/* Hàng 2: Mã tham chiếu + Tiêu đề rút gọn & thông tin dạng Text gọn gàng */}
        <div className="pl-0 sm:pl-10 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {task.referenceCode || `Task #${task.id}`}
            </span>
            {task.title && !task.title.includes(task.referenceCode || '') && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-700 font-medium truncate max-w-md">{task.title}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-500">
            <span>
              Khách: <strong className="font-medium text-gray-800">{task.customerName}</strong>
              {task.customerPhone && task.customerPhone !== 'Chưa cập nhật' && (
                <span className="text-gray-400 ml-1">({task.customerPhone})</span>
              )}
            </span>
            <span className="text-gray-300">•</span>
            <span>
              Kho: <strong className="font-medium text-gray-800">{task.unitCode}</strong>
            </span>
            <span className="text-gray-300">•</span>
            <span>
              Ngày hẹn: <strong className="font-medium text-gray-700">{task.scheduledDate || 'Trong ngày'}</strong>
            </span>
            <span className="text-gray-300">•</span>
            {task.assignedStaffName ? (
              <span className="font-medium text-gray-700">
                Phụ trách: <strong className="text-gray-900">{task.assignedStaffName}</strong>
              </span>
            ) : (
              <span className="text-rose-500 font-medium">Chưa gán nhân sự</span>
            )}
          </div>
        </div>
      </div>

      {/* Cụm button hành động */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 self-end md:self-center">
        {onAssign && (
          task.status === 'COMPLETED' || task.status === 'RESOLVED' ? (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 rounded-lg border border-gray-200 select-none"
              title="Nhiệm vụ đã hoàn thành, chức năng đổi người đã khóa"
            >
              <Lock className="w-3 h-3 text-gray-400" />
              <span>Đã khóa đổi</span>
            </span>
          ) : !isAssigned ? (
            <button
              type="button"
              onClick={() => onAssign(task)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Phân công</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAssign(task)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-gray-500" />
              <span>Đổi người</span>
            </button>
          )
        )}

        {task.taskType === 'RETURN' && onDirectSettlement && (
          <button
            type="button"
            onClick={() => {
              const contractId = task.referenceId || (task.id >= 200000 ? task.id - 200000 : task.id);
              onDirectSettlement(contractId);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Duyệt quyết toán hợp đồng này ngay"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Duyệt quyết toán</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onViewDetails(task.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:text-brand-700 rounded-lg border border-gray-200 hover:border-brand-300 transition-colors cursor-pointer"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
