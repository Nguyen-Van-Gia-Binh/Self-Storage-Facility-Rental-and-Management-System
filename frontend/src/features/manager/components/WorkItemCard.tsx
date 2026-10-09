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

  const getTypeIcon = (type: DispatchTaskType) => {
    switch (type) {
      case 'CHECK_IN':
        return (
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        );
      case 'RETURN':
        return (
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <PackageOpen className="w-5 h-5" />
          </div>
        );
      case 'INCIDENT':
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {getTypeIcon(task.taskType)}
        <div className="space-y-1.5 flex-1 min-w-0">
          {/* Hàng 1: Loại CV + Trạng thái + Mã */}
          <div className="flex flex-wrap items-center gap-2">
            {getTypeBadge(task.taskType)}
            {getStatusBadge(task.status)}
            <span className="text-xs font-mono font-bold text-slate-700 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
              {task.referenceCode || `Task #${task.id}`}
            </span>
          </div>

          {/* Hàng 2: Tiêu đề & Ghi chú */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              {task.title}
            </h4>
            {task.notes && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {task.notes}
              </p>
            )}
          </div>

          {/* Hàng 3: Chi tiết Khách + Ô kho + Giờ + Phụ trách */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-0.5">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">{task.customerName}</span>
              {task.customerPhone && <span className="text-slate-400">({task.customerPhone})</span>}
            </div>

            <div className="flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Kho:</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                {task.unitCode}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Giờ hẹn:</span>
              <span className="font-semibold text-slate-800">{task.scheduledTime || '08:00'}</span>
            </div>

            {task.assignedStaffName ? (
              <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full font-medium">
                <span>Phụ trách: {task.assignedStaffName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                <span>Chưa gán nhân sự</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Button xem chi tiết */}
      <div className="shrink-0 self-end md:self-center pt-2 md:pt-0">
        <button
          type="button"
          onClick={() => onViewDetails(task.id)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-600 hover:text-white rounded-xl border border-brand-200 transition-all cursor-pointer shadow-2xs group-hover:bg-brand-600 group-hover:text-white"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
