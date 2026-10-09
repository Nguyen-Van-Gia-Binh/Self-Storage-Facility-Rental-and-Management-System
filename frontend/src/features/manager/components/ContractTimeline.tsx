// frontend/src/features/manager/components/ContractTimeline.tsx
import React from 'react';
import {
  CheckCircle2,
  CreditCard,
  Key,
  AlertTriangle,
  RotateCcw,
  Clock,
} from 'lucide-react';
import type { ManagerContractItem } from '@/types/contractManager';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  color: string;
}

interface ContractTimelineProps {
  contract: ManagerContractItem;
}

export const ContractTimeline: React.FC<ContractTimelineProps> = ({ contract }) => {
  // Sinh các mốc sự kiện động dựa trên trạng thái và mốc ngày của hợp đồng
  const events: TimelineEvent[] = [
    {
      id: 'reservation',
      time: contract.startDate ? `Trước ${contract.startDate}` : 'Khởi tạo',
      title: 'Tạo đơn đặt chỗ thành công',
      description: `Đơn giữ chỗ gắn với ô kho ${contract.storageUnitCode || ''}`,
      icon: Clock,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'deposit',
      time: contract.startDate || '—',
      title: 'Thanh toán cọc & Ký hợp đồng điện tử',
      description: `Tiền cọc: ${new Intl.NumberFormat('vi-VN').format(contract.depositAmount || 0)} đ qua VietQR`,
      icon: CreditCard,
      color: 'bg-emerald-100 text-emerald-700',
    },
  ];

  if (contract.status !== 'PENDING_CHECK_IN') {
    events.push({
      id: 'checkin',
      time: contract.startDate || '—',
      title: 'Bàn giao kho & Cấp mã PIN truy cập',
      description: contract.accessCode
        ? `Mã PIN: ${contract.accessCode} • Trạng thái: ACTIVE`
        : 'Biên bản bàn giao số điện tử đã ký',
      icon: Key,
      color: 'bg-purple-100 text-purple-700',
    });
  }

  if (contract.status === 'OVERDUE') {
    events.push({
      id: 'overdue',
      time: contract.endDateExclusive || '—',
      title: 'Hợp đồng chuyển trạng thái Quá hạn (OVERDUE)',
      description: `Đã quá hạn ${contract.overdueDays || 1} ngày • Đang tích lũy phí phạt`,
      icon: AlertTriangle,
      color: 'bg-orange-100 text-orange-700',
    });
  }

  if (contract.status === 'PENDING_RETURN' || (contract.status as string) === 'INSPECTED') {
    events.push({
      id: 'return',
      time: contract.endDateExclusive || '—',
      title: 'Yêu cầu trả kho & Nghiệm thu hiện trường',
      description: contract.isInspected
        ? 'Nhân viên đã hoàn thành biên bản kiểm tra kho'
        : 'Đang chờ nhân viên hoàn tất biên bản kiểm tra',
      icon: RotateCcw,
      color: 'bg-amber-100 text-amber-700',
    });
  }

  if (contract.status === 'CLOSED') {
    events.push({
      id: 'closed',
      time: contract.endDateExclusive || '—',
      title: 'Quyết toán thanh lý & Hoàn cọc thành công',
      description: 'Hợp đồng đã đóng (CLOSED). Ô kho đã được giải phóng sẵn sàng đón khách mới.',
      icon: CheckCircle2,
      color: 'bg-slate-100 text-slate-700',
    });
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((ev) => {
        const Icon = ev.icon;
        return (
          <div key={ev.id} className="relative group">
            {/* Dot icon */}
            <div
              className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${ev.color}`}
            >
              <Icon className="w-3 h-3" />
            </div>

            {/* Event detail */}
            <div className="text-xs">
              <span className="text-[11px] font-mono text-slate-400 block">{ev.time}</span>
              <h4 className="font-bold text-slate-800 mt-0.5">{ev.title}</h4>
              {ev.description && (
                <p className="text-slate-500 mt-0.5 leading-relaxed">{ev.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
