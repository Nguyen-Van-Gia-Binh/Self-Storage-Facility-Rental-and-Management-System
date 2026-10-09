// frontend/src/features/manager/components/IncidentTimeline.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History, CheckCircle2, Clock, User, Wrench, ShieldCheck } from 'lucide-react';
import type { ManagementSupportTicket } from '../types/staffAssignment';

interface IncidentTimelineProps {
  ticket: ManagementSupportTicket;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ ticket }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const fmt = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  // Xây dựng chuỗi sự kiện dựa trên dữ liệu thật
  const events = [
    {
      id: 1,
      title: `${ticket.customerName} gửi báo cáo sự cố #${ticket.code}`,
      time: fmt(ticket.createdAt),
      icon: Clock,
      color: 'bg-amber-100 text-amber-700',
      active: true,
    },
    {
      id: 2,
      title: 'Quản lý cơ sở tiếp nhận yêu cầu hỗ trợ kỹ thuật',
      time: fmt(ticket.createdAt),
      icon: User,
      color: 'bg-blue-100 text-blue-700',
      active: true,
    },
  ];

  if (ticket.assignedStaffName) {
    events.push({
      id: 3,
      title: `Phân công nhân viên ${ticket.assignedStaffName} phụ trách hiện trường`,
      time: fmt(ticket.updatedAt || ticket.createdAt),
      icon: User,
      color: 'bg-sky-100 text-sky-700',
      active: true,
    });
  }

  if (ticket.status === 'IN_PROGRESS' || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    events.push({
      id: 4,
      title: `${ticket.assignedStaffName || 'Nhân viên'} bắt đầu kiểm tra và xử lý hiện trường`,
      time: fmt(ticket.updatedAt || ticket.createdAt),
      icon: Wrench,
      color: 'bg-orange-100 text-orange-700',
      active: true,
    });
  }

  if (ticket.resolvedAt || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    events.push({
      id: 5,
      title: 'Hoàn thành sửa chữa và nghiệm thu kết quả',
      time: fmt(ticket.resolvedAt || ticket.updatedAt),
      icon: CheckCircle2,
      color: 'bg-emerald-100 text-emerald-700',
      active: true,
    });
  }

  if (ticket.status === 'CLOSED') {
    events.push({
      id: 6,
      title: 'Đã đóng sự cố và lưu trữ biên bản bàn giao hoàn tất',
      time: fmt(ticket.updatedAt),
      icon: ShieldCheck,
      color: 'bg-slate-100 text-slate-700',
      active: true,
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Lịch sử hoạt động & Tiến trình xử lý ({events.length} mốc)
          </h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="p-5 pt-1 border-t border-slate-100">
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {events.map((ev) => {
              const Icon = ev.icon;
              return (
                <div key={ev.id} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 border-white ring-2 ring-slate-100 ${ev.color}`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">
                      {ev.title}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                      {ev.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
