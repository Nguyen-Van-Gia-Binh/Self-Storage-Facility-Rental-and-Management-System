// frontend/src/features/bom/pages/BomPricingManagementPage.tsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Tag,
  ShieldCheck,
  Percent,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { fetchFacilities, fetchUnitTypes } from '@/api/facility';
import {
  updateUnitTypePrice,
  fetchSurcharges,
  updateSurcharge,
  createSurcharge,
  fetchActivePolicy,
  fetchPolicyVersions,
  nextScheduledPolicy,
} from '@/api/pricing';
import type { PolicyVersionListItem } from '@/api/pricing';
import {
  fetchDiscountPrograms,
  createDiscountProgram,
  updateDiscountProgram,
  type DiscountProgramItem,
  type CreateDiscountProgramPayload,
  type UpdateDiscountProgramPayload,
} from '@/api/discount';
import type {
  FacilityListItem,
  UnitTypeCatalog,
  SurchargeItem,
  ActivePolicyInfo,
} from '@/types';
import { FacilityPriceTable } from '../components/FacilityPriceTable';
import { PriceUpdateModal } from '../components/PriceUpdateModal';
import { SurchargeTable } from '../components/SurchargeTable';
import { SurchargeModal, type SurchargeModalSubmit } from '../components/SurchargeModal';
import { PolicySummaryCard } from '../components/PolicySummaryCard';
import { DiscountProgramTable } from '../components/DiscountProgramTable';
import { DiscountProgramModal } from '../components/DiscountProgramModal';

type PricingTab = 'PRICING' | 'SURCHARGES' | 'POLICIES' | 'DISCOUNTS';

