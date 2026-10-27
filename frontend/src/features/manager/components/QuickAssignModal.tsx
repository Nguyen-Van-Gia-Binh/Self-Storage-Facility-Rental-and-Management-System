// frontend/src/features/manager/components/QuickAssignModal.tsx
import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle, User, Phone } from 'lucide-react';
import type { ManagementSupportTicket, StaffWorkloadItem } from '../types/staffAssignment';
import { getStaffWorkload, assignSupportStaffDirect } from '../api/staffAssignmentApi';

interface QuickAssignModalProps {
  ticket: ManagementSupportTicket | null;
  facilityId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickAssignModal: React.FC<QuickAssignModalProps> = ({
  ticket,
  facilityId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [staffList, setStaffList] = useState<StaffWorkloadItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && facilityId) {
      setSelectedStaffId(ticket?.assignedStaffId ?? null);
      setNotes('');
      setError(null);
      setLoading(true);

      getStaffWorkload(facilityId)
        .then((list) => {
          setStaffList(list);
          if (!ticket?.assignedStaffId && list.length > 0) {
            // Tự động chọn nhân viên sẵn sàng nhất (ít việc nhất)
            const sorted = [...list].sort((a, b) => a.activeTaskCount - b.activeTaskCount);
            setSelectedStaffId(sorted[0].staffId);
          }
        })
        .catch(() => {
          setError('Không thể tải danh sách nhân viên cơ sở.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, facilityId, ticket]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setError('Vui lòng chọn nhân viên phụ trách.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await assignSupportStaffDirect(
        ticket.id,
        selectedStaffId,
        notes.trim() || 'Phân công nhanh từ danh sách sự cố cơ sở'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Lỗi phân công nhân sự:', err);
      setError(err?.message || 'Không thể phân công nhân sự. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Phân công nhân sự xử lý sự cố
              </h3>
              <p className="text-[11px] font-mono text-slate-500">
                #{ticket.code} · {ticket.storageUnitCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tóm tắt sự cố */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold text-slate-900">{ticket.categoryDisplayName || ticket.category}</span>
              <span className="font-mono text-slate-500">Ô kho: {ticket.storageUnitCode}</span>
            </div>
            <p className="text-slate-600 line-clamp-2 leading-relaxed">
              {ticket.description}
            </p>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
              <User className="w-3 h-3 text-slate-400" />
              <span>Khách thuê: <strong>{ticket.customerName}</strong> ({ticket.customerPhone || '—'})</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Danh sách nhân viên trực ca */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Chọn nhân viên vận hành phụ trách:
            </label>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải danh sách nhân sự cơ sở...
              </div>
            ) : staffList.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-center">
                Cơ sở hiện chưa có nhân viên nào được phân bổ.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {staffList.map((staff) => {
                  const isSelected = selectedStaffId === staff.staffId;
                  const isOverloaded = staff.status === 'OVERLOADED';

                  return (
                    <div
                      key={staff.staffId}
                      onClick={() => setSelectedStaffId(staff.staffId)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {staff.staffName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {staff.staffName}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              {staff.staffPhone}
                            </span>
                            {staff.shift && (
                              <span>· {staff.shift}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isOverloaded
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {staff.activeTaskCount} việc đang làm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ghi chú điều phối */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Ghi chú chỉ đạo cho nhân viên (tùy chọn):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Kiểm tra ngay khóa cửa ô kho, liên hệ khách xác nhận trước khi phá khóa..."
              rows={2}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedStaffId}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang phân công...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Xác nhận phân công</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
