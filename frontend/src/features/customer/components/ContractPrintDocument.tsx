import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { RentedContract } from '../types';
import type { CustomerRentalDetail } from '@/api/customerRentals';

export interface ContractPrintDocumentProps {
  contract: RentedContract;
  detail?: CustomerRentalDetail | null;
}

function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export const ContractPrintDocument: React.FC<ContractPrintDocumentProps> = ({
  contract,
  detail,
}) => {
  const effectiveContractNumber = detail?.contractCode || contract.contractNumber || 'CTR-2026-0000';
  const effectiveUnitNumber = detail?.unitCode || contract.unitNumber || 'HC-B203';
  const effectiveFacilityName = detail?.facilityName || contract.facilityName || 'SmartStorage Landmark Center';
  const effectiveFacilityAddress =
    detail?.facilityAddress || 'Cơ sở trực thuộc Hệ thống Cho thuê kho tự quản SmartStorage';
  const effectiveFacilityPhone = detail?.facilityPhone || '1900 8888';
  const effectiveCustomerName = detail?.customerName || contract.customerName || 'Nguyễn Văn Khách';
  const effectiveCustomerPhone = detail?.customerPhone || contract.customerPhone || '0987654321';
  const effectiveCustomerIdentity =
    detail?.customerIdentityNumber || contract.customerIdentityNumber || '079201001234';
  const effectiveCustomerEmail = detail?.customerEmail || contract.customerEmail || 'khachhang@smartstorage.vn';
  const effectiveUnitTypeName = detail?.unitTypeName || contract.unitTypeName || 'Kho Tiêu Chuẩn';
  const effectiveDimensions = detail?.unitDimensions || contract.unitDimensions || '2.0m x 2.5m x 2.5m';
  const effectiveFloor = detail?.floor ?? contract.floor ?? 1;
  const effectivePosition = detail?.position || contract.position || 'Khu A';
  const effectiveStartDate = contract.startDate || '2026-09-15';
  const effectiveEndDate = contract.endDate || '2027-04-15';
  const effectiveMonthlyRent = detail?.monthlyPrice || contract.monthlyRent || 0;
  const effectiveDeposit = detail?.depositAmount || contract.depositHeld || effectiveMonthlyRent;
  const isPendingCheckin =
    contract.status === 'PENDING_CHECKIN' ||
    (contract.status as string) === 'PENDING_CHECK_IN';

  const isHandoverCompleted =
    !isPendingCheckin &&
    (contract.status === 'ACTIVE' ||
      contract.status === 'OVERDUE' ||
      contract.status === 'PENDING_RETURN' ||
      contract.status === 'CLOSED' ||
      contract.status === 'TERMINATED' ||
      Boolean(detail?.checkinDate || contract.checkinDate || detail?.customerConfirmedAt));

  const effectiveCheckinDate = isHandoverCompleted
    ? (detail?.checkinDate || contract.checkinDate || effectiveStartDate)
    : 'Chưa thực hiện (Chờ làm thủ tục nhận kho tại quầy)';
  const effectiveHandoverStaff = isHandoverCompleted
    ? (detail?.handoverStaffName || contract.handoverStaffName || 'Nhân viên lễ tân cơ sở')
    : 'Chờ phân công tiếp đón tại quầy';
  const effectiveHandoverNote = isHandoverCompleted
    ? (detail?.handoverConditionNote ||
      contract.handoverConditionNote ||
      'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao')
    : 'Đang chờ khách hàng xuất trình CCCD và mã e-Pass tại quầy lễ tân để tiến hành nghiệm thu thực địa.';

  const relocationCode = detail?.relocationSupportRequestCode || contract.relocationSupportRequestCode;
  const relocationReason = detail?.relocationReason || contract.relocationReason;

  // Lấy ngày lập hợp đồng
  const baseContractDate = detail?.checkinDate || contract.checkinDate || effectiveStartDate;
  const dateParts = baseContractDate.split('-');
  const printYear = dateParts[0] || '2026';
  const printMonth = dateParts[1] || '09';
  const printDay = dateParts[2] || '15';

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
      className="contract-print-document font-serif text-[12.5px] leading-relaxed text-slate-900 bg-white p-6 max-w-[210mm] mx-auto print:p-0 print:m-0"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* 1. Header văn bản hành chính Việt Nam */}
      <div className="grid grid-cols-2 gap-4 pb-4 border-b-2 border-slate-900 mb-4">
        {/* Cột trái: Thương hiệu đơn vị */}
        <div>
          <div className="font-bold text-[14px] uppercase tracking-wider text-slate-900">
            SMARTSTORAGE VIỆT NAM
          </div>
          <div className="text-[11px] text-slate-700 italic">
            Hệ thống kho tự quản thông minh 24/7
          </div>
          <div className="text-[11px] text-slate-800 mt-1 font-semibold">
            {effectiveFacilityName}
          </div>
          <div className="text-[10.5px] text-slate-600 leading-tight">
            Đ/c: {effectiveFacilityAddress}
          </div>
          <div className="text-[10.5px] text-slate-600">
            Hotline: <strong>{effectiveFacilityPhone}</strong> · Web: www.smartstorage.vn
          </div>
        </div>

        {/* Cột phải: Quốc hiệu & Tiêu ngữ */}
        <div className="text-center">
          <div className="font-bold text-[12.5px] uppercase tracking-wide">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </div>
          <div className="font-bold text-[12px] underline decoration-slate-800 underline-offset-4">
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="text-[11px] text-slate-500 my-0.5">---------------o0o---------------</div>
          <div className="text-[11px] italic text-slate-700">
            TP. Hồ Chí Minh, ngày {printDay} tháng {printMonth} năm {printYear}
          </div>
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

      {/* 3. Căn cứ pháp lý */}
      <div className="text-[11px] italic text-slate-700 space-y-0.5 mb-3 pl-2 border-l border-slate-300">
        <p>• Căn cứ Bộ luật Dân sự số 91/2015/QH13 được Quốc hội ban hành ngày 24/11/2015;</p>
        <p>• Căn cứ Luật Thương mại số 36/2005/QH11 và Luật Kinh doanh Bất động sản số 29/2023/QH15;</p>
        <p>• Căn cứ Luật Giao dịch Điện tử số 20/2023/QH15 có hiệu lực thi hành;</p>
        <p>• Căn cứ Quy chế vận hành và Biểu phí dịch vụ của Hệ thống Cho thuê kho tự quản SmartStorage;</p>
        <p>• Căn cứ nhu cầu và sự thỏa thuận hoàn toàn tự nguyện giữa các bên tham gia.</p>
      </div>

      <p className="text-[11.5px] mb-2 font-medium">Hôm nay, các bên tham gia hợp đồng thống nhất ký kết các điều khoản sau:</p>

      {/* ĐIỀU 1: CÁC BÊN THAM GIA HỢP ĐỒNG */}
      <section className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase border-b border-slate-400 pb-0.5 mb-1.5">
          ĐIỀU 1: CÁC BÊN THAM GIA HỢP ĐỒNG
        </h2>

        <div className="grid grid-cols-2 gap-3 text-[11.5px]">
          {/* Bên A */}
          <div className="border border-slate-300 p-2.5 rounded bg-slate-50/50">
            <div className="font-bold uppercase text-slate-900 mb-1">
              BÊN CHO THUÊ (BÊN A):
            </div>
            <p><strong>Cơ sở quản lý:</strong> {effectiveFacilityName}</p>
            <p><strong>Địa chỉ cơ sở:</strong> {effectiveFacilityAddress}</p>
            <p><strong>Hotline cơ sở:</strong> {effectiveFacilityPhone}</p>
            <p><strong>Đại diện tiếp nhận:</strong> {effectiveHandoverStaff}</p>
          </div>

          {/* Bên B */}
          <div className="border border-slate-300 p-2.5 rounded bg-slate-50/50">
            <div className="font-bold uppercase text-slate-900 mb-1">
              BÊN THUÊ KHO (BÊN B):
            </div>
            <p><strong>Họ và tên khách hàng:</strong> {effectiveCustomerName}</p>
            <p><strong>Số CMND / CCCD:</strong> <span className="font-mono font-bold">{effectiveCustomerIdentity}</span></p>
            <p><strong>Số điện thoại:</strong> {effectiveCustomerPhone}</p>
            <p><strong>Thư điện tử (Email):</strong> {effectiveCustomerEmail}</p>
          </div>
        </div>
      </section>

      {/* ĐIỀU 2: ĐỐI TƯỢNG VÀ THỜI HẠN THUÊ KHO */}
      <section className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase border-b border-slate-400 pb-0.5 mb-1.5">
          ĐIỀU 2: ĐỐI TƯỢNG VÀ THỜI HẠN THUÊ KHO
        </h2>

        <table className="w-full border-collapse border border-slate-400 text-[11px] mb-2">
          <tbody>
            <tr className="bg-slate-100 font-semibold">
              <td className="border border-slate-400 px-2 py-1 w-1/4">Mã ô kho</td>
              <td className="border border-slate-400 px-2 py-1 w-1/4">Loại ô kho</td>
              <td className="border border-slate-400 px-2 py-1 w-1/4">Kích thước (D x R x C)</td>
              <td className="border border-slate-400 px-2 py-1 w-1/4">Vị trí vật lý</td>
            </tr>
            <tr>
              <td className="border border-slate-400 px-2 py-1.5 font-bold font-mono text-[12px]">
                {effectiveUnitNumber}
              </td>
              <td className="border border-slate-400 px-2 py-1.5">{effectiveUnitTypeName}</td>
              <td className="border border-slate-400 px-2 py-1.5">{effectiveDimensions}</td>
              <td className="border border-slate-400 px-2 py-1.5">Tầng {effectiveFloor} ({effectivePosition})</td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-2 text-[11.5px] bg-slate-50/60 p-2 border border-slate-200 rounded">
          <div>
            <strong>Ngày bắt đầu thuê:</strong> {effectiveStartDate}
          </div>
          <div>
            <strong>Ngày kết thúc hợp đồng:</strong> {effectiveEndDate}
          </div>
        </div>

        {relocationCode && (
          <div className="mt-1.5 p-2 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-950">
            <strong>Phụ lục điều chuyển kỹ thuật ({relocationCode}):</strong> Ô kho được điều chuyển từ ô ban đầu sang <strong>{effectiveUnitNumber}</strong> ({relocationReason}). Toàn bộ đơn giá thuê và tiền cọc bảo đảm được giữ nguyên vẹn theo quy tắc BR-AVL-05 & BR-SUP-02.
          </div>
        )}
      </section>

      {/* ĐIỀU 3: GIÁ THUÊ, TIỀN CỌC BẢO ĐẢM VÀ QUY CHẾ THANH TOÁN */}
      <section className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase border-b border-slate-400 pb-0.5 mb-1.5">
          ĐIỀU 3: GIÁ THUÊ, TIỀN CỌC BẢO ĐẢM VÀ QUY CHẾ THANH TOÁN
        </h2>

        <div className="space-y-1 text-[11.5px]">
          <p>
            <strong>1. Đơn giá thuê:</strong>{' '}
            <span className="font-bold">{formatCurrencyVND(effectiveMonthlyRent)} / tháng</span> (Đã bao gồm chi phí bảo quản tiêu chuẩn, giám sát an ninh 24/7 và điện chiếu sáng công cộng).
          </p>
          <p>
            <strong>2. Tiền cọc bảo đảm (Deposit):</strong>{' '}
            <span className="font-bold">{formatCurrencyVND(effectiveDeposit)}</span>. Khoản tiền cọc được bảo lưu tại tài khoản ngân hàng của Bên A để bảo đảm thực hiện nghĩa vụ hợp đồng và sẽ được hoàn trả 100% cho Bên B sau khi nghiệm thu trả kho theo quy tắc <strong>BR-RET-04</strong>.
          </p>
          <p>
            <strong>3. Xử lý chậm nộp & quá hạn (BR-OVD):</strong>
          </p>
          <ul className="list-disc pl-5 text-[11px] text-slate-700 space-y-0.5">
            <li><strong>Ân hạn D+1 đến D+3:</strong> Miễn phí phạt quá hạn; Bên B vẫn duy trì đầy đủ quyền ra vào ô kho.</li>
            <li><strong>Từ D+4 đến D+6:</strong> Áp dụng phí phạt quá hạn 10%/ngày trên số dư nợ phí thuê.</li>
            <li><strong>Từ D+7 đến D+9:</strong> Tạm khóa mã PIN/Access Code mở kho; tổng phí phạt không vượt trần 70% tiền cọc.</li>
            <li><strong>Từ D+10:</strong> Hệ thống tiến hành quy trình chấm dứt hợp đồng và xử lý tài sản theo hợp đồng dịch vụ.</li>
          </ul>
        </div>
      </section>

      {/* ĐIỀU 4: BIÊN BẢN BÀN GIAO & NGHIỆM THU HIỆN TRƯỜNG (CHECK-IN HANDOVER) */}
      <section className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase border-b border-slate-400 pb-0.5 mb-1.5 flex justify-between items-center">
          <span>ĐIỀU 4: BIÊN BẢN BÀN GIAO & NGHIỆM THU HIỆN TRƯỜNG (CHECK-IN HANDOVER)</span>
          {isPendingCheckin && (
            <span className="text-[10px] font-normal italic text-slate-600 lowercase tracking-normal">
              (chờ thực hiện tại quầy khi nhận kho)
            </span>
          )}
        </h2>

        <div className="text-[11px] mb-1.5 flex justify-between bg-slate-50 p-1.5 border border-slate-200 rounded">
          <span>Thời điểm hoàn tất bàn giao: <strong>{effectiveCheckinDate}</strong></span>
          <span>Nhân viên đón tiếp & lập biên bản: <strong>{effectiveHandoverStaff}</strong></span>
        </div>

        <div className="border border-slate-300 p-2 rounded bg-white text-[11px]">
          <p className="font-bold mb-1 text-slate-800">
            Kết quả kiểm tra 4 tiêu chí nghiệm thu vật lý bàn giao tại chỗ (BR-CHK-02):
          </p>
          {isHandoverCompleted ? (
            <div className="grid grid-cols-2 gap-1 text-slate-800 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-700 font-bold">[✓]</span>
                <span>Mặt bằng kho sạch sẽ, thông thoáng, không vật cản</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-700 font-bold">[✓]</span>
                <span>Cửa cuốn & cơ cấu khóa vận hành an toàn, trơn tru</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-700 font-bold">[✓]</span>
                <span>Sàn tường khô ráo, phòng chống ẩm mốc & PCCC đạt chuẩn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-700 font-bold">[✓]</span>
                <span>Khóa điện tử IoT đã sẵn sàng, cấp mã PIN mở cửa 24/7</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">[  ]</span>
                <span>Mặt bằng kho sạch sẽ, thông thoáng (Chờ kiểm tra hiện trường)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">[  ]</span>
                <span>Cửa cuốn & cơ cấu khóa (Chờ kiểm tra hiện trường)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">[  ]</span>
                <span>Sàn tường & PCCC đạt chuẩn (Chờ kiểm tra hiện trường)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">[  ]</span>
                <span>Khóa điện tử IoT & mã PIN (Chờ kích hoạt tại quầy)</span>
              </div>
            </div>
          )}
          <p className="mt-1.5 pt-1 border-t border-slate-200 text-slate-700 italic">
            Ghi chú hiện trường: <strong>{effectiveHandoverNote}</strong>
          </p>
        </div>
      </section>

      {/* ĐIỀU 5: NỘI QUY AN TOÀN, AN NINH & QUYỀN TRUY CẬP */}
      <section className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase border-b border-slate-400 pb-0.5 mb-1.5">
          ĐIỀU 5: NỘI QUY AN TOÀN, AN NINH & QUYỀN TRUY CẬP
        </h2>
        <ul className="list-disc pl-5 text-[11px] text-slate-700 space-y-0.5">
          <li>Bên B được cấp quyền ra vào cơ sở và mở khóa ô kho 24/7 thông qua mã số bảo mật PIN / mã QR điện tử (BR-ACC-01, BR-ACC-02).</li>
          <li>Tuyệt đối nghiêm cấm lưu trữ các chất độc hại, chất cháy nổ, vũ khí, hàng lậu hoặc các chất bị pháp luật cấm (BR-GEN-01).</li>
          <li>Bên B có trách nhiệm tự bảo mật mã mở khóa và khóa cửa ô kho cẩn thận sau mỗi lần truy cập.</li>
        </ul>
      </section>

      {/* ĐIỀU 6: HIỆU LỰC HỢP ĐỒNG & CHỮ KÝ XÁC NHẬN ĐIỆN TỬ */}
      <section className="mb-4 break-inside-avoid">
        <h2 className="font-bold text-[12.5px] uppercase border-b border-slate-400 pb-0.5 mb-2">
          ĐIỀU 6: HIỆU LỰC HỢP ĐỒNG & CHỮ KÝ XÁC NHẬN ĐIỆN TỬ
        </h2>
        <p className="text-[11px] mb-3 text-slate-700">
          Hợp đồng này được lập dưới dạng dữ liệu điện tử có giá trị pháp lý tương đương văn bản giấy. Hai bên đã đọc, hiểu rõ và đồng ý toàn bộ quyền và nghĩa vụ quy định trong hợp đồng.
        </p>

        {/* Khối chữ ký số */}
        <div className="grid grid-cols-2 gap-4 text-center">
          {/* Bên A */}
          <div className="border border-slate-300 p-3 rounded bg-slate-50/50">
            <div className="font-bold uppercase text-[12px] text-slate-900">
              ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
            </div>
            <div className="text-[10.5px] text-slate-500 mb-2">Ban Quản lý cơ sở</div>
            {isHandoverCompleted ? (
              <>
                <div className="my-2 py-1.5 px-3 inline-block border-2 border-emerald-600 bg-emerald-50 rounded text-[11px] font-bold text-emerald-800 tracking-wider">
                  ✓ ĐÃ KÝ SỐ ĐIỆN TỬ
                </div>
                <div className="text-[10px] text-slate-500">Thời gian ký: {effectiveCheckinDate}</div>
                <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveHandoverStaff}</div>
              </>
            ) : (
              <>
                <div className="my-2 py-1.5 px-3 inline-block border-2 border-dashed border-slate-400 bg-slate-100 rounded text-[11px] font-bold text-slate-600 tracking-wider">
                  CHỜ KÝ BÀN GIAO TẠI QUẦY
                </div>
                <div className="text-[10px] text-slate-500 italic">Ký số khi tiếp đón thực tế</div>
                <div className="font-semibold text-[11.5px] text-slate-500 mt-1">Đại diện tiếp đón cơ sở</div>
              </>
            )}
          </div>

          {/* Bên B */}
          <div className="border border-slate-300 p-3 rounded bg-slate-50/50">
            <div className="font-bold uppercase text-[12px] text-slate-900">
              ĐẠI DIỆN BÊN THUÊ KHO (BÊN B)
            </div>
            <div className="text-[10.5px] text-slate-500 mb-2">Khách hàng xác nhận</div>
            {isHandoverCompleted ? (
              <>
                <div className="my-2 py-1.5 px-3 inline-block border-2 border-emerald-600 bg-emerald-50 rounded text-[11px] font-bold text-emerald-800 tracking-wider">
                  ✓ ĐÃ XÁC NHẬN BÀN GIAO
                </div>
                <div className="text-[10px] text-slate-500">Thời gian ký: {effectiveCheckinDate}</div>
                <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveCustomerName}</div>
              </>
            ) : (
              <>
                <div className="my-2 py-1.5 px-3 inline-block border-2 border-dashed border-slate-400 bg-slate-100 rounded text-[11px] font-bold text-slate-600 tracking-wider">
                  CHỜ XÁC NHẬN KHI NHẬN KHO
                </div>
                <div className="text-[10px] text-slate-500 italic">Xác nhận tại quầy sau khi nghiệm thu</div>
                <div className="font-semibold text-[11.5px] text-slate-800 mt-1">{effectiveCustomerName}</div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. Footer xác thực hệ thống & QR Code */}
      <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 break-inside-avoid">
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
            className="border border-slate-200 p-0.5 rounded bg-white"
          />
          <div className="text-[9.5px] text-slate-400 max-w-[120px] leading-tight text-right">
            Quét QR để đối chiếu tính xác thực hợp đồng điện tử
          </div>
        </div>
      </div>
    </article>
  );
};
