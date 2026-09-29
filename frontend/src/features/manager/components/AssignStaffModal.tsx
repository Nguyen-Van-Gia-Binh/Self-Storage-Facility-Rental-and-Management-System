import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  AlertTriangle,
  Clock,
  FileCheck,
  RotateCcw,
  Wrench,
  Lock,
  Send,
  Loader2,
} from 'lucide-react';
import { SlaCountdownBadge } from './SlaCountdownBadge';
import type {
  DailyDispatchTaskItem,
  StaffWorkloadItem,
  AssignTaskPayload,
  DispatchTaskPriority,
} from '../types/staffAssignment';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DailyDispatchTaskItem | null;
  staffList: StaffWorkloadItem[];
  onAssign: (payload: AssignTaskPayload) => Promise<void>;
}

export const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  isOpen,
  onClose,
  task,
  staffList,
  onAssign,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>('');
  const [priority, setPriority] = useState<DispatchTaskPriority>('NORMAL');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && task) {
      setSelectedStaffId(task.assignedStaffId || '');
      setPriority(task.priority || (task.isUrgent ? 'URGENT' : 'NORMAL'));
      setNotes(task.notes || '');
      setErrorMessage(null);
    }
  }, [isOpen, task?.id]);

  if (!isOpen || !task) return null;

  const isReassign = Boolean(task.assignedStaffId);
  const selectedStaff = staffList.find((s) => s.staffId === selectedStaffId);

  const getTaskIcon = () => {
    switch (task.taskType) {
      case 'CHECK_IN':
        return <FileCheck className="w-5 h-5 text-blue-600" />;
      case 'RETURN':
        return <RotateCcw className="w-5 h-5 text-purple-600" />;
      case 'INCIDENT':
        return <Wrench className="w-5 h-5 text-amber-600" />;
      case 'OVERLOCK':
        return <Lock className="w-5 h-5 text-rose-600" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setErrorMessage('Vui lòng chọn nhân viên phụ trách ca trực.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onAssign({
        taskId: task.id,
        taskType: task.taskType,
        staffId: Number(selectedStaffId),
        priority,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi phân công nhân viên'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
              {getTaskIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isReassign ? 'Điều chuyển Nhân sự Phụ trách' : 'Phân công Nhân sự Cơ sở'}
              </h3>
              <p className="text-xs text-slate-500">
                {isReassign
                  ? `Chuyển giao nhiệm vụ từ ${task.assignedStaffName || 'nhân viên cũ'} sang người mới (AC-4)`
                  : 'Chỉ định nhân viên tiếp nhận nhiệm vụ thực địa (US-FM-05.1 AC-1)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form id="assign-staff-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Task Brief Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-slate-700">
                {task.referenceCode || `#TASK-${task.id}`}
              </span>
              <div className="flex items-center gap-2">
                {(task.isUrgent || task.taskType === 'INCIDENT') && (
                  <SlaCountdownBadge
                    slaDeadline={task.slaDeadline}
                    createdAt={task.scheduledDate}
                  />
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 font-mono">
                  Ô kho {task.unitCode}
                </span>
              </div>
            </div>
            <h4 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
              <span>
                Khách hàng: <strong className="text-slate-700">{task.customerName}</strong>
              </span>
              <span>
                SĐT: <strong className="text-slate-700">{task.customerPhone}</strong>
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3 text-slate-400" />
                Giờ hẹn: {task.scheduledTime} ({task.scheduledDate})
              </span>
            </div>
          </div>

          {/* Staff Selection (Cân bằng tải AC-3) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>Chọn nhân viên cơ sở phụ trách</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Khối lượng công việc trực ca hôm nay
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {staffList.length === 0 ? (
                <div className="text-center py-6 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-slate-700">Chưa có nhân viên trực thuộc cơ sở này</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Cơ sở hiện chưa được phân công nhân viên, hoặc bạn chưa có quyền quản lý cơ sở được chọn.
                  </p>
                </div>
              ) : (
                staffList.map((staff) => {
                  const isCurrentAssigned = staff.staffId === task.assignedStaffId;
                  const isSelected = staff.staffId === selectedStaffId;
                  const isOverloaded = staff.activeTaskCount >= 5;

                  return (
                    <label
                      key={staff.staffId}
                      className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="assignedStaff"
                            value={staff.staffId}
                            checked={isSelected}
                            onChange={() => setSelectedStaffId(staff.staffId)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">
                                {staff.staffName}
                              </span>
                              {isCurrentAssigned && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                                  Đang phụ trách
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {staff.shift || 'Ca trực'} · {staff.staffPhone}
                            </p>
                          </div>
                        </div>

                        {/* Workload badge */}
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isOverloaded
                                ? 'bg-rose-100 text-rose-700'
                                : staff.activeTaskCount <= 2
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {staff.activeTaskCount} việc đang làm
                          </span>
                          {isOverloaded && (
                            <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                              Quá tải tải việc!
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Warning if selecting overloaded staff (AC-3) */}
            {selectedStaff && selectedStaff.activeTaskCount >= 5 && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Lưu ý cân bằng tải (AC-3):</strong> Nhân viên {selectedStaff.staffName}{' '}
                  hiện đang có {selectedStaff.activeTaskCount} nhiệm vụ tồn đọng. Bạn nên cân nhắc
                  phân bổ cho nhân viên khác có khối lượng nhẹ hơn.
                </span>
              </div>
            )}
          </div>

          {/* Priority Selection (AC-2 & BR-SUP-01) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Mức độ ưu tiên & Cam kết xử lý (SLA)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setPriority('NORMAL')}
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  priority === 'NORMAL'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">Bình thường</span>
                  <input
                    type="radio"
                    name="assignModalPriority"
                    value="NORMAL"
                    checked={priority === 'NORMAL'}
                    onChange={() => setPriority('NORMAL')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Xử lý theo đúng khung giờ hẹn trước trong ngày
                </p>
              </div>

              <div
                onClick={() => setPriority('URGENT')}
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  priority === 'URGENT'
                    ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    Khẩn cấp (SLA 2h)
                  </span>
                  <input
                    type="radio"
                    name="assignModalPriority"
                    value="URGENT"
                    checked={priority === 'URGENT'}
                    onChange={() => setPriority('URGENT')}
                    className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                  />
                </div>
                <p className="text-[11px] text-rose-600 font-medium">
                  Bắt buộc tiếp nhận & xử lý trong 2 giờ (BR-SUP-01)
                </p>
              </div>
            </div>
          </div>

          {/* Notes / Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Chỉ đạo / Ghi chú từ Facility Manager
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú hoặc nhắc nhở đặc biệt cho nhân viên trực ca..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
        </form>

        {/* Modal Footer - Sticky bottom */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            form="assign-staff-form"
            type="submit"
            disabled={isSubmitting || staffList.length === 0 || !selectedStaffId}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{isReassign ? 'Xác nhận điều chuyển' : 'Gán nhiệm vụ ngay'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
