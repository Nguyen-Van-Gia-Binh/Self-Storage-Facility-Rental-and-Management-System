import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Receipt } from 'lucide-react';
import type { ContractFinancialSummary } from '@/types/contractManager';
import { getContractFinancialDetail } from '@/api/contract';

interface ContractFinancialModalProps {
  isOpen: boolean;
  contractId: number | null;
  onClose: () => void;
}

const formatMoney = (amount: number) => `${amount.toLocaleString('vi-VN')} đ`;

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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="financial-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]"
      >
        {/* Header nền trắng, đường kẻ chân mảnh */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-500 shrink-0" />
              <h3 id="financial-modal-title" className="font-bold text-base text-gray-900 tracking-tight">
                Chi tiết tài chính &amp; Công nợ
              </h3>
              {data?.contractCode && (
                <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 font-mono text-xs font-medium text-gray-700">
                  Mã HĐ: {data.contractCode}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Theo dõi tiền cọc, phí quá hạn và các khoản phụ phí phát sinh.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body dạng Sổ cái (Ledger Style) */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="py-10 text-center text-gray-400 text-xs animate-pulse">
              Đang tải dữ liệu tài chính...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Nhóm 1: Thông tin thanh toán */}
              <section className="space-y-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  THÔNG TIN THANH TOÁN
                </h4>
                <div className="divide-y divide-gray-100">
                  <div className="py-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Tổng tiền thuê</p>
                      <p className="text-xs text-gray-500 mt-0.5">Đã thanh toán trước</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums text-right shrink-0 whitespace-nowrap">
                      {formatMoney(data.totalRentalFee)}
                    </span>
                  </div>

                  <div className="py-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Tiền cọc giữ</p>
                      <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                        Số dư: {formatMoney(data.depositBalance)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums text-right shrink-0 whitespace-nowrap">
                      {formatMoney(data.depositAmount)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Nhóm 2: Phát sinh & Công nợ */}
              <section className="pt-4 border-t border-gray-200 space-y-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  PHÁT SINH &amp; CÔNG NỢ
                </h4>
                <div className="py-1 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Phí quá hạn phát sinh</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Áp dụng phạt 5%/ngày (Ngày 1–3) và 10%/ngày (từ ngày 4)
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums text-right shrink-0 whitespace-nowrap ${
                      data.overdueFeeAccrued > 0 ? 'text-rose-600' : 'text-gray-900'
                    }`}
                  >
                    {formatMoney(data.overdueFeeAccrued)}
                  </span>
                </div>
              </section>

              {/* Nhóm 3: Tổng kết (Hero Element) */}
              <section className="pt-4 border-t border-gray-200 flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-900">
                    TỔNG CÔNG NỢ CẦN THU
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {data.totalOutstandingDebt > 0 ? 'Chưa thanh toán' : 'Đã thanh toán đầy đủ'}
                  </p>
                </div>
                <span
                  className={`text-2xl font-bold tabular-nums text-right shrink-0 whitespace-nowrap tracking-tight ${
                    data.totalOutstandingDebt > 0 ? 'text-rose-600' : 'text-gray-900'
                  }`}
                >
                  {formatMoney(data.totalOutstandingDebt)}
                </span>
              </section>

              {/* Danh mục phụ phí phát sinh */}
              <section className="pt-4 border-t border-gray-200 space-y-2.5">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Danh mục phụ phí phát sinh ({data.extraCharges.length})
                </h4>
                {data.extraCharges.length === 0 ? (
                  <div className="py-4 px-3 rounded-lg bg-gray-50/70 border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-400 italic">
                      Không có phụ phí phát sinh nào khác.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                    {data.extraCharges.map((charge) => (
                      <div
                        key={charge.id}
                        className="px-3.5 py-2.5 bg-white flex items-start justify-between gap-4 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800">{charge.reason}</p>
                          <span className="text-[11px] text-gray-400">{charge.createdAt}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                            {formatMoney(charge.amount)}
                          </span>
                          <span
                            className={`block text-[10px] font-semibold mt-0.5 ${
                              charge.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {charge.status === 'PAID' ? 'Đã trả' : 'Chưa trả'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>

        {/* Footer căn phải */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