export const BomPricingManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PricingTab>('PRICING');

  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(1);
  const [unitTypes, setUnitTypes] = useState<UnitTypeCatalog[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true);
  const [isLoadingUnitTypes, setIsLoadingUnitTypes] = useState(false);

  const [surcharges, setSurcharges] = useState<SurchargeItem[]>([]);
  const [isLoadingSurcharges, setIsLoadingSurcharges] = useState(false);
  const [activePolicy, setActivePolicy] = useState<ActivePolicyInfo | null>(null);
  const [policyVersions, setPolicyVersions] = useState<PolicyVersionListItem[]>([]);
  const [scheduledPolicy, setScheduledPolicy] = useState<{ version: string; effectiveDate: string } | null>(null);
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);

  const [discountPrograms, setDiscountPrograms] = useState<DiscountProgramItem[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountProgramItem | null>(null);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  const [priceModalUnitType, setPriceModalUnitType] = useState<UnitTypeCatalog | null>(null);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
  const [editingSurcharge, setEditingSurcharge] = useState<SurchargeItem | null>(null);
  const [isSavingSurcharge, setIsSavingSurcharge] = useState(false);

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    let ignore = false;
    fetchFacilities()
      .then((data) => {
        if (!ignore) {
          const active = data.filter((f) => f.isActive);
          setFacilities(active);
          if (active.length > 0) {
            setSelectedFacilityId((prev) =>
              active.some((f) => f.id === prev) ? prev : active[0].id
            );
          }
          setIsLoadingFacilities(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          showToast(err instanceof Error ? err.message : 'Lỗi tải cơ sở', 'error');
          setIsLoadingFacilities(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedFacilityId) return;
    let ignore = false;
    setIsLoadingUnitTypes(true);
    fetchUnitTypes(selectedFacilityId)
      .then((data) => {
        if (!ignore) {
          setUnitTypes(data);
          setIsLoadingUnitTypes(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setUnitTypes([]);
          setIsLoadingUnitTypes(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedFacilityId]);

  useEffect(() => {
    let ignore = false;
    if (activeTab === 'SURCHARGES') {
      setIsLoadingSurcharges(true);
      fetchSurcharges()
        .then((data) => {
          if (!ignore) {
            setSurcharges(data);
            setIsLoadingSurcharges(false);
          }
        })
        .catch(() => {
          if (!ignore) setIsLoadingSurcharges(false);
        });
    } else if (activeTab === 'POLICIES') {
      setIsLoadingPolicy(true);
      Promise.all([
        fetchActivePolicy(),
        fetchPolicyVersions().catch(() => [] as PolicyVersionListItem[]),
      ])
        .then(([data, versions]) => {
          if (!ignore) {
            setActivePolicy(data);
            setPolicyVersions(versions);
            setScheduledPolicy(nextScheduledPolicy(versions));
            setIsLoadingPolicy(false);
          }
        })
        .catch(() => {
          if (!ignore) setIsLoadingPolicy(false);
        });
    } else if (activeTab === 'DISCOUNTS') {
      setIsLoadingDiscounts(true);
      fetchDiscountPrograms()
        .then((res) => {
          if (!ignore) {
            setDiscountPrograms(res.content || []);
            setIsLoadingDiscounts(false);
          }
        })
        .catch(() => {
          if (!ignore) setIsLoadingDiscounts(false);
        });
    }

    return () => {
      ignore = true;
    };
  }, [activeTab]);

  const handleConfirmPriceUpdate = async (pricePerM2: number, effectiveDate: string) => {
    if (!priceModalUnitType) return;
    setIsUpdatingPrice(true);
    try {
      await updateUnitTypePrice(
        selectedFacilityId,
        priceModalUnitType.id,
        pricePerM2,
        effectiveDate
      );
      const monthly = Math.round((pricePerM2 * (priceModalUnitType.areaM2 || 0)) / 1000) * 1000;
      showToast(
        `Đã lưu đơn giá ${pricePerM2.toLocaleString('vi-VN')} ₫/m² cho "${priceModalUnitType.name}". Giá thuê niêm yết ${monthly.toLocaleString('vi-VN')} ₫/tháng, hiệu lực ${effectiveDate}.`
      );
      setPriceModalUnitType(null);

      const refreshed = await fetchUnitTypes(selectedFacilityId);
      setUnitTypes(refreshed);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Lỗi khi cập nhật giá', 'error');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const closeSurchargeModal = () => {
    setIsSurchargeModalOpen(false);
    setEditingSurcharge(null);
  };

  const handleSubmitSurcharge = async (data: SurchargeModalSubmit) => {
    setIsSavingSurcharge(true);
    try {
      if (data.mode === 'create') {
        await createSurcharge(data.body);
        showToast(`Đã thêm phụ phí "${data.body.name}" thành công!`);
      } else if (editingSurcharge) {
        await updateSurcharge(editingSurcharge, data.body);
        showToast(`Đã cập nhật phụ phí "${data.body.name}". Lần ghi sau dùng số mới.`);
      }
      closeSurchargeModal();
      const updated = await fetchSurcharges();
      setSurcharges(updated);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Không lưu được phụ phí', 'error');
    } finally {
      setIsSavingSurcharge(false);
    }
  };

  const handleDeactivateSurcharge = async (item: SurchargeItem) => {
    const confirmed = window.confirm(
      `Ngừng áp dụng phụ phí "${item.name}"? Các hợp đồng đã ghi nhận khoản này không đổi.`,
    );
    if (!confirmed) return;
    try {
      await updateSurcharge(item, { isActive: false });
      showToast(`Đã ngừng áp dụng "${item.name}".`);
      const updated = await fetchSurcharges();
      setSurcharges(updated);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Không ngừng áp dụng được phụ phí', 'error');
    }
  };

  const handleSubmitDiscount = async (
    payload: CreateDiscountProgramPayload | UpdateDiscountProgramPayload
  ) => {
    setIsSavingDiscount(true);
    try {
      if (editingDiscount) {
        await updateDiscountProgram(editingDiscount.id, payload as UpdateDiscountProgramPayload);
        showToast(`Đã cập nhật chương trình "${payload.name}" thành công!`);
      } else {
        await createDiscountProgram(payload as CreateDiscountProgramPayload);
        showToast(`Đã tạo chương trình ưu đãi "${payload.name}" thành công!`);
      }
      setIsDiscountModalOpen(false);
      setEditingDiscount(null);
      const res = await fetchDiscountPrograms();
      setDiscountPrograms(res.content || []);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Lỗi khi lưu chương trình ưu đãi', 'error');
    } finally {
      setIsSavingDiscount(false);
    }
  };

  const handleToggleDiscountStatus = async (item: DiscountProgramItem) => {
    const actionText = item.isActive ? 'Tạm dừng áp dụng' : 'Kích hoạt lại';
    const confirmed = window.confirm(`${actionText} chương trình "${item.name}"?`);
    if (!confirmed) return;
    try {
      await updateDiscountProgram(item.id, {
        name: item.name,
        discountType: item.discountType,
        discountValue: item.discountValue,
        minRentalMonths: item.minRentalMonths,
        startDate: item.startDate,
        endDate: item.endDate,
        scopeType: item.scopeType,
        facilityId: item.facilityId,
        unitTypeId: item.unitTypeId,
        isActive: !item.isActive,
      });
      showToast(`Đã ${actionText.toLowerCase()} chương trình "${item.name}".`);
      const res = await fetchDiscountPrograms();
      setDiscountPrograms(res.content || []);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Không thay đổi được trạng thái', 'error');
    }
  };

  const currentFacility = facilities.find((f) => f.id === selectedFacilityId);

  const selectFacility = (id: number) => {
    setIsLoadingUnitTypes(true);
    setSelectedFacilityId(id);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 animate-fade-in">
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Quản lý Bảng giá & Phụ phí
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập khung giá thuê ô kho theo m², biểu phí dịch vụ và chính sách tài chính
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PRICING')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'PRICING'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span>Khung giá thuê ô kho</span>
          </button>
          <button
            onClick={() => setActiveTab('SURCHARGES')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'SURCHARGES'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4 text-blue-500" />
            <span>Biểu phí & Phụ thu</span>
          </button>
          <button
            onClick={() => setActiveTab('POLICIES')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'POLICIES'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Chính sách cọc & Quá hạn</span>
          </button>
          <button
            onClick={() => setActiveTab('DISCOUNTS')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === 'DISCOUNTS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-4 h-4 text-purple-500" />
            <span>Khuyến mãi & Giảm giá</span>
          </button>
        </div>
      </div>

      {activeTab === 'PRICING' && (
        <FacilityPriceTable
          facilities={facilities}
          selectedFacilityId={selectedFacilityId}
          onSelectFacility={selectFacility}
          unitTypes={unitTypes}
          onOpenPriceModal={(ut) => setPriceModalUnitType(ut)}
          isLoading={isLoadingFacilities || isLoadingUnitTypes}
        />
      )}

      {activeTab === 'SURCHARGES' && (
        <SurchargeTable
          surcharges={surcharges}
          onOpenModal={() => {
            setEditingSurcharge(null);
            setIsSurchargeModalOpen(true);
          }}
          onEdit={(item) => {
            setEditingSurcharge(item);
            setIsSurchargeModalOpen(true);
          }}
          onDeactivate={handleDeactivateSurcharge}
          isLoading={isLoadingSurcharges}
        />
      )}

      {activeTab === 'POLICIES' && (
        <PolicySummaryCard
          policy={activePolicy}
          scheduledPolicy={scheduledPolicy}
          versions={policyVersions}
          isLoading={isLoadingPolicy}
        />
      )}

      {activeTab === 'DISCOUNTS' && (
        <DiscountProgramTable
          programs={discountPrograms}
          onOpenModal={() => {
            setEditingDiscount(null);
            setIsDiscountModalOpen(true);
          }}
          onEdit={(item) => {
            setEditingDiscount(item);
            setIsDiscountModalOpen(true);
          }}
          onToggleStatus={handleToggleDiscountStatus}
          isLoading={isLoadingDiscounts}
        />
      )}

      {priceModalUnitType && (
        <PriceUpdateModal
          key={`price-${priceModalUnitType.id}-${priceModalUnitType.pricePerM2 ?? priceModalUnitType.monthlyPrice}`}
          isOpen={Boolean(priceModalUnitType)}
          onClose={() => setPriceModalUnitType(null)}
          facilityName={currentFacility ? currentFacility.name : 'Cơ sở'}
          unitType={priceModalUnitType}
          onConfirm={handleConfirmPriceUpdate}
          isLoading={isUpdatingPrice}
        />
      )}

      {isSurchargeModalOpen && (
        <SurchargeModal
          key={editingSurcharge ? `edit-surcharge-${editingSurcharge.id}` : 'create-surcharge-modal'}
          isOpen={isSurchargeModalOpen}
          onClose={closeSurchargeModal}
          facilities={facilities}
          editing={editingSurcharge}
          onSubmit={handleSubmitSurcharge}
          isLoading={isSavingSurcharge}
        />
      )}

      {isDiscountModalOpen && (
        <DiscountProgramModal
          key={editingDiscount ? `edit-discount-${editingDiscount.id}` : 'create-discount-modal'}
          isOpen={isDiscountModalOpen}
          onClose={() => {
            setIsDiscountModalOpen(false);
            setEditingDiscount(null);
          }}
          facilities={facilities}
          editing={editingDiscount}
          onSubmit={handleSubmitDiscount}
          isLoading={isSavingDiscount}
        />
      )}
    </div>
  );
};
