// frontend/src/features/manager/components/WorkItemCard.tsx
import React from 'react';
import {
  CheckCircle,
  PackageOpen,
  Wrench,
  Clock,
  User,
  Box,
  ArrowRight,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import type { DailyDispatchTaskItem, DispatchTaskType, DispatchTaskStatus } from '../types/staffAssignment';

interface WorkItemCardProps {
  task: DailyDispatchTaskItem;
  onViewDetails: (taskId: number) => void;
}

export const WorkItemCard: React.FC<WorkItemCardProps> = ({ task, onViewDetails }) => {
  const getTypeBadge = (type: DispatchTaskType) => {
    switch (type) {
      case 'CHECK_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check-in bàn giao</span>
          </span>
        );
      case 'RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <PackageOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Nghiệm thu trả kho</span>
          </span>
        );
      case 'INCIDENT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Wrench className="w-3.5 h-3.5 text-rose-600" />
            <span>Sự cố kỹ thuật</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: DispatchTaskStatus) => {
    switch (status) {
      case 'COMPLETED':
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Đã hoàn thành</span>
          </span>
        );
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            <span>Đang xử lý</span>
          </span>
        );
      case 'UNASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Chờ xử lý</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
            <XCircle className="w-3 h-3 text-slate-500" />
            <span>Hủy</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
      <div className="space-y-2 flex-1">
        {/* Hàng 1: Loại CV + Trạng thái + Mã */}
        <div className="flex flex-wrap items-center gap-2">
          {getTypeBadge(task.taskType)}
          {getStatusBadge(task.status)}
          <span className="text-xs font-bold text-slate-800 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
            {task.referenceCode || `Task #${task.id}`}
          </span>
        </div>

        {/* Hàng 2: Tiêu đề / Mô tả & Khách hàng */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
            {task.title}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {task.notes || 'Không có ghi chú thêm'}
          </p>
        </div>

        {/* Hàng 3: Chi tiết Khách + Ô kho + Giờ */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">{task.customerName}</span>
            <span className="text-slate-400">({task.customerPhone})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-slate-400" />
            <span>Kho:</span>
            <span className="font-semibold text-slate-800">{task.unitCode}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Giờ hẹn:</span>
            <span className="font-medium text-slate-700">{task.scheduledTime || '08:00'}</span>
          </div>

          {task.assignedStaffName && (
            <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
              <span>Phụ trách: {task.assignedStaffName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Button xem chi tiết */}
      <div className="shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={() => onViewDetails(task.id)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-600 hover:text-white rounded-xl transition-all cursor-pointer"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
