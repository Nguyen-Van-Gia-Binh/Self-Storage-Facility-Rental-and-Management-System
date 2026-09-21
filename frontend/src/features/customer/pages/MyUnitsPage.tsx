import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  KeyRound, 
  Plus, 
  HelpCircle, 
  PhoneCall, 
  Shield, 
  Layers
} from 'lucide-react';
import { mockRentedContracts } from '../mockData';
import { RentedUnitCard } from '../components/RentedUnitCard';
import { getStoredMoveInPasses } from '@/api/payment';
import type { RentedContract } from '../types';

export const MyUnitsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');

  // Đọc danh sách hợp đồng bao gồm các đơn vừa thanh toán lưu trong localStorage
  const contracts: RentedContract[] = useMemo(() => {
    const storedPasses = getStoredMoveInPasses();
    const dynamicContracts: RentedContract[] = storedPasses.map((pass, idx) => ({
      id: String(pass.reservationId || `PASS-${idx}`),
      contractNumber: pass.passCode,
      facilityId: String(pass.facilityId),
      facilityName: pass.facilityName,
      unitId: `U-${pass.unitNumber}`,
      unitNumber: pass.unitNumber,
      unitTypeName: 'Kho Tiêu Chuẩn Thông Minh',
      sizeCategory: 'M',
      storageType: 'STANDARD',
      startDate: pass.startDate,
      endDate: new Date(new Date(pass.startDate).getTime() + 90 * 24 * 3600 * 1000)
        .toISOString()
        .split('T')[0],
      monthlyRent: Math.round(pass.totalPaid / 2),
      depositHeld: Math.round(pass.totalPaid / 2),
      accessPin: undefined,
      status: 'PENDING_CHECKIN',
    }));

    // Gộp và loại trừ trùng lặp mã hợp đồng
    const existingCodes = new Set(mockRentedContracts.map((c) => c.contractNumber));
    const newItems = dynamicContracts.filter((c) => !existingCodes.has(c.contractNumber));

    return [...newItems, ...mockRentedContracts];
  }, []);

  const filteredContracts = contracts.filter((c) => {
    if (activeTab === 'ACTIVE') return c.status === 'ACTIVE';
    if (activeTab === 'PENDING') return c.status === 'PENDING_CHECKIN';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-brand-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Cổng Quản Lý Kho Khách Hàng (SmartStorage)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a1614] tracking-tight">
            Kho Của Tôi & Thẻ Mở Khóa Số
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản lý các ngăn tủ đang thuê, xem mã PIN khóa điện tử 24/7 và gia hạn hợp đồng trực tuyến.
          </p>
        </div>

        <Link to="/customer">
          <Button variant="primary" size="sm" className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Thuê thêm ngăn kho mới</span>
          </Button>
        </Link>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-sm font-semibold">
        {[
          { key: 'ALL', label: `Tất cả hợp đồng (${contracts.length})` },
          { key: 'ACTIVE', label: `Đang sử dụng (${contracts.filter(c => c.status === 'ACTIVE').length})` },
          { key: 'PENDING', label: `Chờ nhận kho (${contracts.filter(c => c.status === 'PENDING_CHECKIN').length})` },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'ALL' | 'ACTIVE' | 'PENDING')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                isSelected
                  ? 'border-brand-500 text-brand-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* List of Rented Unit Cards */}
      {filteredContracts.length > 0 ? (
        <div className="space-y-6">
          {filteredContracts.map((contract) => (
            <RentedUnitCard key={contract.id} contract={contract} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-white border border-slate-200/90 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0a1614]">Không có hợp đồng nào trong mục này</h3>
            <p className="text-xs text-slate-500 mt-1">
              Bạn chưa có hợp đồng nào tương ứng với bộ lọc đã chọn.
            </p>
          </div>
          <Link to="/customer">
            <Button variant="primary" size="sm" className="mt-2">
              Khám phá các cơ sở kho
            </Button>
          </Link>
        </Card>
      )}

      {/* Quick Help & Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <Card className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-[#0a1614]">Quy định an ninh & Hoàn cọc (BR-DEP-01)</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tiền cọc tương đương 1 tháng tiền thuê được giữ an toàn và tự động hoàn trả đầy đủ trong 7 ngày làm việc sau khi nghiệm thu trả kho không hư hại (BR-RET-05).
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#96b3cf]/15 flex items-center justify-center text-[#96b3cf]">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-[#0a1614]">Hướng dẫn sử dụng khóa thông minh (BR-ACC-01)</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nhập mã PIN 4 số trên bàn phím cảm ứng tại cửa kho để mở. Mã PIN có hiệu lực 24/7 trong suốt thời gian hợp đồng còn hiệu lực.
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#7c94c3]/15 flex items-center justify-center text-[#7c94c3]">
            <PhoneCall className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-[#0a1614]">Hỗ trợ kỹ thuật 24/7</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Gặp sự cố kẹt khóa điện tử hoặc cần hỗ trợ khẩn cấp? Gọi ngay Hotline <strong className="text-brand-700">1900 8888</strong> để nhân viên trực cơ sở hỗ trợ tại chỗ.
          </p>
        </Card>
      </div>
    </div>
  );
};
