import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { RentedContract } from '../types';
import type { CustomerRentalDetail } from '@/api/customerRentals';
import type { ContractRenewalHistoryItem } from '@/api/contract';

export interface ContractPrintDocumentProps {
  contract: RentedContract;
  detail?: CustomerRentalDetail | null;
  renewals?: ContractRenewalHistoryItem[];
}

function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export const ContractPrintDocument: React.FC<ContractPrintDocumentProps> = ({
  contract,
  detail,
  renewals = [],
}) => {
  const effectiveContractNumber = detail?.contractCode || contract.contractNumber || 'CTR-2026-0000';
  const effectiveUnitNumber = detail?.unitCode || contract.unitNumber || 'HC-B203';
  const effectiveFacilityName = detail?.facilityName || contract.facilityName || 'SmartStorage Landmark Center';
  const effectiveFacilityAddress =
    detail?.facilityAddress || 'Cơ sở trực thuộc Hệ thống Cho thuê kho tự quản SmartStorage';
  const effectiveFacilityPhone = detail?.facilityPhone || '1900 8888';
  const effectiveCustomerName = detail?.customerName || contract.customerName || 'Chưa cập nhật';
  const effectiveCustomerPhone = detail?.customerPhone || contract.customerPhone || 'Chưa cập nhật';
  const effectiveCustomerIdentity =
    detail?.customerIdentityNumber || contract.customerIdentityNumber || 'Chưa cập nhật';
  const effectiveCustomerEmail = detail?.customerEmail || contract.customerEmail || 'Chưa cập nhật';
  const effectiveUnitTypeName = detail?.unitTypeName || contract.unitTypeName || 'Kho Tiêu Chuẩn';
  const effectiveDimensions = detail?.unitDimensions || contract.unitDimensions || '2.0m x 2.5m x 2.5m';
  const effectiveFloor = detail?.floor ?? contract.floor ?? 1;
  const effectivePosition = detail?.position || contract.position || 'Khu A';
  const effectiveStartDate = contract.startDate || '2026-09-15';
  const effectiveEndDate = contract.endDate || '2027-04-15';
  const effectiveRentalMonths = detail?.rentalMonths || contract.rentalMonths || 1;
  const effectiveMonthlyRent = detail?.monthlyPrice || contract.monthlyRent || 0;
  const effectiveDeposit = detail?.depositAmount ?? contract.depositHeld ?? effectiveMonthlyRent;
  const effectiveTotalRentalFee = detail?.totalRentalFee || contract.totalRentalFee || (effectiveMonthlyRent * effectiveRentalMonths);
  const effectiveTotalContractAmount = detail?.totalContractAmount || contract.totalContractAmount || (effectiveTotalRentalFee + effectiveDeposit);

  // Tính toán thời hạn thuê gốc ban đầu (Original Term)
  // Khi hợp đồng đã gia hạn, rentalMonths bị cộng dồn, nhưng hợp đồng gốc chỉ thể hiện thời hạn ban đầu
  const totalRenewedMonths = renewals.reduce((sum, r) => sum + (r.renewalMonths || 0), 0);
  const originalRentalMonths = (effectiveMonthlyRent > 0 && effectiveTotalRentalFee > 0)
    ? Math.max(1, Math.round(effectiveTotalRentalFee / effectiveMonthlyRent))
    : Math.max(1, effectiveRentalMonths - totalRenewedMonths);
  const originalEndDate = renewals.length > 0 && renewals[0].previousEndDate
    ? renewals[0].previousEndDate
    : effectiveEndDate;
  const isPendingCheckin =
    contract.status === 'PENDING_CHECKIN' ||
    (contract.status as string) === 'PENDING_CHECK_IN';

  const isCancelledAtHandover = contract.status === 'TERMINATED';
  const isClosed = contract.status === 'CLOSED';

  const isRelocating =
    !isCancelledAtHandover &&
    !isClosed &&
    (contract.status === 'PENDING_CHECKIN' ||
      (contract.status as string) === 'PENDING_CHECK_IN' ||
      contract.status === 'ACTIVE') &&
    Boolean(contract.relocationEligible || detail?.relocationEligible);

  const isHandoverCompleted =
    !isPendingCheckin &&
    !isCancelledAtHandover;

  const effectiveCheckinDate = isHandoverCompleted
    ? (detail?.checkinDate || contract.checkinDate || effectiveStartDate)
    : isCancelledAtHandover
      ? 'Không nhận kho (Đã hủy hợp đồng do sự cố)'
      : 'Chưa thực hiện (Chờ làm thủ tục nhận kho tại quầy)';
  const effectiveHandoverStaff = isHandoverCompleted || isCancelledAtHandover
    ? (detail?.handoverStaffName || contract.handoverStaffName || 'Nhân viên lễ tân cơ sở')
    : 'Chờ phân công tiếp đón tại quầy';
  const effectiveHandoverNote = isClosed
    ? 'Đã hoàn tất nghiệm thu và quyết toán hợp đồng'
    : isHandoverCompleted
      ? (detail?.handoverConditionNote ||
        contract.handoverConditionNote ||
        'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao')
      : isCancelledAtHandover
        ? (detail?.handoverConditionNote || contract.handoverConditionNote || 'Không đạt chuẩn nhận kho do phát sinh sự cố hư hỏng tại chỗ')
        : isRelocating
          ? 'Ô kho phát sinh sự cố lúc tiếp đón. Cơ sở đang phân bổ lại ô kho mới cùng loại cho quý khách.'
          : 'Đang chờ khách hàng xuất trình CCCD và mã e-Pass tại quầy lễ tân để tiến hành nghiệm thu thực địa.';

  const relocationCode = (isCancelledAtHandover || isClosed)
    ? undefined
    : (detail?.relocationSupportRequestCode || contract.relocationSupportRequestCode);
  const relocationReason = detail?.relocationReason || contract.relocationReason;

  // Lấy ngày lập hợp đồng
  const baseContractDate = detail?.checkinDate || contract.checkinDate || effectiveStartDate;
  const dateParts = baseContractDate.split('-');
  const printYear = dateParts[0] || '2026';
  const printMonth = dateParts[1] || '09';
  const printDay = dateParts[2] || '15';

  // Quyết toán tài chính & Tất toán thanh lý hợp đồng (PL-SETTLEMENT)
  const hasSettlement = isClosed || Boolean(detail?.settledAt) || Boolean(detail?.settlementType);
  const settlementType = detail?.settlementType || (
    (contract.status as string) === 'CANCELLED'
      ? 'CANCELLED_CHECKIN'
      : contract.status === 'TERMINATED'
      ? detail?.checkinDate == null ? 'REJECTED_CHECKIN' : 'OVERDUE_TERMINATED'
      : 'NORMAL'
  );
  const settledByName = detail?.settledByName || 'Quản lý cơ sở';
  const settledAtDate = detail?.settledAt ? new Date(detail.settledAt) : new Date();
  const settleYear = String(settledAtDate.getFullYear());
  const settleMonth = String(settledAtDate.getMonth() + 1).padStart(2, '0');
  const settleDay = String(settledAtDate.getDate()).padStart(2, '0');
  const settlementRefund = detail?.settlementRefundAmount ?? (
    isClosed ? (contract.depositHeld ?? effectiveDeposit) : 0
  );
  const settlementPayable = detail?.settlementPayableAmount ?? 0;
  const settlementDamage = detail?.settlementDamageCost ?? 0;
  const settlementOverdue = detail?.settlementOverdueFee ?? (detail?.overdueFeeAccrued ?? 0);
  const settlementDepositForfeited = detail?.settlementDepositForfeited ?? (
    settlementType === 'EARLY_RETURN' || settlementType === 'OVERDUE_TERMINATED' ? effectiveDeposit : 0
  );
  const settlementEarlyRentRefund = detail?.settlementEarlyRentRefund ?? 0;
  const settlementSealingFee = detail?.settlementSealingFee ?? (
    settlementType === 'OVERDUE_TERMINATED' ? Math.max(0, effectiveDeposit - settlementOverdue) : 0
  );
  const settlementNote = detail?.settlementNote || 'Đã đối soát đầy đủ hiện trạng vật chất và nghĩa vụ tài chính.';

  const qrPayload = JSON.stringify({
    contract: effectiveContractNumber,
    unit: effectiveUnitNumber,
    customer: effectiveCustomerName,
    facility: effectiveFacilityName,
    checkin: effectiveCheckinDate,
    status: contract.status,
  });

  return (
    <article
      data-testid="contract-print-document"
      className="contract-print-document text-[12.5px] leading-relaxed text-slate-900 bg-white p-6 max-w-[210mm] mx-auto print:p-0 print:m-0 relative overflow-hidden"
      style={{ fontFamily: "'Times New Roman', Times, 'Arial', 'Be Vietnam Pro', serif" }}
    >
      {/* 1. Quốc hiệu & Tiêu ngữ chuẩn văn bản pháp lý Việt Nam đặt trên cùng chính giữa */}
      <div className="text-center mb-3">
        <div className="font-bold text-[13px] uppercase tracking-wide text-slate-950">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </div>
        <div className="font-bold text-[12px] text-slate-950 mt-0.5">
          Độc lập - Tự do - Hạnh phúc
        </div>
        <div className="w-36 mx-auto border-b border-slate-800 my-1.5" />
        <div className="text-[11px] italic text-slate-600">
          {effectiveFacilityAddress.includes('Hà Nội') ? 'Hà Nội' : 'TP. Hồ Chí Minh'}, ngày {printDay} tháng {printMonth} năm {printYear}
        </div>
      </div>

      {/* Thông tin đơn vị SmartStorage */}
      <div className="flex justify-between items-center text-[11px] text-slate-700 mb-3">
        <div>
          <span className="font-bold uppercase tracking-wider text-slate-900 text-[12px]">SMARTSTORAGE VIỆT NAM</span>
          <span className="mx-1.5 text-slate-400">·</span>
          <span className="italic">{effectiveFacilityName}</span>
        </div>
        <div className="text-[10.5px] text-slate-500">
          Hotline: <strong className="text-slate-700">{effectiveFacilityPhone}</strong> · www.smartstorage.vn
        </div>
      </div>

      {/* 2. Tiêu đề hợp đồng */}
      <div className="text-center my-4">
        <h1 className="text-[16px] font-bold uppercase tracking-wide leading-tight">
          HỢP ĐỒNG THUÊ Ô KHO TỰ QUẢN THÔNG MINH
          <br />
          VÀ BIÊN BẢN BÀN GIAO HIỆN TRƯỜNG ĐIỆN TỬ
        </h1>
        <div className="text-[12px] font-bold mt-1 tracking-wider text-slate-800">
          Số hiệu: <span className="font-mono text-[13px]">{effectiveContractNumber}</span>
        </div>
        <p className="text-[10.5px] italic text-slate-600 mt-0.5">
          (Xác lập dưới hình thức điện tử tuân thủ Luật Giao dịch Điện tử 2023 & Bộ luật Dân sự 2015)
        </p>
      </div>

      {/* 3. Căn cứ pháp lý tinh gọn */}
      <div className="text-[11px] italic text-slate-700 space-y-0.5 mb-3">
        <p>• Căn cứ Bộ luật Dân sự số 91/2015/QH13 được Quốc hội ban hành ngày 24/11/2015;</p>
        <p>• Căn cứ Luật Giao dịch Điện tử số 20/2023/QH15 có hiệu lực thi hành;</p>
        <p>• Căn cứ nhu cầu và sự thỏa thuận hoàn toàn tự nguyện giữa các bên tham gia.</p>
      </div>

      <p className="text-[11.5px] mb-2 font-medium">Hôm nay, các bên tham gia hợp đồng thống nhất ký kết các điều khoản sau:</p>

      {/* ĐIỀU 1: CÁC BÊN THAM GIA HỢP ĐỒNG */}
      <section className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase mb-2">
          ĐIỀU 1: CÁC BÊN THAM GIA HỢP ĐỒNG
        </h2>

        <div className="grid grid-cols-2 gap-6 text-[11.5px] leading-relaxed">
          {/* Bên A */}
          <div>
            <div className="font-bold uppercase text-slate-950 mb-1">
              BÊN CHO THUÊ (BÊN A):
            </div>
            <p>• <strong>Cơ sở quản lý:</strong> {effectiveFacilityName}</p>
            <p>• <strong>Địa chỉ cơ sở:</strong> {effectiveFacilityAddress}</p>
            <p>• <strong>Hotline cơ sở:</strong> {effectiveFacilityPhone}</p>
            <p>• <strong>Đại diện tiếp nhận:</strong> {effectiveHandoverStaff}</p>
          </div>

          {/* Bên B */}
          <div>
            <div className="font-bold uppercase text-slate-950 mb-1">
              BÊN THUÊ KHO (BÊN B):
            </div>
            <p>• <strong>Họ và tên khách hàng:</strong> {effectiveCustomerName}</p>
            <p>• <strong>Số CMND / CCCD:</strong> <span className="font-mono font-bold">{effectiveCustomerIdentity}</span></p>
            <p>• <strong>Số điện thoại:</strong> {effectiveCustomerPhone}</p>
            <p>• <strong>Thư điện tử:</strong> {effectiveCustomerEmail}</p>
          </div>
        </div>
      </section>

      {/* ĐIỀU 2: ĐỐI TƯỢNG VÀ THỜI HẠN THUÊ KHO */}
      <section className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase mb-2">
          ĐIỀU 2: ĐỐI TƯỢNG VÀ THỜI HẠN THUÊ KHO
        </h2>

        <table className="w-full border-collapse border border-slate-600 text-[11px] mb-2">
          <tbody>
            <tr className="font-bold border-b border-slate-600">
              <td className="border border-slate-600 px-2 py-1 w-1/4">Mã ô kho</td>
              <td className="border border-slate-600 px-2 py-1 w-1/4">Loại ô kho</td>
              <td className="border border-slate-600 px-2 py-1 w-1/4">Kích thước (D x R x C)</td>
              <td className="border border-slate-600 px-2 py-1 w-1/4">Vị trí vật lý</td>
            </tr>
            <tr>
              <td className="border border-slate-600 px-2 py-1.5 font-bold font-mono text-[12px]">
                {effectiveUnitNumber}
              </td>
              <td className="border border-slate-600 px-2 py-1.5">{effectiveUnitTypeName}</td>
              <td className="border border-slate-600 px-2 py-1.5">{effectiveDimensions}</td>
              <td className="border border-slate-600 px-2 py-1.5">Tầng {effectiveFloor} ({effectivePosition})</td>
            </tr>
          </tbody>
        </table>

        <div className="text-[11.5px] my-2 leading-relaxed">
          <p>
            • <strong>Thời hạn thuê ban đầu:</strong> {originalRentalMonths} tháng (Bắt đầu từ ngày <strong>{effectiveStartDate}</strong> đến ngày <strong>{originalEndDate}</strong>).
            {renewals.length > 0 && (
              <span className="italic text-slate-700 block mt-0.5">
                * Lưu ý: Hợp đồng đã xác lập Phụ lục gia hạn thêm {totalRenewedMonths} tháng, thời hạn hiệu lực mới đến ngày <strong>{effectiveEndDate}</strong> (Chi tiết tại Phụ lục đính kèm).
              </span>
            )}
          </p>
        </div>

        {relocationCode && (
          <div className="mt-1.5 text-[11px] text-slate-800 italic">
            <strong>* Phụ lục điều chuyển kỹ thuật ({relocationCode}):</strong> Ô kho được điều chuyển từ ô ban đầu sang <strong>{effectiveUnitNumber}</strong> ({relocationReason}). Toàn bộ đơn giá thuê và tiền cọc bảo đảm được giữ nguyên vẹn.
          </div>
        )}
      </section>

      {/* ĐIỀU 3: GIÁ THUÊ, TIỀN CỌC BẢO ĐẢM VÀ QUY CHẾ THANH TOÁN */}
      <section className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase mb-2">
          ĐIỀU 3: GIÁ THUÊ, TIỀN CỌC BẢO ĐẢM VÀ QUY CHẾ THANH TOÁN
        </h2>

        <div className="space-y-1.5 text-[11.5px]">
          <p>
            <strong>1. Đơn giá thuê:</strong>{' '}
            <span className="font-bold">{formatCurrencyVND(effectiveMonthlyRent)} / tháng</span> (Đã bao gồm chi phí bảo quản tiêu chuẩn, giám sát an ninh 24/7 và điện chiếu sáng công cộng).
          </p>
          <p>
            <strong>2. Tổng tiền thuê trọn kỳ ban đầu ({originalRentalMonths} tháng):</strong>{' '}
            <span className="font-bold">{formatCurrencyVND(effectiveTotalRentalFee)}</span> (Đơn giá x Thời hạn thuê gốc).
          </p>
          <p>
            <strong>3. Tiền cọc bảo đảm:</strong>{' '}
            <span className="font-bold">{formatCurrencyVND(effectiveDeposit)}</span>. Khoản tiền cọc được bảo lưu tại tài khoản ngân hàng của Bên A để bảo đảm thực hiện nghĩa vụ hợp đồng và sẽ được hoàn trả 100% cho Bên B sau khi nghiệm thu trả kho đúng quy định.
          </p>
          <div className="p-2 bg-slate-100 border border-slate-300 rounded font-bold text-slate-900 flex justify-between items-center text-[12px] my-1">
            <span>TỔNG GIÁ TRỊ HỢP ĐỒNG BAN ĐẦU:</span>
            <span className="text-[13px] text-brand-900 font-extrabold">{formatCurrencyVND(effectiveTotalContractAmount)}</span>
          </div>
          {renewals.length > 0 && (
            <p className="text-[10.5px] text-slate-600 italic">
              * Giá trị trên chưa bao gồm các khoản tiền thuê nộp theo các Phụ lục gia hạn thời hạn hợp đồng đính kèm.
            </p>
          )}
          <p>
            <strong>4. Xử lý chậm nộp & quá hạn:</strong>
          </p>
          <ul className="list-disc pl-5 text-[11px] text-slate-700 space-y-0.5">
            <li><strong>Ân hạn D+1 đến D+3:</strong> Miễn phí phạt quá hạn; Bên B vẫn duy trì đầy đủ quyền ra vào ô kho.</li>
            <li><strong>Từ D+4 đến D+6:</strong> Áp dụng phí phạt quá hạn 10%/ngày trên số dư nợ phí thuê.</li>
            <li><strong>Từ D+7 đến D+9:</strong> Tạm khóa mã PIN mở kho; tổng phí phạt không vượt trần 70% tiền cọc.</li>
            <li><strong>Từ D+10:</strong> Hệ thống tiến hành quy trình chấm dứt hợp đồng và xử lý tài sản theo hợp đồng dịch vụ.</li>
          </ul>
        </div>
      </section>

      {/* ĐIỀU 4: BIÊN BẢN BÀN GIAO & NGHIỆM THU HIỆN TRƯỜNG */}
      <section className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase mb-2 flex justify-between items-center">
          <span>ĐIỀU 4: BIÊN BẢN BÀN GIAO & NGHIỆM THU HIỆN TRƯỜNG</span>
          {isPendingCheckin && (
            <span className="text-[10px] font-normal italic text-slate-600 lowercase tracking-normal">
              (chờ thực hiện tại quầy khi nhận kho)
            </span>
          )}
        </h2>

        <div className="text-[11.5px] mb-2 leading-relaxed">
          <p>• Thời điểm hoàn tất bàn giao: <strong>{effectiveCheckinDate}</strong> &nbsp;|&nbsp; Nhân viên đón tiếp & lập biên bản: <strong>{effectiveHandoverStaff}</strong></p>
        </div>

        <div className="text-[11.5px] space-y-1 mb-2">
          <p className="font-semibold text-slate-900 mb-1">
            Kết quả kiểm tra 4 tiêu chí nghiệm thu vật lý bàn giao tại chỗ:
          </p>
          {isHandoverCompleted ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-900">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-950">[✓]</span>
                <span>Mặt bằng kho sạch sẽ, thông thoáng, không vật cản</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-950">[✓]</span>
                <span>Cửa cuốn & cơ cấu khóa vận hành an toàn, trơn tru</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-950">[✓]</span>
                <span>Sàn tường khô ráo, phòng chống ẩm mốc & PCCC đạt chuẩn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-950">[✓]</span>
                <span>Khóa điện tử thông minh đã sẵn sàng, cấp mã PIN mở cửa 24/7</span>
              </div>
            </div>
          ) : (contract.status === 'TERMINATED' || isCancelledAtHandover) ? (
            (contract.handoverRejected || contract.contractNumber?.includes('REJ') || contract.contractNumber?.includes('REFUND') || isCancelledAtHandover) ? (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-rose-950 text-[11px] leading-relaxed">
                <span className="font-bold text-rose-900">Biên bản từ chối nhận bàn giao tại hiện trường (BR-CHK-02) &amp; Hoàn 100%: </span>
                <span>Tại buổi bàn giao, khách hàng và đại diện cơ sở kiểm tra hiện trường phát hiện khiếm khuyết vật lý không đạt chuẩn ({contract.rejectionReason || 'Ô kho bị ẩm ướt / dột nước từ trần kho'}). Khách hàng từ chối nhận bàn giao và yêu cầu thanh lý. Hệ thống đã dừng thực hiện hợp đồng và hoàn trả 100% chi phí (tiền thuê + cọc) cho khách hàng.</span>
              </div>
            ) : (!contract.unitNumber || contract.unitNumber === 'Chưa gán ô kho' || contract.contractNumber?.includes('NO-UNIT')) ? (
              <div className="p-2.5 bg-orange-50 border border-orange-300 rounded text-orange-950 text-[11px] leading-relaxed">
                <span className="font-bold text-orange-900">Biên bản hủy đặt chỗ (Chưa phân bổ ô vật lý): </span>
                <span>Khách hàng đã thông báo hủy đơn trước khi cơ sở phân bổ ô kho thực tế. Hợp đồng đặt trước được hủy bỏ và tiền cọc được hoàn trả 100%.</span>
              </div>
            ) : (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-900 text-[11px] leading-relaxed">
                <span className="font-bold">Biên bản hủy giữ chỗ &amp; Giải phóng ô kho: </span>
                <span>Khách hàng hủy đơn trước ngày nhận kho. Ô kho vật lý ({effectiveUnitNumber}) đã được giải phóng về trạng thái Trống để phục vụ khách hàng khác. Tiền cọc được hoàn trả theo quy định.</span>
              </div>
            )
          ) : (contract.relocationEligible || detail?.relocationEligible || isRelocating) ? (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] leading-relaxed">
              <span className="font-bold">Đang điều phối đổi ô kho tại chỗ: </span>
              <span>Phát hiện sự cố kỹ thuật tại ô kho ban đầu. Đang tiến hành đổi sang ô kho đạt chuẩn khác cùng loại cho quý khách.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400">[  ]</span>
                <span>Mặt bằng kho sạch sẽ, thông thoáng (Chờ kiểm tra hiện trường)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400">[  ]</span>
                <span>Cửa cuốn & cơ cấu khóa (Chờ kiểm tra hiện trường)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400">[  ]</span>
                <span>Sàn tường & PCCC đạt chuẩn (Chờ kiểm tra hiện trường)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400">[  ]</span>
                <span>Khóa điện tử & mã PIN (Chờ kích hoạt tại quầy)</span>
              </div>
            </div>
          )}
          <p className="mt-1.5 text-slate-700 italic">
            Ghi chú hiện trường: <strong>{effectiveHandoverNote}</strong>
          </p>
        </div>
      </section>

      {/* ĐIỀU 5: NỘI QUY AN TOÀN, AN NINH & QUYỀN TRUY CẬP */}
      <section className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase mb-2">
          ĐIỀU 5: NỘI QUY AN TOÀN, AN NINH & QUYỀN TRUY CẬP
        </h2>
        <ul className="list-disc pl-5 text-[11px] text-slate-700 space-y-0.5">
          <li>Bên B được cấp quyền ra vào cơ sở và mở khóa ô kho 24/7 thông qua mã số bảo mật PIN / mã QR điện tử.</li>
          <li>Tuyệt đối nghiêm cấm lưu trữ các chất độc hại, chất cháy nổ, vũ khí, hàng lậu hoặc các chất bị pháp luật cấm.</li>
          <li>Bên B có trách nhiệm tự bảo mật mã mở khóa và khóa cửa ô kho cẩn thận sau mỗi lần truy cập.</li>
        </ul>
      </section>

      {/* ĐIỀU 6: HIỆU LỰC HỢP ĐỒNG & CHỮ KÝ XÁC NHẬN ĐIỆN TỬ */}
      <section className="mb-4 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase mb-2">
          ĐIỀU 6: HIỆU LỰC HỢP ĐỒNG & CHỮ KÝ XÁC NHẬN ĐIỆN TỬ
        </h2>
        <p className="text-[11px] mb-3 text-slate-700">
          Hợp đồng này được lập dưới dạng dữ liệu điện tử có giá trị pháp lý tương đương văn bản giấy. Hai bên đã đọc, hiểu rõ và đồng ý toàn bộ quyền và nghĩa vụ quy định trong hợp đồng.
        </p>

        {/* Khối chữ ký số */}
        <div className="grid grid-cols-2 gap-6 text-center mt-4">
          {/* Bên A */}
          <div>
            <div className="font-bold uppercase text-[12px] text-slate-950">
              ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
            </div>
            <div className="text-[10.5px] text-slate-500 italic mb-1">Ban Quản lý cơ sở</div>
            {isHandoverCompleted ? (
              <>
                <div className="my-2 py-1 px-3 inline-block border border-emerald-700 bg-emerald-50/50 text-[11px] font-bold text-emerald-800 tracking-wider">
                  ✓ ĐÃ KÝ SỐ ĐIỆN TỬ
                </div>
                <div className="text-[10px] text-slate-500">Thời gian ký: {effectiveCheckinDate}</div>
                <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveHandoverStaff}</div>
              </>
            ) : isCancelledAtHandover ? (
              <>
                <div className="my-2 py-1.5 px-3 inline-block border-2 border-dashed border-rose-400 bg-rose-50 rounded text-[11px] font-bold text-rose-700 tracking-wider">
                  HỦY NHẬN DO SỰ CỐ
                </div>
                <div className="text-[10px] text-slate-500 italic">Dừng hợp đồng tại quầy</div>
                <div className="font-semibold text-[11.5px] text-slate-700 mt-1">{effectiveHandoverStaff}</div>
              </>
            ) : isRelocating ? (
              <>
                <div className="my-2 py-1.5 px-3 inline-block border-2 border-dashed border-amber-400 bg-amber-50 rounded text-[11px] font-bold text-amber-800 tracking-wider">
                  ĐANG ĐỢI ĐỔI Ô MỚI
                </div>
                <div className="text-[10px] text-slate-500 italic">Điều chuyển ô kho mới</div>
                <div className="font-semibold text-[11.5px] text-slate-700 mt-1">{effectiveHandoverStaff}</div>
              </>
            ) : (
              <div className="my-2">
                <div className="py-1 px-3 inline-block border border-dashed border-slate-400 text-[11px] font-semibold text-slate-600 tracking-wider">
                  CHỜ KÝ BÀN GIAO TẠI QUẦY
                </div>
                <div className="text-[10px] text-slate-400 italic mt-0.5">Ký số khi tiếp đón thực tế</div>
                <div className="font-semibold text-[11.5px] text-slate-500 mt-2">Đại diện tiếp đón cơ sở</div>
              </div>
            )}
          </div>

          {/* Bên B */}
          <div>
            <div className="font-bold uppercase text-[12px] text-slate-950">
              ĐẠI DIỆN BÊN THUÊ KHO (BÊN B)
            </div>
            <div className="text-[10.5px] text-slate-500 italic mb-1">Khách hàng xác nhận</div>
            {isHandoverCompleted ? (
              <>
                <div className="my-2 py-1 px-3 inline-block border border-emerald-700 bg-emerald-50/50 text-[11px] font-bold text-emerald-800 tracking-wider">
                  ✓ ĐÃ XÁC NHẬN BÀN GIAO
                </div>
                <div className="text-[10px] text-slate-500">Thời gian ký: {effectiveCheckinDate}</div>
                <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveCustomerName}</div>
              </>
            ) : (contract.status === 'TERMINATED' || isCancelledAtHandover) ? (
              (contract.handoverRejected || contract.contractNumber?.includes('REJ') || contract.contractNumber?.includes('REFUND') || isCancelledAtHandover) ? (
                <>
                  <div className="my-2 py-1.5 px-3 inline-block border-2 border-dashed border-rose-400 bg-rose-50 rounded text-[11px] font-bold text-rose-700 tracking-wider">
                    TỪ CHỐI NHẬN KHO (HOÀN 100%)
                  </div>
                  <div className="text-[10px] text-slate-500 italic">Xác nhận sự cố hiện trường</div>
                  <div className="font-semibold text-[11.5px] text-slate-700 mt-1">{effectiveCustomerName}</div>
                </>
              ) : (!contract.unitNumber || contract.unitNumber === 'Chưa gán ô kho' || contract.contractNumber?.includes('NO-UNIT')) ? (
                <>
                  <div className="my-2 py-1.5 px-3 inline-block border-2 border-dashed border-orange-400 bg-orange-50 rounded text-[11px] font-bold text-orange-800 tracking-wider">
                    HỦY ĐẶT CHỖ (HOÀN CỌC 100%)
                  </div>
                  <div className="text-[10px] text-slate-500 italic">Hủy trước khi phân bổ</div>
                  <div className="font-semibold text-[11.5px] text-slate-700 mt-1">{effectiveCustomerName}</div>
                </>
              ) : (
                <>
                  <div className="my-2 py-1.5 px-3 inline-block border-2 border-dashed border-rose-400 bg-rose-50 rounded text-[11px] font-bold text-rose-700 tracking-wider">
                    HỦY GIỮ CHỖ (GIẢI PHÓNG Ô)
                  </div>
                  <div className="text-[10px] text-slate-500 italic">Giải phóng mặt bằng ô kho</div>
                  <div className="font-semibold text-[11.5px] text-slate-700 mt-1">{effectiveCustomerName}</div>
                </>
              )
            ) : (contract.relocationEligible || detail?.relocationEligible || isRelocating) ? (
              <>
                <div className="my-2 py-1.5 px-3 inline-block border-2 border-dashed border-amber-400 bg-amber-50 rounded text-[11px] font-bold text-amber-800 tracking-wider">
                  CHỜ BÀN GIAO Ô MỚI
                </div>
                <div className="text-[10px] text-slate-500 italic">Chờ nhận ô kho thay thế</div>
                <div className="font-semibold text-[11.5px] text-slate-700 mt-1">{effectiveCustomerName}</div>
              </>
            ) : (
              <div className="my-2">
                <div className="py-1 px-3 inline-block border border-dashed border-slate-400 text-[11px] font-semibold text-slate-600 tracking-wider">
                  CHỜ XÁC NHẬN KHI NHẬN KHO
                </div>
                <div className="text-[10px] text-slate-400 italic mt-0.5">Xác nhận tại quầy sau khi nghiệm thu</div>
                <div className="font-semibold text-[11.5px] text-slate-500 mt-2">{effectiveCustomerName}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Footer xác thực hệ thống & QR Code */}
      <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 break-inside-avoid">
        <div>
          <p>Hệ thống Quản lý & Cho thuê kho tự quản thông minh (SmartStorage System).</p>
          <p>Mã kiểm tra tính toàn vẹn văn bản: <strong className="font-mono">{effectiveContractNumber}</strong></p>
          <p>Văn bản có giá trị pháp lý lưu trữ vĩnh viễn theo Luật Giao dịch Điện tử.</p>
        </div>

        <div className="flex items-center gap-2" data-testid="contract-qr-code">
          <QRCodeSVG
            value={qrPayload}
            size={52}
            level="M"
            className="border border-slate-200 p-0.5 bg-white"
          />
          <div className="text-[9.5px] text-slate-400 max-w-[120px] leading-tight text-right">
            Quét QR để đối chiếu tính xác thực hợp đồng điện tử
          </div>
        </div>
      </div>

      {/* 5. CÁC PHỤ LỤC HỢP ĐỒNG IN ẤN RỜI (TỰ ĐỘNG NGẮT TRANG RIÊNG BIỆT THEO ĐIỀU 403 BLDS) */}
      {renewals && renewals.length > 0 && renewals.map((renewal, idx) => {
        const addendumCode = `PL-${String(idx + 1).padStart(2, '0')}`;
        const renewalDateParts = (renewal.createdAt ? renewal.createdAt.slice(0, 10) : (renewal.previousEndDate || effectiveStartDate)).split('-');
        const rYear = renewalDateParts[0] || printYear;
        const rMonth = renewalDateParts[1] || printMonth;
        const rDay = renewalDateParts[2] || printDay;
        const isPriceChanged = renewal.monthlyPriceSnapshot && renewal.monthlyPriceSnapshot !== effectiveMonthlyRent;
        const priceDiff = (renewal.monthlyPriceSnapshot || effectiveMonthlyRent) - effectiveMonthlyRent;

        const addendumQrPayload = JSON.stringify({
          type: 'CONTRACT_ADDENDUM',
          addendumCode,
          contract: effectiveContractNumber,
          customer: effectiveCustomerName,
          previousEnd: renewal.previousEndDate,
          newEnd: renewal.newEndDate,
          monthlyPrice: renewal.monthlyPriceSnapshot || effectiveMonthlyRent,
          paid: renewal.totalPaid || renewal.rentalFeeAmount,
        });

        return (
          <section
            key={renewal.id || idx}
            data-testid={`contract-addendum-${idx + 1}`}
            className="contract-addendum-page ss-page-break print:break-before-page pt-8 border-t-2 border-dashed border-slate-300 print:border-none text-[12.5px] leading-relaxed text-slate-900"
            style={{ fontFamily: "'Times New Roman', Times, 'Arial', 'Be Vietnam Pro', serif" }}
          >
            {/* Quốc hiệu & Tiêu ngữ */}
            <div className="text-center mb-3">
              <div className="font-bold text-[13px] uppercase tracking-wide text-slate-950">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="font-bold text-[12px] text-slate-950 mt-0.5">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="w-36 mx-auto border-b border-slate-800 my-1.5" />
              <div className="text-[11px] italic text-slate-600">
                {effectiveFacilityAddress.includes('Hà Nội') ? 'Hà Nội' : 'TP. Hồ Chí Minh'}, ngày {rDay} tháng {rMonth} năm {rYear}
              </div>
            </div>

            {/* Thông tin đơn vị SmartStorage */}
            <div className="flex justify-between items-center text-[11px] text-slate-700 mb-3">
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-900 text-[12px]">SMARTSTORAGE VIỆT NAM</span>
                <span className="mx-1.5 text-slate-400">·</span>
                <span className="italic">{effectiveFacilityName}</span>
              </div>
              <div className="text-[10.5px] text-slate-500">
                Hotline: <strong className="text-slate-700">{effectiveFacilityPhone}</strong> · www.smartstorage.vn
              </div>
            </div>

            {/* Tiêu đề Phụ lục */}
            <div className="text-center my-4">
              <h2 className="text-[15px] font-bold uppercase tracking-wide leading-tight">
                PHỤ LỤC HỢP ĐỒNG SỐ {String(idx + 1).padStart(2, '0')}
                <br />
                V/V GIA HẠN THỜI HẠN THUÊ Ô KHO &amp; ĐIỀU CHỈNH ĐƠN GIÁ (NẾU CÓ)
              </h2>
              <div className="text-[12px] font-bold mt-1 tracking-wider text-slate-800">
                (Đính kèm Hợp đồng thuê ô kho tự quản số: <span className="font-mono text-[13px]">{effectiveContractNumber}</span>)
              </div>
              <p className="text-[10.5px] italic text-slate-600 mt-0.5">
                (Xác lập theo Điều 403 Bộ luật Dân sự 2015 &amp; Luật Giao dịch Điện tử 2023)
              </p>
            </div>

            {/* Căn cứ pháp lý */}
            <div className="text-[11px] italic text-slate-700 space-y-0.5 mb-3">
              <p>• Căn cứ Bộ luật Dân sự số 91/2015/QH13 có hiệu lực thi hành;</p>
              <p>• Căn cứ Hợp đồng thuê ô kho tự quản số <strong>{effectiveContractNumber}</strong> đã ký kết giữa hai bên;</p>
              <p>• Căn cứ đề nghị gia hạn và thanh toán giao dịch điện tử đã được hai bên đồng thuận ghi nhận vào Hệ thống.</p>
            </div>

            {/* Thông tin 2 bên */}
            <div className="grid grid-cols-2 gap-6 text-[11.5px] mb-3 leading-relaxed">
              <div>
                <div className="font-bold uppercase text-slate-950 mb-0.5">BÊN CHO THUÊ (BÊN A):</div>
                <p>• <strong>Cơ sở:</strong> {effectiveFacilityName}</p>
                <p>• <strong>Đại diện tiếp nhận:</strong> {effectiveHandoverStaff}</p>
              </div>
              <div>
                <div className="font-bold uppercase text-slate-950 mb-0.5">BÊN THUÊ KHO (BÊN B):</div>
                <p>• <strong>Khách hàng:</strong> {effectiveCustomerName}</p>
                <p>• <strong>Số CCCD:</strong> <span className="font-mono font-bold">{effectiveCustomerIdentity}</span></p>
              </div>
            </div>

            <p className="text-[11.5px] mb-2 font-medium">Hai bên thống nhất ký kết Phụ lục hợp đồng với các nội dung sau:</p>

            {/* Nội dung thỏa thuận */}
            <div className="space-y-2 text-[11.5px] mb-4">
              <div>
                <strong>Điều 1: Gia hạn thời hạn thuê ô kho {effectiveUnitNumber}</strong>
                <p className="pl-4 text-[11px] text-slate-800">
                  1.1. Thời hạn thuê trước khi gia hạn: Kết thúc ngày <strong>{renewal.previousEndDate}</strong>.
                </p>
                <p className="pl-4 text-[11px] text-slate-800">
                  1.2. Thời gian gia hạn bổ sung: <strong>{renewal.renewalMonths} tháng</strong>.
                </p>
                <p className="pl-4 text-[11px] text-slate-800">
                  1.3. Thời hạn thuê mới có hiệu lực đến hết ngày: <strong>{renewal.newEndDate}</strong>.
                </p>
              </div>

              <div>
                <strong>Điều 2: Biểu giá thuê kỳ gia hạn &amp; Bảo lưu tiền cọc bảo đảm</strong>
                <p className="pl-4 text-[11px] text-slate-800">
                  2.1. Đơn giá thuê trong kỳ gia hạn: <strong>{formatCurrencyVND(renewal.monthlyPriceSnapshot || effectiveMonthlyRent)} / tháng</strong>.
                  {isPriceChanged ? (
                    <span className="italic block mt-0.5 text-slate-600">
                      * Ghi chú điều chỉnh: {priceDiff > 0 ? `Tăng ${formatCurrencyVND(priceDiff)}/tháng` : `Giảm ${formatCurrencyVND(Math.abs(priceDiff))}/tháng`} theo Biểu giá niêm yết hiện hành của Bên A. Nguyên tắc không áp dụng hồi tố kỳ thuê ban đầu theo quy định tại Điều 403 Bộ luật Dân sự.
                    </span>
                  ) : (
                    <span className="italic block mt-0.5 text-slate-600">
                      * Giữ nguyên mức đơn giá thuê ban đầu theo hợp đồng gốc.
                    </span>
                  )}
                </p>
                <p className="pl-4 text-[11px] text-slate-800">
                  2.2. Tổng số tiền gia hạn đã thanh toán: <strong>{formatCurrencyVND(renewal.totalPaid || renewal.rentalFeeAmount)}</strong> (Phương thức: {renewal.paymentMethod || 'Thanh toán trực tuyến / Cổng VNPay'}).
                </p>
                <p className="pl-4 text-[11px] text-slate-800">
                  2.3. Tiền cọc bảo đảm (Theo quy định BR-DEP-01): <strong>Bảo lưu 100% khoản cọc ban đầu là {formatCurrencyVND(effectiveDeposit)}</strong>. Bên Cho Thuê không thu thêm bất kỳ khoản bổ sung tiền cọc nào đối với kỳ gia hạn này.
                </p>
              </div>

              <div>
                <strong>Điều 3: Điều khoản thi hành &amp; Hiệu lực pháp lý</strong>
                <p className="pl-4 text-[11px] text-slate-800">
                  3.1. Phụ lục này có hiệu lực kể từ ngày <strong>{renewal.previousEndDate}</strong> và là bộ phận cấu thành không thể tách rời của Hợp đồng số <strong>{effectiveContractNumber}</strong>.
                </p>
                <p className="pl-4 text-[11px] text-slate-800">
                  3.2. Mọi điều khoản khác của Hợp đồng số {effectiveContractNumber} không được sửa đổi, bổ sung tại Phụ lục này vẫn giữ nguyên giá trị và hiệu lực pháp lý ràng buộc hai bên.
                </p>
              </div>
            </div>

            {/* Chữ ký số 2 bên của phụ lục */}
            <div className="grid grid-cols-2 gap-6 text-center mt-6 break-inside-avoid">
              <div>
                <div className="font-bold uppercase text-[12px] text-slate-950">
                  ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
                </div>
                <div className="text-[10.5px] text-slate-500 italic mb-1">Ban Quản lý cơ sở</div>
                <div className="my-2 py-1 px-3 inline-block border border-emerald-700 bg-emerald-50/50 text-[11px] font-bold text-emerald-800 tracking-wider">
                  ✓ ĐÃ KÝ SỐ XÁC NHẬN
                </div>
                <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveHandoverStaff}</div>
              </div>

              <div>
                <div className="font-bold uppercase text-[12px] text-slate-950">
                  ĐẠI DIỆN BÊN THUÊ KHO (BÊN B)
                </div>
                <div className="text-[10.5px] text-slate-500 italic mb-1">Khách hàng xác nhận</div>
                <div className="my-2 py-1 px-3 inline-block border border-emerald-700 bg-emerald-50/50 text-[11px] font-bold text-emerald-800 tracking-wider">
                  ✓ ĐÃ XÁC NHẬN ĐIỆN TỬ
                </div>
                <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveCustomerName}</div>
              </div>
            </div>

            {/* Footer QR phụ lục */}
            <div className="pt-3 mt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 break-inside-avoid">
              <div>
                <p>Chứng thực Phụ lục Hợp đồng điện tử SmartStorage System.</p>
                <p>Mã phụ lục: <strong className="font-mono">{addendumCode} / {effectiveContractNumber}</strong></p>
              </div>
              <div className="flex items-center gap-2">
                <QRCodeSVG
                  value={addendumQrPayload}
                  size={44}
                  level="M"
                  className="border border-slate-200 p-0.5 bg-white"
                />
                <div className="text-[9px] text-slate-400 max-w-[110px] leading-tight text-right">
                  Quét QR để xác minh hiệu lực phụ lục
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* 6. PHỤ LỤC ĐIỀU CHUYỂN Ô KHO KỸ THUẬT IN ẤN RỜI (NẾU CÓ) */}
      {relocationCode && (
        <section
          data-testid="contract-addendum-relocation"
          className="contract-addendum-page ss-page-break print:break-before-page pt-8 border-t-2 border-dashed border-slate-300 print:border-none text-[12.5px] leading-relaxed text-slate-900"
          style={{ fontFamily: "'Times New Roman', Times, 'Arial', 'Be Vietnam Pro', serif" }}
        >
          {/* Quốc hiệu & Tiêu ngữ */}
          <div className="text-center mb-3">
            <div className="font-bold text-[13px] uppercase tracking-wide text-slate-950">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="font-bold text-[12px] text-slate-950 mt-0.5">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="w-36 mx-auto border-b border-slate-800 my-1.5" />
            <div className="text-[11px] italic text-slate-600">
              {effectiveFacilityAddress.includes('Hà Nội') ? 'Hà Nội' : 'TP. Hồ Chí Minh'}, ngày {printDay} tháng {printMonth} năm {printYear}
            </div>
          </div>

          <div className="text-center my-4">
            <h2 className="text-[15px] font-bold uppercase tracking-wide leading-tight">
              PHỤ LỤC HỢP ĐỒNG ĐIỀU CHUYỂN Ô KHO KỸ THUẬT
            </h2>
            <div className="text-[12px] font-bold mt-1 tracking-wider text-slate-800">
              Mã phụ lục: <span className="font-mono text-[13px]">{relocationCode}</span> (Đính kèm Hợp đồng số: {effectiveContractNumber})
            </div>
          </div>

          <div className="text-[11px] italic text-slate-700 space-y-0.5 mb-3">
            <p>• Căn cứ Hợp đồng thuê ô kho tự quản số <strong>{effectiveContractNumber}</strong>;</p>
            <p>• Căn cứ sự cố kỹ thuật phát sinh tại hiện trường và biên bản kiểm tra thực địa của Ban Quản lý.</p>
          </div>

          <div className="space-y-2 text-[11.5px] mb-4">
            <div>
              <strong>Điều 1: Điều chuyển sang ô kho mới thay thế</strong>
              <p className="pl-4 text-[11px] text-slate-800">
                1.1. Do phát sinh sự cố tại ô kho ban đầu ({relocationReason || 'Sự cố vật lý tại ô cũ'}), Bên A tiến hành bàn giao cho Bên B ô kho mới thay thế đạt chuẩn: <strong>{effectiveUnitNumber}</strong> (Loại kho: {effectiveUnitTypeName}, Tầng {effectiveFloor}).
              </p>
            </div>
            <div>
              <strong>Điều 2: Cam kết giữ nguyên quyền lợi tài chính</strong>
              <p className="pl-4 text-[11px] text-slate-800">
                2.1. Đơn giá thuê ({formatCurrencyVND(effectiveMonthlyRent)}/tháng) và số tiền cọc bảo đảm ({formatCurrencyVND(effectiveDeposit)}) được giữ nguyên trọn vẹn, Bên B không phải chi trả thêm bất kỳ phụ phí nào.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-center mt-6 break-inside-avoid">
            <div>
              <div className="font-bold uppercase text-[12px] text-slate-950">
                ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
              </div>
              <div className="my-2 py-1 px-3 inline-block border border-emerald-700 bg-emerald-50/50 text-[11px] font-bold text-emerald-800 tracking-wider">
                ✓ ĐÃ DUYỆT ĐIỀU CHUYỂN
              </div>
              <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveHandoverStaff}</div>
            </div>

            <div>
              <div className="font-bold uppercase text-[12px] text-slate-950">
                ĐẠI DIỆN BÊN THUÊ KHO (BÊN B)
              </div>
              <div className="my-2 py-1 px-3 inline-block border border-emerald-700 bg-emerald-50/50 text-[11px] font-bold text-emerald-800 tracking-wider">
                ✓ ĐÃ ĐỒNG THUẬN TIẾP NHẬN
              </div>
              <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveCustomerName}</div>
            </div>
          </div>
        </section>
      )}

      {/* 7. PHỤ LỤC THỎA THUẬN CHẤM DỨT TRƯỚC HẠN & TRẢ KHO SỚM IN ẤN RỜI (NẾU CÓ) */}
      {(contract.status === 'PENDING_RETURN' || Boolean(contract.scheduledReturnDate || detail?.scheduledReturnDate)) && (
        <section
          data-testid="contract-addendum-early-return"
          className="contract-addendum-page ss-page-break print:break-before-page pt-8 border-t-2 border-dashed border-slate-300 print:border-none font-serif text-[12.5px] leading-relaxed text-slate-900"
        >
          {/* Quốc hiệu & Tiêu ngữ */}
          <div className="text-center mb-3">
            <div className="font-bold text-[13px] uppercase tracking-wide text-slate-950">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="font-bold text-[12px] text-slate-950 mt-0.5">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="w-36 mx-auto border-b border-slate-800 my-1.5" />
            <div className="text-[11px] italic text-slate-600">
              {effectiveFacilityAddress.includes('Hà Nội') ? 'Hà Nội' : 'TP. Hồ Chí Minh'}, ngày {printDay} tháng {printMonth} năm {printYear}
            </div>
          </div>

          <div className="text-center my-4">
            <h2 className="text-[15px] font-bold uppercase tracking-wide leading-tight">
              PHỤ LỤC THỎA THUẬN CHẤM DỨT HỢP ĐỒNG TRƯỚC HẠN
              <br />
              VÀ BÀN GIAO TRẢ Ô KHO TỰ QUẢN
            </h2>
            <div className="text-[12px] font-bold mt-1 tracking-wider text-slate-800">
              Mã phụ lục: <span className="font-mono text-[13px]">PL-RETURN / {effectiveContractNumber}</span>
            </div>
            <p className="text-[10.5px] italic text-slate-600 mt-0.5">
              (Xác lập theo Điều 422 Bộ luật Dân sự 2015 &amp; Quy định dịch vụ SmartStorage BR-RET-06)
            </p>
          </div>

          <div className="text-[11px] italic text-slate-700 space-y-0.5 mb-3">
            <p>• Căn cứ Hợp đồng thuê ô kho tự quản số <strong>{effectiveContractNumber}</strong> đã ký kết giữa hai bên;</p>
            <p>• Căn cứ nhu cầu và thông báo đề nghị trả kho của Bên B đã được Hệ thống tiếp nhận điện tử.</p>
          </div>

          <div className="space-y-2 text-[11.5px] mb-4">
            <div>
              <strong>Điều 1: Thỏa thuận chấm dứt thời hạn thuê kho trước hạn</strong>
              <p className="pl-4 text-[11px] text-slate-800">
                1.1. Hai bên thống nhất chấm dứt việc thuê ô kho <strong>{effectiveUnitNumber}</strong> trước thời hạn ban đầu ({effectiveEndDate}).
              </p>
              <p className="pl-4 text-[11px] text-slate-800">
                1.2. Thời điểm Bên B tiến hành bàn giao trả kho thực tế: Ngày <strong>{detail?.scheduledReturnDate || contract.scheduledReturnDate || 'Theo đăng ký điện tử của khách hàng'}</strong>.
              </p>
            </div>
            <div>
              <strong>Điều 2: Nghĩa vụ tài chính &amp; Hoàn cọc bảo đảm</strong>
              <p className="pl-4 text-[11px] text-slate-800">
                2.1. Tiền cọc bảo đảm: Bên A cam kết hoàn trả 100% tiền cọc <strong>{formatCurrencyVND(effectiveDeposit)}</strong> cho Bên B sau khi hoàn tất kiểm tra vật lý hiện trường 4 tiêu chí nghiệm thu.
              </p>
              <p className="pl-4 text-[11px] text-slate-800">
                2.2. Quyết toán tiền thuê chưa sử dụng: Số tiền thuê tương ứng với thời gian chưa sử dụng (nếu có) sẽ được tính toán và chi trả cho Bên B theo đúng quy định tại chính sách hoàn phí BR-RET-06.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-center mt-6 break-inside-avoid">
            <div>
              <div className="font-bold uppercase text-[12px] text-slate-950">
                ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
              </div>
              <div className="my-2 py-1 px-3 inline-block border border-emerald-700 bg-emerald-50/50 text-[11px] font-bold text-emerald-800 tracking-wider">
                ✓ ĐÃ TIẾP NHẬN YÊU CẦU
              </div>
              <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveHandoverStaff}</div>
            </div>

            <div>
              <div className="font-bold uppercase text-[12px] text-slate-950">
                ĐẠI DIỆN BÊN THUÊ KHO (BÊN B)
              </div>
              <div className="my-2 py-1 px-3 inline-block border border-emerald-700 bg-emerald-50/50 text-[11px] font-bold text-emerald-800 tracking-wider">
                ✓ ĐÃ XÁC NHẬN TRẢ KHO
              </div>
              <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveCustomerName}</div>
            </div>
          </div>
        </section>
      )}

      {/* 8. BIÊN BẢN QUYẾT TOÁN TÀI CHÍNH VÀ THANH LÝ HỢP ĐỒNG IN ẤN RỜI (PL-SETTLEMENT) */}
      {hasSettlement && (
        <section
          data-testid="contract-addendum-settlement"
          className="contract-addendum-page ss-page-break print:break-before-page pt-8 border-t-2 border-dashed border-slate-300 print:border-none text-[12.5px] leading-relaxed text-slate-900"
          style={{ fontFamily: "'Times New Roman', Times, 'Arial', 'Be Vietnam Pro', serif" }}
        >
          {/* Quốc hiệu & Tiêu ngữ */}
          <div className="text-center mb-3">
            <div className="font-bold text-[13px] uppercase tracking-wide text-slate-950">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </div>
            <div className="font-bold text-[12px] text-slate-950 mt-0.5">
              Độc lập - Tự do - Hạnh phúc
            </div>
            <div className="w-36 mx-auto border-b border-slate-800 my-1.5" />
            <div className="text-[11px] italic text-slate-600">
              {effectiveFacilityAddress.includes('Hà Nội') ? 'Hà Nội' : 'TP. Hồ Chí Minh'}, ngày {settleDay} tháng {settleMonth} năm {settleYear}
            </div>
          </div>

          <div className="text-center my-4">
            <h2 className="text-[15px] font-bold uppercase tracking-wide leading-tight">
              BIÊN BẢN QUYẾT TOÁN TÀI CHÍNH
              <br />
              VÀ TẤT TOÁN THANH LÝ HỢP ĐỒNG THUÊ KHO
            </h2>
            <div className="text-[12px] font-bold mt-1 tracking-wider text-slate-800">
              Mã phụ lục: <span className="font-mono text-[13px]">PL-SETTLEMENT / {effectiveContractNumber}</span>
            </div>
            <p className="text-[10.5px] italic text-slate-600 mt-0.5">
              (Căn cứ Điều 422 Bộ luật Dân sự 2015 &amp; Quy chế quản lý kho tự quản SmartStorage)
            </p>
          </div>

          <div className="text-[11px] italic text-slate-700 space-y-0.5 mb-3">
            <p>• Căn cứ Hợp đồng thuê ô kho tự quản số <strong>{effectiveContractNumber}</strong> ký giữa Bên A và Bên B;</p>
            <p>• Căn cứ Biên bản nghiệm thu bàn giao hiện trạng thực tế ô kho <strong>{effectiveUnitNumber}</strong>;</p>
            <p>• Căn cứ kết quả đối soát nghĩa vụ tài chính và phê duyệt quyết toán của Quản lý cơ sở.</p>
          </div>

          {/* Thành phần tham gia */}
          <div className="grid grid-cols-2 gap-4 text-[11.5px] mb-3 bg-slate-50/80 p-2.5 rounded border border-slate-200">
            <div>
              <strong className="text-slate-950 block">ĐẠI DIỆN BÊN CHO THUÊ (BÊN A):</strong>
              <div>Ông/Bà: <strong>{settledByName}</strong></div>
              <div>Chức vụ: <strong>Quản lý cơ sở (Facility Manager)</strong></div>
              <div>Đơn vị: {effectiveFacilityName}</div>
            </div>
            <div>
              <strong className="text-slate-950 block">ĐẠI DIỆN BÊN THUÊ KHO (BÊN B):</strong>
              <div>Khách hàng: <strong>{effectiveCustomerName}</strong></div>
              <div>Số CCCD: {effectiveCustomerIdentity}</div>
              <div>Số điện thoại: {effectiveCustomerPhone}</div>
            </div>
          </div>

          <div className="space-y-3 text-[11.5px] mb-4">
            <div>
              <strong>Điều 1: Căn cứ &amp; Loại hình quyết toán hợp đồng</strong>
              <p className="pl-4 text-[11px] text-slate-800 mt-0.5">
                {settlementType === 'NORMAL' && '1.1. Quyết toán thanh lý hợp đồng đúng hạn / tháng cuối (BR-RET-04). Hai bên nghiệm thu hoàn tất hiện trạng ô kho, đối soát hoàn trả tiền cọc bảo đảm.'}
                {settlementType === 'EARLY_RETURN' && '1.1. Quyết toán chấm dứt hợp đồng trước hạn theo thỏa thuận (BR-RET-06). Khách hàng được hoàn trả 100% tiền thuê của thời gian chưa sử dụng, phạt tiền cọc bảo vệ phòng trống theo quy định.'}
                {settlementType === 'OVERDUE_TERMINATED' && '1.1. Quyết toán cưỡng chế chấm dứt hợp đồng do quá hạn D+7 (BR-OVD-07, BR-OVD-11). Toàn bộ tiền cọc được khấu trừ thanh toán nợ quá hạn và chi phí niêm phong vận chuyển về Kho Tổng.'}
                {settlementType === 'REJECTED_CHECKIN' && '1.1. Quyết toán hủy hợp đồng do từ chối nhận kho vì lỗi cơ sở (BR-CHK-06). Khách hàng được hoàn trả 100% tiền thuê đã nộp và 100% tiền cọc bảo đảm.'}
                {settlementType === 'CANCELLED_CHECKIN' && '1.1. Quyết toán hủy đơn nhận kho trước thời điểm bắt đầu (BR-CAN). Khách hàng được hoàn tiền thuê và hoàn/phạt cọc theo quy chế mốc thời gian quy định.'}
              </p>
              <p className="pl-4 text-[10.5px] italic text-slate-600 mt-1">
                Ghi chú đối soát hiện trường: {settlementNote}
              </p>
            </div>

            <div>
              <strong>Điều 2: Bảng chiết tính quyết toán dòng tiền chi tiết</strong>
              <div className="mt-1 pl-4">
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold">
                      <th className="border border-slate-300 px-2 py-1 text-center w-10">STT</th>
                      <th className="border border-slate-300 px-2 py-1 text-left">Hạng mục quyết toán nghĩa vụ tài chính</th>
                      <th className="border border-slate-300 px-2 py-1 text-right w-36">Số tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-2 py-1 text-center font-mono">1</td>
                      <td className="border border-slate-300 px-2 py-1">Tiền đặt cọc bảo đảm ban đầu (Deposit)</td>
                      <td className="border border-slate-300 px-2 py-1 text-right font-mono font-semibold">+{formatCurrencyVND(effectiveDeposit)}</td>
                    </tr>
                    {settlementEarlyRentRefund > 0 && (
                      <tr className="text-emerald-800">
                        <td className="border border-slate-300 px-2 py-1 text-center font-mono">2</td>
                        <td className="border border-slate-300 px-2 py-1">Hoàn trả tiền thuê thời gian chưa sử dụng ({detail?.settlementUnusedDays || 0} ngày)</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-semibold">+{formatCurrencyVND(settlementEarlyRentRefund)}</td>
                      </tr>
                    )}
                    {settlementDepositForfeited > 0 && (
                      <tr className="text-amber-800">
                        <td className="border border-slate-300 px-2 py-1 text-center font-mono">3</td>
                        <td className="border border-slate-300 px-2 py-1">Khấu trừ tiền cọc phạt giữ phòng trống / hủy kho</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-semibold">-{formatCurrencyVND(settlementDepositForfeited)}</td>
                      </tr>
                    )}
                    {settlementDamage > 0 && (
                      <tr className="text-rose-800">
                        <td className="border border-slate-300 px-2 py-1 text-center font-mono">4</td>
                        <td className="border border-slate-300 px-2 py-1">Khấu trừ chi phí bồi thường hư hại ô kho (Biên bản nghiệm thu)</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-semibold">-{formatCurrencyVND(settlementDamage)}</td>
                      </tr>
                    )}
                    {settlementOverdue > 0 && (
                      <tr className="text-rose-800">
                        <td className="border border-slate-300 px-2 py-1 text-center font-mono">5</td>
                        <td className="border border-slate-300 px-2 py-1">Khấu trừ phí phạt lưu kho quá hạn (BR-OVD-02..04)</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-semibold">-{formatCurrencyVND(settlementOverdue)}</td>
                      </tr>
                    )}
                    {settlementSealingFee > 0 && (
                      <tr className="text-purple-800">
                        <td className="border border-slate-300 px-2 py-1 text-center font-mono">6</td>
                        <td className="border border-slate-300 px-2 py-1">Khấu trừ chi phí niêm phong, kiểm kê và vận chuyển Kho Tổng (BR-OVD-07)</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-semibold">-{formatCurrencyVND(settlementSealingFee)}</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50/80 font-bold text-slate-950">
                      <td colSpan={2} className="border border-slate-300 px-2 py-1.5 text-right uppercase">
                        {settlementPayable > 0 ? 'Tổng số tiền Bên B nộp bù cho Bên A:' : 'Tổng số tiền Bên A hoàn trả cho Bên B:'}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-[12px] text-emerald-900">
                        {settlementPayable > 0 ? formatCurrencyVND(settlementPayable) : `+${formatCurrencyVND(settlementRefund)}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <strong>Điều 3: Cam kết thanh lý dứt điểm &amp; Giải phóng trách nhiệm</strong>
              <p className="pl-4 text-[11px] text-slate-800">
                3.1. Hai bên xác nhận mọi nghĩa vụ tài sản, hàng hóa trong ô kho và các khoản phí thuê đã được đối soát chính xác, đầy đủ.
              </p>
              <p className="pl-4 text-[11px] text-slate-800">
                3.2. Căn cứ Điều 422 Bộ luật Dân sự 2015, Hợp đồng số <strong>{effectiveContractNumber}</strong> chính thức chấm dứt và tất toán toàn bộ quyền, nghĩa vụ kể từ ngày ký biên bản này. Hai bên cam kết không còn bất kỳ khiếu nại hay tranh chấp nào liên quan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-center mt-6 break-inside-avoid">
            <div>
              <div className="font-bold uppercase text-[12px] text-slate-950">
                ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
              </div>
              <div className="text-[10.5px] text-slate-500 italic mb-1">Quản lý cơ sở phê duyệt</div>
              <div className="my-2 py-1 px-3 inline-block border border-emerald-700 bg-emerald-50/50 text-[11px] font-bold text-emerald-800 tracking-wider">
                ✓ ĐÃ DUYỆT TẤT TOÁN
              </div>
              <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{settledByName}</div>
            </div>

            <div>
              <div className="font-bold uppercase text-[12px] text-slate-950">
                ĐẠI DIỆN BÊN THUÊ KHO (BÊN B)
              </div>
              <div className="text-[10.5px] text-slate-500 italic mb-1">Khách hàng xác nhận</div>
              <div className="my-2 py-1 px-3 inline-block border border-emerald-700 bg-emerald-50/50 text-[11px] font-bold text-emerald-800 tracking-wider">
                ✓ ĐÃ ĐỒNG THUẬN TẤT TOÁN
              </div>
              <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveCustomerName}</div>
            </div>
          </div>
        </section>
      )}
    </article>
  );
};
