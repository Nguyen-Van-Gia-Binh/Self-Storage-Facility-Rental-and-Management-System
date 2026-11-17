import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  AlertCircle,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { createDirectContract, type CreateDirectContractRequest } from '@/api/contract';
import { DateField } from '@/components/ui/DateField';
import { fetchUnitTypes, fetchStorageUnits } from '@/api/unit';
import { getUsers, type AppUser } from '@/api/user';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { formatDateVN } from '@/features/customer/utils/unitPickerHelpers';
import type { UnitTypeResponse, StorageUnitResponse } from '@/types/unit';
import type { FacilityListItem } from '@/types';
import type { WaitlistResponse } from '@/types/waitlist';
import type { ManagerContractItem } from '@/types/contractManager';

interface CreateDirectContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContract: ManagerContractItem, message: string) => void;
  defaultFacilityId?: number;
  initialWaitlist?: WaitlistResponse | null;
}

export const CreateDirectContractModal: React.FC<CreateDirectContractModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultFacilityId,
  initialWaitlist,
}) => {
  // Facilities
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(defaultFacilityId || 0);

  // Waitlist link
  const [waitlistId, setWaitlistId] = useState<number | undefined>(undefined);

  // Customer search & selection
  const [customerSearchKeyword, setCustomerSearchKeyword] = useState<string>('');
  const [customerSearching, setCustomerSearching] = useState<boolean>(false);
  const [customerSearchError, setCustomerSearchError] = useState<string | null>(null);
  const [customerSearchResults, setCustomerSearchResults] = useState<AppUser[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<AppUser | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Unit types & Storage units
  const [unitTypes, setUnitTypes] = useState<UnitTypeResponse[]>([]);
  const [selectedUnitTypeId, setSelectedUnitTypeId] = useState<number>(0);
  const [loadingUnitTypes, setLoadingUnitTypes] = useState<boolean>(false);

  const [availableUnits, setAvailableUnits] = useState<StorageUnitResponse[]>([]);
  const [selectedStorageUnitId, setSelectedStorageUnitId] = useState<number | undefined>(undefined);
  const [loadingUnits, setLoadingUnits] = useState<boolean>(false);

  // Contract details
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [rentalMonths, setRentalMonths] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [notes, setNotes] = useState<string>('');

  // Form state
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => {
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  // Load facilities if needed
  useEffect(() => {
    if (!isOpen) return;

    const initFacilities = async () => {
      setErrorMessage(null);
      if (defaultFacilityId) {
        setSelectedFacilityId(defaultFacilityId);
      }
      try {
        const facs = await fetchMyAssignedFacilities();
        setFacilities(facs);
        if (!defaultFacilityId && facs.length > 0) {
          setSelectedFacilityId(facs[0].id);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách cơ sở:', err);
      }
    };

    initFacilities();
  }, [isOpen, defaultFacilityId]);

  // Pre-fill if opened from Waitlist
  useEffect(() => {
    if (!isOpen) return;

    const applyWaitlist = () => {
      if (initialWaitlist) {
        setWaitlistId(initialWaitlist.id);
        if (initialWaitlist.facilityId) {
          setSelectedFacilityId(initialWaitlist.facilityId);
        }
        if (initialWaitlist.customerId) {
          setSelectedCustomer({
            id: initialWaitlist.customerId,
            fullName: initialWaitlist.customerName || 'Khách hàng',
            email: initialWaitlist.customerEmail || '',
            phone: initialWaitlist.contactPhone || initialWaitlist.customerPhone || '',
            role: 'STORAGE_CUSTOMER',
            status: 'ACTIVE',
            active: true,
            facilityIds: [],
            createdAt: new Date().toISOString(),
          });
          setCustomerPhone(initialWaitlist.contactPhone || initialWaitlist.customerPhone || '');
        } else {
          const kw = initialWaitlist.contactPhone || initialWaitlist.customerPhone || initialWaitlist.customerName || '';
          setCustomerSearchKeyword(kw);
        }
        if (initialWaitlist.unitTypeId) {
          setSelectedUnitTypeId(initialWaitlist.unitTypeId);
        }
        if (initialWaitlist.targetStartDate) {
          const todayStr = new Date().toISOString().split('T')[0];
          setStartDate(initialWaitlist.targetStartDate >= todayStr ? initialWaitlist.targetStartDate : todayStr);
        }
        if (initialWaitlist.rentalMonths) {
          setRentalMonths(initialWaitlist.rentalMonths);
        }
        if (initialWaitlist.contactNotes) {
          setNotes(initialWaitlist.contactNotes);
        }
      } else {
        setWaitlistId(undefined);
      }
    };

    applyWaitlist();
  }, [isOpen, initialWaitlist]);

  // Load unit types when facility changes
  useEffect(() => {
    if (!isOpen || !selectedFacilityId) return;

    let isSubscribed = true;
    const loadTypes = async () => {
      setLoadingUnitTypes(true);
      try {
        const res = await fetchUnitTypes(selectedFacilityId, { size: 100, isActive: true });
        if (!isSubscribed) return;
        const types = res.content || [];
        setUnitTypes(types);
        if (types.length > 0) {
          setSelectedUnitTypeId((prev) => {
            if (initialWaitlist?.unitTypeId && types.some((t) => t.id === initialWaitlist.unitTypeId)) {
              return initialWaitlist.unitTypeId;
            }
            if (prev && types.some((t) => t.id === prev)) {
              return prev;
            }
            return types[0].id;
          });
        } else {
          setSelectedUnitTypeId(0);
        }
      } catch (err) {
        if (!isSubscribed) return;
        console.error('Lỗi khi tải danh sách loại kho:', err);
        setUnitTypes([]);
      } finally {
        if (isSubscribed) setLoadingUnitTypes(false);
      }
    };

    loadTypes();
    return () => {
      isSubscribed = false;
    };
  }, [isOpen, selectedFacilityId, initialWaitlist?.unitTypeId]);

  // Load available units when unit type changes
  useEffect(() => {
    let isSubscribed = true;
    if (!isOpen || !selectedFacilityId || !selectedUnitTypeId) {
      const resetUnits = () => {
        setAvailableUnits([]);
        setSelectedStorageUnitId(undefined);
      };
      resetUnits();
      return;
    }

    const loadUnits = async () => {
      setLoadingUnits(true);
      try {
        const res = await fetchStorageUnits(selectedFacilityId, {
          unitTypeId: selectedUnitTypeId,
          status: 'AVAILABLE',
          size: 100,
        });
        if (!isSubscribed) return;
        setAvailableUnits(res.content || []);
        setSelectedStorageUnitId(undefined); // Default to unassigned (allocate later via 2D map)
      } catch (err) {
        if (!isSubscribed) return;
        console.error('Lỗi khi tải danh sách ô kho trống:', err);
        setAvailableUnits([]);
      } finally {
        if (isSubscribed) setLoadingUnits(false);
      }
    };

    loadUnits();
    return () => {
      isSubscribed = false;
    };
  }, [isOpen, selectedFacilityId, selectedUnitTypeId]);

  // Search customers
  const handleSearchCustomers = useCallback(async (kw?: string) => {
    const term = kw !== undefined ? kw : customerSearchKeyword;
    setCustomerSearching(true);
    setCustomerSearchError(null);
    try {
      const res = await getUsers({
        keyword: term.trim() || undefined,
        role: 'STORAGE_CUSTOMER',
        size: 15,
      });
      setCustomerSearchResults(res.content || []);
    } catch (err: unknown) {
      console.error('Lỗi khi tìm kiếm khách hàng:', err);
      const errObj = err as { message?: string };
      const msg = errObj?.message || 'Không thể kết nối đến hệ thống tài khoản';
      setCustomerSearchError(msg);
      setCustomerSearchResults([]);
    } finally {
      setCustomerSearching(false);
    }
  }, [customerSearchKeyword]);

  // Debounced search when keyword changes
  useEffect(() => {
    if (!isOpen || selectedCustomer) return;
    const timer = setTimeout(() => {
      handleSearchCustomers(customerSearchKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, customerSearchKeyword, selectedCustomer, handleSearchCustomers]);

  // Select customer handler
  const handleSelectCustomer = (cust: AppUser) => {
    setSelectedCustomer(cust);
    setCustomerPhone(cust.phone || '');
  };

  // Reset when closed
  const handleClose = () => {
    setSelectedCustomer(null);
    setCustomerPhone('');
    setCustomerSearchKeyword('');
    setCustomerSearchResults([]);
    setErrorMessage(null);
    setNotes('');
    setStartDate(today);
    setRentalMonths(1);
    setWaitlistId(undefined);
    onClose();
  };

  // Calculated values
  const currentUnitType = unitTypes.find((ut) => ut.id === selectedUnitTypeId);
  const monthlyPrice = currentUnitType?.monthlyPrice || 0;
  const depositAmount = monthlyPrice; // 1 month deposit
  const totalRent = monthlyPrice * rentalMonths;
  const totalPayment = totalRent + depositAmount;

  // Calculate End Date
  const calculateEndDate = (start: string, months: number) => {
    if (!start) return '';
    const d = new Date(start);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };
  const endDate = calculateEndDate(startDate, rentalMonths);

  // Quy chế ưu tiên: Chặn tạo hợp đồng từ Waitlist nếu còn đơn đặt cọc trước chưa gán ô kho
  const isBlockedByPriority = Boolean(
    initialWaitlist && (initialWaitlist.unassignedReservationCount ?? 0) > 0
  );

  // Chặn khi hạng kho đã chọn hoàn toàn hết ô kho trống khả dụng
  const isNoAvailableUnits = !loadingUnits && availableUnits.length === 0;

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isBlockedByPriority) {
      showError(
        `Quy chế ưu tiên: Không thể tạo hợp đồng cho khách từ Danh sách chờ khi còn ${initialWaitlist?.unassignedReservationCount} đơn đặt trước chưa được gán ô kho. Vui lòng vào mục "Gán ô kho" để xử lý trước!`
      );
      return;
    }

    if (isNoAvailableUnits) {
      showError(
        'Không thể tạo hợp đồng: Hạng kho đã chọn hiện không còn ô kho nào trống khả dụng. Vui lòng chọn hạng kho khác còn trống hoặc liên hệ khách hàng khi có ô trả!'
      );
      return;
    }

    if (!selectedCustomer) {
      showError('Vui lòng tìm và chọn tài khoản khách hàng thuê từ hệ thống.');
      return;
    }
    const cleanPhone = customerPhone.trim();
    if (!cleanPhone) {
      showError('Vui lòng nhập số điện thoại liên hệ của khách hàng.');
      return;
    }
    if (!/^0\d{9}$/.test(cleanPhone)) {
      showError('Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số (bắt đầu bằng số 0, ví dụ: 0987654321).');
      return;
    }
    const customerId = selectedCustomer.id;
    const customerFullName = selectedCustomer.fullName;
    const customerEmail = selectedCustomer.email;

    if (!selectedFacilityId) {
      showError('Vui lòng chọn cơ sở quản lý.');
      return;
    }
    if (!selectedUnitTypeId) {
      showError('Vui lòng chọn loại ô kho.');
      return;
    }
    if (!startDate) {
      showError('Vui lòng chọn ngày bắt đầu thuê.');
      return;
    }

    const payload: CreateDirectContractRequest = {
      customerId,
      customerFullName,
      customerEmail,
      customerPhone: cleanPhone,
      facilityId: selectedFacilityId,
      unitTypeId: selectedUnitTypeId,
      storageUnitId: selectedStorageUnitId || undefined,
      startDate,
      rentalMonths,
      paymentMethod,
      waitlistId,
      notes: notes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const newContract = await createDirectContract(payload);
      onSuccess(newContract, 'Đã tạo hợp đồng trực tiếp thành công!');
      handleClose();
    } catch (err: unknown) {
      console.error('Lỗi khi tạo hợp đồng trực tiếp:', err);
      const errObj = err as { message?: string; error?: string };
      const msg = errObj?.message || errObj?.error || 'Không thể tạo hợp đồng trực tiếp. Vui lòng kiểm tra lại.';
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={() => !submitting && handleClose()}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header trắng sạch (Apple / Stripe style) */}
        <div className="flex justify-between items-start gap-4 px-6 py-5 border-b border-gray-200 bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Tạo Hợp Đồng Trực Tiếp
              </h2>
              {waitlistId && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-semibold">
                  Đơn chờ #{waitlistId}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {waitlistId
                ? 'Chốt hợp đồng trực tiếp cho khách hàng từ danh sách chờ.'
                : 'Lập hợp đồng trực tiếp tại quầy cho khách hàng có tài khoản.'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form wrapper bao bọc Body cuộn + Footer cố định */}
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
          {/* Modal Body */}
          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
            {/* Priority Alert Banner if unassigned reservations exist for this waitlist */}
            {isBlockedByPriority && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-bold text-sm text-amber-900">
                      Cần ưu tiên gán ô cho {initialWaitlist?.unassignedReservationCount} đơn đặt trước
                    </h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Khách hàng đã thanh toán cọc giữ chỗ trước online được ưu tiên bảo đảm ô kho. Vui lòng hoàn tất gán ô kho tại mục <strong>Gán ô kho</strong> trước khi tạo hợp đồng từ danh sách chờ.
                    </p>
                    <div className="pt-1">
                      <a
                        href={`/manager/allocation?facilityId=${selectedFacilityId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Chuyển sang màn hình Gán ô kho →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alert Banner when no units are available for the selected unit type */}
            {isNoAvailableUnits && !isBlockedByPriority && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div className="space-y-1 flex-1">
                    <h4 className="font-bold text-sm text-rose-900">
                      Hạng kho này hiện đã hết ô trống
                    </h4>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      Cơ sở hiện không còn ô kho khả dụng thuộc hạng này. Vui lòng chọn hạng kho còn trống khác hoặc tạo hợp đồng khi có ô trả.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Section 1: Cơ sở áp dụng */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 inline-flex items-center justify-center text-[11px] font-bold">
                  1
                </span>
                Cơ sở áp dụng
              </h3>
              {defaultFacilityId && facilities.length > 0 ? (
                <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 flex items-center justify-between">
                  <span>{facilities.find((f) => f.id === defaultFacilityId)?.name || `Cơ sở #${defaultFacilityId}`}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 font-medium px-2 py-0.5 rounded-md">
                    Cơ sở hiện tại
                  </span>
                </div>
              ) : (
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Section 2: Khách hàng thuê */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 inline-flex items-center justify-center text-[11px] font-bold">
                    2
                  </span>
                  Khách hàng thuê
                </h3>
                <span className="text-xs text-gray-400">
                  Tài khoản hệ thống
                </span>
              </div>

              {selectedCustomer ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {selectedCustomer.fullName?.charAt(0)?.toUpperCase() || 'K'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <span className="truncate">{selectedCustomer.fullName}</span>
                          <span className="text-xs text-gray-400 font-normal">#{selectedCustomer.id}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 truncate">
                          <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{selectedCustomer.email}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerPhone('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Đổi khách
                    </button>
                  </div>

                  {/* Input nhập/xác nhận Số điện thoại */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                      <span>
                        Số điện thoại liên hệ nhận kho <span className="text-rose-500">*</span>
                      </span>
                      {!selectedCustomer.phone && (
                        <span className="text-xs text-amber-600 font-medium">Cần bổ sung SĐT</span>
                      )}
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="0[0-9]{9}"
                      placeholder="Nhập số điện thoại (10 số, ví dụ: 0987654321)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên, số điện thoại hoặc email khách hàng..."
                      value={customerSearchKeyword}
                      onChange={(e) => setCustomerSearchKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchCustomers(customerSearchKeyword);
                        }
                      }}
                      className="w-full h-10 pl-9 pr-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  {customerSearching && (
                    <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tìm khách hàng...</span>
                    </div>
                  )}

                  {customerSearchError && (
                    <div className="p-3 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
                      {customerSearchError}
                    </div>
                  )}

                  {!customerSearching && !customerSearchError && customerSearchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
                      {customerSearchResults.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-900">{cust.fullName}</span>
                            <span className="text-gray-500 ml-2 tabular-nums">
                              {cust.phone ? `(${cust.phone})` : '(Chưa có SĐT)'}
                            </span>
                            <div className="text-gray-400 truncate mt-0.5">{cust.email}</div>
                          </div>
                          <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-md shrink-0">
                            Chọn
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!customerSearching && !customerSearchError && customerSearchResults.length === 0 && (
                    <div className="p-3 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                      Không tìm thấy khách hàng nào khớp với từ khóa.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 3: Loại ô kho & Ô kho vật lý (Grid 2 cột đều nhau) */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 inline-flex items-center justify-center text-[11px] font-bold">
                  3
                </span>
                Loại ô kho &amp; Ô kho vật lý
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại ô kho <span className="text-rose-500">*</span>
                  </label>
                  {loadingUnitTypes ? (
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                  ) : (
                    <select
                      value={selectedUnitTypeId}
                      onChange={(e) => setSelectedUnitTypeId(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      {unitTypes.map((ut) => (
                        <option key={ut.id} value={ut.id}>
                          {ut.name} ({ut.areaM2}m²) - {ut.monthlyPrice.toLocaleString('vi-VN')} đ/tháng
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ô kho vật lý (Tùy chọn)
                  </label>
                  {loadingUnits ? (
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                  ) : (
                    <select
                      value={selectedStorageUnitId || ''}
                      onChange={(e) =>
                        setSelectedStorageUnitId(e.target.value ? Number(e.target.value) : undefined)
                      }
                      className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="">-- Chưa gán ô (Phân bổ trên Sơ đồ 2D sau) --</option>
                      {availableUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code} (Tầng {u.floor} - {u.position || 'Trống'})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {availableUnits.length > 0
                      ? `${availableUnits.length} ô kho đang trống sẵn sàng cho thuê`
                      : 'Hiện chưa có ô kho trống ngay'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Ngày bắt đầu & Thời hạn thuê (Grid 2 cột đồng đều) */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 inline-flex items-center justify-center text-[11px] font-bold">
                  4
                </span>
                Thời gian thuê
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu thuê <span className="text-rose-500">*</span>
                  </label>
                  <DateField
                    min={today}
                    value={startDate}
                    onChange={setStartDate}
                    className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Hỗ trợ đặt trước từ hôm nay trở đi
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời hạn thuê
                  </label>
                  <select
                    value={rentalMonths}
                    onChange={(e) => setRentalMonths(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {m} tháng {m === 12 ? '(1 năm)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1 tabular-nums">
                    Ngày kết thúc dự kiến:{' '}
                    <span className="font-semibold text-gray-700">{endDate ? formatDateVN(endDate) : '—'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: Phương thức thanh toán */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 inline-flex items-center justify-center text-[11px] font-bold">
                  5
                </span>
                Phương thức thu cọc &amp; tiền thuê ban đầu
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`relative flex items-start gap-3 rounded-lg border bg-white p-3.5 cursor-pointer transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    className="mt-1 h-4 w-4 accent-brand-600 cursor-pointer shrink-0"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900">Tiền mặt tại quầy</span>
                    <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Hợp đồng kích hoạt ngay, sẵn sàng nhận kho.
                    </span>
                  </div>
                </label>

                <label
                  className={`relative flex items-start gap-3 rounded-lg border bg-white p-3.5 cursor-pointer transition-all ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setPaymentMethod('BANK_TRANSFER')}
                    className="mt-1 h-4 w-4 accent-brand-600 cursor-pointer shrink-0"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900">Chuyển khoản (VNPay)</span>
                    <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Khách tự thanh toán online trên mục Kho của tôi.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Section 6: Ghi chú hợp đồng */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 inline-flex items-center justify-center text-[11px] font-bold">
                  6
                </span>
                Ghi chú hợp đồng (Tùy chọn)
              </h3>
              <textarea
                rows={2}
                placeholder="Ghi chú thêm thông tin tư vấn, yêu cầu riêng của khách hàng..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Modal Footer: Tổng tiền + Nút Submit đậm rõ nét */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 shrink-0 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Đơn giá thuê tháng:</span>
                <span className="font-medium text-gray-900 tabular-nums">
                  {monthlyPrice.toLocaleString('vi-VN')} đ/tháng
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tiền đặt cọc (1 tháng):</span>
                <span className="font-medium text-gray-900 tabular-nums">
                  {depositAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tiền thuê {rentalMonths} tháng:</span>
                <span className="font-medium text-gray-900 tabular-nums">
                  {totalRent.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between items-baseline border-t border-gray-200 pt-2 mt-2">
                <span className="font-bold text-gray-900 text-base">Tổng thanh toán ban đầu:</span>
                <span className="font-bold text-brand-600 text-xl tabular-nums">
                  {totalPayment.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  loadingUnits ||
                  isBlockedByPriority ||
                  isNoAvailableUnits ||
                  !selectedCustomer ||
                  !customerPhone.trim()
                }
                className="px-6 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang khởi tạo...</span>
                  </>
                ) : isBlockedByPriority ? (
                  <>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Cần gán ô cho khách đặt trước</span>
                  </>
                ) : isNoAvailableUnits ? (
                  <>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Hết ô kho trống khả dụng</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Xác nhận Tạo Hợp Đồng</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
