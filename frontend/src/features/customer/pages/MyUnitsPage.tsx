import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Plus,
  HelpCircle,
  PhoneCall,
  Shield,
  Layers,
  Search,
  X,
  RotateCcw,
} from 'lucide-react';
import { RentedUnitCard } from '../components/RentedUnitCard';
import { CustomerRentalsKpiSummary } from '../components/CustomerRentalsKpiSummary';
import { ChangePinModal } from '../components/ChangePinModal';
import { ScheduleReturnModal } from '../components/ScheduleReturnModal';
import { ContractDetailModal } from '../components/ContractDetailModal';
import { getCustomerContracts } from '@/api/customerRentals';
import type { RentedContract } from '../types';

export const MyUnitsPage: React.FC = () => {
  const [contracts, setContracts] = useState<RentedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [selectedPinContract, setSelectedPinContract] = useState<RentedContract | null>(null);
  const [selectedReturnContract, setSelectedReturnContract] = useState<RentedContract | null>(null);
  const [selectedDetailContract, setSelectedDetailContract] = useState<RentedContract | null>(null);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomerContracts();
      setContracts(data);
    } catch (err) {
      console.error('Lỗi tải danh sách hợp đồng:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // Handler khi đổi mã PIN thành công
  const handlePinChanged = (contractId: string, newPin: string) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, accessPin: newPin } : c))
    );
  };

  // Handler khi đăng ký trả kho thành công
  const handleReturnScheduled = (contractId: string, returnDate: string) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? { ...c, status: 'PENDING_RETURN', scheduledReturnDate: returnDate }
          : c
      )
    );
    loadContracts();
  };

  // Lọc theo Tab và Search Query
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // 1. Lọc theo Tab
      if (activeTab === 'ACTIVE' && contract.status !== 'ACTIVE') return false;
      if (activeTab === 'PENDING_CHECKIN' && contract.status !== 'PENDING_CHECKIN') return false;
      if (activeTab === 'ATTENTION') {
        const isAttention =
          contract.status === 'EXPIRING_SOON' ||
          contract.status === 'OVERDUE' ||
          contract.status === 'PENDING_RETURN';
        if (!isAttention) return false;
      }
      if (activeTab === 'CLOSED' && contract.status !== 'CLOSED' && contract.status !== 'TERMINATED') {
        return false;
      }

      // 2. Lọc theo từ khóa tìm kiếm (mã ô, tên cơ sở, số hợp đồng)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUnit = contract.unitNumber.toLowerCase().includes(q);
        const matchFacility = contract.facilityName.toLowerCase().includes(q);
        const matchContract = contract.contractNumber.toLowerCase().includes(q);
        if (!matchUnit && !matchFacility && !matchContract) return false;
      }

      return true;
    });
  }, [contracts, activeTab, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a1614] tracking-tight">
            Kho Của Tôi
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadContracts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Link to="/customer/units">
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thuê thêm ngăn kho mới</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Banner */}
      <CustomerRentalsKpiSummary
        contracts={contracts}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs sm:text-sm font-bold pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: `Tất cả (${contracts.length})` },
            { id: 'ACTIVE', label: `Đang hoạt động (${contracts.filter((c) => c.status === 'ACTIVE').length})` },
            {
              id: 'PENDING_CHECKIN',
              label: `Chờ nhận kho (${contracts.filter((c) => c.status === 'PENDING_CHECKIN').length})`,
            },
            {
              id: 'ATTENTION',
              label: `Cần chú ý (${
                contracts.filter(
                  (c) =>
                    c.status === 'EXPIRING_SOON' ||
                    c.status === 'OVERDUE' ||
                    c.status === 'PENDING_RETURN'
                ).length
              })`,
            },
            {
              id: 'CLOSED',
              label: `Lịch sử (${contracts.filter((c) => c.status === 'CLOSED' || c.status === 'TERMINATED').length})`,
            },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 px-2.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'border-brand-600 text-brand-700 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72 flex-shrink-0">
          <Input
            placeholder="Tìm theo số ngăn, cơ sở, mã HĐ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs pl-8 pr-7 py-1.5 h-9"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List of Rented Unit Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Đang tải dữ liệu danh sách ngăn kho...
        </div>
      ) : filteredContracts.length > 0 ? (
        <div className="space-y-5">
          {filteredContracts.map((contract) => (
            <RentedUnitCard
              key={contract.id}
              contract={contract}
              onChangePin={(c) => setSelectedPinContract(c)}
              onScheduleReturn={(c) => setSelectedReturnContract(c)}
              onViewDetail={(c) => setSelectedDetailContract(c)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-white border border-slate-200/90 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0a1614]">
              {searchQuery ? 'Không tìm thấy ngăn kho nào phù hợp' : 'Không có hợp đồng nào trong mục này'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? `Không có kết quả nào khớp với từ khóa "${searchQuery}". Hãy thử tìm kiếm khác.`
                : 'Bạn chưa có hợp đồng nào tương ứng với bộ lọc đã chọn.'}
            </p>
          </div>
          {searchQuery ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs font-semibold cursor-pointer"
            >
              Xóa bộ lọc tìm kiếm
            </Button>
          ) : (
            <Link to="/customer/units">
              <Button variant="primary" size="sm" className="mt-2 text-xs font-bold cursor-pointer">
                Khám phá và thuê ngăn kho mới
              </Button>
            </Link>
          )}
        </Card>
      )}

      {/* Quick Help & Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        <Card className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-[#0a1614]">Quy định hoàn cọc (BR-DEP-01)</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tiền cọc Deposit 1 tháng được bảo lưu an toàn tại ngân hàng và tự động hoàn trả 100% trong 24-48 giờ sau khi hoàn tất biên bản nghiệm thu trả kho không hư hại (BR-RET-04).
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#96b3cf]/15 flex items-center justify-center text-[#96b3cf]">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-[#0a1614]">Khóa số thông minh (BR-ACC-01)</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nhập mã PIN 4-6 số trên bàn phím cảm ứng hoặc quét mã QR Pass để mở cửa ô kho 24/7. Bạn có thể chủ động đổi mã PIN mới bất cứ lúc nào ngay trên Dashboard.
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#7c94c3]/15 flex items-center justify-center text-[#7c94c3]">
            <PhoneCall className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-[#0a1614]">Đường dây nóng hỗ trợ 24/7</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Gặp sự cố kẹt khóa điện tử hoặc cần hỗ trợ khẩn cấp tại quầy? Gọi ngay Hotline <strong className="text-brand-700">1900 8888</strong> để nhân viên trực cơ sở hỗ trợ tại chỗ.
          </p>
        </Card>
      </div>

      {/* Modals Management */}
      <ChangePinModal
        isOpen={Boolean(selectedPinContract)}
        onClose={() => setSelectedPinContract(null)}
        contract={selectedPinContract}
        onPinChanged={handlePinChanged}
      />

      <ScheduleReturnModal
        isOpen={Boolean(selectedReturnContract)}
        onClose={() => setSelectedReturnContract(null)}
        contract={selectedReturnContract}
        onReturnScheduled={handleReturnScheduled}
      />

      <ContractDetailModal
        isOpen={Boolean(selectedDetailContract)}
        onClose={() => setSelectedDetailContract(null)}
        contract={selectedDetailContract}
      />
    </div>
  );
};
