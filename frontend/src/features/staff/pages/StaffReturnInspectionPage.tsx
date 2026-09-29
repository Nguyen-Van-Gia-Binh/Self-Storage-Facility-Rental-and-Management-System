import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, User, Phone, ShieldCheck, RefreshCw,
  AlertTriangle, UserCheck, ClipboardList, Handshake, CheckCircle2,
} from 'lucide-react';
import type { ReturnContractDetail, ReturnInspectionRequest } from '@/types';
import { getReturnContracts, getReturnContractById, submitReturnInspection, assignReturnStaff, completeUnitCleaning } from '@/api/contract';
import { fetchMyAssignedFacilities } from '@/api/facility';
import type { FacilityListItem } from '@/types';
import { useCurrentUser } from '@/utils/useCurrentUser';
import { ReturnInspectionForm } from '../components/ReturnInspectionForm';
import { ReturnSuccessModal } from '../components/ReturnSuccessModal';
import { Button } from '@/components/ui/Button';

export const StaffReturnInspectionPage: React.FC = () => {
  const { contractId } = useParams<{ contractId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const staffId = user?.id ? Number(user.id) : undefined;
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [staffFacilityId, setStaffFacilityId] = useState<number | null>(null);
  const staffFacilityName = facilities.find((facility) => facility.id === staffFacilityId)?.name || 'Chưa được gán cơ sở';

  const [contracts, setContracts] = useState<ReturnContractDetail[]>([]);
  const [selectedContract, setSelectedContract] = useState<ReturnContractDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'MY_TASKS' | 'UNASSIGNED'>('MY_TASKS');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);

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

  useEffect(() => {
    fetchMyAssignedFacilities()
      .then((list) => {
        setFacilities(list);
        setStaffFacilityId((current) =>
          current && list.some((facility) => facility.id === current) ? current : (list[0]?.id ?? null)
        );
      })
      .catch((error) => {
        console.error('Không tải được cơ sở được phân công:', error);
        setFacilities([]);
        setStaffFacilityId(null);
      });
  }, []);

  const loadData = React.useCallback(async () => {
    if (!staffFacilityId) {
      setContracts([]);
      setSelectedContract(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rawList = await getReturnContracts(staffFacilityId);
      // Chỉ hiển thị các hợp đồng chưa được nghiệm thu trong danh mục ca trực của Staff
      const list = rawList.filter((c) => !c.isInspected && c.status !== 'INSPECTED');
      setContracts(list);

      const targetId = contractId ? parseInt(contractId, 10) : parseInt(searchParams.get('id') || '', 10);
      if (targetId) {
        const item = list.find((c) => c.id === targetId) || (await getReturnContractById(targetId));
        setSelectedContract(item);
        if (item && Number(item.assignedStaffId) === staffId) {
          setActiveTab('MY_TASKS');
        } else if (item) {
          setActiveTab('UNASSIGNED');
        }
      } else {
        // Tự động chọn đơn đầu tiên được phân công cho nhân viên này nếu có
        const myTask = list.find((c) => Number(c.assignedStaffId) === staffId);
        if (myTask) {
          setSelectedContract(myTask);
          setActiveTab('MY_TASKS');
        } else {
          // Nếu chưa có đơn phân công, chọn đơn chờ đầu tiên để nhân viên sẵn sàng tiếp nhận
          const unassignedTask = list.find((c) => !c.assignedStaffId || Number(c.assignedStaffId) !== staffId);
          setSelectedContract(unassignedTask || null);
          if (unassignedTask) {
            setActiveTab('UNASSIGNED');
          }
        }
      }
    } catch (err) {
      console.error('Lỗi nạp hợp đồng trả kho:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId, searchParams, staffFacilityId, staffId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Đơn được phân công đích danh cho nhân viên
  const myAssignedContracts = contracts.filter((c) => Number(c.assignedStaffId) === staffId);

  // Đơn chờ nhận việc tại cơ sở
  const unassignedContracts = contracts.filter(
    (c) => !c.assignedStaffId || Number(c.assignedStaffId) !== staffId
  );

  // Nhân viên chủ động tự nhận nhiệm vụ trả kho khi khách đến quầy (FS-03, FS-04 - Mục 31)
  const handleSelfClaim = async (contract: ReturnContractDetail) => {
    if (!staffId) return;
    setClaimingId(contract.id);
    try {
      await assignReturnStaff(contract.id, staffId);
      const updated = {
        ...contract,
        assignedStaffId: staffId,
        assignedStaffName: user?.fullName || 'Nhân viên trực quầy',
        assignmentStatus: 'ASSIGNED' as const,
      };
      setContracts((prev) => prev.map((c) => (c.id === contract.id ? updated : c)));
      setSelectedContract(updated);
      setActiveTab('MY_TASKS');
    } catch (err) {
      console.error('Lỗi khi tự nhận việc:', err);
      alert('Không thể nhận nhiệm vụ lúc này, vui lòng thử lại.');
    } finally {
      setClaimingId(null);
    }
  };

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
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
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

        {/* Khóa cứng cơ sở ca trực (FS-01, Mục 30) & Làm mới */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold shadow-xs">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {facilities.length > 1 ? (
              <select
                value={staffFacilityId ?? ''}
                onChange={(event) => setStaffFacilityId(Number(event.target.value))}
                className="bg-transparent font-bold text-emerald-900 focus:outline-none"
                aria-label="Cơ sở ca trực"
              >
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.code} — {facility.name}
                  </option>
                ))}
              </select>
            ) : (
              <span>Ca trực: {staffFacilityName}</span>
            )}
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

      {/* Tabs điều hướng hàng đợi (Mục 31: Khắc phục tắc luồng) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('MY_TASKS');
            if (myAssignedContracts.length > 0) setSelectedContract(myAssignedContracts[0]);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MY_TASKS'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Nhiệm vụ của tôi ({myAssignedContracts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('UNASSIGNED');
            if (unassignedContracts.length > 0) setSelectedContract(unassignedContracts[0]);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'UNASSIGNED'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Hàng đợi chờ nhận việc ({unassignedContracts.length})</span>
        </button>
      </div>

      {/* Khi không có đơn nào ở cả 2 danh sách */}
      {contracts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8 text-teal-500" />
          </div>
          <h3 className="font-semibold text-slate-800 text-lg">Không có yêu cầu trả kho nào cần xử lý</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Hiện tại tại {staffFacilityName} chưa có khách hàng nào gửi yêu cầu trả kho.
          </p>
          <button
            onClick={() => navigate('/staff')}
            className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 cursor-pointer"
          >
            Về trang ca trực
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cột trái (4/12): Danh sách hợp đồng theo Tab */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  {activeTab === 'MY_TASKS' ? (
                    <>
                      <UserCheck className="w-4 h-4 text-teal-600" />
                      Nhiệm vụ của bạn ({myAssignedContracts.length})
                    </>
                  ) : (
                    <>
                      <Handshake className="w-4 h-4 text-amber-600" />
                      Đơn chờ tiếp đón ({unassignedContracts.length})
                    </>
                  )}
                </label>
              </div>

              {activeTab === 'MY_TASKS' ? (
                myAssignedContracts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 space-y-2">
                    <p className="text-xs">Bạn chưa có nhiệm vụ nào được phân công.</p>
                    {unassignedContracts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('UNASSIGNED');
                          if (unassignedContracts.length > 0) setSelectedContract(unassignedContracts[0]);
                        }}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 underline cursor-pointer"
                      >
                        Xem {unassignedContracts.length} đơn đang chờ nhận việc →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                    {myAssignedContracts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedContract(c)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                          selectedContract?.id === c.id
                            ? 'border-teal-500 bg-teal-50/60 font-medium text-teal-900 shadow-xs'
                            : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center font-semibold">
                          <span className="font-mono text-slate-900">{c.code}</span>
                          <span className="text-teal-700 font-mono font-bold">{c.storageUnitCode}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-slate-600 truncate max-w-[140px]">{c.customerName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                            Đang xử lý
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                unassignedContracts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Tất cả các đơn trả kho tại cơ sở đã được phân công hoặc tiếp nhận.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {unassignedContracts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedContract(c)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition cursor-pointer space-y-2 ${
                          selectedContract?.id === c.id
                            ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-center font-semibold">
                          <span className="font-mono text-slate-900">{c.code}</span>
                          <span className="text-amber-700 font-mono font-bold">{c.storageUnitCode}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span className="font-medium text-slate-800">{c.customerName}</span>
                          <span className="text-slate-500">{c.requestedReturnDate}</span>
                        </div>
                        <div className="pt-1.5 flex items-center justify-between border-t border-slate-100">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Chờ nhận việc
                          </span>
                          <button
                            type="button"
                            disabled={claimingId === c.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelfClaim(c);
                            }}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {claimingId === c.id ? 'Đang nhận...' : 'Tự nhận việc này →'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
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

          {/* Cột phải (8/12): Form Nghiệm thu trả kho hoặc Thẻ tự nhận việc */}
          <div className="lg:col-span-8 space-y-4">
            {selectedContract ? (
              Number(selectedContract.assignedStaffId) === staffId ? (
                <>
                  {/* Banner xác nhận: đơn đã được tiếp nhận */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Đơn trả kho này đã được gán cho bạn ({<strong>{user?.fullName || 'Nhân viên'}</strong>}). Vui lòng cùng khách hàng kiểm tra hiện trạng và lập biên bản.
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
                <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
                    <Handshake className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      Đơn trả kho đang chờ tiếp nhận tại quầy
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Khách hàng <strong>{selectedContract.customerName}</strong> đang yêu cầu nghiệm thu trả ô kho <strong>{selectedContract.storageUnitCode}</strong>.
                      Nhân viên có thể chủ động bấm nhận việc để mở biểu mẫu nghiệm thu ngay lập tức mà không cần chờ Quản lý phân công.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      size="md"
                      variant="primary"
                      isLoading={claimingId === selectedContract.id}
                      onClick={() => handleSelfClaim(selectedContract)}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 shadow-sm cursor-pointer"
                    >
                      <Handshake className="w-4 h-4 mr-2" />
                      TIẾP NHẬN NHIỆM VỤ NÀY & BẮT ĐẦU NGHIỆM THU
                    </Button>
                  </div>
                </div>
              )
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
        onMarkCleaned={
          selectedContract
            ? async () => {
                await completeUnitCleaning(selectedContract.id);
              }
            : undefined
        }
      />
    </div>
  );
};

