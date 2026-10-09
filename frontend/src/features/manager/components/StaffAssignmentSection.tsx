// frontend/src/features/manager/components/StaffAssignmentSection.tsx
import React, { useState } from 'react';
import { UserCheck, UserX, RefreshCw, Edit3, Send, Phone, Clock, FileText } from 'lucide-react';
import type { StaffWorkloadItem } from '../types/staffAssignment';

interface StaffAssignmentSectionProps {
  assignedStaffId?: number | null;
  assignedStaffName?: string | null;
  assignedStaffPhone?: string | null;
  assignmentNotes?: string | null;
  assignedAt?: string | null;
  staffList: StaffWorkloadItem[];
  onAssign: (staffId: number, notes?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const StaffAssignmentSection: React.FC<StaffAssignmentSectionProps> = ({
  assignedStaffId,
  assignedStaffName,
  assignedStaffPhone,
  assignmentNotes,
  assignedAt,
  staffList,
  onAssign,
  isSubmitting = false,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(!assignedStaffId);
  const [selectedStaffId, setSelectedStaffId] = useState<number | ''>(assignedStaffId || '');
  const [notes, setNotes] = useState<string>(assignmentNotes || '');

  const handleSave = async () => {
    if (!selectedStaffId) return;
    await onAssign(Number(selectedStaffId), notes);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setSelectedStaffId(assignedStaffId || '');
    setNotes(assignmentNotes || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Nhân viên phụ trách hiện trường
          </h3>
        </div>

        {assignedStaffId && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đổi nhân viên</span>
          </button>
        )}
      </div>

      {assignedStaffId && !isEditing ? (
        /* Trạng thái đã phân công */
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {assignedStaffName ? assignedStaffName.charAt(0) : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {assignedStaffName || `Nhân viên #${assignedStaffId}`}
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    ✓ Đã phân công
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {assignedStaffPhone || '0987654321'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Ca làm việc hiện tại
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ghi chú điều phối */}
          <div className="pt-2 border-t border-slate-200/60 text-xs">
            <span className="text-slate-500 font-medium block mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              Ghi chú điều phối từ Quản lý:
            </span>
            <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/70 font-normal">
              {assignmentNotes || 'Kiểm tra hiện trường, khắc phục sự cố và lập biên bản nghiệm thu.'}
            </p>
          </div>
        </div>
      ) : (
        /* Form phân công / chọn nhân viên */
        <div className="space-y-4">
          {!assignedStaffId && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200/60">
              <UserX className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Sự cố hiện chưa có nhân viên phụ trách. Vui lòng phân công nhân viên theo ca trực.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Chọn nhân viên trực ca tại cơ sở:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {staffList.length > 0 ? (
                staffList.map((s) => (
                  <label
                    key={s.staffId}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedStaffId === s.staffId
                        ? 'bg-brand-50/60 border-brand-500 ring-2 ring-brand-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="assigned_staff"
                        checked={selectedStaffId === s.staffId}
                        onChange={() => setSelectedStaffId(s.staffId)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{s.staffName}</span>
                        <span className="text-[11px] text-slate-500 block">{s.shift || 'Ca trực'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600">
                      {s.activeTaskCount} việc
                    </span>
                  </label>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl col-span-2">
                  Đang tải danh sách nhân viên cơ sở...
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú chỉ đạo cho nhân viên:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Kiểm tra khóa, thử mở bằng chìa dự phòng hoặc liên hệ thợ kỹ thuật..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {assignedStaffId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
            )}
            <button
              type="button"
              disabled={!selectedStaffId || isSubmitting}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang lưu...' : '📋 Xác nhận phân công'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
