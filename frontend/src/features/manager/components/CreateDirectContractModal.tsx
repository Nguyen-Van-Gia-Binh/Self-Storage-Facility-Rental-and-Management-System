import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FileCheck,
  Search,
  Building2,
  Layers,
  Box,
  Calendar,
  CreditCard,
  User,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import { createDirectContract, type CreateDirectContractRequest } from '@/api/contract';
import { fetchUnitTypes, fetchStorageUnits } from '@/api/unit';
import { getUsers, type AppUser } from '@/api/user';
import { fetchMyAssignedFacilities } from '@/api/facility';
import type { UnitTypeResponse, StorageUnitResponse } from '@/types/unit';
import type { FacilityListItem } from '@/types';
import type { WaitlistResponse } from '@/types/waitlist';

interface CreateDirectContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContract: any, message: string) => void;
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
  const [customerMode, setCustomerMode] = useState<'search' | 'walkin'>('search');
  const [customerSearchKeyword, setCustomerSearchKeyword] = useState<string>('');
  const [customerSearching, setCustomerSearching] = useState<boolean>(false);
  const [customerSearchError, setCustomerSearchError] = useState<string | null>(null);
  const [customerSearchResults, setCustomerSearchResults] = useState<AppUser[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<AppUser | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Walk-in customer states
  const [walkinFullName, setWalkinFullName] = useState<string>('');
  const [walkinPhone, setWalkinPhone] = useState<string>('');
  const [walkinEmail, setWalkinEmail] = useState<string>('');

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
    if (isOpen) {
      setErrorMessage(null);
      if (defaultFacilityId) {
        setSelectedFacilityId(defaultFacilityId);
      }
      fetchMyAssignedFacilities()
        .then((facs) => {
          setFacilities(facs);
          if (!defaultFacilityId && facs.length > 0) {
            setSelectedFacilityId(facs[0].id);
          }
        })
        .catch((err) => console.error('Lỗi khi tải danh sách cơ sở:', err));
    }
  }, [isOpen, defaultFacilityId]);

  // Pre-fill if opened from Waitlist
  useEffect(() => {
    if (isOpen && initialWaitlist) {
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
        setCustomerMode('search');
      } else {
        setCustomerMode('walkin');
        setWalkinFullName(initialWaitlist.customerName || '');
        setWalkinPhone(initialWaitlist.contactPhone || initialWaitlist.customerPhone || '');
        setWalkinEmail(initialWaitlist.customerEmail || '');
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
    } else if (isOpen && !initialWaitlist) {
      setWaitlistId(undefined);
    }
  }, [isOpen, initialWaitlist]);

  // Load unit types when facility changes
  useEffect(() => {
    if (isOpen && selectedFacilityId) {
      setLoadingUnitTypes(true);
      fetchUnitTypes(selectedFacilityId, { size: 100, isActive: true })
        .then((res) => {
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
        })
        .catch((err) => {
          console.error('Lỗi khi tải danh sách loại kho:', err);
          setUnitTypes([]);
        })
        .finally(() => setLoadingUnitTypes(false));
    }
  }, [isOpen, selectedFacilityId]);

  // Load available units when unit type changes
  useEffect(() => {
    if (isOpen && selectedFacilityId && selectedUnitTypeId) {
      setLoadingUnits(true);
      fetchStorageUnits(selectedFacilityId, {
        unitTypeId: selectedUnitTypeId,
        status: 'AVAILABLE',
        size: 100,
      })
        .then((res) => {
          setAvailableUnits(res.content || []);
          setSelectedStorageUnitId(undefined); // Default to unassigned (allocate later via 2D map)
        })
        .catch((err) => {
          console.error('Lỗi khi tải danh sách ô kho trống:', err);
          setAvailableUnits([]);
        })
        .finally(() => setLoadingUnits(false));
    } else {
      setAvailableUnits([]);
      setSelectedStorageUnitId(undefined);
    }
  }, [isOpen, selectedFacilityId, selectedUnitTypeId]);

  // Search customers
  const handleSearchCustomers = async (kw?: string) => {
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
    } catch (err: any) {
      console.error('Lỗi khi tìm kiếm khách hàng:', err);
      const msg = err?.message || 'Không thể kết nối đến hệ thống tài khoản';
      setCustomerSearchError(msg);
      setCustomerSearchResults([]);
    } finally {
      setCustomerSearching(false);
    }
  };

  // Debounced search when keyword changes
  useEffect(() => {
    if (!isOpen || selectedCustomer) return;
    const timer = setTimeout(() => {
      handleSearchCustomers(customerSearchKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, customerSearchKeyword, selectedCustomer]);

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
    setCustomerMode('search');
    setWalkinFullName('');
    setWalkinPhone('');
    setWalkinEmail('');
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

    let cleanPhone = '';
    let customerId: number | undefined = undefined;
    let customerFullName: string | undefined = undefined;
    let customerEmail: string | undefined = undefined;

    if (customerMode === 'search') {
      if (!selectedCustomer) {
        showError('Vui lòng tìm và chọn khách hàng từ danh sách, hoặc chuyển sang tab "Khách vãng lai tại quầy".');
        return;
      }
      cleanPhone = customerPhone.trim();
      if (!cleanPhone) {
        showError('Vui lòng nhập số điện thoại liên hệ của khách hàng.');
        return;
      }
      if (!/^0\d{9}$/.test(cleanPhone)) {
        showError('Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số (bắt đầu bằng số 0, ví dụ: 0987654321).');
        return;
      }
      customerId = selectedCustomer.id;
      customerFullName = selectedCustomer.fullName;
      customerEmail = selectedCustomer.email;
    } else {
      if (!walkinFullName.trim()) {
        showError('Vui lòng nhập họ và tên khách hàng.');
        return;
      }
      cleanPhone = walkinPhone.trim();
      if (!cleanPhone) {
        showError('Vui lòng nhập số điện thoại liên hệ nhận kho của khách hàng.');
        return;
      }
      if (!/^0\d{9}$/.test(cleanPhone)) {
        showError('Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số (bắt đầu bằng số 0, ví dụ: 0987654321).');
        return;
      }
      customerFullName = walkinFullName.trim();
      customerEmail = walkinEmail.trim() || undefined;
    }

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
    } catch (err: any) {
      console.error('Lỗi khi tạo hợp đồng trực tiếp:', err);
      const msg = err?.message || err?.error || 'Không thể tạo hợp đồng trực tiếp. Vui lòng kiểm tra lại.';
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-800 to-teal-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  {waitlistId ? 'Tạo Hợp Đồng Trực Tiếp (Waitlist CRM)' : 'Tạo Hợp Đồng Trực Tiếp'}
                </h2>
                {waitlistId && (
                  <span className="text-[10px] bg-teal-400/25 text-teal-100 border border-teal-300/40 px-2 py-0.5 rounded-full font-bold">
                    Đơn Waitlist #{waitlistId}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80">
                {waitlistId
                  ? 'Chốt hợp đồng trực tiếp cho khách hàng từ danh sách chờ telesales CRM'
                  : 'Lập hợp đồng tại quầy cho khách vãng lai hoặc đặt trước > 30 ngày'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Priority Alert Banner if unassigned reservations exist for this waitlist */}
          {isBlockedByPriority && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-sm text-amber-900">
                    QUY CHẾ ƯU TIÊN: Đang có {initialWaitlist?.unassignedReservationCount} khách đặt trước chưa gán ô kho
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Theo quy chế phân bổ hệ thống, khách hàng đã thanh toán cọc giữ chỗ trước online được ưu tiên bảo đảm ô kho. 
                    Quản lý cơ sở (FM) bắt buộc phải hoàn tất gán ô kho cho các khách đặt trước này tại mục <strong>Gán ô kho</strong> trước khi phân bổ hoặc tạo hợp đồng cho khách trong Danh sách chờ (Waitlist).
                  </p>
                  <div className="pt-1">
                    <a
                      href={`/manager/allocation?facilityId=${selectedFacilityId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg transition-colors shadow-2xs"
                    >
                      Chuyển sang màn hình Gán ô kho ngay →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Chọn cơ sở */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              1. Cơ sở áp dụng
            </label>
            {defaultFacilityId && facilities.length > 0 ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>{facilities.find((f) => f.id === defaultFacilityId)?.name || `Cơ sở #${defaultFacilityId}`}</span>
                <span className="text-[10px] bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded-full">
                  Cơ sở hiện tại
                </span>
              </div>
            ) : (
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Section 2: Khách hàng */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-600" />
                2. Khách hàng thuê
              </label>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCustomerMode('search')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    customerMode === 'search'
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Search className="w-3 h-3" />
                  <span>Tìm khách hàng có sẵn</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode('walkin');
                    setSelectedCustomer(null);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    customerMode === 'walkin'
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Khách vãng lai tại quầy</span>
                </button>
              </div>
            </div>

            {customerMode === 'search' ? (
              selectedCustomer ? (
                <div className="space-y-3">
                  <div className="p-3 bg-brand-50/50 border border-brand-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                        {selectedCustomer.fullName?.charAt(0)?.toUpperCase() || 'K'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{selectedCustomer.fullName}</span>
                          <span className="text-[10px] text-slate-500 font-normal">#{selectedCustomer.id}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {selectedCustomer.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerPhone('');
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Đổi khách hàng
                    </button>
                  </div>

                  {/* Input nhập/xác nhận Số điện thoại */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-brand-600" />
                        Số điện thoại liên hệ nhận kho <span className="text-rose-500">*</span>
                      </span>
                      {!selectedCustomer.phone && (
                        <span className="text-[10px] text-amber-600 font-semibold">Tài khoản chưa có SĐT, vui lòng bổ sung</span>
                      )}
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="0[0-9]{9}"
                      placeholder="Nhập số điện thoại khách hàng (10 số, ví dụ: 0987654321)..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Số điện thoại này sẽ dùng để gửi thông báo bàn giao, mã PIN mở cửa thông minh và cập nhật vào hồ sơ khách hàng.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  {customerSearching && (
                    <div className="p-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tìm khách hàng...</span>
                    </div>
                  )}

                  {customerSearchError && (
                    <div className="p-3 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">
                      {customerSearchError}
                    </div>
                  )}

                  {!customerSearching && !customerSearchError && customerSearchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs">
                      {customerSearchResults.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-2.5 hover:bg-brand-50/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{cust.fullName}</span>
                            <span className="text-slate-500 ml-2 text-[11px]">
                              {cust.phone ? `(${cust.phone})` : '(Chưa có SĐT)'}
                            </span>
                            <div className="text-[11px] text-slate-400">{cust.email}</div>
                          </div>
                          <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60">
                            Chọn
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!customerSearching && !customerSearchError && customerSearchResults.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <p>Không tìm thấy khách hàng nào khớp với từ khóa.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerMode('walkin');
                          if (/^0\d{9}$/.test(customerSearchKeyword.trim())) {
                            setWalkinPhone(customerSearchKeyword.trim());
                          } else if (customerSearchKeyword.includes('@')) {
                            setWalkinEmail(customerSearchKeyword.trim());
                          } else if (customerSearchKeyword.trim()) {
                            setWalkinFullName(customerSearchKeyword.trim());
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Điền thông tin tạo mới cho khách vãng lai tại quầy</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* TAB 2: Khách vãng lai tại quầy */
              <div className="p-3.5 bg-teal-50/40 border border-teal-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-teal-100">
                  <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-teal-600" />
                    Thông tin khách vãng lai mới tại quầy
                  </span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                    Tự động tạo tài khoản
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên khách hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Lê Thanh Tùng..."
                      value={walkinFullName}
                      onChange={(e) => setWalkinFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-brand-600" />
                        Số điện thoại liên hệ <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-slate-400">10 chữ số</span>
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="0[0-9]{9}"
                      placeholder="Nhập 10 số (ví dụ: 0987654321)..."
                      value={walkinPhone}
                      onChange={(e) => setWalkinPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-brand-600" />
                      Email khách hàng (Tùy chọn)
                    </span>
                    <span className="text-[10px] text-slate-400">Tự động sinh theo SĐT nếu để trống</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Ví dụ: thanhtung@gmail.com (hoặc bỏ trống)..."
                    value={walkinEmail}
                    onChange={(e) => setWalkinEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Hệ thống sẽ tự động tạo hồ sơ khách hàng, gán quyền truy cập kho và gửi thông tin mã PIN mở khóa 24/7 tới số điện thoại này.
                </p>
              </div>
            )}
          </div>

          {/* Section 3: Hạng kho & Ô kho cụ thể */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-600" />
                3. Loại ô kho (Unit Type)
              </label>
              {loadingUnitTypes ? (
                <div className="h-9 bg-slate-100 rounded-xl animate-pulse" />
              ) : (
                <select
                  value={selectedUnitTypeId}
                  onChange={(e) => setSelectedUnitTypeId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-brand-600" />
                Ô kho vật lý (Tùy chọn)
              </label>
              {loadingUnits ? (
                <div className="h-9 bg-slate-100 rounded-xl animate-pulse" />
              ) : (
                <select
                  value={selectedStorageUnitId || ''}
                  onChange={(e) =>
                    setSelectedStorageUnitId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">-- Chưa gán ô (Sẽ phân bổ trên Sơ đồ 2D sau) --</option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} (Tầng {u.floor} - {u.position || 'Trống'})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[10px] text-slate-400 mt-1">
                {availableUnits.length > 0
                  ? `${availableUnits.length} ô kho đang trống sẵn sàng cho thuê`
                  : 'Hiện chưa có ô kho trống ngay (hợp đồng sẽ phân bổ sau)'}
              </p>
              {availableUnits.length === 0 && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1.5 leading-snug">
                  ⚠️ Lưu ý: Hạng kho này hiện không có sẵn ô trống vật lý. Bạn có thể tư vấn khách đổi sang hạng kho còn trống khác hoặc lập hợp đồng gán ô sau.
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Ngày bắt đầu & Thời hạn thuê */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                4. Ngày bắt đầu thuê
              </label>
              <input
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <p className="text-[10px] text-teal-600 font-medium mt-1">
                Hỗ trợ đặt trước từ hôm nay hoặc bất kỳ ngày nào trong tương lai
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Thời hạn thuê (tháng)
              </label>
              <select
                value={rentalMonths}
                onChange={(e) => setRentalMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {m} tháng {m === 12 ? '(1 năm)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Ngày kết thúc dự kiến: <span className="font-semibold text-slate-700">{endDate}</span>
              </p>
            </div>
          </div>

          {/* Section 5: Phương thức thanh toán cọc */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-brand-600" />
              5. Phương thức thu cọc / tiền thuê ban đầu
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col gap-1 cursor-pointer transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    className="hidden"
                  />
                  <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center shrink-0">
                    {paymentMethod === 'CASH' && <div className="w-2 h-2 rounded-full bg-brand-600" />}
                  </div>
                  <span>Tiền mặt tại quầy (CASH)</span>
                </div>
                <p className="text-[10px] text-slate-500 pl-6.5 font-normal">
                  Đã thu tiền mặt tại quầy — Hợp đồng kích hoạt sẵn sàng nhận kho.
                </p>
              </label>

              <label
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col gap-1 cursor-pointer transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setPaymentMethod('BANK_TRANSFER')}
                    className="hidden"
                  />
                  <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center shrink-0">
                    {paymentMethod === 'BANK_TRANSFER' && (
                      <div className="w-2 h-2 rounded-full bg-brand-600" />
                    )}
                  </div>
                  <span>Chuyển khoản trực tiếp (BANK_TRANSFER)</span>
                </div>
                <p className="text-[10px] text-teal-700 pl-6.5 font-medium">
                  Hợp đồng xuất hiện ngay trên tài khoản khách hàng để quét VietQR / thanh toán online.
                </p>
              </label>
            </div>
          </div>

          {/* Section 6: Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              6. Ghi chú hợp đồng
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú thêm thông tin tư vấn, yêu cầu riêng của khách hàng..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Bảng tính chi phí & Tóm tắt */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Đơn giá thuê tháng:</span>
              <span className="font-semibold text-slate-900">{monthlyPrice.toLocaleString('vi-VN')} đ/tháng</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tiền đặt cọc bảo đảm (1 tháng):</span>
              <span className="font-semibold text-slate-900">{depositAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tiền thuê {rentalMonths} tháng:</span>
              <span className="font-semibold text-slate-900">{totalRent.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-800">Tổng thanh toán ban đầu:</span>
              <span className="text-base font-black font-mono text-teal-700">
                {totalPayment.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              * Hợp đồng được tạo ngay cho khách hàng. Nếu chọn <strong className="text-teal-700">Chuyển khoản</strong>, khách hàng sẽ thấy nút &quot;Thanh toán ngay&quot; trên trang &quot;Kho của tôi&quot; để quét VietQR kích hoạt kho.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  isBlockedByPriority ||
                  (customerMode === 'search'
                    ? !selectedCustomer
                    : !walkinFullName.trim() || !walkinPhone.trim())
                }
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-brand-700 hover:from-teal-800 hover:to-brand-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang khởi tạo...</span>
                  </>
                ) : isBlockedByPriority ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-300" />
                    <span>Bị khóa: Cần gán ô kho cho khách đặt trước</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
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
