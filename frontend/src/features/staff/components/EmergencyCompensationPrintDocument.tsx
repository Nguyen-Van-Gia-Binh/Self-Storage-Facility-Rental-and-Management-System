import React from 'react';
import { Printer, X } from 'lucide-react';
import type { CheckInContract } from '@/types';

function formatVND(amount?: number | null): string {
  if (amount == null) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return '...';
  const parts = isoDate.split('T')[0].split('-');
  if (parts.length < 3) return isoDate;
  return `ngày ${parts[2]} tháng ${parts[1]} năm ${parts[0]}`;
}

export interface EmergencyCompensationPrintDocumentProps {
  contract: CheckInContract;
  onClose: () => void;
}

export const EmergencyCompensationPrintDocument: React.FC<EmergencyCompensationPrintDocumentProps> = ({
  contract,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const rentFee = contract.totalRentalFee || (contract.monthlyPrice * contract.rentalMonths) || 0;
  const deposit = contract.depositAmount || contract.monthlyPrice || 0;
  const penalty = contract.compensationAmount || deposit;
  const totalPayout = contract.totalPayoutAmount || (rentFee + deposit + penalty);

  return (
    <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Actions Bar (Ẩn khi in ấn) */}
        <div className="no-print px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white">
              Văn bản Pháp lý
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Biên bản Bồi thường Phạt cọc &amp; Thanh lý Hợp đồng (A4)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>In Biên bản (Ctrl+P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nội dung Giấy in A4 Chuẩn Pháp lý */}
        <div className="p-8 sm:p-12 text-slate-900 font-serif leading-relaxed space-y-6 text-sm print:p-8">
          {/* Quốc hiệu & Tiêu ngữ */}
          <div className="text-center space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-widest">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h4>
            <p className="font-semibold text-xs tracking-wider">
              Độc lập – Tự do – Hạnh phúc
            </p>
            <div className="w-32 h-[1px] bg-slate-400 mx-auto mt-1" />
          </div>

          {/* Tiêu đề Biên bản */}
          <div className="text-center space-y-1 pt-2">
            <h2 className="font-bold text-base sm:text-lg uppercase tracking-wide text-slate-900">
              BIÊN BẢN BỒI THƯỜNG VI PHẠM NGHĨA VỤ BÀN GIAO MẶT BẰNG
              <br />
              &amp; THANH LÝ HỢP ĐỒNG THUÊ KHO
            </h2>
            <p className="text-xs italic text-slate-600">
              (Số: BB-BT/{contract.code || '20261119-01'} · Căn cứ Điều 328 Bộ luật Dân sự 2015 &amp; Quy định BR-BMP-02)
            </p>
          </div>

          {/* Thời gian & Địa điểm */}
          <div className="text-xs italic text-slate-600">
            Hôm nay, {formatDate(new Date().toISOString())}, tại Văn phòng Ban Quản lý Cơ sở: <strong>{contract.facilityName || 'Hệ thống SmartStorage'}</strong>.
          </div>

          {/* Các bên tham gia */}
          <div className="space-y-3 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-800">BÊN CHO THUÊ (BÊN A):</p>
              <div className="pl-4 space-y-0.5 mt-1">
                <p>• Đơn vị: Hệ thống Kho Tự Quản Thông Minh SmartStorage — {contract.facilityName}</p>
                <p>• Đại diện: {contract.assignedStaffName || 'Đại diện Ban Quản lý Cơ sở'}</p>
              </div>
            </div>

            <div>
              <p className="font-bold uppercase tracking-wider text-slate-800">BÊN THUÊ (BÊN B):</p>
              <div className="pl-4 space-y-0.5 mt-1">
                <p>• Họ và tên: <strong>{contract.customerName}</strong></p>
                <p>• Số điện thoại: {contract.customerPhone}</p>
                <p>• Số CCCD/Hộ chiếu: {contract.customerIdentityNumber || '....................................................'}</p>
                <p>• Hợp đồng thuê số: <strong>{contract.code}</strong> (Loại ô kho: {contract.unitTypeName || 'Tiêu chuẩn'})</p>
              </div>
            </div>
          </div>

          {/* Nội dung sự việc & Căn cứ pháp lý */}
          <div className="space-y-2 text-xs text-justify">
            <p className="font-bold uppercase tracking-wider text-slate-800">NỘI DUNG SỰ VIỆC VÀ CĂN CỨ BỒI THƯỜNG:</p>
            <p>
              Vào ngày nhận kho theo lịch hẹn, do cơ sở xảy ra sự cố kỹ thuật bất khả kháng dẫn đến tình trạng cháy kho 100% (cơ sở không còn bất kỳ ô kho cùng loại và không có ô kho lớn hơn để nâng hạng đền bù). Do đó, Bên A không thể thực hiện nghĩa vụ bàn giao mặt bằng lưu trữ cho Bên B theo đúng thỏa thuận hợp đồng.
            </p>
            <p>
              Căn cứ <strong>Khoản 2 Điều 328 Bộ luật Dân sự năm 2015</strong>: <em>&quot;Trường hợp bên nhận đặt cọc từ chối việc giao kết, thực hiện hợp đồng thì phải trả cho bên đặt cọc tài sản đặt cọc và một khoản tiền tương đương giá trị tài sản đặt cọc (trừ trường hợp có thỏa thuận khác)&quot;</em> và <strong>Quy định BR-BMP-02</strong> của Hệ thống SmartStorage, hai bên thống nhất thanh lý hợp đồng và Bên A thực hiện bồi thường phạt cọc gấp đôi cho Bên B.
            </p>
          </div>

          {/* Bảng kê quyết toán tài chính */}
          <div className="space-y-2 text-xs">
            <p className="font-bold uppercase tracking-wider text-slate-800">CHI TIẾT KHOẢN TIỀN HOÀN TRẢ VÀ BỒI THƯỜNG:</p>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead className="bg-slate-100 font-bold">
                <tr>
                  <th className="border border-slate-300 px-3 py-2 text-center w-12">STT</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Nội dung chi trả</th>
                  <th className="border border-slate-300 px-3 py-2 text-center w-28">Tỷ lệ</th>
                  <th className="border border-slate-300 px-3 py-2 text-right w-36">Số tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-2 text-center">1</td>
                  <td className="border border-slate-300 px-3 py-2">Hoàn trả tiền thuê kho khách hàng đã đóng trước</td>
                  <td className="border border-slate-300 px-3 py-2 text-center font-semibold">100%</td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-mono font-semibold">{formatVND(rentFee)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2 text-center">2</td>
                  <td className="border border-slate-300 px-3 py-2">Hoàn trả tiền cọc bảo đảm ban đầu</td>
                  <td className="border border-slate-300 px-3 py-2 text-center font-semibold">100%</td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-mono font-semibold">{formatVND(deposit)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2 text-center">3</td>
                  <td className="border border-slate-300 px-3 py-2 font-medium">Khoản tiền phạt cọc Bên A chịu bồi thường (Điều 328 BLDS)</td>
                  <td className="border border-slate-300 px-3 py-2 text-center font-bold text-rose-700">100% cọc</td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold text-rose-700">+ {formatVND(penalty)}</td>
                </tr>
                <tr className="bg-slate-50 font-bold text-sm">
                  <td colSpan={3} className="border border-slate-300 px-3 py-2.5 text-right uppercase">
                    TỔNG SỐ TIỀN BÊN B NHẬN ĐƯỢC:
                  </td>
                  <td className="border border-slate-300 px-3 py-2.5 text-right font-mono text-rose-700">
                    {formatVND(totalPayout)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cam kết giải ngân */}
          <div className="space-y-1 text-xs">
            <p>
              • <strong>Hình thức thanh toán:</strong> Chuyển khoản trực tiếp vào tài khoản ngân hàng của Bên B.
            </p>
            <p>
              • <strong>Thời hạn giải ngân:</strong> Trong vòng <strong>03 ngày làm việc</strong> kể từ ngày ký biên bản này.
            </p>
            <p>
              • Hai bên xác nhận sau khi nhận đủ số tiền nêu trên, Hợp đồng số <strong>{contract.code}</strong> chính thức chấm dứt và không còn bất kỳ khiếu nại hay tranh chấp nào khác.
            </p>
          </div>

          {/* Chữ ký hai bên */}
          <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs">
            <div className="space-y-16">
              <p className="font-bold uppercase tracking-wider">ĐẠI DIỆN BÊN THUÊ (BÊN B)</p>
              <p className="italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            </div>
            <div className="space-y-16">
              <p className="font-bold uppercase tracking-wider">ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</p>
              <p className="italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
