// frontend/src/features/bom/pages/BomPricingManagementPage.tsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Tag,
  ShieldCheck,
  Percent,
  CheckCircle2,
  AlertCircle,
  Building2,
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
import { PriceUpdateDrawer } from '../components/PriceUpdateDrawer';
import { SurchargeTable } from '../components/SurchargeTable';
import { SurchargeDrawer, type SurchargeDrawerSubmit } from '../components/SurchargeDrawer';
import { PolicySummaryCard } from '../components/PolicySummaryCard';
import { PolicyDrawer } from '../components/PolicyDrawer';
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

  // Drawer Price Update State (Single & Bulk)
  const [priceDrawerUnitType, setPriceDrawerUnitType] = useState<UnitTypeCatalog | null>(null);
  const [priceDrawerBulkTargets, setPriceDrawerBulkTargets] = useState<UnitTypeCatalog[]>([]);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const [isSurchargeDrawerOpen, setIsSurchargeDrawerOpen] = useState(false);
  const [editingSurcharge, setEditingSurcharge] = useState<SurchargeItem | null>(null);
  const [isSavingSurcharge, setIsSavingSurcharge] = useState(false);

  // Policy Drawer State (Publish & View Snapshot)
  const [isPolicyDrawerOpen, setIsPolicyDrawerOpen] = useState(false);
  const [policyDrawerMode, setPolicyDrawerMode] = useState<'publish' | 'view'>('publish');
  const [viewingPolicyVersion, setViewingPolicyVersion] = useState<PolicyVersionListItem | null>(null);

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

  const refreshUnitTypes = async () => {
    if (!selectedFacilityId) return;
    try {
      const data = await fetchUnitTypes(selectedFacilityId);
      setUnitTypes(data);
    } catch {
      setUnitTypes([]);
    }
  };

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
      Promise.all([fetchActivePolicy(), fetchPolicyVersions()])
        .then(([active, versions]) => {
          if (!ignore) {
            setActivePolicy(active);
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

  // Drawer handlers
  const handleOpenSinglePriceDrawer = (ut: UnitTypeCatalog) => {
    setPriceDrawerBulkTargets([]);
    setPriceDrawerUnitType(ut);
  };

  const handleOpenBulkPriceDrawer = (selected: UnitTypeCatalog[]) => {
    setPriceDrawerUnitType(null);
    setPriceDrawerBulkTargets(selected);
  };

  const handleClosePriceDrawer = () => {
    setPriceDrawerUnitType(null);
    setPriceDrawerBulkTargets([]);
  };

  const handleConfirmSinglePrice = async (
    unitTypeId: number,
    pricePerM2: number,
    effectiveDate: string
  ) => {
    setIsUpdatingPrice(true);
    try {
      await updateUnitTypePrice(selectedFacilityId, unitTypeId, pricePerM2, effectiveDate);
      showToast('Đã cập nhật đơn giá loại ô kho thành công!');
      handleClosePriceDrawer();
      await refreshUnitTypes();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Lỗi khi cập nhật giá', 'error');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleConfirmBulkPrice = async (
    updates: { unitTypeId: number; pricePerM2: number }[],
    effectiveDate: string
  ) => {
    setIsUpdatingPrice(true);
    try {
      await Promise.all(
        updates.map((u) =>
          updateUnitTypePrice(selectedFacilityId, u.unitTypeId, u.pricePerM2, effectiveDate)
        )
      );
      showToast(`Đã cập nhật giá thành công cho ${updates.length} loại ô kho!`);
      handleClosePriceDrawer();
      await refreshUnitTypes();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Lỗi khi cập nhật giá hàng loạt', 'error');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const closeSurchargeDrawer = () => {
    setIsSurchargeDrawerOpen(false);
    setEditingSurcharge(null);
  };

  const handleSubmitSurcharge = async (data: SurchargeDrawerSubmit) => {
    setIsSavingSurcharge(true);
    try {
      if (data.mode === 'create') {
        await createSurcharge(data.body);
        showToast(`Đã thêm phụ phí "${data.body.name}" thành công!`);
      } else if (editingSurcharge) {
        await updateSurcharge(editingSurcharge, data.body);
        showToast(`Đã cập nhật phụ phí "${data.body.name}". Lần ghi sau dùng số mới.`);
      }
      closeSurchargeDrawer();
      const updated = await fetchSurcharges();
      setSurcharges(updated);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Không lưu được phụ phí', 'error');
    } finally {
      setIsSavingSurcharge(false);
    }
  };

  const handleToggleSurchargeStatus = async (item: SurchargeItem) => {
    const nextActive = !item.isActive;
    const actionLabel = nextActive ? 'Kích hoạt' : 'Tạm ngưng';
    try {
      await updateSurcharge(item, { isActive: nextActive });
      showToast(`Đã ${actionLabel.toLowerCase()} phụ phí "${item.name}".`);
      const updated = await fetchSurcharges();
      setSurcharges(updated);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || `Không thể ${actionLabel.toLowerCase()} phụ phí`, 'error');
    }
  };

  const handleBulkToggleSurchargeStatus = async (
    items: SurchargeItem[],
    targetActive: boolean
  ) => {
    const actionLabel = targetActive ? 'Kích hoạt' : 'Tạm ngưng';
    try {
      await Promise.all(
        items.map((item) => updateSurcharge(item, { isActive: targetActive }))
      );
      showToast(`Đã ${actionLabel.toLowerCase()} thành công ${items.length} phụ phí!`);
      const updated = await fetchSurcharges();
      setSurcharges(updated);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || `Lỗi khi ${actionLabel.toLowerCase()} hàng loạt`, 'error');
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
    <div className="space-y-4 max-w-[1600px] mx-auto pb-12 animate-fade-in">
      {/* Toast Alert */}
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

      {/* Tầng 1: Header & Tabs Navigation (Điều hướng phân hệ) */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500 text-white shadow-2xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Quản lý Bảng giá & Phụ phí
            </h1>
            <p className="text-xs text-slate-500">
              Thiết lập khung giá thuê theo m², biểu phí dịch vụ và chính sách tài chính
            </p>
          </div>
        </div>

        {/* 4 Tabs Điều hướng phân hệ */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PRICING')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'PRICING'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            <span>Khung giá thuê ô kho</span>
          </button>
          <button
            onClick={() => setActiveTab('SURCHARGES')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'SURCHARGES'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-blue-500" />
            <span>Biểu phí & Phụ thu</span>
          </button>
          <button
            onClick={() => setActiveTab('POLICIES')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'POLICIES'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Chính sách cọc & Quá hạn</span>
          </button>
          <button
            onClick={() => setActiveTab('DISCOUNTS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'DISCOUNTS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-purple-500" />
            <span>Khuyến mãi & Giảm giá</span>
          </button>
        </div>
      </div>

      {/* Tầng 2: Context Bar (Bộ lọc không gian - Cơ sở) - Chỉ hiển thị khi ở tab Khung giá thuê */}
      {activeTab === 'PRICING' && (
        <div className="bg-slate-50/90 border border-slate-200/80 px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-100/80 text-amber-700">
              <Building2 className="w-4 h-4 shrink-0" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Đang xem bảng giá tại:</span>
            <div className="relative">
              <select
                value={selectedFacilityId}
                onChange={(e) => selectFacility(Number(e.target.value))}
                className="text-xs font-bold bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer shadow-2xs"
                title="Chọn cơ sở xem bảng giá"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {currentFacility && (
            <div className="text-xs text-slate-500 flex items-center gap-3 font-medium">
              <span>Mã CS: <strong className="text-slate-700 font-mono">{currentFacility.code || `#${currentFacility.id}`}</strong></span>
              <span>·</span>
              <span>Đang quản lý: <strong className="text-slate-700 font-mono tabular-nums">{unitTypes.length} loại ô kho</strong></span>
              {currentFacility.address && (
                <>
                  <span>·</span>
                  <span className="text-slate-400 line-clamp-1 max-w-sm">{currentFacility.address}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'PRICING' && (
        <FacilityPriceTable
          unitTypes={unitTypes}
          facilityName={currentFacility ? currentFacility.name : 'Cơ sở'}
          selectedFacilityId={selectedFacilityId}
          onOpenPriceModal={handleOpenSinglePriceDrawer}
          onOpenBulkPriceModal={handleOpenBulkPriceDrawer}
          isLoading={isLoadingFacilities || isLoadingUnitTypes}
        />
      )}

      {activeTab === 'SURCHARGES' && (
        <SurchargeTable
          surcharges={surcharges}
          onOpenModal={() => {
            setEditingSurcharge(null);
            setIsSurchargeDrawerOpen(true);
          }}
          onEdit={(item) => {
            setEditingSurcharge(item);
            setIsSurchargeDrawerOpen(true);
          }}
          onToggleStatus={handleToggleSurchargeStatus}
          onBulkToggleStatus={handleBulkToggleSurchargeStatus}
          isLoading={isLoadingSurcharges}
        />
      )}

      {activeTab === 'POLICIES' && (
        <PolicySummaryCard
          policy={activePolicy}
          scheduledPolicy={scheduledPolicy}
          versions={policyVersions}
          isLoading={isLoadingPolicy}
          onOpenPublishDrawer={() => {
            setViewingPolicyVersion(null);
            setPolicyDrawerMode('publish');
            setIsPolicyDrawerOpen(true);
          }}
          onViewVersion={(ver) => {
            setViewingPolicyVersion(ver);
            setPolicyDrawerMode('view');
            setIsPolicyDrawerOpen(true);
          }}
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

      {/* Slide-over Drawer Cập nhật giá (Single & Bulk) */}
      <PriceUpdateDrawer
        isOpen={Boolean(priceDrawerUnitType || priceDrawerBulkTargets.length > 0)}
        onClose={handleClosePriceDrawer}
        facilityName={currentFacility ? currentFacility.name : 'Cơ sở'}
        unitType={priceDrawerUnitType}
        selectedUnitTypes={priceDrawerBulkTargets}
        onConfirmSingle={handleConfirmSinglePrice}
        onConfirmBulk={handleConfirmBulkPrice}
        isLoading={isUpdatingPrice}
      />

      <SurchargeDrawer
        isOpen={isSurchargeDrawerOpen}
        onClose={closeSurchargeDrawer}
        facilities={facilities}
        editing={editingSurcharge}
        onSubmit={handleSubmitSurcharge}
        isLoading={isSavingSurcharge}
      />

      <PolicyDrawer
        isOpen={isPolicyDrawerOpen}
        onClose={() => setIsPolicyDrawerOpen(false)}
        mode={policyDrawerMode}
        activePolicy={activePolicy}
        viewingVersion={viewingPolicyVersion}
        onPublishSuccess={async () => {
          showToast('Đã ban hành phiên bản chính sách mới thành công!');
          setIsPolicyDrawerOpen(false);
          setIsLoadingPolicy(true);
          try {
            const [active, versions] = await Promise.all([fetchActivePolicy(), fetchPolicyVersions()]);
            setActivePolicy(active);
            setPolicyVersions(versions);
            setScheduledPolicy(nextScheduledPolicy(versions));
          } catch {
            // keep existing state
          } finally {
            setIsLoadingPolicy(false);
          }
        }}
        onSwitchToPublishWithSnapshot={() => {
          setPolicyDrawerMode('publish');
        }}
      />

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
