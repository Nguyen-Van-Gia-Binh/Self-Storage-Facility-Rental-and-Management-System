import React from 'react';
import type { OverdueReportResponse, SystemOccupancyReport, SystemRevenueReport } from '@/types';
import { formatDate, formatPercent } from '@/utils/format';

export interface ExecutivePrintReportProps {
  revenue?: SystemRevenueReport;
  occupancy?: SystemOccupancyReport;
  overdue?: OverdueReportResponse;
  from: string;
  to: string;
  scopeName: string;
  printedAt: string;
  preparedBy: string;
  preparedOn: string;
}

/** Accounting Ledger format: zero -> em-dash "—", non-zero -> integer grouped by dots without repeated "đ" */
function formatLedgerAmount(value?: number | null): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || Math.round(num) === 0) return '—';
  return Math.round(num).toLocaleString('vi-VN');
}

function formatLedgerCount(value?: number | null): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num === 0) return '—';
  return String(num);
}

function overdueStage(days: number): string {
  if (days <= 3) return `D+${days}: Khóa PIN, phí lưu kho 5%/ngày`;
  if (days <= 6) return `D+${days}: Khóa PIN, phạt quá hạn 10%/ngày`;
  return 'D+7: Cưỡng chế niêm phong (khấu trừ 100% cọc)';
}

