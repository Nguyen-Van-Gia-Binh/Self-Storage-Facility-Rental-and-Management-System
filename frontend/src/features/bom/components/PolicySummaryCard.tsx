// frontend/src/features/bom/components/PolicySummaryCard.tsx
import React from 'react';
import { Settings2, AlertCircle } from 'lucide-react';
import type { PolicyVersionListItem } from '@/api/pricing';
import type { ActivePolicyInfo } from '@/types';

interface PolicySummaryCardProps {
  policy: ActivePolicyInfo | null;
  scheduledPolicy?: { version: string; effectiveDate: string } | null;
  versions?: PolicyVersionListItem[];
  isLoading?: boolean;
  onOpenPublishDrawer?: () => void;
  onViewVersion?: (version: PolicyVersionListItem) => void;
}

interface PolicyRowItem {
  label: string;
  description: string;
  value: string;
}

interface PolicySectionGroup {
  title: string;
  items: PolicyRowItem[];
}

function formatDay(value: string): string {
  if (!value) return '—';
  const parts = value.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return value;
}

function formatVersionTag(version: string): string {
  const trimmed = String(version ?? '').trim();
  if (!trimmed) return 'v—';
  return trimmed.toLowerCase().startsWith('v') ? trimmed : `v${trimmed}`;
}

function resolvePublisherName(item: PolicyVersionListItem): string {
  if (item.publishedByName && item.publishedByName.trim()) {
    return item.publishedByName.trim();
  }
  return item.publishedBy ? `BOM #${item.publishedBy}` : 'Hệ thống';
}

