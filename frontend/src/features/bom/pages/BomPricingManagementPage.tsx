// frontend/src/features/bom/pages/BomPricingManagementPage.tsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { fetchFacilities, fetchUnitTypes } from '@/api/facility';
import {
  updateUnitTypePrice,
  fetchSurcharges,
  createSurcharge,
  fetchActivePolicy,
} from '@/api/pricing';
import type {
  FacilityListItem,
  UnitTypeCatalog,
  SurchargeItem,
  CreateSurchargeRequest,
  ActivePolicyInfo,
} from '@/types';
import { FacilityPriceTable } from '../components/FacilityPriceTable';
import { PriceUpdateModal } from '../components/PriceUpdateModal';
import { SurchargeTable } from '../components/SurchargeTable';
import { SurchargeModal } from '../components/SurchargeModal';
import { PolicySummaryCard } from '../components/PolicySummaryCard';

type PricingTab = 'PRICING' | 'SURCHARGES' | 'POLICIES';

export const BomPricingManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PricingTab>('PRICING');

  // Facilities & Unit Types state
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(1);
  const [unitTypes, setUnitTypes] = useState<UnitTypeCatalog[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true);
  const [isLoadingUnitTypes, setIsLoadingUnitTypes] = useState(false);

  // Surcharges & Policy state
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>([]);
  const [isLoadingSurcharges, setIsLoadingSurcharges] = useState(false);
  const [activePolicy, setActivePolicy] = useState<ActivePolicyInfo | null>(null);
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);

  // Modals state
  const [priceModalUnitType, setPriceModalUnitType] = useState<UnitTypeCatalog | null>(null);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isSurchargeModalOpen, setIsSurchargeModalOpen] = useState(false);
  const [isCreatingSurcharge, setIsCreatingSurcharge] = useState(false);

  // Toast state
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

  // Load facilities once
  useEffect(() => {
    let ignore = false;
    fetchFacilities(undefined, true)
      .then((data) => {
        if (!ignore) {
          setFacilities(data);
          if (data.length > 0) {
            setSelectedFacilityId(data[0].id);
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

  // Load Unit Types whenever selectedFacilityId changes
  useEffect(() => {
    if (!selectedFacilityId) return;
    let ignore = false;
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

  // Load Surcharges & Policies when tab is selected
  useEffect(() => {
    let ignore = false;
    if (activeTab === 'SURCHARGES') {
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
      fetchActivePolicy()
        .then((data) => {
          if (!ignore) {
            setActivePolicy(data);
            setIsLoadingPolicy(false);
          }
        })
        .catch(() => {
          if (!ignore) setIsLoadingPolicy(false);
        });
    }

    return () => {
      ignore = true;
    };
  }, [activeTab]);

  const handleConfirmPriceUpdate = async (newPrice: number, effectiveDate: string) => {
    if (!priceModalUnitType) return;
    setIsUpdatingPrice(true);
    try {
      await updateUnitTypePrice(
        selectedFacilityId,
        priceModalUnitType.id,
        newPrice,
        effectiveDate
      );
      showToast(
        `Đã cập nhật đơn giá cho "${priceModalUnitType.name}" thành ${newPrice.toLocaleString('vi-VN')} VND/tháng!`
      );
      setPriceModalUnitType(null);

      // Refresh unit types
      const updated = await fetchUnitTypes(selectedFacilityId);
      setUnitTypes(updated);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Lỗi khi cập nhật giá', 'error');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const handleCreateSurcharge = async (data: CreateSurchargeRequest) => {
    setIsCreatingSurcharge(true);
    try {
      await createSurcharge(data);
      showToast(`Đã thêm phụ phí "${data.name}" thành công!`);
      setIsSurchargeModalOpen(false);

      // Refresh surcharges
      const updated = await fetchSurcharges();
      setSurcharges(updated);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Lỗi khi thêm phụ phí', 'error');
    } finally {
      setIsCreatingSurcharge(false);
    }
  };

  const currentFacility = facilities.find((f) => f.id === selectedFacilityId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
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

      {/* Header */}
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
              Thiết lập khung giá thuê ô kho, biểu phí phát sinh và chính sách tài chính (BM-03)
            </p>
          </div>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
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
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'PRICING' && (
        <FacilityPriceTable
          facilities={facilities}
          selectedFacilityId={selectedFacilityId}
          onSelectFacility={(id) => {
            setIsLoadingUnitTypes(true);
            setSelectedFacilityId(id);
          }}
          unitTypes={unitTypes}
          onOpenPriceModal={(ut) => setPriceModalUnitType(ut)}
          isLoading={isLoadingFacilities || isLoadingUnitTypes}
        />
      )}

      {activeTab === 'SURCHARGES' && (
        <SurchargeTable
          surcharges={surcharges}
          onOpenModal={() => setIsSurchargeModalOpen(true)}
          isLoading={isLoadingSurcharges}
        />
      )}

      {activeTab === 'POLICIES' && (
        <PolicySummaryCard policy={activePolicy} isLoading={isLoadingPolicy} />
      )}

      {/* Price Update Modal */}
      {priceModalUnitType && (
        <PriceUpdateModal
          key={`price-${priceModalUnitType.id}-${priceModalUnitType.monthlyPrice}`}
          isOpen={Boolean(priceModalUnitType)}
          onClose={() => setPriceModalUnitType(null)}
          facilityName={currentFacility ? currentFacility.name : 'Cơ sở'}
          unitType={priceModalUnitType}
          onConfirm={handleConfirmPriceUpdate}
          isLoading={isUpdatingPrice}
        />
      )}

      {/* Surcharge Create Modal */}
      {isSurchargeModalOpen && (
        <SurchargeModal
          key="create-surcharge-modal"
          isOpen={isSurchargeModalOpen}
          onClose={() => setIsSurchargeModalOpen(false)}
          facilities={facilities}
          onSubmit={handleCreateSurcharge}
          isLoading={isCreatingSurcharge}
        />
      )}
    </div>
  );
};
