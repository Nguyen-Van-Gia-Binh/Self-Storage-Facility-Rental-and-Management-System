import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  FileCheck,
  Clock,
  RotateCcw,
  ShieldAlert,
  Building2,
  RefreshCw,
  AlertTriangle,
  Receipt,
  Lock,
  Unlock,
  CheckCircle2,
} from 'lucide-react';
import type { ManagerContractItem, ContractKpiData } from '@/types/contractManager';
import { getManagerContracts, getManagerKpiData } from '@/api/contract';
import { ContractKpiCards } from '../components/ContractKpiCards';
import { ReassignUnitModal } from '../components/ReassignUnitModal';
import { ContractFinancialModal } from '../components/ContractFinancialModal';
import { SettlementApprovalModal } from '../components/SettlementApprovalModal';

type TabKey = 'ACTIVE' | 'PENDING_CHECK_IN' | 'RETURN' | 'OVERDUE';

const FACILITIES = [
  { id: 1, name: 'Kho Tự Quản Tân Thuận (Quận 7, TP.HCM)' },
  { id: 2, name: 'Kho Tự Quản Thủ Đức (TP. Thủ Đức)' },
];

export const ContractsHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('ACTIVE');
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(1);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterExpiringOnly, setFilterExpiringOnly] = useState<boolean>(false);

  const [contracts, setContracts] = useState<ManagerContractItem[]>([]);
  const [kpiData, setKpiData] = useState<ContractKpiData>({
    activeCount: 0,
    nearExpiringCount: 0,
    pendingCheckInCount: 0,
    overdueCount: 0,
    totalOverdueDebt: 0,
    pendingSettlementCount: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [reassignModalOpen, setReassignModalOpen] = useState<boolean>(false);
  const [selectedForReassign, setSelectedForReassign] = useState<ManagerContractItem | null>(null);

  const [financialModalOpen, setFinancialModalOpen] = useState<boolean>(false);
  const [selectedForFinancial, setSelectedForFinancial] = useState<number | null>(null);

  const [settlementModalOpen, setSettlementModalOpen] = useState<boolean>(false);
  const [selectedForSettlement, setSelectedForSettlement] = useState<ManagerContractItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [contractsRes, kpiRes] = await Promise.all([
        getManagerContracts({
          facilityId: selectedFacilityId,
          keyword: searchKeyword,
          nearExpiration: filterExpiringOnly,
        }),
        getManagerKpiData(selectedFacilityId),
      ]);
      setContracts(contractsRes);
      setKpiData(kpiRes);
    } catch (err) {
      console.error('Lỗi tải dữ liệu hợp đồng:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFacilityId, searchKeyword, filterExpiringOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Phân nhóm hợp đồng theo Tab
  const tabContracts = useMemo(() => {
    switch (activeTab) {
      case 'ACTIVE':
        return contracts.filter((c) => c.status === 'ACTIVE');
      case 'PENDING_CHECK_IN':
        return contracts.filter((c) => c.status === 'PENDING_CHECK_IN');
      case 'RETURN':
        return contracts.filter(
          (c) => c.status === 'NOTICE_SUBMITTED' || c.status === 'INSPECTED'
        );
      case 'OVERDUE':
        return contracts.filter((c) => c.status === 'OVERDUE');
      default:
        return contracts;
    }
  }, [contracts, activeTab]);

  const handleReassignSuccess = (updatedContract: ManagerContractItem, message: string) => {
    showToast(message);
    setContracts((prev) =>
      prev.map((c) => (c.id === updatedContract.id ? updatedContract : c))
    );
    loadData();
  };

  const handleSettlementSuccess = (_contractId: number, message: string) => {
    showToast(message);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/30 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Giám sát Hợp đồng & Điều phối Ô kho
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-100 text-blue-700">
              SCR-FM-02
            </span>
          </div>
          <p className="text-xs text-slate-700 mt-1">
            Trung tâm quản lý vòng đời thuê, phân bổ ô kho, xử lý đổi kho ngoại lệ và thanh lý cọc
          </p>
        </div>

        {/* Facility Selector */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-700" />
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {FACILITIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <ContractKpiCards
        kpi={kpiData}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Controls: Search & Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top filter bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo mã HĐ, mã ô kho, tên khách..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {activeTab === 'ACTIVE' && (
              <label className="flex items-center gap-2 text-xs text-amber-900 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterExpiringOnly}
                  onChange={(e) => setFilterExpiringOnly(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Chỉ hiện hợp đồng sắp hết hạn (≤7 ngày)</span>
              </label>
            )}

            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Tabs Bar */}
        <div className="flex border-b border-slate-200 px-4 bg-white overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'ACTIVE'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>1. Hợp đồng đang thuê</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
              {kpiData.activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PENDING_CHECK_IN')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'PENDING_CHECK_IN'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>2. Đặt chỗ & Nhận kho</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800">
              {kpiData.pendingCheckInCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RETURN')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'RETURN'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>3. Trả kho & Hoàn cọc</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800">
              {kpiData.pendingSettlementCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('OVERDUE')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'OVERDUE'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>4. Quá hạn & Niêm phong</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
              {kpiData.overdueCount}
            </span>
          </button>
        </div>

        {/* Tab Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
              Đang tải danh sách hợp đồng...
            </div>
          ) : tabContracts.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Không tìm thấy hợp đồng nào phù hợp với điều kiện lọc.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã HĐ</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Ô kho & Loại</th>
                  <th className="py-3 px-4">Thời hạn thuê</th>
                  <th className="py-3 px-4">Giá & Cọc</th>
                  <th className="py-3 px-4">Tình trạng / Cảnh báo</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tabContracts.map((contract) => {
                  return (
                    <tr
                      key={contract.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Mã HĐ */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {contract.code}
                        </span>
                        {contract.accessCode && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                              PIN: {contract.accessCode}
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {contract.customerName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {contract.customerPhone}
                        </span>
                      </td>

                      {/* Ô kho */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {contract.storageUnitCode}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                            {contract.unitTypeName}
                          </span>
                        </div>
                        {contract.floor && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Tầng {contract.floor} • {contract.position}
                          </span>
                        )}
                      </td>

                      {/* Thời hạn */}
                      <td className="py-3 px-4">
                        <span className="text-slate-800 block">
                          {contract.startDate} → {contract.endDateExclusive}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {contract.rentalMonths} tháng
                        </span>
                      </td>

                      {/* Giá & Cọc */}
                      <td className="py-3 px-4 font-mono">
                        <span className="text-slate-900 font-medium block">
                          {contract.monthlyPrice.toLocaleString('vi-VN')} đ/th
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Cọc: {contract.depositAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </td>

                      {/* Trạng thái & Cảnh báo theo Tab */}
                      <td className="py-3 px-4">
                        {activeTab === 'ACTIVE' && (
                          <div>
                            {contract.nearExpiration ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                <AlertTriangle className="w-3 h-3" />
                                Hết hạn sau {contract.daysRemaining} ngày
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                Đang thuê bình thường
                              </span>
                            )}
                          </div>
                        )}

                        {activeTab === 'PENDING_CHECK_IN' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              <Clock className="w-3 h-3" />
                              Ân hạn còn {contract.daysRemaining} ngày
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Hẹn nhận: {contract.startDate}
                            </span>
                          </div>
                        )}

                        {activeTab === 'RETURN' && (
                          <div>
                            {contract.status === 'INSPECTED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                Đã nghiệm thu • Chờ hoàn cọc
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                Đã báo trả • Chờ Staff kiểm tra
                              </span>
                            )}
                            {contract.damageCost && contract.damageCost > 0 ? (
                              <span className="block text-[10px] text-rose-600 mt-0.5 font-medium">
                                Phí bồi thường: {contract.damageCost.toLocaleString('vi-VN')} đ
                              </span>
                            ) : null}
                          </div>
                        )}

                        {activeTab === 'OVERDUE' && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Quá hạn {contract.overdueDays} ngày
                            </span>

                            {contract.overdueDays && contract.overdueDays <= 3 ? (
                              <span className="block text-[10px] text-amber-800 mt-0.5 flex items-center gap-1 font-medium">
                                <Unlock className="w-3 h-3" /> Trong 3 ngày ân hạn (PIN mở bình thường)
                              </span>
                            ) : contract.overdueDays && contract.overdueDays <= 10 ? (
                              <span className="block text-[10px] text-rose-800 mt-0.5 flex items-center gap-1 font-bold">
                                <Lock className="w-3 h-3" /> Đã khóa mã PIN • Phạt 10%/ngày
                              </span>
                            ) : (
                              <span className="block text-[10px] text-rose-900 font-bold mt-0.5 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                Kích hoạt niêm phong Sealing (D+10)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        {/* Nút Đổi ô kho (chỉ hiển thị ở PENDING_CHECK_IN) */}
                        {activeTab === 'PENDING_CHECK_IN' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedForReassign(contract);
                              setReassignModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Đổi ô kho
                          </button>
                        )}

                        {/* Nút Quyết toán hoàn cọc (chỉ ở Tab Return) */}
                        {activeTab === 'RETURN' && contract.status === 'INSPECTED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedForSettlement(contract);
                              setSettlementModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Duyệt quyết toán
                          </button>
                        )}

                        {/* Nút Xem chi tiết công nợ tài chính */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedForFinancial(contract.id);
                            setFinancialModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" />
                          Công nợ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      <ReassignUnitModal
        isOpen={reassignModalOpen}
        contract={selectedForReassign}
        onClose={() => {
          setReassignModalOpen(false);
          setSelectedForReassign(null);
        }}
        onSuccess={handleReassignSuccess}
      />

      <ContractFinancialModal
        isOpen={financialModalOpen}
        contractId={selectedForFinancial}
        onClose={() => {
          setFinancialModalOpen(false);
          setSelectedForFinancial(null);
        }}
      />

      <SettlementApprovalModal
        isOpen={settlementModalOpen}
        contract={selectedForSettlement}
        onClose={() => {
          setSettlementModalOpen(false);
          setSelectedForSettlement(null);
        }}
        onSuccess={handleSettlementSuccess}
      />
    </div>
  );
};
