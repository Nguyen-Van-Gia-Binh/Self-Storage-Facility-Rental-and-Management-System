import React, { useState, useEffect } from 'react';
import { X, AlertCircle, ShieldCheck, Receipt } from 'lucide-react';
import type { ContractFinancialSummary } from '@/types/contractManager';
import { getContractFinancialDetail } from '@/api/contract';

interface ContractFinancialModalProps {
  isOpen: boolean;
  contractId: number | null;
  onClose: () => void;
}

export const ContractFinancialModal: React.FC<ContractFinancialModalProps> = ({
  isOpen,
  contractId,
  onClose,
}) => {
  const [data, setData] = useState<ContractFinancialSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contractId) {
      setLoading(true);
      setError(null);
      getContractFinancialDetail(contractId)
        .then((res) => setData(res))
        .catch((err) => {
          console.error(err);
          setError('Không thể tải chi tiết công nợ tài chính của hợp đồng.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, contractId]);

  if (!isOpen || !contractId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Chi tiết tài chính & Công nợ (FM-03)</h3>
              <p className="text-xs text-slate-300">
                Theo dõi tiền cọc, phí quá hạn và các khoản phụ phí phát sinh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
              Đang tải dữ liệu tài chính...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-slate-500">Mã hợp đồng:</span>
                <span className="font-mono font-bold text-slate-800">{data.contractCode}</span>
              </div>

              {/* Grid 4 chỉ số chính */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-700 font-medium block mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Tiền cọc giữ (Deposit)
                  </span>
                  <span className="text-base font-bold text-emerald-900">
                    {data.depositAmount.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5">
                    Số dư: {data.depositBalance.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <span className="text-blue-700 font-medium block mb-1">Tổng tiền thuê</span>
                  <span className="text-base font-bold text-blue-900">
                    {data.totalRentalFee.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[11px] text-blue-600 block mt-0.5">Đã thanh toán trước</span>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="text-amber-700 font-medium block mb-1">Phí quá hạn phát sinh</span>
                  <span className="text-base font-bold text-amber-900">
                    {data.overdueFeeAccrued.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[11px] text-amber-600 block mt-0.5">Phạt 10%/ngày (từ D+4)</span>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                  <span className="text-rose-700 font-medium block mb-1">Tổng công nợ cần thu</span>
                  <span className="text-base font-bold text-rose-700">
                    {data.totalOutstandingDebt.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[11px] text-rose-500 block mt-0.5">Chưa thanh toán</span>
                </div>
              </div>

              {/* Danh sách phụ phí */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Danh mục phụ phí phát sinh ({data.extraCharges.length})
                </h4>
                {data.extraCharges.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Không có phụ phí phát sinh.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {data.extraCharges.map((charge) => (
                      <div
                        key={charge.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-medium text-slate-800">{charge.reason}</p>
                          <span className="text-[10px] text-slate-400">{charge.createdAt}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800">
                            {charge.amount.toLocaleString('vi-VN')} đ
                          </span>
                          <span
                            className={`block text-[10px] font-semibold ${
                              charge.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {charge.status === 'PAID' ? 'ĐÃ TRẢ' : 'CHƯA TRẢ'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
