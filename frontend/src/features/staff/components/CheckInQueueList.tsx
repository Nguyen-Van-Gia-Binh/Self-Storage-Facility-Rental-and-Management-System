import React, { useState, useMemo } from 'react';
import { Search, X, Clock, AlertTriangle, CheckCircle2, User } from 'lucide-react';
import type { CheckInContract } from '../../../types';
import { Badge } from '../../../components/ui/Badge';

export interface CheckInQueueListProps {
  contracts: CheckInContract[];
  selectedContractId: number | null;
  onSelectContract: (contract: CheckInContract) => void;
  isLoading?: boolean;
  currentStaffId?: number;
}

type FilterTab = 'ALL' | 'MY_TASKS' | 'TODAY' | 'LATE';

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isTodayAppointment(contract: CheckInContract): boolean {
  const label = (contract.appointmentTime || '').toLowerCase();
  return contract.startDate === localToday() || label.includes('hôm nay');
}

function isLateAppointment(contract: CheckInContract): boolean {
  const label = (contract.appointmentTime || '').toLowerCase();
  return label.includes('quá hạn') || contract.graceDaysRemaining < 10;
}

export const CheckInQueueList: React.FC<CheckInQueueListProps> = ({
  contracts,
  selectedContractId,
  onSelectContract,
  isLoading = false,
  currentStaffId,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  // Lọc danh sách theo từ khóa tìm kiếm và tab phân loại
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // 1. Lọc theo tab
      if (activeTab === 'MY_TASKS') {
        if (!currentStaffId || Number(contract.assignedStaffId) !== currentStaffId) {
          return false;
        }
      } else if (activeTab === 'TODAY') {
        if (!isTodayAppointment(contract)) {
          return false;
        }
      } else if (activeTab === 'LATE') {
        if (!isLateAppointment(contract)) {
          return false;
        }
      }

      // 2. Lọc theo từ khóa tìm kiếm (Mã đơn, CCCD, SĐT, Tên, Mã kho)
      if (!searchKeyword.trim()) return true;

      const q = searchKeyword.toLowerCase().trim();
      return (
        contract.customerName.toLowerCase().includes(q) ||
        contract.customerIdentityNumber.includes(q) ||
        contract.customerPhone.includes(q) ||
        contract.code.toLowerCase().includes(q) ||
        contract.reservationCode.toLowerCase().includes(q) ||
        contract.storageUnitCode.toLowerCase().includes(q)
      );
    });
  }, [contracts, searchKeyword, activeTab, currentStaffId]);

  // Thống kê nhanh số lượng
  const stats = useMemo(() => {
    const myTasksCount = contracts.filter(
      (c) => currentStaffId && Number(c.assignedStaffId) === currentStaffId
    ).length;
    const todayCount = contracts.filter(isTodayAppointment).length;
    const lateCount = contracts.filter(isLateAppointment).length;
    return {
      all: contracts.length,
      myTasks: myTasksCount,
      today: todayCount,
      late: lateCount,
    };
  }, [contracts, currentStaffId]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-brand-600" />
            Hàng đợi tiếp đón ({contracts.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">Ca trực hôm nay</span>
        </div>

        {/* Search input đa tiêu chí */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tra cứu CCCD, SĐT, Mã đơn, Tên..."
            className="w-full pl-9 pr-8 py-2 bg-white text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all placeholder:text-slate-400"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="grid grid-cols-4 gap-1 bg-slate-200/60 p-1 rounded-xl text-[11px] font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`py-1 px-1 rounded-lg transition-all text-center cursor-pointer truncate ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Tất cả ({stats.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MY_TASKS')}
            className={`py-1 px-1 rounded-lg transition-all text-center cursor-pointer truncate ${
              activeTab === 'MY_TASKS'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'hover:text-emerald-800 text-emerald-700'
            }`}
          >
            Của tôi ({stats.myTasks})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TODAY')}
            className={`py-1 px-1 rounded-lg transition-all text-center cursor-pointer truncate ${
              activeTab === 'TODAY'
                ? 'bg-white text-brand-700 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Hôm nay ({stats.today})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LATE')}
            className={`py-1 px-1 rounded-lg transition-all text-center cursor-pointer truncate ${
              activeTab === 'LATE'
                ? 'bg-white text-amber-700 font-semibold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Trễ ({stats.late})
          </button>
        </div>
      </div>

      {/* Contract Queue Cards */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
        {isLoading ? (
          <div className="p-2 space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-5 w-14 rounded-lg" />
                </div>
                <div className="skeleton h-3 w-28 rounded" />
                <div className="flex items-center justify-between pt-1">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-4 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
            <p className="text-sm font-medium">Không tìm thấy khách hàng phù hợp</p>
            <p className="text-xs text-slate-400">
              {searchKeyword
                ? `Không có kết quả nào khớp với "${searchKeyword}".`
                : 'Hiện không có cuộc hẹn nào trong mục này.'}
            </p>
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="text-xs text-brand-600 hover:underline font-semibold mt-1"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          filteredContracts.map((contract) => {
            const isSelected = contract.id === selectedContractId;
            const isLate = isLateAppointment(contract);
            const isFinished = contract.status === 'ACTIVE';
            const isTerminated = contract.status === 'TERMINATED';
            const isAssignedToMe = currentStaffId && Number(contract.assignedStaffId) === currentStaffId;

            return (
              <div
                key={contract.id}
                onClick={() => onSelectContract(contract)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-400/80 ring-offset-2'
                    : isAssignedToMe
                    ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400 hover:bg-emerald-50/50'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-bold text-slate-900 text-sm hover:text-brand-700 transition-colors">
                      {contract.customerName}
                    </span>
                    {contract.customerIdentityNumber ? (
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        CCCD: <span className="text-slate-700 font-semibold">{contract.customerIdentityNumber}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Badge Ô kho */}
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono bg-slate-900 text-white shadow-xs">
                    {contract.storageUnitCode}
                  </span>
                </div>

                {/* Thông tin loại kho & giờ hẹn */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="truncate max-w-[140px] text-slate-600 font-medium">
                    {contract.unitTypeName}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {contract.appointmentTime}
                  </span>
                </div>

                {/* Badges nghiệp vụ & Phân công */}
                <div className="flex items-center flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                  {isAssignedToMe ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-full shadow-xs">
                      ✓ Phân công cho bạn
                    </span>
                  ) : contract.assignedStaffName ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      Phụ trách: {contract.assignedStaffName}
                    </span>
                  ) : null}

                  {isFinished ? (
                    <Badge variant="available">Đã nhận kho (ACTIVE)</Badge>
                  ) : isTerminated ? (
                    <Badge variant="locked">Từ chối nhận kho</Badge>
                  ) : isLate ? (
                    <Badge variant="warning">
                      Ân hạn còn {contract.graceDaysRemaining} ngày
                    </Badge>
                  ) : (
                    <Badge variant="primary">Chờ bàn giao</Badge>
                  )}

                  {contract.isFullyPaid && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Đã thu 100%
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>* Tra cứu tự động lọc khi gõ</span>
        <span className="font-semibold text-slate-700">Đối chiếu CCCD gốc</span>
      </div>
    </div>
  );
};