function getInitials(name: string): string {
  const cleaned = name.replace(/^BOM\s*#/i, '').trim();
  if (!cleaned) return 'HT';
  if (/^\d+$/.test(cleaned)) return 'BM';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export const PolicySummaryCard: React.FC<PolicySummaryCardProps> = ({
  policy,
  scheduledPolicy = null,
  versions = [],
  isLoading = false,
  onOpenPublishDrawer,
  onViewVersion,
}) => {
  if (isLoading || !policy) {
    return (
      <div className="bg-white px-6 py-8 rounded-md border border-gray-200 text-center">
        <p className="text-sm text-gray-500">Đang tải thông số chính sách hệ thống...</p>
      </div>
    );
  }

  const cancelFullDays = policy.cancelFullRefundDays ?? 7;
  const cancelMidPct = Math.round((policy.cancelMidRefundRate ?? 0.5) * 100);
  const cancelLatePct = Math.round(policy.cancelLateRefundRate * 100);
  const overdueDailyPct = Math.round(policy.overdueDailyRate * 100);
  const overdueCapPct = Math.round(policy.overdueCapRate * 100);
  const refundWorkingDays = policy.returnRefundWorkingDays ?? 7;

  const sections: PolicySectionGroup[] = [
    {
      title: 'Nhóm 1: Tài chính & Tiền cọc',
      items: [
        {
          label: 'Quy định tiền cọc',
          description: `Bằng ${policy.depositMultiplier} tháng tiền thuê khi đặt chỗ và bàn giao kho.`,
          value: `${policy.depositMultiplier} tháng`,
        },
        {
          label: 'Chính sách hủy đặt chỗ',
          description: `≥${cancelFullDays} ngày hoàn 100% cọc; 2-${cancelFullDays - 1} ngày hoàn ${cancelMidPct}%; <${policy.cancelFullRefundHours}h hoàn ${cancelLatePct}%.`,
          value: `Hoàn 100% / ${cancelMidPct}% / ${cancelLatePct}%`,
        },
      ],
    },
    {
      title: 'Nhóm 2: Thời gian & Gia hạn',
      items: [
        {
          label: 'Giữ chỗ & Bàn giao',
          description: `Giữ chỗ ${policy.reservationHoldHours}h để thanh toán cọc; ân hạn ${policy.checkinGraceDays} ngày tiếp đón.`,
          value: `${policy.reservationHoldHours} giờ`,
        },
        {
          label: 'Khóa quyền gia hạn',
          description: `Khóa tự gia hạn trực tuyến khi hợp đồng còn dưới ${policy.returnNoticeDays} ngày.`,
          value: `Trước ${policy.returnNoticeDays} ngày`,
        },
        {
          label: 'Kỳ hạn gia hạn',
          description: `Cho phép gia hạn từ ${policy.renewalMinMonths} đến ${policy.renewalMaxMonths} tháng mỗi lần.`,
          value: `${policy.renewalMinMonths} — ${policy.renewalMaxMonths} tháng`,
        },
      ],
    },
    {
      title: 'Nhóm 3: Rủi ro & Kết thúc',
      items: [
        {
          label: 'Phí quá hạn hợp đồng',
          description: `Ân hạn ${policy.overdueGraceDays} ngày; từ ngày ${policy.overdueGraceDays + 1} phạt ${overdueDailyPct}%/ngày, trần ${overdueCapPct}% cọc.`,
          value: `${overdueDailyPct}% / ngày`,
        },
        {
          label: 'Quy định trả kho',
          description: `Yêu cầu trả kho mọi lúc; đối soát hoàn cọc trong ${refundWorkingDays} ngày làm việc.`,
          value: 'Linh hoạt 24/7',
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Status Bar (Stripe / Vercel style) */}
      <div className="bg-white border border-gray-200 rounded-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Chính sách vận hành</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-900 text-white text-xs font-semibold tabular-nums">
              {formatVersionTag(policy.version)}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded border border-emerald-600 text-emerald-700 bg-transparent text-xs font-medium">
              Đang hiệu lực
            </span>
            <span className="text-xs text-gray-500 tabular-nums">
              · Áp dụng từ{' '}
              <span className="font-medium text-gray-700">
                {policy.effectiveDate ? formatDay(policy.effectiveDate) : '—'}
              </span>
            </span>
          </div>
          {scheduledPolicy && (
            <p className="text-xs text-amber-700 font-medium tabular-nums">
              Phiên bản {formatVersionTag(scheduledPolicy.version)} dự kiến hiệu lực từ{' '}
              {formatDay(scheduledPolicy.effectiveDate)}.
            </p>
          )}
        </div>

        {onOpenPublishDrawer && (
          <button
            type="button"
            onClick={onOpenPublishDrawer}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            <Settings2 className="w-3.5 h-3.5 text-gray-500" />
            <span>Cập nhật chính sách</span>
          </button>
        )}
      </div>

      {/* Concise Legal Snapshot Notice */}
      <div className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-2 text-xs text-gray-600">
        <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <p>
          <strong className="font-medium text-gray-700">Lưu ý:</strong> Thay đổi chỉ áp dụng cho đơn đặt chỗ và hợp đồng tạo mới sau ngày hiệu lực; hợp đồng đã ký giữ nguyên snapshot thông số ban đầu.
        </p>
      </div>

      {/* Unified Vertical Definition List (Stripe / Linear Settings Table) */}
      <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-200 overflow-hidden">
        {sections.map((section) => (
          <React.Fragment key={section.title}>
            <div className="bg-gray-50/80 px-4 py-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                {section.title}
              </h4>
            </div>
            {section.items.map((item) => (
              <div
                key={item.label}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/50 transition-colors"
              >
                <div className="min-w-0 pr-4">
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
                <div className="text-base font-semibold text-gray-900 tabular-nums sm:text-right shrink-0">
                  {item.value}
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Version History Table (Notion / Linear style — clickable rows, no action column clutter) */}
      {versions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900">Lịch sử phiên bản</h4>
              <span className="text-xs text-gray-500 tabular-nums">({versions.length})</span>
            </div>
            {onViewVersion && (
              <span className="text-xs text-gray-400">Click vào dòng để xem chi tiết</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr className="whitespace-nowrap">
                  <th className="px-4 py-2.5 font-semibold">Phiên bản</th>
                  <th className="px-4 py-2.5 font-semibold">Ngày hiệu lực</th>
                  <th className="px-4 py-2.5 font-semibold">Người ban hành</th>
                  <th className="px-4 py-2.5 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {versions.map((item) => {
                  const publisherName = resolvePublisherName(item);
                  const initials = getInitials(publisherName);
                  const isActive = item.status === 'Đang hiệu lực';
                  const isScheduled = item.status === 'Chưa áp dụng';

                  return (
                    <tr
                      key={`${item.id}-${item.versionNo}`}
                      onClick={() => onViewVersion?.(item)}
                      onKeyDown={(event) => {
                        if (onViewVersion && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault();
                          onViewVersion(item);
                        }
                      }}
                      tabIndex={onViewVersion ? 0 : undefined}
                      className={
                        onViewVersion
                          ? 'hover:bg-gray-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-gray-50'
                          : 'hover:bg-gray-50/60 transition-colors'
                      }
                    >
                      <td className="px-4 py-2.5 font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                        v{item.versionNo}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 tabular-nums whitespace-nowrap">
                        {formatDay(item.effectiveDate)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-700 inline-flex items-center justify-center shrink-0"
                          >
                            {initials}
                          </span>
                          <span className="text-sm text-gray-700">{publisherName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>{item.status}</span>
                          </span>
                        ) : isScheduled ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>{item.status}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 line-through">{item.status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
