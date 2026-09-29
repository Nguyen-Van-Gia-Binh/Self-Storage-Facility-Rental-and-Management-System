import React from 'react';
import type { OverdueReportResponse, SystemOccupancyReport, SystemRevenueReport } from '@/types';
import { formatCurrency, formatDate, formatPercent } from '@/utils/format';

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

function overdueStage(days: number): string {
  if (days <= 3) return 'D+1..D+3: Ân hạn, phí 0, vẫn vào kho';
  if (days <= 6) return `D+${days}: Phạt 10%/ngày, khóa báo trả kho`;
  if (days <= 9) return `D+${days}: Khóa Access Code, trần 70% cọc`;
  return 'D+10: Chấm dứt hợp đồng, ô kho dọn dẹp';
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
  const accrued = overdue?.totalAccruedFee ?? contracts.reduce((sum, item) => sum + (item.accruedOverdueFee || 0), 0);

  return (
    <article className="ss-report">
      <header className="ss-letterhead">
        <div>
          <div className="ss-brand">SMARTSTORAGE</div>
          <div className="ss-brand-sub">Hệ thống cho thuê kho tự quản · Ban vận hành kinh doanh</div>
        </div>
        <div className="ss-doc-meta">
          <div>Mã biểu: BM-05/BC-VH</div>
          <div>Múi giờ: Asia/Ho_Chi_Minh</div>
          <div>Lập lúc: {printedAt}</div>
        </div>
      </header>

      <div className="ss-title">
        <h1>Báo cáo đối soát doanh thu, tỷ lệ lấp đầy và nợ quá hạn</h1>
        <p>Dùng để trình ký và lưu hồ sơ vận hành. Số liệu khớp màn hình tại cùng kỳ và cùng phạm vi.</p>
      </div>

      <table className="ss-meta">
        <tbody>
          <tr>
            <td><span>Kỳ báo cáo</span>{formatDate(from)} – {formatDate(to)}</td>
            <td><span>Phạm vi</span>{scopeName}</td>
            <td><span>Người lập</span>{preparedBy} · {preparedOn}</td>
            <td><span>Nguồn số liệu</span>Sổ hợp đồng và giao dịch đã ghi nhận</td>
          </tr>
        </tbody>
      </table>

      <section>
        <h2 className="ss-section-title">1. Doanh thu và cơ cấu dòng tiền</h2>
        <div className="ss-kpis">
          <div className="ss-kpi"><span>Tổng doanh thu</span><b>{formatCurrency(revenue?.totalRevenue ?? 0)}</b></div>
          <div className="ss-kpi"><span>Tiền thuê kho</span><b>{formatCurrency(revenue?.rentalRevenue ?? 0)}</b></div>
          <div className="ss-kpi"><span>Phụ phí</span><b>{formatCurrency(revenue?.surchargeRevenue ?? 0)}</b></div>
          <div className="ss-kpi"><span>Phí gia hạn</span><b>{formatCurrency(revenue?.renewalRevenue ?? 0)}</b></div>
          <div className="ss-kpi"><span>Phạt quá hạn</span><b>{formatCurrency(revenue?.overdueFeeRevenue ?? 0)}</b></div>
          <div className="ss-kpi"><span>Tiền cọc đang giữ</span><b>{formatCurrency(revenue?.depositBalance ?? 0)}</b></div>
          <div className="ss-kpi"><span>Đã hoàn trả</span><b>{formatCurrency(revenue?.totalRefundAmount ?? 0)}</b></div>
          <div className="ss-kpi"><span>Số cơ sở</span><b>{facilities.length}</b></div>
        </div>
        {facilities.length === 0 ? (
          <div className="ss-empty">Không có dữ liệu doanh thu trong kỳ này.</div>
        ) : (
          <table className="ss-table">
            <thead>
              <tr>
                <th>Cơ sở</th>
                <th className="ss-num">Tiền thuê</th>
                <th className="ss-num">Phụ phí</th>
                <th className="ss-num">Gia hạn</th>
                <th className="ss-num">Phạt quá hạn</th>
                <th className="ss-num">Cọc đang giữ</th>
                <th className="ss-num">Đã hoàn</th>
                <th className="ss-num">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((row) => (
                <tr key={row.facilityId}>
                  <td>{row.facilityName}</td>
                  <td className="ss-num">{formatCurrency(row.rentalRevenue)}</td>
                  <td className="ss-num">{formatCurrency(row.surchargeRevenue)}</td>
                  <td className="ss-num">{formatCurrency(row.renewalRevenue)}</td>
                  <td className="ss-num">{formatCurrency(row.overdueFeeRevenue)}</td>
                  <td className="ss-num">{formatCurrency(row.depositBalance)}</td>
                  <td className="ss-num">{formatCurrency(row.refundAmount)}</td>
                  <td className="ss-num">{formatCurrency(row.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Cộng</td>
                <td className="ss-num">{formatCurrency(revenue?.rentalRevenue ?? 0)}</td>
                <td className="ss-num">{formatCurrency(revenue?.surchargeRevenue ?? 0)}</td>
                <td className="ss-num">{formatCurrency(revenue?.renewalRevenue ?? 0)}</td>
                <td className="ss-num">{formatCurrency(revenue?.overdueFeeRevenue ?? 0)}</td>
                <td className="ss-num">{formatCurrency(revenue?.depositBalance ?? 0)}</td>
                <td className="ss-num">{formatCurrency(revenue?.totalRefundAmount ?? 0)}</td>
                <td className="ss-num">{formatCurrency(revenue?.totalRevenue ?? 0)}</td>
              </tr>
            </tfoot>
          </table>
        )}
        <p className="ss-note">Tiền cọc là khoản đang giữ, không cộng vào tổng doanh thu. Khoản đã hoàn được liệt kê riêng để đối soát.</p>
      </section>

      <section className="ss-page-break">
        <h2 className="ss-section-title">2. Hiệu suất và tỷ lệ lấp đầy</h2>
        <div className="ss-kpis">
          <div className="ss-kpi"><span>Usage Rate toàn hệ thống</span><b>{formatPercent(occupancy?.averageOccupancyRate ?? 0)}</b></div>
          <div className="ss-kpi"><span>Tổng ô kho</span><b>{occupancy?.totalUnitsSystem ?? 0}</b></div>
          <div className="ss-kpi"><span>Đang thuê</span><b>{occupancy?.occupiedUnitsSystem ?? 0}</b></div>
          <div className="ss-kpi"><span>Còn trống</span><b>{occupancy?.availableUnitsSystem ?? 0}</b></div>
        </div>
        <p className="ss-note">Usage Rate = số ô Occupied / (tổng ô − ô Out of service). Ô ngừng khai thác không tính vào mẫu số.</p>
        {units.length === 0 ? (
          <div className="ss-empty">Không có dữ liệu lấp đầy cho phạm vi đã chọn.</div>
        ) : (
          <table className="ss-table">
            <thead>
              <tr>
                <th>Cơ sở</th>
                <th className="ss-num">Tổng ô</th>
                <th className="ss-num">Đang thuê</th>
                <th className="ss-num">Trống</th>
                <th className="ss-num">Đặt chỗ</th>
                <th className="ss-num">Vệ sinh</th>
                <th className="ss-num">Bảo trì</th>
                <th className="ss-num">Ngừng</th>
                <th className="ss-num">Usage Rate</th>
                <th className="ss-num">HĐ quá hạn</th>
              </tr>
            </thead>
            <tbody>
              {units.map((row) => (
                <tr key={row.facilityId}>
                  <td>{row.facilityName}</td>
                  <td className="ss-num">{row.totalUnits}</td>
                  <td className="ss-num">{row.occupiedUnits}</td>
                  <td className="ss-num">{row.availableUnits}</td>
                  <td className="ss-num">{row.reservedUnits}</td>
                  <td className="ss-num">{row.cleaningUnits}</td>
                  <td className="ss-num">{row.maintenanceUnits}</td>
                  <td className="ss-num">{row.outOfServiceUnits}</td>
                  <td className="ss-num">{formatPercent(row.occupancyRate)}</td>
                  <td className="ss-num">{row.overdueContractsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="ss-page-break">
        <h2 className="ss-section-title">3. Hợp đồng quá hạn và nợ đọng</h2>
        <div className="ss-kpis">
          <div className="ss-kpi"><span>Số hợp đồng quá hạn</span><b>{overdue?.totalOverdueContracts ?? contracts.length}</b></div>
          <div className="ss-kpi"><span>Tổng nợ phạt tích lũy</span><b>{formatCurrency(accrued)}</b></div>
          <div className="ss-kpi"><span>Ân hạn D+1..D+3</span><b>{contracts.filter((item) => item.overdueDays <= 3).length}</b></div>
          <div className="ss-kpi"><span>Đến hạn chấm dứt D+10</span><b>{contracts.filter((item) => item.overdueDays >= 10).length}</b></div>
        </div>
        <p className="ss-note">D+1 đến D+3: phí 0, vẫn truy cập ô kho. D+4 đến D+6: phạt 10% tiền cọc mỗi ngày, khóa báo trả kho. D+7 đến D+9: khóa Access Code. D+10: chấm dứt hợp đồng, trần phí 70% tiền cọc.</p>
        {contracts.length === 0 ? (
          <div className="ss-empty">Không có hợp đồng quá hạn trong phạm vi đã chọn.</div>
        ) : (
          <table className="ss-table">
            <thead>
              <tr>
                <th>Mã hợp đồng</th>
                <th>Khách hàng</th>
                <th>Điện thoại</th>
                <th>Cơ sở / ô kho</th>
                <th>Hết hạn</th>
                <th className="ss-num">Số ngày</th>
                <th className="ss-num">Nợ phạt</th>
                <th>Biện pháp</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((item) => (
                <tr key={item.contractId}>
                  <td>{item.contractCode}</td>
                  <td>{item.customerName}</td>
                  <td>{item.customerPhone}</td>
                  <td>{item.facilityName} · {item.unitCode}</td>
                  <td>{item.endDateExclusive ? formatDate(item.endDateExclusive) : ''}</td>
                  <td className="ss-num">D+{item.overdueDays}</td>
                  <td className="ss-num">{formatCurrency(item.accruedOverdueFee)}</td>
                  <td>{overdueStage(item.overdueDays)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6}>Cộng nợ phạt</td>
                <td className="ss-num">{formatCurrency(accrued)}</td>
                <td>{contracts.length} hợp đồng</td>
              </tr>
            </tfoot>
          </table>
        )}

        <div className="ss-sign ss-keep">
          <div>
            <strong>Người lập biểu</strong>
            <span>{preparedBy} · {preparedOn}</span>
          </div>
          <div>
            <strong>Phụ trách vận hành</strong>
            <span>Ký, ghi rõ họ tên</span>
          </div>
          <div>
            <strong>Giám đốc điều hành</strong>
            <span>Phê duyệt</span>
          </div>
        </div>
      </section>
    </article>
  );
};