export const ExecutivePrintReport: React.FC<ExecutivePrintReportProps> = ({
  revenue,
  occupancy,
  overdue,
  from,
  to,
  scopeName,
  printedAt,
  preparedBy,
  preparedOn,
}) => {
  const facilities = revenue?.byFacility ?? [];
  const units = occupancy?.data ?? [];
  const contracts = overdue?.content ?? [];
  const accrued =
    overdue?.totalAccruedFee ??
    contracts.reduce((sum, item) => sum + (item.accruedOverdueFee || 0), 0);

  // Dynamically omit all-zero breakdown columns in Part 3 to keep A4 portrait readable
  const showReserved = units.some((u) => (u.reservedUnits ?? 0) > 0);
  const showCleaning = units.some((u) => (u.cleaningUnits ?? 0) > 0);
  const showMaintenance = units.some((u) => (u.maintenanceUnits ?? 0) > 0);
  const showOutOfService = units.some((u) => (u.outOfServiceUnits ?? 0) > 0);
  const showOverdueCol = units.some((u) => (u.overdueContractsCount ?? 0) > 0);

  const reportYear = preparedOn.match(/\d{4}/)?.[0] || String(new Date().getFullYear());
  const depositHeld = revenue?.totalDepositLiability ?? revenue?.depositBalance ?? 0;

  return (
    <article
      className="ss-report"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      {/* 1. Formal Vietnamese Administrative & Contract Header (Left Org + Right National Motto) */}
      <div className="ss-letterhead">
        <div className="ss-lh-left">
          <div className="ss-brand">CÔNG TY SMARTSTORAGE</div>
          <div className="ss-brand-sub">Bộ phận: BOM Operations</div>
          <div className="ss-lh-rule ss-lh-rule-sm" />
          <div className="ss-lh-meta">Mã báo cáo: BC-VH-05</div>
        </div>

        <div className="ss-lh-right">
          <div className="ss-motto-top">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="ss-motto-sub">Độc lập - Tự do - Hạnh phúc</div>
          <div className="ss-lh-rule ss-lh-rule-md" />
          <div className="ss-lh-meta">Ngày xuất: {preparedOn}</div>
        </div>
      </div>

      {/* 2. Centered Report Title & Italic Period */}
      <div className="ss-title">
        <h1>BÁO CÁO ĐỐI SOÁT DOANH THU, TỶ LỆ LẤP ĐẦY VÀ NỢ QUÁ HẠN</h1>
        <p className="ss-period">
          Từ ngày {formatDate(from)} đến ngày {formatDate(to)}
        </p>
      </div>

      {/* 3. Unboxed 2-Column Metadata Block (Thin Horizontal Rules Only) */}
      <table className="ss-meta">
        <tbody>
          <tr>
            <td className="ss-meta-label">Phạm vi báo cáo:</td>
            <td className="ss-meta-value">{scopeName}</td>
            <td className="ss-meta-label">Người lập biểu:</td>
            <td className="ss-meta-value">{preparedBy}</td>
          </tr>
          <tr>
            <td className="ss-meta-label">Đơn vị tính:</td>
            <td className="ss-meta-value">Đồng Việt Nam (VND)</td>
            <td className="ss-meta-label">Thời gian xuất:</td>
            <td className="ss-meta-value">{printedAt}</td>
          </tr>
        </tbody>
      </table>

      {/* Part 1: Executive Summary (Monochrome Key Financial Highlights) */}
      <section className="ss-section ss-keep">
        <div className="ss-section-head">
          <h2 className="ss-section-title">1. Tóm tắt chỉ số thực thu và tài chính</h2>
          <span className="ss-unit-note">Đơn vị tính: VND</span>
        </div>
        <table className="ss-summary-table">
          <tbody>
            <tr>
              <td className="ss-sum-label">Tổng Doanh thu thực thu (Cash)</td>
              <td className="ss-num ss-sum-val">{formatLedgerAmount(revenue?.totalRevenue)}</td>
              <td className="ss-sum-label">Định kỳ (MRR)</td>
              <td className="ss-num ss-sum-val">{formatLedgerAmount(revenue?.mrr)}</td>
              <td className="ss-sum-label">HĐ đang hoạt động</td>
              <td className="ss-num ss-sum-val">{formatLedgerCount(revenue?.activeContractCount)}</td>
            </tr>
            <tr>
              <td className="ss-sum-label">Tiền cọc đang giữ</td>
              <td className="ss-num ss-sum-val">{formatLedgerAmount(depositHeld)}</td>
              <td className="ss-sum-label">Tiền đã hoàn trả</td>
              <td className="ss-num ss-sum-val">{formatLedgerAmount(revenue?.totalRefundAmount)}</td>
              <td className="ss-sum-label">Nợ quá hạn tích lũy</td>
              <td className="ss-num ss-sum-val">{formatLedgerAmount(accrued)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Part 2: Financial Table (Monochrome Ledger, Right-Aligned, Single-Line Facilities, Safe Total Row) */}
      <section className="ss-section">
        <div className="ss-section-head">
          <h2 className="ss-section-title">2. Bảng đối soát doanh thu theo cơ sở</h2>
          <span className="ss-unit-note">Đơn vị tính: VND</span>
        </div>
        {facilities.length === 0 ? (
          <div className="ss-empty">Không có dữ liệu doanh thu phát sinh trong kỳ báo cáo.</div>
        ) : (
          <table className="ss-table ss-table-financial">
            <thead>
              <tr>
                <th className="ss-col-facility">Cơ sở lưu kho</th>
                <th className="ss-num">Tiền thuê</th>
                <th className="ss-num">Phụ phí</th>
                <th className="ss-num">Gia hạn</th>
                <th className="ss-num">Quá hạn</th>
                <th className="ss-num">Cọc giữ</th>
                <th className="ss-num">Đã hoàn</th>
                <th className="ss-num">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((row) => (
                <tr key={row.facilityId}>
                  <td className="ss-col-facility">{row.facilityName}</td>
                  <td className="ss-num">{formatLedgerAmount(row.rentalRevenue)}</td>
                  <td className="ss-num">{formatLedgerAmount(row.surchargeRevenue)}</td>
                  <td className="ss-num">{formatLedgerAmount(row.renewalRevenue)}</td>
                  <td className="ss-num">{formatLedgerAmount(row.overdueFeeRevenue)}</td>
                  <td className="ss-num">{formatLedgerAmount(row.depositBalance)}</td>
                  <td className="ss-num">{formatLedgerAmount(row.refundAmount)}</td>
                  <td className="ss-num ss-bold">{formatLedgerAmount(row.totalRevenue)}</td>
                </tr>
              ))}
              {/* Total Row inside tbody (never tfoot) to avoid Chrome duplicating it across pages */}
              <tr className="ss-total-row">
                <td className="ss-col-facility">TỔNG CỘNG</td>
                <td className="ss-num">{formatLedgerAmount(revenue?.rentalRevenue)}</td>
                <td className="ss-num">{formatLedgerAmount(revenue?.surchargeRevenue)}</td>
                <td className="ss-num">{formatLedgerAmount(revenue?.renewalRevenue)}</td>
                <td className="ss-num">{formatLedgerAmount(revenue?.overdueFeeRevenue)}</td>
                <td className="ss-num">{formatLedgerAmount(revenue?.depositBalance)}</td>
                <td className="ss-num">{formatLedgerAmount(revenue?.totalRefundAmount)}</td>
                <td className="ss-num">{formatLedgerAmount(revenue?.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        )}
        <p className="ss-footnote">
          Ghi chú: Dấu “—” biểu thị không phát sinh trong kỳ. Tiền cọc là khoản nợ phải trả đang giữ hộ, không cộng vào tổng doanh thu thực thu.
        </p>
      </section>

      {/* Part 3: Operational Efficiency & Occupancy (Clean Core Columns, Footnote Below) */}
      <section className="ss-section ss-page-break">
        <div className="ss-section-head">
          <h2 className="ss-section-title">3. Hiệu suất vận hành và tỷ lệ lấp đầy</h2>
          <span className="ss-unit-note">
            Toàn hệ thống: {formatPercent(occupancy?.averageOccupancyRate ?? Number.NaN)} ·{' '}
            {occupancy?.occupiedUnitsSystem ?? 0}/{occupancy?.totalUnitsSystem ?? 0} ô
          </span>
        </div>

        {units.length === 0 ? (
          <div className="ss-empty">Không có dữ liệu tỷ lệ lấp đầy cho phạm vi đã chọn.</div>
        ) : (
          <table className="ss-table">
            <thead>
              <tr>
                <th className="ss-col-facility">Cơ sở lưu kho</th>
                <th className="ss-num">Tổng kho</th>
                <th className="ss-num">Đang thuê</th>
                <th className="ss-num">Công suất trống</th>
                {showReserved && <th className="ss-num">Đặt chỗ</th>}
                {showCleaning && <th className="ss-num">Vệ sinh</th>}
                {showMaintenance && <th className="ss-num">Bảo trì</th>}
                {showOutOfService && <th className="ss-num">Ngừng</th>}
                {showOverdueCol && <th className="ss-num">HĐ quá hạn</th>}
                <th className="ss-num">Tỷ lệ lấp đầy*</th>
              </tr>
            </thead>
            <tbody>
              {units.map((row) => {
                const exploitable = Math.max(0, row.totalUnits - (row.outOfServiceUnits || 0));
                const rateDisplay =
                  row.occupancyRate == null || exploitable === 0
                    ? '—'
                    : formatPercent(row.occupancyRate);
                return (
                  <tr key={row.facilityId}>
                    <td className="ss-col-facility">{row.facilityName}</td>
                    <td className="ss-num">{formatLedgerCount(row.totalUnits)}</td>
                    <td className="ss-num">{formatLedgerCount(row.occupiedUnits)}</td>
                    <td className="ss-num">{formatLedgerCount(row.availableUnits)}</td>
                    {showReserved && <td className="ss-num">{formatLedgerCount(row.reservedUnits)}</td>}
                    {showCleaning && <td className="ss-num">{formatLedgerCount(row.cleaningUnits)}</td>}
                    {showMaintenance && <td className="ss-num">{formatLedgerCount(row.maintenanceUnits)}</td>}
                    {showOutOfService && <td className="ss-num">{formatLedgerCount(row.outOfServiceUnits)}</td>}
                    {showOverdueCol && <td className="ss-num">{formatLedgerCount(row.overdueContractsCount)}</td>}
                    <td className="ss-num ss-bold">{rateDisplay}</td>
                  </tr>
                );
              })}
              <tr className="ss-total-row">
                <td className="ss-col-facility">TỔNG CỘNG</td>
                <td className="ss-num">{formatLedgerCount(occupancy?.totalUnitsSystem)}</td>
                <td className="ss-num">{formatLedgerCount(occupancy?.occupiedUnitsSystem)}</td>
                <td className="ss-num">{formatLedgerCount(occupancy?.availableUnitsSystem)}</td>
                {showReserved && (
                  <td className="ss-num">
                    {formatLedgerCount(units.reduce((s, u) => s + (u.reservedUnits || 0), 0))}
                  </td>
                )}
                {showCleaning && (
                  <td className="ss-num">
                    {formatLedgerCount(units.reduce((s, u) => s + (u.cleaningUnits || 0), 0))}
                  </td>
                )}
                {showMaintenance && (
                  <td className="ss-num">
                    {formatLedgerCount(units.reduce((s, u) => s + (u.maintenanceUnits || 0), 0))}
                  </td>
                )}
                {showOutOfService && (
                  <td className="ss-num">
                    {formatLedgerCount(units.reduce((s, u) => s + (u.outOfServiceUnits || 0), 0))}
                  </td>
                )}
                {showOverdueCol && (
                  <td className="ss-num">
                    {formatLedgerCount(units.reduce((s, u) => s + (u.overdueContractsCount || 0), 0))}
                  </td>
                )}
                <td className="ss-num">
                  {occupancy?.averageOccupancyRate != null
                    ? formatPercent(occupancy.averageOccupancyRate)
                    : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        )}
        <p className="ss-footnote">
          (*) Tỷ lệ lấp đầy (Usage Rate) = Số ô đang thuê / (Tổng ô kho − Ô ngừng khai thác). Các cột phân loại bằng 0 toàn kỳ được ẩn tự động để tối ưu khổ giấy A4.
        </p>
      </section>

      {/* Part 4: Overdue Contracts + Formal 3-Column Approval Sign-off Block */}
      <section className="ss-section ss-keep">
        <div className="ss-section-head">
          <h2 className="ss-section-title">4. Hợp đồng quá hạn và công nợ rủi ro</h2>
          <span className="ss-unit-note">
            Số HĐ quá hạn: {overdue?.totalOverdueContracts ?? contracts.length} · Tổng nợ phạt: {formatLedgerAmount(accrued)} VND
          </span>
        </div>

        {contracts.length === 0 ? (
          <div className="ss-empty">Không phát sinh hợp đồng quá hạn trong phạm vi và kỳ báo cáo đã chọn.</div>
        ) : (
          <table className="ss-table">
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Khách hàng</th>
                <th>Cơ sở / Ô kho</th>
                <th className="ss-num">Hết hạn</th>
                <th className="ss-num">Trễ hạn</th>
                <th className="ss-num">Nợ phạt (VND)</th>
                <th>Chế tài áp dụng</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((item) => (
                <tr key={item.contractId}>
                  <td>{item.contractCode}</td>
                  <td>{item.customerName}</td>
                  <td>{item.facilityName} · {item.unitCode}</td>
                  <td className="ss-num">{item.endDateExclusive ? formatDate(item.endDateExclusive) : '—'}</td>
                  <td className="ss-num">D+{item.overdueDays}</td>
                  <td className="ss-num">{formatLedgerAmount(item.accruedOverdueFee)}</td>
                  <td>{overdueStage(item.overdueDays)}</td>
                </tr>
              ))}
              <tr className="ss-total-row">
                <td colSpan={5}>TỔNG NỢ PHẠT TÍCH LŨY ({contracts.length} hợp đồng)</td>
                <td className="ss-num">{formatLedgerAmount(accrued)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        )}

        {/* Formal Sign-off Block (Top-right Date Line + 3 Equal Columns with 80px Space) */}
        <div className="ss-sign-wrap ss-keep">
          <div className="ss-sign-top-date">
            ……, ngày …… tháng …… năm {reportYear}
          </div>
          <div className="ss-sign">
            <div className="ss-sign-col">
              <strong className="ss-sign-role">NGƯỜI LẬP BIỂU</strong>
              <span className="ss-sign-hint">(Ký, ghi rõ họ tên)</span>
              <div className="ss-sign-space" />
              <div className="ss-sign-dots">........................................</div>
              <div className="ss-sign-name">{preparedBy}</div>
            </div>
            <div className="ss-sign-col">
              <strong className="ss-sign-role">PHỤ TRÁCH VẬN HÀNH</strong>
              <span className="ss-sign-hint">(Ký, ghi rõ họ tên)</span>
              <div className="ss-sign-space" />
              <div className="ss-sign-dots">........................................</div>
              <div className="ss-sign-placeholder">(Ghi rõ họ tên)</div>
            </div>
            <div className="ss-sign-col">
              <strong className="ss-sign-role">GIÁM ĐỐC ĐIỀU HÀNH</strong>
              <span className="ss-sign-hint">(Ký, ghi rõ họ tên &amp; đóng dấu)</span>
              <div className="ss-sign-space" />
              <div className="ss-sign-dots">........................................</div>
              <div className="ss-sign-placeholder">(Ghi rõ họ tên)</div>
            </div>
          </div>
        </div>

        {/* Clean Monochrome Document Footer */}
        <div className="ss-doc-footer">
          <span>Mã biểu: BC-VH-05 · SmartStorage</span>
          <span>Báo cáo đối soát doanh thu &amp; vận hành</span>
          <span>Xuất lúc: {printedAt}</span>
        </div>
      </section>
    </article>
  );
};
