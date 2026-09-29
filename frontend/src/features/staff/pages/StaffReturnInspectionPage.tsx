import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, User, Phone, ShieldCheck, RefreshCw,
  AlertTriangle, UserCheck, ClipboardList,
} from 'lucide-react';
import type { ReturnContractDetail, ReturnInspectionRequest } from '@/types';
import { getReturnContracts, getReturnContractById, submitReturnInspection } from '@/api/contract';
import { useCurrentUser } from '@/utils/useCurrentUser';
import { ReturnInspectionForm } from '../components/ReturnInspectionForm';
import { ReturnSuccessModal } from '../components/ReturnSuccessModal';

const FACILITIES = [
  { id: 0, name: 'Tất cả cơ sở' },
  { id: 1, name: 'Cơ sở Quận 1' },
  { id: 2, name: 'Cơ sở Cầu Giấy' },
  { id: 3, name: 'Cơ sở Hải Châu' },
  { id: 4, name: 'Cơ sở Bình Thạnh' },
  { id: 5, name: 'Cơ sở Hai Bà Trưng' },
];

export const StaffReturnInspectionPage: React.FC = () => {
  const { contractId } = useParams<{ contractId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const staffId = user?.id as number | undefined;

  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(0);
  const [contracts, setContracts] = useState<ReturnContractDetail[]>([]);
  const [selectedContract, setSelectedContract] = useState<ReturnContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successData, setSuccessData] = useState<{
    isOpen: boolean;
    contractCode: string;
    unitCode: string;
    customerName: string;
    refundAmount: number;
  }>({
    isOpen: false,
    contractCode: '',
    unitCode: '',
    customerName: '',
    refundAmount: 0,
  });

  const loadData = React.useCallback(async (facilityId?: number) => {
    setLoading(true);
    try {
      const targetFacilityId = facilityId !== undefined ? facilityId : selectedFacilityId;
      const list = await getReturnContracts(targetFacilityId === 0 ? undefined : targetFacilityId);
      // Chỉ hiển thị các hợp đồng chưa được nghiệm thu trong danh mục ca trực của Staff
      const pendingList = list.filter((c) => !c.isInspected && c.status !== 'INSPECTED');
      setContracts(pendingList);

      const targetId = contractId ? parseInt(contractId, 10) : parseInt(searchParams.get('id') || '', 10);
      if (targetId) {
        const item = pendingList.find((c) => c.id === targetId) || (await getReturnContractById(targetId));
        setSelectedContract(item);
      } else {
        // Tự động chọn đơn đầu tiên được phân công cho nhân viên này
        const myTask = staffId ? pendingList.find((c) => Number(c.assignedStaffId) === Number(staffId)) : null;
        setSelectedContract(myTask ?? null);
      }
    } catch (err) {
      console.error('Lỗi nạp hợp đồng trả kho:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId, searchParams, selectedFacilityId, staffId]);

  const handleFacilityChange = (newFacilityId: number) => {
    setSelectedFacilityId(newFacilityId);
    loadData(newFacilityId);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Chỉ hiển thị đơn được Quản lý phân công đích danh cho nhân viên hiện tại
  const myAssignedContracts = staffId
    ? contracts.filter((c) => Number(c.assignedStaffId) === Number(staffId))
    : [];

  // Đếm số đơn đang chờ phân công (để hiển thị thông tin)
  const unassignedCount = contracts.filter((c) => !c.assignedStaffId).length;

  const handleSubmitInspection = async (data: ReturnInspectionRequest) => {
    if (!selectedContract) return;
    setSubmitting(true);
    try {
      const res = await submitReturnInspection(selectedContract.id, data, staffId);
      const finishedContract = selectedContract;
      // Lập tức loại bỏ hợp đồng đã nghiệm thu khỏi danh sách của nhân viên
      setContracts((prev) => prev.filter((c) => c.id !== finishedContract.id));
      setSelectedContract(null);

      setSuccessData({
        isOpen: true,
        contractCode: finishedContract.code,
        unitCode: finishedContract.storageUnitCode,
        customerName: finishedContract.customerName,
        refundAmount: res.estimatedDepositRefund,
      });
    } catch (err) {
      console.error('Lỗi khi nộp biên bản nghiệm thu:', err);
      alert('Đã xảy ra lỗi khi nộp biên bản nghiệm thu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-9 rounded-xl" />
          <div className="space-y-1.5">
            <div className="skeleton h-7 w-72 rounded" />
            <div className="skeleton h-4 w-96 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="lg:col-span-2 skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff')}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Quay lại danh mục ca trực"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Nghiệm Thu Trả Kho & Biên Bản Bàn Giao
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kiểm tra tình trạng ô kho vật lý, lập biên bản đối soát và xác định tiền cọc hoàn trả.
            </p>
          </div>
        </div>

        {/* Thanh công cụ cơ sở & Làm mới */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-700">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-slate-500 shrink-0">Cơ sở:</span>
            <select
              value={selectedFacilityId}
              onChange={(e) => handleFacilityChange(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
            >
              {FACILITIES.map((f) => (
                <option key={f.id} value={f.id} className="text-slate-900 bg-white">
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-600 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Thông tin trạng thái tổng quan */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 font-semibold">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Nhiệm vụ của tôi: <strong>{myAssignedContracts.length}</strong></span>
        </div>
        {unassignedCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Chờ Quản lý phân công: <strong>{unassignedCount}</strong></span>
          </div>
        )}
      </div>

      {myAssignedContracts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8 text-teal-500" />
          </div>
          <h3 className="font-semibold text-slate-800 text-lg">Chưa có nhiệm vụ nghiệm thu được phân công</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Quản lý cơ sở sẽ phân công nhiệm vụ nghiệm thu trả kho cho bạn khi có khách hàng gửi yêu cầu. Vui lòng chờ thông báo từ Quản lý.
          </p>
          {unassignedCount > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 inline-block">
              Hiện có <strong>{unassignedCount}</strong> đơn trả kho đang chờ Quản lý phân công nhân viên.
            </p>
          )}
          <button
            onClick={() => navigate('/staff')}
            className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700"
          >
            Về trang ca trực
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái (4/12): Danh sách hợp đồng được phân công cho tôi */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                Hợp đồng được phân công cho bạn:
              </label>

              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {myAssignedContracts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContract(c)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition ${
                        selectedContract?.id === c.id
                          ? 'border-teal-500 bg-teal-50/50 font-medium text-teal-900 shadow-xs'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center font-semibold">
                        <span>{c.code}</span>
                        <span className="text-teal-700 font-mono">{c.storageUnitCode}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="text-slate-500 truncate max-w-[140px]">{c.customerName}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          Được giao
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
            </div>

            {/* Thông tin chi tiết hợp đồng được chọn */}
            {selectedContract && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Hồ sơ hợp đồng
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Chờ nghiệm thu
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-500">Mã hợp đồng:</span>
                    <p className="font-bold text-slate-900 font-mono">{selectedContract.code}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-slate-500">Mã ô kho:</span>
                      <p className="font-bold text-teal-600 font-mono">{selectedContract.storageUnitCode}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Loại ô kho:</span>
                      <p className="font-medium text-slate-800 text-xs">{selectedContract.unitTypeName}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-semibold">{selectedContract.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{selectedContract.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                      <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>CCCD: {selectedContract.customerIdentityNumber}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Kỳ hạn thuê:</span>
                      <span className="font-medium text-slate-700">
                        {selectedContract.rentalMonths} tháng
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tiền cọc Deposit:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {selectedContract.depositAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cột phải (8/12): Form Nghiệm thu trả kho kèm Banner phân công */}
          <div className="lg:col-span-8 space-y-4">
            {selectedContract ? (
              <>
                {/* Banner xác nhận: đơn được phân công cho nhân viên đang đăng nhập */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Đơn trả kho này đã được Quản lý cơ sở phân công đích danh cho bạn ({
                    <strong>{user?.fullName || 'Nhân viên'}</strong>}). Vui lòng tiến hành nghiệm thu hiện trường.
                  </span>
                </div>

                {/* Form nghiệm thu trả kho */}
                <ReturnInspectionForm
                  contract={selectedContract}
                  onSubmit={handleSubmitInspection}
                  isSubmitting={submitting}
                />
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                Vui lòng chọn một hợp đồng từ danh sách để bắt đầu nghiệm thu.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal thành công */}
      <ReturnSuccessModal
        isOpen={successData.isOpen}
        contractCode={successData.contractCode}
        unitCode={successData.unitCode}
        customerName={successData.customerName}
        refundAmount={successData.refundAmount}
        onClose={() => {
          setSuccessData((prev) => ({ ...prev, isOpen: false }));
          loadData();
        }}
      />
    </div>
  );
};
