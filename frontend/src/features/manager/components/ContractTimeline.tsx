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
import { formatDateVN } from '@/features/customer/utils/unitPickerHelpers';

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

function formatDisplayDate(iso?: string | null): string {
  if (!iso) return '—';
  const trimmed = iso.trim();
  return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? formatDateVN(trimmed.slice(0, 10)) : trimmed;
}

export const ContractTimeline: React.FC<ContractTimelineProps> = ({ contract }) => {
  const startDateDisplay = formatDisplayDate(contract.startDate);
  const endDateDisplay = formatDisplayDate(contract.endDateExclusive);

  // Sinh các mốc sự kiện động dựa trên trạng thái và mốc ngày của hợp đồng
  const events: TimelineEvent[] = [
    {
      id: 'reservation',
      time: contract.startDate ? `Trước ${startDateDisplay}` : 'Khởi tạo',
      title: 'Tạo đơn đặt chỗ thành công',
      description: `Đơn giữ chỗ gắn với ô kho ${contract.storageUnitCode || ''}`,
      icon: Clock,
      color: 'bg-blue-50 text-blue-600 border border-blue-200',
    },
    {
      id: 'deposit',
      time: startDateDisplay,
      title: 'Thanh toán cọc & Ký hợp đồng điện tử',
      description: `Tiền cọc: ${new Intl.NumberFormat('vi-VN').format(contract.depositAmount || 0)} đ qua VNPay`,
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    },
  ];

  if (contract.status !== 'PENDING_CHECK_IN') {
    events.push({
      id: 'checkin',
      time: startDateDisplay,
      title: 'Bàn giao kho & Cấp mã PIN truy cập',
      description: contract.accessCode
        ? `Mã PIN đã cấp • Trạng thái bàn giao hoàn tất`
        : 'Biên bản bàn giao số điện tử đã ký',
      icon: Key,
      color: 'bg-gray-100 text-gray-600 border border-gray-200',
    });
  }

  if (contract.status === 'OVERDUE') {
    events.push({
      id: 'overdue',
      time: endDateDisplay,
      title: 'Hợp đồng chuyển trạng thái Quá hạn',
      description: `Đã quá hạn ${contract.overdueDays || 1} ngày • Đang tích lũy phí phạt`,
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-600 border border-rose-200',
    });
  }

  if (contract.status === 'PENDING_RETURN' || (contract.status as string) === 'INSPECTED') {
    events.push({
      id: 'return',
      time: endDateDisplay,
      title: 'Yêu cầu trả kho & Nghiệm thu hiện trường',
      description: contract.isInspected
        ? 'Nhân viên đã hoàn thành biên bản kiểm tra kho'
        : 'Đang chờ nhân viên hoàn tất biên bản kiểm tra',
      icon: RotateCcw,
      color: 'bg-amber-50 text-amber-600 border border-amber-200',
    });
  }

  if (contract.status === 'CLOSED') {
    events.push({
      id: 'closed',
      time: endDateDisplay,
      title: 'Quyết toán thanh lý & Hoàn cọc thành công',
      description: 'Hợp đồng đã đóng. Ô kho đã được giải phóng sẵn sàng đón khách mới.',
      icon: CheckCircle2,
      color: 'bg-gray-100 text-gray-600 border border-gray-200',
    });
  }

  return (
    <div className="relative pl-7 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
      {events.map((ev) => {
        const Icon = ev.icon;
        return (
          <div key={ev.id} className="relative">
            {/* Dot icon */}
            <div
              className={`absolute -left-7 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${ev.color}`}
            >
              <Icon className="w-3 h-3" />
            </div>

            {/* Event detail */}
            <div className="text-sm">
              <span className="text-xs text-gray-400 tabular-nums block">{ev.time}</span>
              <h4 className="font-semibold text-gray-900 mt-0.5">{ev.title}</h4>
              {ev.description && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ev.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
