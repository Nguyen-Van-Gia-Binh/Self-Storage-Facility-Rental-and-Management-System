import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, User, Phone, ShieldCheck, CheckCircle } from 'lucide-react';
import type { ReturnContractDetail, ReturnInspectionRequest } from '@/types';
import { getReturnContracts, getReturnContractById, submitReturnInspection } from '@/api/contract';
import { ReturnInspectionForm } from '../components/ReturnInspectionForm';
import { ReturnSuccessModal } from '../components/ReturnSuccessModal';

export const StaffReturnInspectionPage: React.FC = () => {
  const { contractId } = useParams<{ contractId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await getReturnContracts();
        setContracts(list);

        const targetId = contractId ? parseInt(contractId, 10) : parseInt(searchParams.get('id') || '', 10);
        if (targetId) {
          const item = list.find((c) => c.id === targetId) || (await getReturnContractById(targetId));
          setSelectedContract(item);
        } else if (list.length > 0) {
          setSelectedContract(list[0]);
        }
      } catch (err) {
        console.error('Lỗi nạp hợp đồng trả kho:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [contractId, searchParams]);

  const handleSubmitInspection = async (data: ReturnInspectionRequest) => {
    if (!selectedContract) return;
    setSubmitting(true);
    try {
      const res = await submitReturnInspection(selectedContract.id, data);
      setSuccessData({
        isOpen: true,
        contractCode: selectedContract.code,
        unitCode: selectedContract.storageUnitCode,
        customerName: selectedContract.customerName,
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
      <div className="p-8 text-center text-slate-500">
        Đang tải dữ liệu hồ sơ trả kho...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
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
              Nghiệm Thu Trả Kho & Biên Bản Bàn Giao (Flow 3)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kiểm tra tình trạng ô kho vật lý, lập biên bản đối soát và xác định cọc hoàn trả theo BR-RET-04.
            </p>
          </div>
        </div>

        {selectedContract && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold">
            <Building2 className="w-4 h-4" />
            {selectedContract.facilityName}
          </div>
        )}
      </div>

      {contracts.length === 0 && !selectedContract ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <CheckCircle className="w-12 h-12 text-teal-500 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-lg">Không có yêu cầu trả kho nào cần xử lý</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Hiện tại tất cả các lượt hẹn trả kho trong ngày đã hoàn tất nghiệm thu hoặc chưa phát sinh yêu cầu mới.
          </p>
          <button
            onClick={() => navigate('/staff')}
            className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700"
          >
            Về trang ca trực
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái (4/12): Danh sách chọn hợp đồng & Thẻ thông tin khách */}
          <div className="lg:col-span-4 space-y-4">
            {/* Bộ chọn nhanh nếu có nhiều hợp đồng trả kho */}
            {contracts.length > 1 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                <label className="text-xs font-semibold text-slate-600">Chọn hợp đồng trả kho:</label>
                <div className="space-y-1.5">
                  {contracts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContract(c)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition ${
                        selectedContract?.id === c.id
                          ? 'border-teal-500 bg-teal-50/50 font-medium text-teal-900'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between font-semibold">
                        <span>{c.code}</span>
                        <span className="text-teal-700 font-mono">{c.storageUnitCode}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{c.customerName}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

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

          {/* Cột phải (8/12): Form Nghiệm thu trả kho */}
          <div className="lg:col-span-8">
            {selectedContract ? (
              <ReturnInspectionForm
                contract={selectedContract}
                onSubmit={handleSubmitInspection}
                isSubmitting={submitting}
              />
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
        onClose={() => setSuccessData({ ...successData, isOpen: false })}
      />
    </div>
  );
};
