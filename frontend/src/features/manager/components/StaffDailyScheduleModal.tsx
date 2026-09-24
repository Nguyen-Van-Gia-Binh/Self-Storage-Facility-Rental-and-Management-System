import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  FileCheck,
  RotateCcw,
  Wrench,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { StaffWorkloadItem } from '../types/staffAssignment';
import type { StaffDailyTaskReport } from '@/types';
import { getStaffDailySchedule } from '../api/staffAssignmentApi';

interface StaffDailyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffWorkloadItem | null;
}

export const StaffDailyScheduleModal: React.FC<StaffDailyScheduleModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  const [schedule, setSchedule] = useState<StaffDailyTaskReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !staff) {
      setSchedule(null);
      return;
    }

    let isMounted = true;
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStaffDailySchedule(staff.staffId);
        if (isMounted) {
          setSchedule(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Không thể tải lịch trình ca trực của nhân viên'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSchedule();

    return () => {
      isMounted = false;
    };
  }, [isOpen, staff]);

  if (!isOpen || !staff) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lịch trình Ca trực & Công việc trong ngày
              </h3>
              <p className="text-xs text-slate-500">
                Nhân viên: <strong className="text-slate-800">{staff.staffName}</strong> ·{' '}
                {staff.shift || 'Ca trực tiêu chuẩn'}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Đang tải lịch trình chi tiết...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          ) : schedule ? (
            <>
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 text-[11px] font-semibold">
                    <FileCheck className="w-3.5 h-3.5" /> Check-in
                  </div>
                  <p className="text-lg font-black text-blue-900 mt-1">
                    {schedule.pendingCheckIns?.length || 0}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600 text-[11px] font-semibold">
                    <RotateCcw className="w-3.5 h-3.5" /> Trả kho
                  </div>
                  <p className="text-lg font-black text-purple-900 mt-1">
                    {schedule.pendingReturns?.length || 0}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-600 text-[11px] font-semibold">
                    <Wrench className="w-3.5 h-3.5" /> Sự cố & Overlock
                  </div>
                  <p className="text-lg font-black text-amber-900 mt-1">
                    {schedule.openSupportRequests?.length || 0}
                  </p>
                </div>
              </div>

              {/* 1. Danh sách Check-in */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span>1. Lượt hẹn Bàn giao Check-in ({schedule.pendingCheckIns?.length || 0})</span>
                </h4>
                {schedule.pendingCheckIns?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">
                    Không có lượt bàn giao check-in nào được gán cho nhân viên này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {schedule.pendingCheckIns.map((ci) => (
                      <div
                        key={ci.reservationId}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{ci.customerName}</span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">
                              {ci.unitCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ci.customerPhone} · Đặt chỗ #{ci.reservationId}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {ci.appointmentTime}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 mt-0.5">
                            {ci.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Danh sách Return */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  <span>2. Lượt hẹn Nghiệm thu Trả kho ({schedule.pendingReturns?.length || 0})</span>
                </h4>
                {schedule.pendingReturns?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">
                    Không có lượt trả kho nào được gán cho nhân viên này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {schedule.pendingReturns.map((ret) => (
                      <div
                        key={ret.contractId}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{ret.customerName}</span>
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-mono text-[10px] font-bold">
                              {ret.unitCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ret.contractCode} · Cọc:{' '}
                            {(ret.depositAmount || 0).toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {ret.appointmentTime}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 mt-0.5">
                            {ret.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Danh sách Sự cố & Overlock */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>
                    3. Sự cố Kỹ thuật & Khóa ngoài ({schedule.openSupportRequests?.length || 0})
                  </span>
                </h4>
                {schedule.openSupportRequests?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">
                    Không có sự cố hoặc lệnh khóa ngoài nào được gán cho nhân viên này.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {schedule.openSupportRequests.map((inc) => (
                      <div
                        key={inc.ticketId}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 leading-snug">
                              {inc.title}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                              {inc.unitCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {inc.isOverlockTask ? (
                              <span className="text-rose-600 font-semibold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Lệnh khóa ngoài Overlock D+4
                              </span>
                            ) : (
                              <span>Ticket #{inc.ticketId} · Khách: {inc.customerName || 'N/A'}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          {inc.priority === 'URGENT' && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 mb-1">
                              SLA 2h
                            </span>
                          )}
                          <p className="text-[11px] text-slate-500">Hạn: {inc.slaDeadline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
