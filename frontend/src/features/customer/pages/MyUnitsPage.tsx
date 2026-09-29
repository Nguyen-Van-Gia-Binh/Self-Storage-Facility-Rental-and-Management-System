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
  Clock,
  Lock,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { tokenStorage } from '@/utils/tokenStorage';
import { RentedUnitCard } from '../components/RentedUnitCard';
import { CustomerRentalsKpiSummary } from '../components/CustomerRentalsKpiSummary';
import { ChangePinModal } from '../components/ChangePinModal';
import { ScheduleReturnModal } from '../components/ScheduleReturnModal';
import { ContractDetailModal } from '../components/ContractDetailModal';
import { EarlyRenewalReminderModal } from '../components/EarlyRenewalReminderModal';
import { VietQRPaymentModal } from '../components/VietQRPaymentModal';
import { getCustomerContracts } from '@/api/customerRentals';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { parseReminderDays, shouldRemindRenewal } from '../utils/policyTerms';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import type { RentedContract } from '../types';

export const MyUnitsPage: React.FC = () => {
  const isAuthenticated = Boolean(tokenStorage.getAccessToken());
  const policy = useActivePolicy();
  const noticeDays = policy?.returnNoticeDays ?? 0;
  const reminderDays = useMemo(() => parseReminderDays(policy?.renewalReminderDays), [policy]);

  const [contracts, setContracts] = useState<RentedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [selectedPinContract, setSelectedPinContract] = useState<RentedContract | null>(null);
  const [selectedReturnContract, setSelectedReturnContract] = useState<RentedContract | null>(null);
  const [selectedDetailContract, setSelectedDetailContract] = useState<RentedContract | null>(null);
  const [selectedOverdueContract, setSelectedOverdueContract] = useState<RentedContract | null>(null);
  const [earlyRenewalContract, setEarlyRenewalContract] = useState<RentedContract | null>(null);
  const [showEarlyRenewalModal, setShowEarlyRenewalModal] = useState(false);

  const loadContracts = useCallback(async () => {
    if (!isAuthenticated) {
      setContracts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCustomerContracts();
      setContracts(data);
    } catch (err) {
      console.error('Lỗi tải danh sách hợp đồng:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

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
      if (
        activeTab === 'PENDING_CHECKIN' &&
        contract.status !== 'PENDING_CHECKIN' &&
        (contract.status as string) !== 'PENDING_CHECK_IN'
      )
        return false;
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
    })
    .sort((a, b) => {
      // Luôn hiển thị các kho mới nhất lên trên cùng:
      // 1. So sánh ngày bắt đầu thuê (startDate DESC - ngày mới hơn lên trước)
      const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      // 2. Nếu cùng ngày thì theo ID hoặc số hợp đồng giảm dần
      const idA = parseInt(a.id, 10);
      const idB = parseInt(b.id, 10);
      if (!isNaN(idA) && !isNaN(idB)) {
        return idB - idA;
      }
      return (b.contractNumber || '').localeCompare(a.contractNumber || '');
    });
  }, [contracts, activeTab, searchQuery]);

  const earlyRenewalCandidate = useMemo(() => {
    if (!policy) return null;
    return (
      contracts.find((c) => {
        if (c.status !== 'ACTIVE') return false;
        return shouldRemindRenewal(calculateDaysRemaining(c.endDate), noticeDays, reminderDays);
      }) || null
    );
  }, [contracts, policy, noticeDays, reminderDays]);

  // Tự động bung Pop-up nếu chưa bị bỏ qua (dismissed) trong phiên duyệt hiện tại
  useEffect(() => {
    if (!earlyRenewalCandidate) return;
    const isDismissed = sessionStorage.getItem(`early_renewal_dismissed_${earlyRenewalCandidate.id}`) === 'true';
    if (!isDismissed) {
      setEarlyRenewalContract(earlyRenewalCandidate);
      setShowEarlyRenewalModal(true);
    }
  }, [earlyRenewalCandidate]);

  const handleCloseEarlyRenewalModal = () => {
    if (earlyRenewalContract) {
      sessionStorage.setItem(`early_renewal_dismissed_${earlyRenewalContract.id}`, 'true');
    }
    setShowEarlyRenewalModal(false);
  };

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
          <Link to="/customer">
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thuê thêm ô kho mới</span>
            </Button>
          </Link>
        </div>
      </div>

      {!isAuthenticated ? (
        /* Card Yêu cầu đăng nhập cho khách vãng lai */
        <Card className="p-8 sm:p-12 text-center bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 rounded-2xl shadow-xs space-y-4 max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto text-brand-600 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Vui lòng đăng nhập để xem kho của tôi
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              Bạn cần đăng nhập tài khoản khách hàng để tra cứu danh sách các ô kho đang thuê, xem mã PIN mở cửa, gia hạn hợp đồng hoặc đăng ký trả kho.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/auth/login?redirect=/customer/my-units" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full font-bold text-xs flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                Đăng nhập ngay
              </Button>
            </Link>
            <Link to="/auth/register" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full font-bold text-xs flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                Đăng ký tài khoản
              </Button>
            </Link>
            <Link to="/customer/unit-picker" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full font-bold text-xs flex items-center justify-center gap-2 text-brand-600 border-brand-200 hover:bg-brand-50">
                <Plus className="w-4 h-4" />
                Tìm ô kho mới
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* KPI Summary Banner */}
          <CustomerRentalsKpiSummary
            contracts={contracts}
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
          />

      {/* Cảnh báo đề xuất gia hạn sớm trước mốc khóa 30 ngày (BR-REN-01 & BR-REN-02) */}
      {earlyRenewalCandidate && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5 sm:mt-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wide">
                  Đề xuất gia hạn giữ chỗ
                </span>
                <span className="text-xs font-bold text-amber-950">
                  Ô kho {earlyRenewalCandidate.unitNumber} · {earlyRenewalCandidate.facilityName}
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Còn <strong>{calculateDaysRemaining(earlyRenewalCandidate.endDate)} ngày</strong> đến hết hạn. Mốc nhắc trên chính sách là trước <strong>{noticeDays} ngày</strong>
                {reminderDays.length > 0 ? ` (các mốc ${reminderDays.join(', ')} ngày)` : ''}. Gia hạn để giữ nguyên ô kho và mã PIN. Nút gia hạn vẫn mở khi ô kho chưa có người đặt trước.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEarlyRenewalContract(earlyRenewalCandidate);
                setShowEarlyRenewalModal(true);
              }}
              className="w-full sm:w-auto text-xs font-semibold text-amber-900 border-amber-300 hover:bg-amber-100/60 cursor-pointer"
            >
              Chi tiết đề xuất
            </Button>
            <Link to={`/customer/renew/${earlyRenewalCandidate.id}`} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Gia hạn ngay
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs sm:text-sm font-bold pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: `Tất cả (${contracts.length})` },
            { id: 'ACTIVE', label: `Đang hoạt động (${contracts.filter((c) => c.status === 'ACTIVE').length})` },
            {
              id: 'PENDING_CHECKIN',
              label: `Chờ nhận kho (${
                contracts.filter(
                  (c) => c.status === 'PENDING_CHECKIN' || (c.status as string) === 'PENDING_CHECK_IN'
                ).length
              })`,
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
            placeholder="Tìm theo mã ô kho, cơ sở, mã HĐ..."
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
          Đang tải dữ liệu danh sách ô kho...
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
              onOpenOverduePayment={(c) => setSelectedOverdueContract(c)}
              onCancelReturn={() => loadContracts()}
              renewalNoticeDays={noticeDays > 0 ? noticeDays : undefined}
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
              {searchQuery ? 'Không tìm thấy ô kho nào phù hợp' : 'Không có hợp đồng nào trong mục này'}
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
            <Link to="/customer">
              <Button variant="primary" size="sm" className="mt-2 text-xs font-bold cursor-pointer">
                Khám phá và thuê ô kho mới
              </Button>
            </Link>
          )}
        </Card>
      )}
        </>
      )}

      {/* Quick Help & Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        <Card className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-[#0a1614]">Quy định hoàn cọc</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tiền cọc Deposit 1 tháng được bảo lưu an toàn tại ngân hàng và hoàn trả trong vòng 7 ngày làm việc sau khi hoàn tất biên bản nghiệm thu trả kho không hư hại.
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#96b3cf]/15 flex items-center justify-center text-[#96b3cf]">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-[#0a1614]">Khóa số thông minh</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nhập mã PIN theo độ dài trên chính sách của hợp đồng, hoặc quét mã QR Pass để mở cửa ô kho 24/7. Bạn có thể chủ động đổi mã PIN mới bất cứ lúc nào ngay trên Dashboard.
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

      <EarlyRenewalReminderModal
        isOpen={showEarlyRenewalModal}
        onClose={handleCloseEarlyRenewalModal}
        contract={earlyRenewalContract}
        noticeDays={noticeDays}
        reminderDays={reminderDays}
      />

      {selectedOverdueContract && (
        <VietQRPaymentModal
          isOpen={Boolean(selectedOverdueContract)}
          onClose={() => setSelectedOverdueContract(null)}
          onPaymentSuccess={() => {
            setSelectedOverdueContract(null);
            loadContracts();
          }}
          unitNumber={selectedOverdueContract.unitNumber}
          facilityName={selectedOverdueContract.facilityName}
          totalAmount={selectedOverdueContract.overdueFee || 0}
          contractId={Number(selectedOverdueContract.id)}
          paymentType="OVERDUE_PENALTY"
        />
      )}
    </div>
  );
};
