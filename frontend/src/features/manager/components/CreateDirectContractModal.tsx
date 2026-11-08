import React, { useState, useEffect } from 'react';
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

interface CreateDirectContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContract: any, message: string) => void;
  defaultFacilityId?: number;
}

export const CreateDirectContractModal: React.FC<CreateDirectContractModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultFacilityId,
}) => {
  // Facilities
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(defaultFacilityId || 0);

  // Customer search & selection
  const [customerSearchKeyword, setCustomerSearchKeyword] = useState<string>('');
  const [customerSearching, setCustomerSearching] = useState<boolean>(false);
  const [customerSearchError, setCustomerSearchError] = useState<string | null>(null);
  const [customerSearchResults, setCustomerSearchResults] = useState<AppUser[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<AppUser | null>(null);

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
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Load unit types when facility changes
  useEffect(() => {
    if (isOpen && selectedFacilityId) {
      setLoadingUnitTypes(true);
      fetchUnitTypes(selectedFacilityId, { size: 100, isActive: true })
        .then((res) => {
          const types = res.content || [];
          setUnitTypes(types);
          if (types.length > 0) {
            setSelectedUnitTypeId(types[0].id);
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

  // Reset when closed
  const handleClose = () => {
    setSelectedCustomer(null);
    setCustomerSearchKeyword('');
    setCustomerSearchResults([]);
    setErrorMessage(null);
    setNotes('');
    setStartDate(today);
    setRentalMonths(1);
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomer) {
      setErrorMessage('Vui lòng chọn khách hàng để tạo hợp đồng.');
      return;
    }
    if (!selectedFacilityId) {
      setErrorMessage('Vui lòng chọn cơ sở quản lý.');
      return;
    }
    if (!selectedUnitTypeId) {
      setErrorMessage('Vui lòng chọn loại ô kho.');
      return;
    }
    if (!startDate) {
      setErrorMessage('Vui lòng chọn ngày bắt đầu thuê.');
      return;
    }

    const payload: CreateDirectContractRequest = {
      customerId: selectedCustomer.id,
      facilityId: selectedFacilityId,
      unitTypeId: selectedUnitTypeId,
      storageUnitId: selectedStorageUnitId || undefined,
      startDate,
      rentalMonths,
      paymentMethod,
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
      setErrorMessage(msg);
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
              <h2 className="text-base font-bold tracking-tight">Tạo Hợp Đồng Trực Tiếp</h2>
              <p className="text-xs text-white/80">
                Lập hợp đồng tại quầy cho khách vãng lai hoặc đặt trước &gt; 30 ngày
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-600" />
              2. Khách hàng thuê
            </label>

            {selectedCustomer ? (
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
                        <Phone className="w-3 h-3 text-slate-400" />
                        {selectedCustomer.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {selectedCustomer.email}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
                >
                  Đổi khách hàng
                </button>
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
                        onClick={() => setSelectedCustomer(cust)}
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
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    Không tìm thấy khách hàng. Vui lòng kiểm tra từ khóa tìm kiếm.
                  </div>
                )}
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
                {availableUnits.length} ô kho đang trống sẵn sàng
              </p>
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
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={() => setPaymentMethod('CASH')}
                  className="hidden"
                />
                <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                  {paymentMethod === 'CASH' && <div className="w-2 h-2 rounded-full bg-brand-600" />}
                </div>
                <span>Tiền mặt tại quầy (CASH)</span>
              </label>

              <label
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  className="hidden"
                />
                <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                  {paymentMethod === 'BANK_TRANSFER' && (
                    <div className="w-2 h-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <span>Chuyển khoản trực tiếp (BANK_TRANSFER)</span>
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
              * Hợp đồng sẽ được khởi tạo ở trạng thái <strong className="text-amber-700">PENDING_CHECK_IN (Chờ nhận kho)</strong>. Khách hàng có thể check-in trực tuyến hoặc trực tiếp tại quầy vào ngày bắt đầu thuê.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              disabled={submitting || !selectedCustomer}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-brand-700 hover:from-teal-800 hover:to-brand-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận Tạo Hợp Đồng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
