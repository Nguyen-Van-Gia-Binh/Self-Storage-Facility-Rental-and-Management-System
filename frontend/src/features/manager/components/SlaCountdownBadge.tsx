import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SlaCountdownBadgeProps {
  /** Thời điểm tạo phiếu hoặc mốc bắt đầu tính SLA */
  createdAt?: string;
  /** Hạn chót SLA nếu backend đã tính toán sẵn */
  slaDeadline?: string;
  /** Cờ đã hoàn thành nhiệm vụ hay chưa */
  isCompleted?: boolean;
  /** Thời lượng SLA tính bằng giờ (mặc định 2 giờ theo BR-SUP-01) */
  slaHours?: number;
  className?: string;
}

export const SlaCountdownBadge: React.FC<SlaCountdownBadgeProps> = ({
  createdAt,
  slaDeadline,
  isCompleted = false,
  slaHours = 2,
  className = '',
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted]);

  if (isCompleted) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>SLA: Đã xử lý xong</span>
      </span>
    );
  }

  // Xác định thời điểm hết hạn
  let deadlineMs = 0;
  if (slaDeadline) {
    deadlineMs = new Date(slaDeadline).getTime();
  } else if (createdAt) {
    deadlineMs = new Date(createdAt).getTime() + slaHours * 60 * 60 * 1000;
  } else {
    return null;
  }

  const diffMs = deadlineMs - now;

  // Trường hợp ĐÃ VI PHẠM SLA (quá 2 giờ)
  if (diffMs <= 0) {
    const overdueMins = Math.max(1, Math.floor(Math.abs(diffMs) / 60000));
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-sm border border-rose-700 tracking-wide ${className}`}
        title={`Đã trễ hẹn SLA ${overdueMins} phút`}
      >
        <AlertTriangle className="w-3 h-3 text-white shrink-0 animate-pulse" />
        <span>⚠️ ĐÃ VI PHẠM SLA (+{overdueMins} phút)</span>
      </span>
    );
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeFormatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  // Dưới 30 phút: Đổi sang màu đỏ nhấp nháy
  const isUrgentZone = diffMs <= 30 * 60 * 1000;

  if (isUrgentZone) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse ${className}`}
        title="Sắp hết hạn SLA - Cần giải quyết khẩn cấp!"
      >
        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
        <Clock className="w-3 h-3 text-rose-700 shrink-0" />
        <span>⏱ SLA: Còn {timeFormatted}</span>
      </span>
    );
  }

  // Còn nhiều thời gian (> 30 phút): Màu vàng cam
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 ${className}`}
      title="Hạn SLA lấy từ phiếu hỗ trợ"
    >
      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
      <span>⏱ SLA: Còn {timeFormatted}</span>
    </span>
  );
};
